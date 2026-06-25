import { type CSSProperties, useState, useEffect, useMemo, useRef } from 'react';
import { TarotCard, TarotSpread, TAROT_DECK } from '../data/tarotCards';
import { DrawnCard } from '../types';
import { Sparkles, PenTool, Check } from 'lucide-react';
import { cryptoRandomBoolean, cryptoRandomInt, cryptoShuffle } from '../utils/cryptoRandom';
import { haptics } from '../utils/haptics';
import { Language, UI_COPY, getLocalizedSpread } from '../data/localization';
import type { ThemeMode } from '../types';
import cardBackDayImage from '../../images/card_back/card_back_day.png?url';
import cardBackNightImage from '../../images/card_back/card_back_night.png?url';
import RetryingImage from './RetryingImage';

const TOTAL_CARDS_IN_WHEEL = 78;
// Hand-of-cards fan: every card is rotated a constant angular step about a shared
// pivot far below, so the spread curves like a real fan and each card's tilt is
// tangent to the arc. Center card is highest and on top; wings sweep down both sides.
const FAN_MID_INDEX = (TOTAL_CARDS_IN_WHEEL - 1) / 2;
const FAN_MAX_TILT_DEG = 26; // tilt of the outermost cards (fan "openness")
const FAN_STEP_RAD = ((FAN_MAX_TILT_DEG / FAN_MID_INDEX) * Math.PI) / 180;
const FAN_LIFT_HEADROOM = 30; // top breathing room so a lifted card never clips


interface CardSelectionWheelProps {
  spread: TarotSpread;
  onCardsSelected: (drawnCards: DrawnCard[], question: string) => void;
  language: Language;
  resolvedTheme: Exclude<ThemeMode, 'system'>;
}

interface DrawSelection {
  slotIndex: number;
  card: TarotCard;
  isUpright: boolean;
}

interface CardFlight {
  id: number;
  slotIndex: number;
  style: CSSProperties;
}

