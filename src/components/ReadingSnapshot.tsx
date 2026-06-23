import { forwardRef, type CSSProperties } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, DrawnCard, ThemeMode } from '../types';
import { getLocalizedCardName, getTarotSnapshotImageByName, TarotSpread } from '../data/tarotCards';
import { Language, UI_COPY, getLocalizedArcanaLabel, getLocalizedSpread } from '../data/localization';
import { localizeKeyword } from '../utils/keywords';

type ResolvedTheme = Exclude<ThemeMode, 'system'>;

interface ReadingSnapshotProps {
  spread: TarotSpread;
  drawnCards: DrawnCard[];
  question: string;
  messages: ChatMessage[];
  language: Language;
  resolvedTheme: ResolvedTheme;
}

const SNAPSHOT_COPY = {
  zh: {
    savedAt: '保存时间',
    focus: '聚焦问题',
    generalFocus: '通用能量校准',
    cards: '所有翻开的卡片',
    meanings: '翻开卡片的解释',
    keywords: '关键词',
    conversation: 'AI 对话记录',
  },
  en: {
    savedAt: 'Saved at',
    focus: 'Focus',
    generalFocus: 'General energy alignment',
    cards: 'Revealed Cards',
    meanings: 'Card Interpretations',
    keywords: 'Keywords',
    conversation: 'AI Conversation',
  },
} as const;

function formatSnapshotTime(language: Language) {
  return new Date().toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getSnapshotTheme(resolvedTheme: ResolvedTheme) {
  const isLight = resolvedTheme === 'light';
  const glassBase: CSSProperties = {
    backgroundClip: 'padding-box',
  };

  return {
    rootClassName: `relative w-[960px] overflow-hidden p-10 font-sans ${isLight ? 'text-[#10203a]' : 'text-[#dfe2f3]'}`,
    rootStyle: {
      backgroundColor: isLight ? '#eef3f1' : '#0f131f',
      backgroundImage: isLight
        ? 'radial-gradient(circle at top, rgba(255, 255, 255, 0.9), transparent 32%), radial-gradient(circle at 22% 10%, rgba(255, 255, 255, 0.42), transparent 30%), linear-gradient(135deg, #a5c8f6 0%, #f2f6e2 50%, #fdcece 100%)'
        : 'radial-gradient(circle at 18% 8%, rgba(165, 231, 255, 0.2), transparent 28%), radial-gradient(circle at 82% 0%, rgba(255, 172, 232, 0.16), transparent 30%), radial-gradient(circle at 50% 100%, rgba(255, 219, 64, 0.08), transparent 42%), linear-gradient(180deg, #111827 0%, #0f131f 100%)',
    } satisfies CSSProperties,
    noiseStyle: {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      backgroundImage: 'var(--dither-noise)',
      backgroundSize: '160px 160px',
      mixBlendMode: isLight ? 'multiply' : 'soft-light',
      opacity: isLight ? 0.12 : 0.18,
    } satisfies CSSProperties,
    panelClassName: `relative overflow-hidden rounded-xl p-8 shadow-2xl ${isLight ? 'border border-white/60' : 'border border-white/10'}`,
    panelStyle: {
      ...glassBase,
      background: isLight
        ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.58), rgba(255, 255, 255, 0.2) 42%, rgba(255, 255, 255, 0.38)), radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.46), transparent 42%), radial-gradient(circle at 90% 105%, rgba(253, 206, 206, 0.36), transparent 52%), rgba(255, 255, 255, 0.28)'
        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.17), rgba(255, 255, 255, 0.055) 42%, rgba(255, 255, 255, 0.11)), radial-gradient(circle at 18% 0%, rgba(165, 231, 255, 0.2), transparent 40%), radial-gradient(circle at 90% 105%, rgba(255, 172, 232, 0.16), transparent 52%), rgba(18, 24, 38, 0.5)',
      boxShadow: isLight
        ? 'inset 1.5px -1.5px 1px -1px rgba(255, 255, 255, 0.95), inset -1.5px 1.5px 1px -1px rgba(255, 255, 255, 0.82), inset 0 0 4px rgba(16, 32, 58, 0.16), 0 24px 54px rgba(16, 32, 58, 0.16)'
        : 'inset 1.5px -1.5px 1px -1px rgba(255, 255, 255, 0.78), inset -1.5px 1.5px 1px -1px rgba(255, 255, 255, 0.5), inset 0 0 4px rgba(15, 23, 42, 0.45), 0 24px 54px rgba(3, 7, 18, 0.36)',
    } satisfies CSSProperties,
    cardStyle: {
      ...glassBase,
      background: isLight
        ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.48), rgba(255, 255, 255, 0.2)), rgba(255, 255, 255, 0.26)'
        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.035)), rgba(15, 19, 31, 0.52)',
      borderColor: isLight ? 'rgba(16, 32, 58, 0.1)' : 'rgba(255, 255, 255, 0.1)',
      boxShadow: isLight
        ? 'inset 1px -1px 1px -1px rgba(255, 255, 255, 0.9), inset -1px 1px 1px -1px rgba(255, 255, 255, 0.68), 0 12px 28px rgba(16, 32, 58, 0.1)'
        : 'inset 1px -1px 1px -1px rgba(255, 255, 255, 0.58), inset -1px 1px 1px -1px rgba(255, 255, 255, 0.34), 0 12px 28px rgba(3, 7, 18, 0.22)',
    } satisfies CSSProperties,
    aiMessageStyle: {
      ...glassBase,
      background: isLight
        ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.54), rgba(255, 255, 255, 0.23) 48%, rgba(253, 206, 206, 0.28)), radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.48), transparent 44%), rgba(255, 255, 255, 0.3)'
        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.045) 46%, rgba(255, 172, 232, 0.08)), radial-gradient(circle at 18% 0%, rgba(255, 172, 232, 0.12), transparent 44%), rgba(27, 31, 44, 0.48)',
      borderColor: isLight ? 'rgba(155, 79, 115, 0.24)' : 'rgba(255, 172, 232, 0.28)',
      boxShadow: isLight
        ? 'inset 1px -1px 1px -1px rgba(255, 255, 255, 0.9), inset -1px 1px 1px -1px rgba(255, 255, 255, 0.68), 0 14px 30px rgba(155, 79, 115, 0.1)'
        : 'inset 1px -1px 1px -1px rgba(255, 255, 255, 0.6), inset -1px 1px 1px -1px rgba(255, 255, 255, 0.34), 0 14px 30px rgba(3, 7, 18, 0.24)',
    } satisfies CSSProperties,
    userMessageStyle: {
      ...glassBase,
      background: isLight
        ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.22) 48%, rgba(165, 200, 246, 0.22)), rgba(255, 255, 255, 0.3)'
        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.13), rgba(255, 255, 255, 0.04) 46%, rgba(165, 231, 255, 0.08)), rgba(15, 19, 31, 0.5)',
      borderColor: isLight ? 'rgba(47, 111, 149, 0.24)' : 'rgba(165, 231, 255, 0.28)',
      boxShadow: isLight
        ? 'inset 1px -1px 1px -1px rgba(255, 255, 255, 0.9), inset -1px 1px 1px -1px rgba(255, 255, 255, 0.68), 0 14px 30px rgba(47, 111, 149, 0.1)'
        : 'inset 1px -1px 1px -1px rgba(255, 255, 255, 0.6), inset -1px 1px 1px -1px rgba(255, 255, 255, 0.34), 0 14px 30px rgba(3, 7, 18, 0.24)',
    } satisfies CSSProperties,
    keywordStyle: {
      background: isLight ? 'rgba(255, 255, 255, 0.4)' : 'rgba(27, 31, 44, 0.58)',
      borderColor: isLight ? 'rgba(16, 32, 58, 0.1)' : 'rgba(255, 255, 255, 0.1)',
    } satisfies CSSProperties,
    imageShellStyle: {
      backgroundColor: isLight ? 'rgba(255, 255, 255, 0.34)' : 'rgba(0, 0, 0, 0.2)',
    } satisfies CSSProperties,
    dividerClassName: isLight ? 'border-[#10203a]/10' : 'border-white/10',
    accentClassName: isLight ? 'text-[#2f6f95]' : 'text-[#a5e7ff]',
    pinkClassName: isLight ? 'text-[#9b4f73]' : 'text-[#fface8]',
    goldClassName: isLight ? 'text-[#806600]' : 'text-[#ffdb40]',
    mutedClassName: isLight ? 'text-[#49617a]' : 'text-[#bbc9cf]',
    bodyClassName: isLight ? 'text-[#10203a]' : 'text-[#dfe2f3]',
    strongClassName: isLight ? 'text-[#0f172a]' : 'text-white',
  };
}

