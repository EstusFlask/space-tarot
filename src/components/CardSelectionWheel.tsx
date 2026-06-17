import { useState, useEffect, useRef } from 'react';
import { TarotCard, TarotSpread, TAROT_DECK } from '../data/tarotCards';
import { DrawnCard } from '../types';
import { Sparkles, HelpCircle, PenTool } from 'lucide-react';
import { cryptoRandomBoolean, cryptoRandomInt, cryptoShuffle } from '../utils/cryptoRandom';
import { Language, UI_COPY, getLocalizedSpread } from '../data/localization';

interface CardSelectionWheelProps {
  spread: TarotSpread;
  onCardsSelected: (drawnCards: DrawnCard[], question: string) => void;
  language: Language;
}

interface DrawSelection {
  slotIndex: number;
  card: TarotCard;
  isUpright: boolean;
}

export default function CardSelectionWheel({ spread, onCardsSelected, language }: CardSelectionWheelProps) {
  const [drawn, setDrawn] = useState<DrawSelection[]>([]);
  const [question, setQuestion] = useState('');
  const [deck, setDeck] = useState<TarotCard[]>([]);
  const [availableWheelWidth, setAvailableWheelWidth] = useState(() => (typeof window === 'undefined' ? 560 : window.innerWidth - 48));
  const wheelAreaRef = useRef<HTMLDivElement | null>(null);
  const copy = UI_COPY[language].cardSelection;
  const localizedSpread = getLocalizedSpread(spread, language);
  const positionSlots = localizedSpread.positions;

  useEffect(() => {
    setDeck(cryptoShuffle(TAROT_DECK));
  }, []);

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

  const totalToDraw = spread.cardCount;
  const currentDrawIndex = drawn.length;
  const isSelectionComplete = drawn.length >= totalToDraw;

  const handleRemoveDrawnCard = (slotIndex: number) => {
    setDrawn(prev => prev.filter(item => item.slotIndex !== slotIndex));
  };

  const handleCardClick = (slotIndex: number) => {
    setDrawn(prev => {
      if (prev.some(item => item.slotIndex === slotIndex)) {
        return prev.filter(item => item.slotIndex !== slotIndex);
      }

      if (prev.length >= totalToDraw) return prev;

      const sourceDeck = deck.length ? deck : TAROT_DECK;
      const selectedCardIds = new Set(prev.map(item => item.card.id));
      const availableCards = sourceDeck.filter(card => !selectedCardIds.has(card.id));

      if (!availableCards.length) return prev;

      return [
        ...prev,
        {
          slotIndex,
          card: availableCards[cryptoRandomInt(availableCards.length)],
          isUpright: cryptoRandomBoolean(),
        },
      ];
    });
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

  // Generate coordinates for fanned circle (exactly 78 visible cards mapping to a full Tarot deck)
  const totalCardsInWheel = 78;
  const wheelOuterDiameter = Math.min(560, Math.max(272, availableWheelWidth));
  const cardHeight = Math.round(Math.min(80, Math.max(60, wheelOuterDiameter * (80 / 560))));
  const cardWidth = Math.round(cardHeight * 0.6);
  const radius = Math.round((wheelOuterDiameter - cardHeight) / 2);
  const wheelDiameter = radius * 2;
  const wheelFrameHeight = wheelOuterDiameter + 24;
  const centerCounterSize = Math.round(Math.min(128, Math.max(92, wheelOuterDiameter * 0.28)));

  return (
    <div className="w-full flex flex-col items-center justify-start min-h-[calc(100vh-80px)] pt-20 pb-20 text-center relative overflow-hidden">
      {/* Top Right Floating Interactive Drawn Tapestry Control Panel */}
      <div className="md:absolute md:top-2 md:right-6 md:mt-4 mb-6 md:mb-0 w-full md:w-[220px] max-w-sm px-4 z-40 bg-[#1b1f2c]/55 backdrop-blur-xl border border-white/10 p-3.5 rounded-2xl flex flex-col items-start gap-1.5 transition-all text-left shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <span className="text-[10px] font-sans font-extrabold tracking-widest text-[#a5e7ff] uppercase block mb-1">
          {copy.panelTitle}
        </span>
        <div className="flex flex-col gap-1.5 w-full">
          {positionSlots.map((pos, idx) => {
            const isFilled = drawn[idx] !== undefined;
            const slotIndex = isFilled ? drawn[idx].slotIndex : null;

            return (
              <div
                key={pos.name}
                onClick={() => {
                  if (isFilled && slotIndex !== null) {
                    handleRemoveDrawnCard(slotIndex);
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
            type="text"
            className="w-full bg-[#1b1f2c]/50 border border-white/10 rounded-full py-2.5 px-6 font-sans text-sm text-[#dfe2f3] placeholder-[#bbc9cf]/40 focus:border-[#a5e7ff] focus:ring-1 focus:ring-[#a5e7ff]/30 focus:outline-none transition-colors align-middle shadow-lg text-center"
            placeholder={copy.placeholder}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>
      </div>

      {/* Spaced out instruction labels */}
      <div className="z-20 text-center mb-6 px-4">
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

      {/* Floating Circle Tarot deck - Taller container height and extra margins to avoid overlap */}
      <div
        ref={wheelAreaRef}
        className="relative w-full my-8 md:my-10 flex items-center justify-center z-10 select-none"
        style={{ height: `${wheelFrameHeight}px` }}
      >
        {/* Subtle center ambient light source */}
        <div
          className="absolute rounded-full bg-[radial-gradient(circle,_rgba(165,231,255,0.08)_0%,_transparent_75%)] pointer-events-none blur-3xl"
          style={{ width: `${wheelDiameter * 0.64}px`, height: `${wheelDiameter * 0.64}px` }}
        />

        {/* Drawn Counter Indicator */}
        <div
          className="absolute z-20 flex flex-col items-center justify-center bg-[#1b1f2c]/75 backdrop-blur-md rounded-full border border-[#a5e7ff]/20 shadow-2xl"
          style={{ width: `${centerCounterSize}px`, height: `${centerCounterSize}px` }}
        >
          <span className="font-serif text-3xl font-bold text-[#fface8]">{drawn.length}</span>
          <span className="text-[10px] font-sans font-bold tracking-widest text-[#bbc9cf] uppercase">
            {language === 'zh' ? `已抽 ${drawn.length}/${totalToDraw}` : `of ${totalToDraw} drawn`}
          </span>
          {drawn.length === totalToDraw && <div className="w-1.5 h-1.5 rounded-full bg-[#ffdb40] animate-ping mt-1" />}
        </div>

        {/* Dynamic fan card wheel */}
        <div
          className="relative flex items-center justify-center"
          style={{ width: `${wheelDiameter}px`, height: `${wheelDiameter}px` }}
        >
          {Array.from({ length: totalCardsInWheel }).map((_, i) => {
            const angle = (i / totalCardsInWheel) * 2 * Math.PI;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            const rotationDeg = (angle * 180) / Math.PI + 90; // Align perpendicular to radius

            // Check if this visual slot has been drawn or selected
            const isSelected = drawn.some(item => item.slotIndex === i);

            // Dynamically calculate z-index based on the card's vertical height (y coordinate)
            // This ensures that cards higher up perfectly overlap cards further down,
            // creating a continuous, seamless circular overlap fan without any abrupt breakpoint.
            const itemZIndex = isSelected ? 5 : Math.round(((radius - y) / radius) * 100) + 12;

            return (
              <div
                key={i}
                onClick={() => handleCardClick(i)}
                style={{
                  position: 'absolute',
                  transform: `translate(${x}px, ${y}px) rotate(${rotationDeg}deg)`,
                  transition: 'all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1)',
                  zIndex: itemZIndex,
                  opacity: isSelected ? 0.0 : 1, // Make it completely disappear from the wheel upon draw
                  transformOrigin: 'center center',
                  pointerEvents: isSelected ? 'none' : 'auto',
                  width: `${cardWidth}px`,
                  height: `${cardHeight}px`,
                }}
                className={`rounded border ${
                  isSelected
                    ? 'border-gray-800 bg-gray-900/10'
                    : 'border-[#a5e7ff]/30 hover:border-[#a5e7ff] bg-[#1b1f2c]/85 hover:-translate-y-2'
                } backdrop-blur-xs flex items-center justify-center cursor-pointer shadow-[0_4px_10px_rgba(0,0,0,0.4)] transition-all`}
              >
                {!isSelected && (
                  <div className="w-full h-full p-0.5 pointer-events-none">
                    <div className="w-full h-full rounded border border-white/5 bg-gradient-to-b from-[#a5e7ff]/5 via-transparent to-[#fface8]/5 flex items-center justify-center">
                      <HelpCircle className="w-4 h-4 text-[#a5e7ff]/25 animate-pulse" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Actions - Pushed down with extra mt and bottom padding to avoid any overlap */}
      <div className="relative z-30 mt-10 pb-12 w-full px-4 flex justify-center">
        {isSelectionComplete ? (
          <button
            onClick={handleConfirm}
            className="w-full max-w-sm py-4 rounded-full font-serif font-bold text-lg text-black bg-[#a5e7ff] hover:bg-[#b6ebff] active:scale-95 transition-all shadow-[0_0_20px_rgba(165,231,255,0.5)] cursor-pointer tracking-wider flex items-center justify-center gap-2"
          >
            {copy.confirm}
            <Sparkles className="w-5 h-5 animate-spin-slow" />
          </button>
        ) : (
          <div className="py-2.5 px-6 rounded-full border border-white/5 bg-white/[0.02] text-[#bbc9cf]/60 font-sans text-xs tracking-widest uppercase">
            {copy.selectMore(totalToDraw - drawn.length)}
          </div>
        )}
      </div>
    </div>
  );
}