export default function CardSelectionWheel({ spread, onCardsSelected, language, resolvedTheme }: CardSelectionWheelProps) {
  const [drawn, setDrawn] = useState<DrawSelection[]>([]);
  const [armedSlotIndex, setArmedSlotIndex] = useState<number | null>(null);
  const [hoveredSlotIndex, setHoveredSlotIndex] = useState<number | null>(null);
  const [question, setQuestion] = useState('');
  const [deck, setDeck] = useState<TarotCard[]>([]);
  const [isQuestionDirty, setIsQuestionDirty] = useState(false);
  const [availableWheelWidth, setAvailableWheelWidth] = useState(() => (typeof window === 'undefined' ? 560 : window.innerWidth - 48));
  const [flights, setFlights] = useState<CardFlight[]>([]);
  const [returningSlotIndexes, setReturningSlotIndexes] = useState<number[]>([]);
  const wheelAreaRef = useRef<HTMLDivElement | null>(null);
  const fanScrollRef = useRef<HTMLDivElement | null>(null);
  const confirmAreaRef = useRef<HTMLDivElement | null>(null);
  const lastTickScrollLeftRef = useRef(0);
  const questionInputRef = useRef<HTMLInputElement | null>(null);
  const wheelCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const positionCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const flightIdRef = useRef(0);
  const flightTimeoutIds = useRef<number[]>([]);
  const lastPointerTypeRef = useRef('');
  const copy = UI_COPY[language].cardSelection;
  const localizedSpread = getLocalizedSpread(spread, language);
  const positionSlots = localizedSpread.positions;
  const wheelSlotIndexes = useMemo(() => Array.from({ length: TOTAL_CARDS_IN_WHEEL }, (_, i) => i), []);
  const cardBackImage = resolvedTheme === 'light' ? cardBackDayImage : cardBackNightImage;

  useEffect(() => {
    setDeck(cryptoShuffle(TAROT_DECK));
  }, []);

  // Center the horizontal scroller on the middle of the fan once it can overflow.
  useEffect(() => {
    const scroller = fanScrollRef.current;
    if (!scroller) return;
    const center = (scroller.scrollWidth - scroller.clientWidth) / 2;
    scroller.scrollLeft = center;
    lastTickScrollLeftRef.current = center;
  }, [availableWheelWidth]);

  useEffect(() => {
    const updateAvailableWidth = () => {
      setAvailableWheelWidth(wheelAreaRef.current?.clientWidth ?? window.innerWidth - 48);
    };

    updateAvailableWidth();

    const observer = new ResizeObserver(updateAvailableWidth);
    const wheelArea = wheelAreaRef.current;

    if (wheelArea) {
      observer.observe(wheelArea);
    }

    window.addEventListener('resize', updateAvailableWidth);
    window.visualViewport?.addEventListener('resize', updateAvailableWidth);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateAvailableWidth);
      window.visualViewport?.removeEventListener('resize', updateAvailableWidth);
    };
  }, []);

  useEffect(() => {
    return () => {
      flightTimeoutIds.current.forEach(timeoutId => window.clearTimeout(timeoutId));
    };
  }, []);

  const totalToDraw = spread.cardCount;
  const currentDrawIndex = drawn.length;
  const isSelectionComplete = drawn.length >= totalToDraw;

  // Once the spread is fully drawn, glide the page down to the confirm button so the
  // user doesn't have to hunt for it after the last card flies home.
  useEffect(() => {
    if (!isSelectionComplete) return;
    const timeoutId = window.setTimeout(() => {
      confirmAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 720); // let the final card-flight land first
    return () => window.clearTimeout(timeoutId);
  }, [isSelectionComplete]);

  const getWheelCardRotation = (slotIndex: number) => {
    // Constant angular step about a shared pivot below the fan — the card's tilt is
    // tangent to the arc, so the spread splays like a real hand of cards. Pure
    // function of the slot, so the flight animation and the resting card agree.
    return ((slotIndex - FAN_MID_INDEX) * FAN_STEP_RAD * 180) / Math.PI;
  };

  const startCardFlight = (
    fromElement: HTMLElement | null,
    toElement: HTMLElement | null,
    slotIndex: number,
    fromRotation: number,
    toRotation: number,
    preferVisibleLanding = false,
  ) => {
    if (!fromElement || !toElement) return false;

    const fromRect = fromElement.getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();
    const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const isTouchViewport = window.matchMedia('(max-width: 1024px), (pointer: coarse)').matches;
    const isTargetVisible =
      toRect.bottom > 16 &&
      toRect.top < viewportHeight - 16 &&
      toRect.right > 16 &&
      toRect.left < viewportWidth - 16;
    const shouldUseVisibleLanding = preferVisibleLanding && (isTouchViewport || !isTargetVisible);
    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));
    const fromX = fromRect.left;
    const fromY = fromRect.top;
    const slotToX = toRect.left + toRect.width / 2 - fromRect.width / 2;
    const slotToY = toRect.top + toRect.height / 2 - fromRect.height / 2;
    const wheelRect = wheelAreaRef.current?.getBoundingClientRect();
    const visibleToX = shouldUseVisibleLanding && wheelRect
      ? clamp(wheelRect.left + wheelRect.width / 2 - fromRect.width / 2, 24, viewportWidth - fromRect.width - 24)
      : slotToX;
    const visibleToY = shouldUseVisibleLanding && wheelRect
      ? clamp(wheelRect.top + wheelRect.height / 2 - fromRect.height / 2, 64, viewportHeight - fromRect.height - 64)
      : slotToY;
    const travelX = visibleToX - fromX;
    const travelY = visibleToY - fromY;
    const lift = Math.min(120, Math.max(54, Math.hypot(travelX, travelY) * 0.14));
    const midX = fromX + travelX * 0.55;
    const midY = Math.min(fromY, visibleToY) - lift;
    const toScale = shouldUseVisibleLanding
      ? 1.18
      : Math.max(0.34, Math.min(2.4, Math.min(toRect.width / fromRect.width, toRect.height / fromRect.height)));
    const durationMs = shouldUseVisibleLanding ? 1120 : 680;

    const flightId = flightIdRef.current++;

    setFlights(current => [
      ...current,
      {
        id: flightId,
        slotIndex,
        style: {
          width: `${fromRect.width}px`,
          height: `${fromRect.height}px`,
          '--flight-from-x': `${fromX}px`,
          '--flight-from-y': `${fromY}px`,
          '--flight-mid-x': `${midX}px`,
          '--flight-mid-y': `${midY}px`,
          '--flight-to-x': `${visibleToX}px`,
          '--flight-to-y': `${visibleToY}px`,
          '--flight-from-rotation': `${fromRotation}deg`,
          '--flight-mid-rotation': `${(fromRotation + toRotation) / 2 - 8}deg`,
          '--flight-to-rotation': `${toRotation}deg`,
          '--flight-to-scale': `${toScale}`,
          '--flight-duration': `${durationMs}ms`,
        } as CSSProperties,
      },
    ]);

    const timeoutId = window.setTimeout(() => {
      setFlights(current => current.filter(item => item.id !== flightId));
      setReturningSlotIndexes(current => current.filter(index => index !== slotIndex));
      flightTimeoutIds.current = flightTimeoutIds.current.filter(id => id !== timeoutId);
    }, durationMs + 140);

    flightTimeoutIds.current.push(timeoutId);

    return true;
  };

  const finishCardFlight = (cardFlight: CardFlight) => {
    setFlights(current => current.filter(item => item.id !== cardFlight.id));
    setReturningSlotIndexes(current => current.filter(index => index !== cardFlight.slotIndex));
  };

  const handleRemoveDrawnCard = (positionIndex: number) => {
    const selection = drawn[positionIndex];
    if (!selection) return;

    const startedFlight = startCardFlight(
      positionCardRefs.current[positionIndex],
      wheelCardRefs.current[selection.slotIndex],
      selection.slotIndex,
      0,
      getWheelCardRotation(selection.slotIndex),
    );

    if (startedFlight) {
      setReturningSlotIndexes(current => (
        current.includes(selection.slotIndex) ? current : [...current, selection.slotIndex]
      ));
    }

    haptics.remove();

    setDrawn(prev => prev.filter(item => item.slotIndex !== selection.slotIndex));
  };

  const drawCardAtSlot = (slotIndex: number) => {
    if (returningSlotIndexes.includes(slotIndex) || drawn.some(item => item.slotIndex === slotIndex) || drawn.length >= totalToDraw) return;

    const sourceDeck = deck.length ? deck : TAROT_DECK;
    const selectedCardIds = new Set(drawn.map(item => item.card.id));
    const availableCards = sourceDeck.filter(card => !selectedCardIds.has(card.id));

    if (!availableCards.length) return;

    startCardFlight(
      wheelCardRefs.current[slotIndex],
      positionCardRefs.current[drawn.length],
      slotIndex,
      getWheelCardRotation(slotIndex),
      0,
      true,
    );

    const willComplete = drawn.length + 1 >= totalToDraw;
    if (willComplete) {
      haptics.complete();
    } else {
      haptics.select();
    }

    setDrawn([
      ...drawn,
      {
        slotIndex,
        card: availableCards[cryptoRandomInt(availableCards.length)],
        isUpright: cryptoRandomBoolean(),
      },
    ]);
  };

  const handleCardClick = (slotIndex: number) => {
    const isTouchSelection = lastPointerTypeRef.current === 'touch';

    if (isTouchSelection) {
      if (drawn.length >= totalToDraw) return;

      if (armedSlotIndex !== slotIndex) {
        setArmedSlotIndex(slotIndex);
        haptics.select();
        return;
      }
    }

    setArmedSlotIndex(null);
    drawCardAtSlot(slotIndex);
  };

  const handleConfirm = () => {
    if (!isSelectionComplete) return;

    const result: DrawnCard[] = drawn.map((selection, i) => {
      const positionInfo = positionSlots[i];
      const fallbackPosition = spread.positions[i];

      return {
        card: selection.card,
        orientation: selection.isUpright ? 'upright' : 'reversed',
        isUpright: selection.isUpright,
        positionIndex: i,
        positionName: positionInfo?.name ?? fallbackPosition?.name ?? '',
        positionDesc: positionInfo?.description ?? fallbackPosition?.description ?? '',
      };
    });

    onCardsSelected(result, question.trim());
  };

  const handleConfirmQuestion = () => {
    setIsQuestionDirty(false);
    questionInputRef.current?.blur();
  };

  // Hand-of-cards fan geometry. Every card sits on a circular arc and is rotated a
  // constant angular step, so the spread splays open like a real fan (this is what
  // made the original wheel feel "fan-like"). Spacing is a comfortable fraction of a
  // card so each one stays tappable; the fan is wider than the viewport and lives in a
  // horizontal scroller (swipe left/right on mobile; vertical swipes still scroll the
  // page), auto-centred on load.
  const isCompact = availableWheelWidth < 560;
  const cardHeight = isCompact ? 92 : 108;
  const cardWidth = Math.round(cardHeight * (2 / 3));
  const centerStep = Math.round(cardWidth * 0.32); // horizontal reveal between neighbours near the center
  const fanRadius = Math.round(centerStep / FAN_STEP_RAD); // arc radius that yields that spacing
  const maxAngle = FAN_MID_INDEX * FAN_STEP_RAD; // half-span of the fan (= FAN_MAX_TILT_DEG)
  const fanHalfWidth = fanRadius * Math.sin(maxAngle);
  const fanDrop = Math.round(fanRadius * (1 - Math.cos(maxAngle))); // wing drop below the center card
  const fanContentWidth = Math.round(2 * fanHalfWidth + cardWidth);
  const wheelFrameHeight = Math.round(cardHeight + fanDrop + FAN_LIFT_HEADROOM + 44);
  const centerCounterSize = isCompact ? 88 : 112;

  return (
    <div className="w-full flex flex-col items-center justify-start min-h-[calc(100vh-80px)] pt-20 pb-20 text-center relative overflow-x-visible overflow-y-clip">
      {/* Top Right Floating Interactive Drawn Tapestry Control Panel */}
      <div className="liquid-glass liquid-glass-card md:absolute md:top-20 md:right-6 md:mt-0 mb-6 md:mb-0 w-full md:w-[220px] max-w-sm px-4 z-40 border border-white/10 p-3.5 rounded-2xl flex flex-col items-start gap-1.5 transition-all text-left">
        <span className="text-[10px] font-sans font-extrabold tracking-widest text-[#a5e7ff] uppercase block mb-1">
          {copy.panelTitle}
        </span>
        <div className="flex flex-col gap-1.5 w-full">
          {positionSlots.map((pos, idx) => {
            const isFilled = drawn[idx] !== undefined;

            return (
              <div
                key={pos.name}
                onClick={() => {
                  if (isFilled) {
                    handleRemoveDrawnCard(idx);
                  }
                }}
                title={isFilled ? copy.cancelTitle : copy.hintTitle}
                className={`flex items-center justify-between p-2 rounded-xl border transition-all text-left select-none ${
                  isFilled
                    ? 'bg-[#1b1f2c]/90 border-[#a5e7ff]/40 text-white cursor-pointer hover:bg-rose-950/20 hover:border-rose-500/40 group'
                    : 'bg-[#1b1f2c]/25 border-white/5 text-[#bbc9cf]/40'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-[8px] font-sans font-semibold tracking-wider uppercase block text-gray-400 group-hover:text-rose-300 leading-tight">
                    {pos.name}
                  </span>
                  <span className={`text-[10px] leading-tight font-serif ${isFilled ? 'text-[#fface8] group-hover:text-rose-400 font-bold' : 'text-gray-600'}`}>
                    {isFilled ? copy.drawn : copy.empty}
                  </span>
                </div>

                <div
                  ref={(node) => {
                    positionCardRefs.current[idx] = node;
                  }}
                  className={`w-6 h-9 rounded border flex items-center justify-center shrink-0 ml-2 transition-all ${
                    isFilled
                      ? 'border-[#fface8]/30 bg-[#1b1f2c] text-[#fface8] group-hover:border-rose-500 group-hover:bg-rose-950 group-hover:text-rose-400'
                      : 'border-dashed border-gray-800 bg-transparent text-gray-700'
                  }`}
                >
                  {isFilled ? (
                    <>
                      <span className="text-[10px] font-serif font-bold group-hover:hidden">{idx + 1}</span>
                      <span className="text-[11px] font-bold hidden group-hover:inline text-rose-400">×</span>
                    </>
                  ) : (
                    <span className="text-[10px] font-sans text-gray-700">+</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Intent input bar */}
      <div className="relative z-30 w-full max-w-lg px-4 mb-6">
        <label className="block text-xs font-bold tracking-widest text-[#a5e7ff] mb-2.5 uppercase flex items-center justify-center gap-2">
          <PenTool className="w-3.5 h-3.5" />
          {copy.label}
        </label>
        <div className="relative">
          <input
            ref={questionInputRef}
            type="text"
            className="liquid-glass-input w-full rounded-full py-2.5 pl-6 pr-14 font-sans text-sm text-[#dfe2f3] placeholder-[#bbc9cf]/40 focus:outline-none transition-colors align-middle text-center"
            placeholder={copy.placeholder}
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              setIsQuestionDirty(true);
            }}
          />
          {isQuestionDirty && (
            <button
              type="button"
              onClick={handleConfirmQuestion}
              title={copy.confirmQuestionTitle}
              className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#a5e7ff] text-black shadow-[0_0_12px_rgba(165,231,255,0.55)] transition-all hover:scale-105 active:scale-95"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Spaced out instruction labels */}
      <div className="z-20 mb-6 w-full px-4 text-center">
        <div className="liquid-glass card-selection-heading-glass mx-auto max-w-2xl rounded-[26px] border border-white/10 px-5 py-4 md:px-8 md:py-5">
          <h2 className="font-serif text-2xl md:text-3xl text-[#dfe2f3] tracking-widest uppercase text-glow mb-1.5">
            {copy.title}
          </h2>
          <p className="font-sans text-xs md:text-sm text-[#bbc9cf] max-w-md mx-auto min-h-[20px]">
            {drawn.length < totalToDraw ? (
              <span className="flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#fface8] animate-pulse" />
                {copy.drawMore(
                  totalToDraw - drawn.length,
                  localizedSpread.name,
                  positionSlots[currentDrawIndex]?.name ?? positionSlots[currentDrawIndex]?.compactName ?? '',
                )}
              </span>
            ) : (
              <span className="text-[#a5e7ff] font-bold">{copy.complete}</span>
            )}
          </p>
        </div>
      </div>

      {/* Hand-of-cards fan (horizontally scrollable so the full spread is reachable on any width) */}
      <div
        ref={wheelAreaRef}
        className="relative w-full my-8 md:my-10 z-10 select-none"
        style={{ height: `${wheelFrameHeight}px` }}
      >
        {/* Soft ambient glow + drawn counter live in the viewport-centred layer (NOT in the
            scrolling content) so they stay put and aligned while the fan scrolls. */}
        {resolvedTheme !== 'light' && (
          <div
            className="absolute left-1/2 bottom-0 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(165,231,255,0.08)_0%,_transparent_75%)] pointer-events-none blur-3xl z-0"
            style={{ width: `${Math.min(560, fanContentWidth) * 0.7}px`, height: `${cardHeight * 1.5}px` }}
          />
        )}
        <div
          className="liquid-glass absolute left-1/2 bottom-1 -translate-x-1/2 z-20 flex flex-col items-center justify-center rounded-full border border-[#a5e7ff]/20 pointer-events-none"
          style={{ width: `${centerCounterSize}px`, height: `${centerCounterSize}px` }}
        >
          <span className="font-serif text-3xl font-bold text-[#fface8]">{drawn.length}</span>
          <span className="text-[10px] font-sans font-bold tracking-widest text-[#bbc9cf] uppercase">
            {language === 'zh' ? `已抽 ${drawn.length}/${totalToDraw}` : `of ${totalToDraw} drawn`}
          </span>
          {drawn.length === totalToDraw && <div className="w-1.5 h-1.5 rounded-full bg-[#ffdb40] animate-ping mt-1" />}
        </div>

        <div
          ref={fanScrollRef}
          className="fan-scroll absolute inset-0 overflow-x-auto overflow-y-hidden flex items-end"
          style={{ touchAction: 'pan-x pan-y', justifyContent: 'safe center' }}
          onScroll={(event) => {
            // Emit a faint haptic "tick" each time the fan scrolls past roughly one
            // card of travel, giving the swipe a notch-by-notch, ratcheting feel.
            const scrollLeft = event.currentTarget.scrollLeft;
            if (Math.abs(scrollLeft - lastTickScrollLeftRef.current) >= centerStep) {
              lastTickScrollLeftRef.current = scrollLeft;
              haptics.tick();
            }
          }}
        >
          {/* Fanned card spread. Cards are offset down by FAN_LIFT_HEADROOM so a lifted center card never clips the top. */}
          <div
            className="relative shrink-0"
            style={{ width: `${fanContentWidth}px`, height: `${wheelFrameHeight}px` }}
          >
            {wheelSlotIndexes.map((i) => {
              // Circular-arc fan: each card rotated a constant angular step about a pivot
              // below, positioned on the arc so the spread curves and splays like a real fan.
              const angle = (i - FAN_MID_INDEX) * FAN_STEP_RAD;
              const left = Math.round(fanContentWidth / 2 + fanRadius * Math.sin(angle) - cardWidth / 2);
              const yOffset = Math.round(fanRadius * (1 - Math.cos(angle)));
              const rotationDeg = getWheelCardRotation(i);

              // Check if this visual slot has been drawn or selected
              const isSelected = drawn.some(item => item.slotIndex === i) || returningSlotIndexes.includes(i);
              const isArmed = !isSelected && armedSlotIndex === i;
              const isHovered = !isSelected && !isArmed && hoveredSlotIndex === i;

              // Natural fan stacking: center card highest, easing down to both wings so
              // every card tucks under its inward neighbour. Hover only lifts the card a
              // little WITHOUT popping it above its neighbours, so no card ever buries the
              // one beside it — every exposed strip stays clickable. Only an armed (tapped)
              // card pops to the very top for confirmation.
              const distFromCenter = Math.abs(i - FAN_MID_INDEX);
              const baseZ = Math.round(TOTAL_CARDS_IN_WHEEL - distFromCenter) + 12;
              const itemZIndex = isSelected ? 5 : isArmed ? 300 : isHovered ? baseZ + 1 : baseZ;
              const lift = isArmed ? 22 : isHovered ? 12 : 0;

              return (
                <div
                  key={i}
                  ref={(node) => {
                    wheelCardRefs.current[i] = node;
                  }}
                  onPointerDown={(event) => {
                    lastPointerTypeRef.current = event.pointerType;
                  }}
                  onMouseEnter={() => setHoveredSlotIndex(i)}
                  onMouseLeave={() => setHoveredSlotIndex(current => (current === i ? null : current))}
                  onClick={() => handleCardClick(i)}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: `${FAN_LIFT_HEADROOM}px`,
                    transform: `translate3d(${left}px, ${yOffset - lift}px, 0) rotate(${rotationDeg}deg)`,
                    transition: 'transform 0.24s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.2s ease, border-color 0.2s ease, background-color 0.2s ease',
                    zIndex: itemZIndex,
                    opacity: isSelected ? 0.0 : 1, // Make it completely disappear from the fan upon draw
                    transformOrigin: 'center bottom',
                    pointerEvents: isSelected ? 'none' : 'auto',
                    width: `${cardWidth}px`,
                    height: `${cardHeight}px`,
                  }}
                  className={`rounded border ${
                    isSelected
                      ? 'border-gray-800 bg-gray-900/10'
                      : isArmed || isHovered
                        ? 'border-[#a5e7ff] bg-[#1b1f2c]/90'
                      : 'border-[#a5e7ff]/30 hover:border-[#a5e7ff] bg-[#1b1f2c]/85'
                  } tarot-wheel-card flex items-center justify-center cursor-pointer ${
                    resolvedTheme === 'light' ? '' : 'shadow-[0_4px_10px_rgba(0,0,0,0.4)]'
                  }`}
                >
                  {!isSelected && (
                    <div className="w-full h-full p-0.5 pointer-events-none">
                      <RetryingImage
                        src={cardBackImage}
                        alt=""
                        aria-hidden="true"
                        draggable={false}
                        decoding="async"
                        className="w-full h-full rounded object-contain"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {flights.map(cardFlight => (
        <div
          key={cardFlight.id}
          className="tarot-card-flight fixed left-0 top-0 z-[70] rounded border border-[#a5e7ff]/70 bg-[#1b1f2c]/95 pointer-events-none overflow-hidden shadow-[0_0_24px_rgba(165,231,255,0.52)]"
          style={cardFlight.style}
          onAnimationEnd={() => finishCardFlight(cardFlight)}
        >
          <div className="w-full h-full p-0.5">
            <RetryingImage
              src={cardBackImage}
              alt=""
              aria-hidden="true"
              draggable={false}
              decoding="async"
              className="w-full h-full rounded object-contain"
            />
          </div>
        </div>
      ))}

      {/* Confirmation Actions - Pushed down with extra mt and bottom padding to avoid any overlap */}
      <div ref={confirmAreaRef} className="relative z-30 mt-10 pb-12 w-full px-4 flex justify-center">
        {isSelectionComplete ? (
          <button
            onClick={handleConfirm}
            className="liquid-glass-primary w-full max-w-sm py-4 rounded-full font-serif font-bold text-lg text-black active:scale-95 transition-all cursor-pointer tracking-wider flex items-center justify-center gap-2"
          >
            {copy.confirm}
            <Sparkles className="w-5 h-5 animate-spin-slow" />
          </button>
        ) : (
          <div className="liquid-glass-chip py-2.5 px-6 rounded-full border border-white/5 text-[#bbc9cf]/60 font-sans text-xs tracking-widest uppercase">
            {copy.selectMore(totalToDraw - drawn.length)}
          </div>
        )}
      </div>
    </div>
  );
}