const ReadingSnapshot = forwardRef<HTMLDivElement, ReadingSnapshotProps>(function ReadingSnapshot(
  { spread, drawnCards, question, messages, language, resolvedTheme },
  ref,
) {
  const copy = SNAPSHOT_COPY[language];
  const commonCopy = UI_COPY[language].common;
  const chatCopy = UI_COPY[language].oracleChat;
  const localizedSpread = getLocalizedSpread(spread, language);
  const focusText = question.trim() || copy.generalFocus;
  const theme = getSnapshotTheme(resolvedTheme);

  return (
    <div
      ref={ref}
      className={theme.rootClassName}
      style={theme.rootStyle}
    >
      <div style={theme.noiseStyle} />
      <div className={theme.panelClassName} style={theme.panelStyle}>
        <div style={theme.noiseStyle} />
        <div className="relative z-10">
        <header className={`border-b pb-6 mb-7 ${theme.dividerClassName}`}>
          <div className={`text-sm font-bold ${theme.accentClassName}`}>{UI_COPY[language].header.title}</div>
          <h1 className={`font-serif text-4xl mt-2 ${theme.strongClassName}`}>{localizedSpread.name}</h1>
          <div className={`mt-4 grid grid-cols-2 gap-4 text-sm ${theme.mutedClassName}`}>
            <div>
              <span className={theme.pinkClassName}>{copy.focus}: </span>
              <span className={theme.strongClassName}>{focusText}</span>
            </div>
            <div className="text-right">
              <span className={theme.pinkClassName}>{copy.savedAt}: </span>
              <span className={theme.strongClassName}>{formatSnapshotTime(language)}</span>
            </div>
          </div>
        </header>

        <section>
          <h2 className={`font-serif text-2xl mb-4 ${theme.accentClassName}`}>{copy.cards}</h2>
          <div className="grid grid-cols-5 gap-4">
            {drawnCards.map((dc, index) => {
              const position = localizedSpread.positions[dc.positionIndex]?.name ?? dc.positionName;
              const cardName = getLocalizedCardName(dc.card.name, language);

              return (
                <div key={`${dc.card.id}-${index}`} className="rounded-lg border p-3" style={theme.cardStyle}>
                  <div className="h-40 rounded-md overflow-hidden flex items-center justify-center" style={theme.imageShellStyle}>
                    <img
                      src={getTarotSnapshotImageByName(dc.card.name)}
                      alt={cardName}
                      className={`max-h-full max-w-full object-contain ${dc.isUpright ? '' : 'rotate-180'}`}
                    />
                  </div>
                  <div className={`text-[11px] mt-3 leading-snug ${theme.pinkClassName}`}>{position}</div>
                  <div className={`text-sm font-bold mt-1 leading-snug ${theme.strongClassName}`}>{cardName}</div>
                  <div className={`text-xs mt-1 ${theme.mutedClassName}`}>
                    {dc.isUpright ? commonCopy.upright : commonCopy.reversed}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-8">
          <h2 className={`font-serif text-2xl mb-4 ${theme.accentClassName}`}>{copy.meanings}</h2>
          <div className="space-y-4">
            {drawnCards.map((dc, index) => {
              const position = localizedSpread.positions[dc.positionIndex]?.name ?? dc.positionName;
              const cardName = getLocalizedCardName(dc.card.name, language);
              const keywords = dc.isUpright ? dc.card.uprightKeywords : dc.card.reversedKeywords;

              return (
                <article key={`${dc.card.id}-meaning-${index}`} className="rounded-lg border p-5" style={theme.cardStyle}>
                  <h3 className={`font-serif text-xl ${theme.strongClassName}`}>
                    {index + 1}. {position} · {cardName}
                    <span className={`ml-2 text-sm ${theme.pinkClassName}`}>
                      {dc.isUpright ? commonCopy.upright : commonCopy.reversed}
                    </span>
                  </h3>
                  <div className={`text-xs mt-1 ${theme.accentClassName}`}>{getLocalizedArcanaLabel(dc.card, language)}</div>
                  <p className={`text-sm leading-7 mt-3 whitespace-pre-line ${theme.bodyClassName}`}>{dc.card.description}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className={`text-xs ${theme.goldClassName}`}>{copy.keywords}</span>
                    {keywords.map((keyword, keywordIndex) => (
                      <span
                        key={`${keyword}-${keywordIndex}`}
                        className={`text-xs border rounded-full px-3 py-1 whitespace-nowrap ${theme.bodyClassName}`}
                        style={theme.keywordStyle}
                      >
                        {localizeKeyword(keyword, dc.card.name, language)}
                      </span>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {messages.length > 0 && (
          <section className="mt-8">
            <h2 className={`font-serif text-2xl mb-4 ${theme.accentClassName}`}>{copy.conversation}</h2>
            <div className="space-y-4">
              {messages.map(message => {
                const isAi = message.role === 'ai';

                return (
                  <article
                    key={message.id}
                    className="rounded-lg border p-5"
                    style={isAi ? theme.aiMessageStyle : theme.userMessageStyle}
                  >
                    <div className={`text-xs mb-3 ${theme.mutedClassName}`}>
                      <span className={isAi ? theme.pinkClassName : theme.accentClassName}>
                        {isAi ? chatCopy.analyst : chatCopy.querent}
                      </span>
                      <span> · {message.timestamp}</span>
                    </div>
                    <div className={`text-sm leading-7 ${theme.bodyClassName}`}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ node, ...props }) => <h3 className={`font-serif text-xl mt-4 mb-2 ${theme.accentClassName}`} {...props} />,
                          h2: ({ node, ...props }) => <h4 className={`font-serif text-lg mt-4 mb-2 ${theme.pinkClassName}`} {...props} />,
                          h3: ({ node, ...props }) => <h5 className={`font-serif text-base mt-3 mb-1 ${theme.goldClassName}`} {...props} />,
                          p: ({ node, ...props }) => <p className="my-2" {...props} />,
                          ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
                          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />,
                          hr: ({ node, ...props }) => (
                            <hr className={`my-4 h-px border-0 bg-current opacity-40 ${theme.accentClassName}`} {...props} />
                          ),
                          strong: ({ node, ...props }) => <strong className={theme.accentClassName} {...props} />,
                          em: ({ node, ...props }) => <em className={theme.pinkClassName} {...props} />,
                        }}
                      >
                        {message.text}
                      </ReactMarkdown>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
        </div>
      </div>
    </div>
  );
});

export default ReadingSnapshot;
