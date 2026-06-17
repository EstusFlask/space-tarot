import { forwardRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, DrawnCard } from '../types';
import { getLocalizedCardName, getTarotSnapshotImageByName, TarotSpread } from '../data/tarotCards';
import { Language, UI_COPY, getLocalizedArcanaLabel, getLocalizedSpread } from '../data/localization';

interface ReadingSnapshotProps {
  spread: TarotSpread;
  drawnCards: DrawnCard[];
  question: string;
  messages: ChatMessage[];
  language: Language;
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

const ReadingSnapshot = forwardRef<HTMLDivElement, ReadingSnapshotProps>(function ReadingSnapshot(
  { spread, drawnCards, question, messages, language },
  ref,
) {
  const copy = SNAPSHOT_COPY[language];
  const commonCopy = UI_COPY[language].common;
  const chatCopy = UI_COPY[language].oracleChat;
  const localizedSpread = getLocalizedSpread(spread, language);
  const focusText = question.trim() || copy.generalFocus;

  return (
    <div
      ref={ref}
      className="w-[960px] bg-[#0f131f] text-[#dfe2f3] font-sans p-10"
      style={{
        backgroundImage:
          'radial-gradient(circle at 18% 8%, rgba(165, 231, 255, 0.18), transparent 28%), radial-gradient(circle at 82% 0%, rgba(255, 172, 232, 0.14), transparent 30%), linear-gradient(180deg, #111827 0%, #0f131f 100%)',
      }}
    >
      <div className="border border-white/10 bg-[#1b1f2c]/80 rounded-xl p-8 shadow-2xl">
        <header className="border-b border-white/10 pb-6 mb-7">
          <div className="text-sm text-[#a5e7ff] font-bold">{UI_COPY[language].header.title}</div>
          <h1 className="font-serif text-4xl text-white mt-2">{localizedSpread.name}</h1>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-[#bbc9cf]">
            <div>
              <span className="text-[#fface8]">{copy.focus}: </span>
              <span className="text-white">{focusText}</span>
            </div>
            <div className="text-right">
              <span className="text-[#fface8]">{copy.savedAt}: </span>
              <span className="text-white">{formatSnapshotTime(language)}</span>
            </div>
          </div>
        </header>

        <section>
          <h2 className="font-serif text-2xl text-[#a5e7ff] mb-4">{copy.cards}</h2>
          <div className="grid grid-cols-5 gap-4">
            {drawnCards.map((dc, index) => {
              const position = localizedSpread.positions[dc.positionIndex]?.name ?? dc.positionName;
              const cardName = getLocalizedCardName(dc.card.name, language);

              return (
                <div key={`${dc.card.id}-${index}`} className="bg-[#0f131f]/70 border border-white/10 rounded-lg p-3">
                  <div className="h-40 rounded-md bg-black/20 overflow-hidden flex items-center justify-center">
                    <img
                      src={getTarotSnapshotImageByName(dc.card.name)}
                      alt={cardName}
                      className={`max-h-full max-w-full object-contain ${dc.isUpright ? '' : 'rotate-180'}`}
                    />
                  </div>
                  <div className="text-[11px] text-[#fface8] mt-3 leading-snug">{position}</div>
                  <div className="text-sm text-white font-bold mt-1 leading-snug">{cardName}</div>
                  <div className="text-xs text-[#bbc9cf] mt-1">
                    {dc.isUpright ? commonCopy.upright : commonCopy.reversed}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="font-serif text-2xl text-[#a5e7ff] mb-4">{copy.meanings}</h2>
          <div className="space-y-4">
            {drawnCards.map((dc, index) => {
              const position = localizedSpread.positions[dc.positionIndex]?.name ?? dc.positionName;
              const cardName = getLocalizedCardName(dc.card.name, language);
              const keywords = dc.isUpright ? dc.card.uprightKeywords : dc.card.reversedKeywords;

              return (
                <article key={`${dc.card.id}-meaning-${index}`} className="bg-[#0f131f]/55 border border-white/10 rounded-lg p-5">
                  <h3 className="font-serif text-xl text-white">
                    {index + 1}. {position} · {cardName}
                    <span className="ml-2 text-sm text-[#fface8]">
                      {dc.isUpright ? commonCopy.upright : commonCopy.reversed}
                    </span>
                  </h3>
                  <div className="text-xs text-[#a5e7ff] mt-1">{getLocalizedArcanaLabel(dc.card, language)}</div>
                  <p className="text-sm leading-7 text-[#dfe2f3] mt-3 whitespace-pre-line">{dc.card.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-xs text-[#ffdb40]">{copy.keywords}</span>
                    {keywords.map((keyword, keywordIndex) => (
                      <span
                        key={`${keyword}-${keywordIndex}`}
                        className="text-xs bg-[#1b1f2c] border border-white/10 rounded-full px-3 py-1 text-[#dfe2f3]"
                      >
                        {keyword}
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
            <h2 className="font-serif text-2xl text-[#a5e7ff] mb-4">{copy.conversation}</h2>
            <div className="space-y-4">
              {messages.map(message => {
                const isAi = message.role === 'ai';

                return (
                  <article
                    key={message.id}
                    className={`rounded-lg border p-5 ${
                      isAi
                        ? 'bg-[#1b1f2c]/70 border-[#fface8]/30'
                        : 'bg-[#0f131f]/70 border-[#a5e7ff]/30'
                    }`}
                  >
                    <div className="text-xs text-[#bbc9cf] mb-3">
                      <span className={isAi ? 'text-[#fface8]' : 'text-[#a5e7ff]'}>
                        {isAi ? chatCopy.analyst : chatCopy.querent}
                      </span>
                      <span> · {message.timestamp}</span>
                    </div>
                    <div className="text-sm leading-7 text-[#dfe2f3]">
                      <ReactMarkdown
                        components={{
                          h1: ({ node, ...props }) => <h3 className="font-serif text-xl text-[#a5e7ff] mt-4 mb-2" {...props} />,
                          h2: ({ node, ...props }) => <h4 className="font-serif text-lg text-[#fface8] mt-4 mb-2" {...props} />,
                          h3: ({ node, ...props }) => <h5 className="font-serif text-base text-[#ffdb40] mt-3 mb-1" {...props} />,
                          p: ({ node, ...props }) => <p className="my-2" {...props} />,
                          ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
                          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />,
                          strong: ({ node, ...props }) => <strong className="text-[#a5e7ff]" {...props} />,
                          em: ({ node, ...props }) => <em className="text-[#fface8]" {...props} />,
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
  );
});

export default ReadingSnapshot;
