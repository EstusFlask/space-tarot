import { useEffect, useState } from 'react';
import { DrawnCard } from '../types';
import { getLocalizedCardName, getTarotImageByName, TarotSpread } from '../data/tarotCards';
import { Sparkles, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { Language, UI_COPY, getLocalizedArcanaLabel, getLocalizedSpread } from '../data/localization';
import type { ThemeMode } from '../types';
import cardBackDayImage from '../../images/card_back/card_back_day.png?url';
import cardBackNightImage from '../../images/card_back/card_back_night.png?url';
import QuestionPromptDialog from './QuestionPromptDialog';
import RetryingImage from './RetryingImage';
import ViewportPortal from './ViewportPortal';
import type { AISettings } from '../utils/aiSettings';
import { hasAIKey } from '../utils/aiSettings';
import { requestTarotInterpretation } from '../utils/glmClient';

interface CardRevealViewProps {
  spread: TarotSpread;
  drawnCards: DrawnCard[];
  onProceedToChat: (preloadedAIAnalysis: string, question?: string) => void;
  question: string;
  language: Language;
  aiSettings: AISettings;
  onOpenAISettings: () => void;
  onRevealStatusChange: (allCardsRevealed: boolean) => void;
  initialAllRevealed: boolean;
  hasExistingOracleSession: boolean;
  onReturnToChat: () => void;
  resolvedTheme: Exclude<ThemeMode, 'system'>;
}

export default function CardRevealView({
  spread,
  drawnCards,
  onProceedToChat,
  question,
  language,
  aiSettings,
  onOpenAISettings,
  onRevealStatusChange,
  initialAllRevealed,
  hasExistingOracleSession,
  onReturnToChat,
  resolvedTheme,
}: CardRevealViewProps) {
  const [flipped, setFlipped] = useState<number[]>(() => (
    initialAllRevealed ? drawnCards.map((_, index) => index) : []
  ));
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showQuestionPrompt, setShowQuestionPrompt] = useState(false);
  const copy = UI_COPY[language].cardReveal;
  const localizedSpread = getLocalizedSpread(spread, language);
  const commonCopy = UI_COPY[language].common;
  const cardBackImage = resolvedTheme === 'light' ? cardBackDayImage : cardBackNightImage;

  const localizeKeyword = (keyword: string, cardName: string) => {
    if (keyword === cardName) {
      return getLocalizedCardName(cardName, language);
    }

    if (keyword === 'Upright') {
      return commonCopy.upright;
    }

    if (keyword === 'Reversed') {
      return commonCopy.reversed;
    }

    return keyword;
  };

  const handleCardClick = (index: number) => {
    if (!flipped.includes(index)) {
      setFlipped([...flipped, index]);
    } else {
      setSelectedCardIndex(selectedCardIndex === index ? null : index);
    }
  };

  const handleRevealAll = () => {
    const allIndices = Array.from({ length: drawnCards.length }).map((_, i) => i);
    setFlipped(allIndices);
  };

  const consultGLM = async (focusQuestion: string) => {
    setIsAiLoading(true);
    setAiError(null);

    try {
      const payload = {
        settings: aiSettings,
        spreadName: localizedSpread.name,
        question: focusQuestion,
        language,
        cardsDrawn: drawnCards.map(dc => ({
          name: dc.card.name,
          displayName: getLocalizedCardName(dc.card.name, language),
          positionName: localizedSpread.positions[dc.positionIndex]?.name ?? dc.positionName,
          positionDesc: localizedSpread.positions[dc.positionIndex]?.description ?? dc.positionDesc,
          isUpright: dc.isUpright,
          keywords: (dc.isUpright ? dc.card.uprightKeywords : dc.card.reversedKeywords).map(k =>
            localizeKeyword(k, dc.card.name),
          ),
          arcana: getLocalizedArcanaLabel(dc.card, language),
          description: dc.card.description,
        })),
      };

      const interpretation = await requestTarotInterpretation(payload);
      onProceedToChat(interpretation, focusQuestion);
    } catch (err: any) {
      console.error('Error in Oracle consultation:', err);
      setAiError(err.message || copy.consultationError);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleConsultOracle = async () => {
    if (hasExistingOracleSession) {
      onReturnToChat();
      return;
    }

    if (!hasAIKey(aiSettings)) {
      setAiError(null);
      onOpenAISettings();
      return;
    }

    if (!question.trim()) {
      setAiError(null);
      setShowQuestionPrompt(true);
      return;
    }

    await consultGLM(question.trim());
  };

  const handleSubmitQuestionPrompt = (focusQuestion: string) => {
    setShowQuestionPrompt(false);
    void consultGLM(focusQuestion);
  };

  const getThemeClass = (theme: string) => {
    switch (theme) {
      case 'cyan':
        return 'border-[#a5e7ff]/40 neon-rim-blue text-[#a5e7ff]';
      case 'magenta':
        return 'border-[#fface8]/40 neon-rim-magenta text-[#fface8]';
      case 'gold':
        return 'border-[#ffdb40]/40 neon-rim-gold text-[#ffdb40]';
      case 'emerald':
        return 'border-emerald-400/40 neon-rim-emerald text-emerald-300';
      case 'amber':
        return 'border-amber-400/40 neon-rim-amber text-amber-300';
      default:
        return 'border-[#a5e7ff]/30 neon-rim-blue';
    }
  };

  const allFlipped = drawnCards.length > 0 && flipped.length === drawnCards.length;
  const selectedCard = selectedCardIndex !== null ? drawnCards[selectedCardIndex].card : null;
  const selectedCardName = selectedCard ? getLocalizedCardName(selectedCard.name, language) : '';

  useEffect(() => {
    onRevealStatusChange(allFlipped);
  }, [allFlipped, onRevealStatusChange]);

  const getPositionHeading = (index: number) => {
    const position = localizedSpread.positions[drawnCards[index]?.positionIndex ?? index];
    return position?.name ?? copy.positions[index] ?? '';
  };

  const getCompactPositionLabel = (index: number) =>
    localizedSpread.positions[index]?.compactName ?? localizedSpread.positions[index]?.name ?? '';

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[calc(100vh-100px)] pt-24 md:pt-32 text-center pb-32">
      {/* Upper info panel */}
      <div className="text-center mb-6 w-full px-4">
        <h2 className="font-serif text-3xl md:text-4xl text-[#dfe2f3] tracking-wide mb-1">
          {!allFlipped ? copy.titlePending : copy.titleComplete}
        </h2>
        <p className="font-sans text-xs md:text-sm text-[#bbc9cf] max-w-lg mx-auto">
          {!allFlipped ? copy.subtitlePending : copy.subtitleComplete}
        </p>

        {question && (
          <div className="liquid-glass-chip mt-3 inline-block border border-[#a5e7ff]/20 rounded-full px-4 py-1 font-sans text-xs text-[#a5e7ff] tracking-wide">
            {copy.focusQuery} <span className="italic text-white">"{question}"</span>
          </div>
        )}
      </div>

      {/* RENDER THE CORRESPONDING SPREAD LAYOUT */}
      {spread.id === 'yesno' && (
        <div className="relative w-full max-w-sm h-96 flex items-center justify-center my-6">
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 h-12 bg-[#a5e7ff]/10 rounded-full blur-2xl pointer-events-none" />

          <TarotCardFlipItem
            dc={drawnCards[0]}
            isFlipped={flipped.includes(0)}
            onClick={() => handleCardClick(0)}
            themeClass={getThemeClass(drawnCards[0].card.colorTheme)}
            language={language}
            cardBackImage={cardBackImage}
          />
        </div>
      )}

      {spread.id === 'threecard' && (
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full max-w-4xl px-4 my-6">
          {drawnCards.map((dc, index) => (
            <div key={index} className="flex flex-col items-center gap-2 w-full max-w-[240px]">
              <span className="font-serif text-[#a5e7ff] text-xs font-bold tracking-widest uppercase mb-1">
                {localizedSpread.positions[index]?.name ?? dc.positionName}
              </span>
              <TarotCardFlipItem
                dc={dc}
                isFlipped={flipped.includes(index)}
                onClick={() => handleCardClick(index)}
                themeClass={getThemeClass(dc.card.colorTheme)}
                language={language}
                cardBackImage={cardBackImage}
              />
            </div>
          ))}
        </div>
      )}

      {spread.id === 'celticcross' && (
        <div className="relative w-full max-w-5xl flex flex-col xl:flex-row items-center justify-center gap-12 my-6 px-4">
          {/* Group 1: The Ring/Cross Cluster */}
          <div className="relative w-[340px] h-[340px] sm:w-[440px] sm:h-[440px] flex items-center justify-center">
            {/* Positioning Cards in traditional shape */}

            {/* Position 1: Central Situation / Present */}
            <div
              className={`absolute w-18 h-28 sm:w-22 sm:h-34 transition-all duration-300 hover:scale-110 hover:z-30 cursor-pointer ${
                selectedCardIndex === 0 ? 'z-30 scale-105 shadow-2xl shadow-[#a5e7ff]/10' : 'z-10'
              }`}
            >
              <TarotCardFlipItem
                dc={drawnCards[0]}
                isFlipped={flipped.includes(0)}
                onClick={() => handleCardClick(0)}
                themeClass={getThemeClass(drawnCards[0].card.colorTheme)}
                compact
                language={language}
                cardBackImage={cardBackImage}
              />
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] text-gray-500 font-sans tracking-tight">
                {getCompactPositionLabel(0)}
              </span>
            </div>

            {/* Position 2: Obstacle (Overlapping rotated) */}
            <div
              className={`absolute w-18 h-28 sm:w-22 sm:h-34 rotate-90 transform translate-x-2 transition-all duration-300 hover:scale-110 hover:z-30 cursor-pointer ${
                selectedCardIndex === 1 ? 'z-30 scale-105 shadow-2xl shadow-[#fface8]/10' : 'z-20'
              }`}
            >
              <TarotCardFlipItem
                dc={drawnCards[1]}
                isFlipped={flipped.includes(1)}
                onClick={() => handleCardClick(1)}
                themeClass={getThemeClass(drawnCards[1].card.colorTheme)}
                compact
                language={language}
                cardBackImage={cardBackImage}
              />
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] text-gray-500 font-sans tracking-tight -rotate-90">
                {getCompactPositionLabel(1)}
              </span>
            </div>

            {/* Position 3: Subconscious (Below center) */}
            <div className="absolute bottom-0 z-10 w-18 h-28 sm:w-22 sm:h-34">
              <TarotCardFlipItem
                dc={drawnCards[2]}
                isFlipped={flipped.includes(2)}
                onClick={() => handleCardClick(2)}
                themeClass={getThemeClass(drawnCards[2].card.colorTheme)}
                compact
                language={language}
                cardBackImage={cardBackImage}
              />
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] text-gray-500 font-sans tracking-tight">
                {getCompactPositionLabel(2)}
              </span>
            </div>

            {/* Position 4: Past Base (Left) */}
            <div className="absolute left-0 z-10 w-18 h-28 sm:w-22 sm:h-34">
              <TarotCardFlipItem
                dc={drawnCards[3]}
                isFlipped={flipped.includes(3)}
                onClick={() => handleCardClick(3)}
                themeClass={getThemeClass(drawnCards[3].card.colorTheme)}
                compact
                language={language}
                cardBackImage={cardBackImage}
              />
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] text-gray-500 font-sans tracking-tight">
                {getCompactPositionLabel(3)}
              </span>
            </div>

            {/* Position 5: Conscious (Above) */}
            <div className="absolute top-0 z-10 w-18 h-28 sm:w-22 sm:h-34">
              <TarotCardFlipItem
                dc={drawnCards[4]}
                isFlipped={flipped.includes(4)}
                onClick={() => handleCardClick(4)}
                themeClass={getThemeClass(drawnCards[4].card.colorTheme)}
                compact
                language={language}
                cardBackImage={cardBackImage}
              />
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] text-gray-500 font-sans tracking-tight">
                {getCompactPositionLabel(4)}
              </span>
            </div>

            {/* Position 6: Immediate Future (Right of core) */}
            <div className="absolute right-0 z-10 w-18 h-28 sm:w-22 sm:h-34">
              <TarotCardFlipItem
                dc={drawnCards[5]}
                isFlipped={flipped.includes(5)}
                onClick={() => handleCardClick(5)}
                themeClass={getThemeClass(drawnCards[5].card.colorTheme)}
                compact
                language={language}
                cardBackImage={cardBackImage}
              />
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] text-gray-500 font-sans tracking-tight">
                {getCompactPositionLabel(5)}
              </span>
            </div>
          </div>

          {/* Group 2: The Vertical Column Staff (Cards 7, 8, 9, 10 on right side) */}
          <div className="flex flex-row xl:flex-col items-center justify-center gap-4 xl:gap-2 flex-wrap w-full max-w-[480px] xl:max-w-[124px] xl:border-l xl:border-white/5 xl:pl-6">
            {[9, 8, 7, 6].map((idx) => {
              const dc = drawnCards[idx];
              return (
                <div key={idx} className="flex flex-col items-center relative w-18 h-28 sm:w-22 sm:h-34">
                  <TarotCardFlipItem
                    dc={dc}
                    isFlipped={flipped.includes(idx)}
                    onClick={() => handleCardClick(idx)}
                    themeClass={getThemeClass(dc.card.colorTheme)}
                    compact
                    language={language}
                    cardBackImage={cardBackImage}
                  />
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-gray-500 font-sans font-bold whitespace-nowrap">
                    {getCompactPositionLabel(idx)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Card Deep Intuitive Deck Drawer details */}
      {selectedCardIndex !== null && (
        <div className="w-full max-w-lg mx-auto px-4 mt-12 animate-fade-in relative z-20">
          <div className="liquid-glass rounded-xl p-6 text-left border border-[#a5e7ff]/20">
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-3">
              <div>
                <span className="text-xs text-[#fface8] font-serif font-bold uppercase tracking-widest block">
                  {getPositionHeading(selectedCardIndex)}
                </span>
                <h4 className="text-xl font-serif text-[#dfe2f3] font-bold">
                  {selectedCardName}{' '}
                  <span className="text-[#a5e7ff] text-xs">
                    ({drawnCards[selectedCardIndex].isUpright ? commonCopy.upright : commonCopy.reversed})
                  </span>
                </h4>
              </div>
              <div className="liquid-glass-chip w-10 h-14 rounded border border-white/10 flex items-center justify-center overflow-hidden">
                <RetryingImage
                  src={getTarotImageByName(drawnCards[selectedCardIndex].card.name)}
                  alt={getLocalizedCardName(drawnCards[selectedCardIndex].card.name, language)}
                  className={`h-full w-full object-contain ${drawnCards[selectedCardIndex].isUpright ? '' : 'rotate-180'}`}
                />
              </div>
            </div>

            <p className="text-[#bbc9cf] text-sm leading-relaxed mb-4 whitespace-pre-line">
              {drawnCards[selectedCardIndex].card.description}
            </p>

            <div className="space-y-2">
              <span className="text-xs font-bold text-[#ffdb40] uppercase tracking-wider block">
                {copy.guidanceKeywords}
              </span>
              <div className="flex gap-1.5 flex-wrap">
                {(drawnCards[selectedCardIndex].isUpright
                  ? drawnCards[selectedCardIndex].card.uprightKeywords
                  : drawnCards[selectedCardIndex].card.reversedKeywords
                ).map((k, i) => (
                  <span key={i} className="liquid-glass-chip border border-white/5 text-[#dfe2f3] text-xs rounded-full px-3 py-0.5">
                    {k === 'Upright' ? commonCopy.upright : k === 'Reversed' ? commonCopy.reversed : k}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Actions Bar at the bottom of reveal */}
      <ViewportPortal>
        <div className="liquid-glass-bar fixed inset-x-0 bottom-0 z-40 w-full border-t border-white/5 px-4 py-4">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-center gap-4">
        {!allFlipped ? (
          <button
            onClick={handleRevealAll}
            className="liquid-glass-control px-6 py-3 rounded-full border border-[#a5e7ff]/30 text-[#a5e7ff] hover:bg-[#a5e7ff]/10 active:scale-95 transition-all text-xs font-bold tracking-widest uppercase cursor-pointer"
          >
            {copy.revealAll}
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-between">
            <span className="text-xs text-[#bbc9cf] text-left hidden sm:inline leading-tight max-w-[260px]">
              {copy.allDrawnHint}
            </span>
            <button
              onClick={handleConsultOracle}
              disabled={isAiLoading}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-full font-serif font-bold text-xs ${
                isAiLoading
                  ? 'liquid-glass-chip text-gray-500 cursor-not-allowed border border-gray-700'
                  : 'liquid-glass-primary text-black hover:opacity-90 active:scale-95 cursor-pointer'
              } tracking-widest uppercase flex items-center justify-center gap-2`}
            >
              {isAiLoading ? (
                <>
                  {copy.consulting}
                  <RefreshCw className="w-4 h-4 animate-spin" />
                </>
              ) : (
                <>
                  {copy.askOracle}
                  <ArrowRight className="w-4 h-4 animate-pulse" />
                </>
              )}
            </button>
          </div>
        )}
          </div>
        </div>
      </ViewportPortal>

      {/* Embedded loader during consult */}
      {isAiLoading && (
        <ViewportPortal>
          <div className="fixed inset-0 z-[80] bg-[#0f131f]/80 backdrop-blur-lg flex flex-col items-center justify-center p-6 text-center">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-full border-t-2 border-[#fface8] border-r-2 border-[#a5e7ff] animate-spin" />
              <Sparkles className="w-6 h-6 text-[#ffdb40] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-white mb-2 tracking-wider uppercase text-glow">
              {copy.loadingTitle}
            </h3>
            <p className="font-sans text-sm text-[#bbc9cf] max-w-sm">
              {copy.loadingBody(localizedSpread.name)}
            </p>
          </div>
        </ViewportPortal>
      )}

      {/* Error displays */}
      {aiError && (
        <ViewportPortal>
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] w-[90%] max-w-md liquid-glass p-4 rounded-xl border border-red-500/30 flex gap-3 text-left">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <h5 className="font-sans font-bold text-red-300 text-xs uppercase tracking-wide">
                {copy.errorTitle}
              </h5>
              <p className="font-sans text-xs text-red-200 mt-1">{aiError}</p>
              <button
                onClick={handleConsultOracle}
                className="text-white underline text-[10px] font-bold mt-2 hover:opacity-80 block"
              >
                {copy.retry}
              </button>
            </div>
          </div>
        </ViewportPortal>
      )}

      <QuestionPromptDialog
        open={showQuestionPrompt}
        language={language}
        onCancel={() => setShowQuestionPrompt(false)}
        onSubmit={handleSubmitQuestionPrompt}
      />
    </div>
  );
}

// Subcomponent: Individual Card Flip Widget
interface TarotCardFlipItemProps {
  dc: DrawnCard;
  isFlipped: boolean;
  onClick: () => void;
  themeClass: string;
  compact?: boolean;
  language: Language;
  cardBackImage: string;
}

function TarotCardFlipItem({
  dc,
  isFlipped,
  onClick,
  themeClass,
  compact = false,
  language,
  cardBackImage,
}: TarotCardFlipItemProps) {
  const cardImage = getTarotImageByName(dc.card.name);
  const arcanaLabel = getLocalizedArcanaLabel(dc.card, language);
  const cardName = getLocalizedCardName(dc.card.name, language);

  return (
    <div
      onClick={onClick}
      className={`perspective-1000 ${
        compact ? 'w-18 h-28 sm:w-22 sm:h-34' : 'w-48 h-72'
      } cursor-pointer relative group`}
    >
      {/* Plinth shadow directly below */}
      {!compact && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-[85%] h-6 bg-[#a5e7ff]/10 rounded-full blur-xl pointer-events-none group-hover:bg-[#a5e7ff]/20 transition-all duration-300" />
      )}

      <div
        className={`card-inner w-full h-full relative preserve-3d shadow-2xl rounded-xl transition-all duration-[900ms] ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* Face-down structure */}
        <div className="absolute inset-0 w-full h-full backface-hidden rounded-xl flex items-center justify-center overflow-hidden bg-transparent transition-[filter] duration-300 group-hover:drop-shadow-[0_0_14px_rgba(165,231,255,0.35)]">
          <RetryingImage
            src={cardBackImage}
            alt={UI_COPY[language].cardSelection.faceDownLabel}
            draggable={false}
            decoding="async"
            className="h-full w-full object-contain"
          />
        </div>

        {/* Face-up structure */}
        <div
          className={`liquid-glass absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-xl overflow-hidden shadow-2xl border flex flex-col items-center justify-between p-2 sm:p-4 transition-[filter,box-shadow] duration-300 group-hover:drop-shadow-[0_0_14px_rgba(165,231,255,0.35)] ${themeClass}`}
        >
          {/* Bevel details */}
          <div className="absolute inset-1.5 border border-white/[0.04] rounded-lg pointer-events-none" />

          <div className="w-full text-left uppercase text-[7px] text-gray-500 font-bold tracking-widest">
            {arcanaLabel}
          </div>

          <div className="relative flex-1 w-full flex items-center justify-center my-1 overflow-hidden rounded-lg">
            <RetryingImage
              src={cardImage}
              alt={cardName}
              className={`max-h-full max-w-full object-contain transition-transform duration-500 ${
                dc.isUpright ? '' : 'rotate-180'
              }`}
            />
          </div>

          <div className="w-full flex items-end justify-between text-[7px] uppercase font-sans tracking-widest">
            <span>{cardName}</span>
            <span className="text-white/30">{dc.isUpright ? UI_COPY[language].common.upright : UI_COPY[language].common.reversed}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
