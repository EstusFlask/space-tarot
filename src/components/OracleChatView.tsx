import { useState, useRef, useEffect } from 'react';
import { ChatMessage, DrawnCard } from '../types';
import { getLocalizedCardName, TarotSpread } from '../data/tarotCards';
import ReactMarkdown from 'react-markdown';
import { Send, Sparkles, Save, CheckCircle, RefreshCw } from 'lucide-react';
import { Language, UI_COPY, getLocalizedArcanaLabel, getLocalizedSpread } from '../data/localization';

interface OracleChatViewProps {
  spread: TarotSpread;
  drawnCards: DrawnCard[];
  initialAnalysis: string;
  question: string;
  onReset: () => void;
  language: Language;
}

export default function OracleChatView({
  spread,
  drawnCards,
  initialAnalysis,
  question,
  onReset,
  language,
}: OracleChatViewProps) {
  const copy = UI_COPY[language].oracleChat;
  const commonCopy = UI_COPY[language].common;
  const localizedSpread = getLocalizedSpread(spread, language);
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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-oracle',
      role: 'ai',
      text: initialAnalysis,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setIsLoading(true);

    try {
      // Package conversation history for the server
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        text: msg.text,
      }));

      const payload = {
        spreadName: localizedSpread.name,
        question: textToSend,
        language,
        cardsDrawn: drawnCards.map(dc => ({
          name: dc.card.name,
          displayName: getLocalizedCardName(dc.card.name, language),
          positionName: localizedSpread.positions[dc.positionIndex]?.name ?? dc.positionName,
          isUpright: dc.isUpright,
          keywords: (dc.isUpright ? dc.card.uprightKeywords : dc.card.reversedKeywords).map(k =>
            localizeKeyword(k, dc.card.name),
          ),
          arcana: getLocalizedArcanaLabel(dc.card, language),
          description: dc.card.description,
        })),
        history: chatHistory,
      };

      const response = await fetch('/api/interpret-tarot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || copy.errorText);
      }

      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        text: data.interpretation,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'ai',
        text: copy.errorText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveReading = () => {
    try {
      const savedReadingsRaw = localStorage.getItem('tarot_readings_archive');
      const archive = savedReadingsRaw ? JSON.parse(savedReadingsRaw) : [];

      const newEntry = {
        id: `reading-${Date.now()}`,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        spreadName: localizedSpread.name,
        question: question || (language === 'zh' ? '通用校准' : 'General Alignment'),
        cards: drawnCards.map(dc => ({
          name: dc.card.name,
          position: localizedSpread.positions[dc.positionIndex]?.name ?? dc.positionName,
          isUpright: dc.isUpright,
        })),
        summary: messages[0].text,
      };

      localStorage.setItem('tarot_readings_archive', JSON.stringify([newEntry, ...archive]));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (e) {
      console.error('Failed to save reading:', e);
    }
  };

  const quickPrompts = copy.quickPrompts;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-[calc(100vh-100px)] pt-6 relative">
      {/* Top Session Context Header info */}
      <div className="glass-panel border border-[#a5e7ff]/10 rounded-xl px-5 py-3.5 mb-4 flex flex-col md:flex-row items-center justify-between gap-3 text-left relative overflow-hidden shrink-0 mt-6 mx-4">
        <div className="noise-overlay" />
        <div className="relative z-20">
          <span className="text-[10px] font-sans font-bold text-[#fface8] tracking-widest uppercase">
            {copy.title}
          </span>
          <h3 className="font-serif text-lg font-bold text-white uppercase tracking-wider">
            {localizedSpread.name}{' '}
            <span className="text-[#a5e7ff] text-xs">
              {drawnCards.length} {language === 'zh' ? '张牌星盘' : 'Cards Constellation'}
            </span>
          </h3>
          <p className="font-sans text-xs text-[#bbc9cf] italic mt-0.5 max-w-[450px] truncate">
            {copy.focusLabel} {question ? `"${question}"` : language === 'zh' ? '通用能量校准' : 'General life current alignment'}
          </p>
        </div>

        <div className="flex items-center gap-2 relative z-20 w-full md:w-auto shrink-0 justify-end">
          <button
            onClick={handleSaveReading}
            disabled={isSaved}
            className={`px-4 py-2 rounded-full border text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all ${
              isSaved
                ? 'bg-emerald-400/20 border-emerald-400/50 text-emerald-300'
                : 'border-white/10 text-[#bbc9cf] hover:text-white hover:bg-white/5 cursor-pointer'
            }`}
          >
            {isSaved ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                {copy.archiveSaved}
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                {copy.archiveReading}
              </>
            )}
          </button>

          <button
            onClick={onReset}
            className="px-4 py-2 rounded-full bg-[#fface8]/10 border border-[#fface8]/30 text-[#fface8] hover:bg-[#fface8]/20 transition-all text-xs font-bold tracking-wider uppercase cursor-pointer"
          >
            {copy.newSpread}
          </button>
        </div>
      </div>

      {/* Main Chat Conversation Stream container */}
      <div className="flex-1 overflow-y-auto px-4 pb-32 pt-2 gap-4 flex flex-col chat-scroll">
        {/* Draw cards presentation summary for quick references */}
        <div className="glass-panel border border-white/5 rounded-xl p-4 flex flex-wrap gap-2.5 justify-center items-center shrink-0 mb-2">
          {drawnCards.map((dc, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-[#1b1f2c]/55 border border-white/[0.04] rounded-lg px-3 py-1.5 text-left"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#a5e7ff]" />
              <div>
                <span className="text-[8px] text-gray-500 font-bold uppercase block leading-none">
                  {localizedSpread.positions[i]?.name ?? dc.positionName}
                </span>
                <span className="text-[11px] font-medium text-[#dfe2f3] leading-none">
                  {getLocalizedCardName(dc.card.name, language)}{' '}
                  <span className="text-[9px] text-[#fface8]">{dc.isUpright ? '' : commonCopy.reversed}</span>
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Message bubbles list */}
        {messages.map(msg => {
          const isAi = msg.role === 'ai';
          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] ${
                isAi ? 'self-start text-left' : 'self-end text-right'
              } gap-1 mb-2`}
            >
              <span className="text-[9px] font-sans font-bold tracking-widest text-[#bbc9cf]/40 uppercase px-1.5">
                {isAi ? copy.analyst : copy.querent} · {msg.timestamp}
              </span>

              <div
                className={`rounded-2xl px-5 py-4 text-sm leading-relaxed relative ${
                  isAi
                    ? 'glass-panel border-l-2 border-[#fface8]/65 text-[#dfe2f3]'
                    : 'bg-gradient-to-br from-[#1b1f2c] to-[#0f131f] border border-[#a5e7ff]/30 text-[#dfe2f3] shadow-[0_0_15px_rgba(165,231,255,0.08)]'
                }`}
              >
                {isAi && <div className="noise-overlay" />}

                <div className={`markdown-body select-text ${isAi ? 'space-y-3' : 'white-space-pre-wrap'}`}>
                  {isAi ? (
                    <ReactMarkdown
                      components={{
                        h1: ({ node, ...props }) => (
                          <h2
                            className="font-serif text-[#a5e7ff] text-lg font-bold border-b border-white/5 pb-1 uppercase tracking-wider mt-4 first:mt-0"
                            {...props}
                          />
                        ),
                        h2: ({ node, ...props }) => (
                          <h3 className="font-serif text-[#fface8] text-base font-bold uppercase tracking-wide mt-3" {...props} />
                        ),
                        h3: ({ node, ...props }) => (
                          <h4 className="font-sans text-[#ffdb40] text-sm font-semibold tracking-wide mt-2" {...props} />
                        ),
                        p: ({ node, ...props }) => (
                          <p className="font-sans text-[#dfe2f3] leading-relaxed text-sm my-2 text-justify" {...props} />
                        ),
                        blockquote: ({ node, ...props }) => (
                          <blockquote
                            className="border-l-2 border-[#ffdb40] bg-white/[0.02] rounded-r px-4 py-2 italic text-[#ffdb40] my-3 leading-loose"
                            {...props}
                          />
                        ),
                        ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1.5 my-2.5" {...props} />,
                        li: ({ node, ...props }) => <li className="text-sm font-sans" {...props} />,
                        strong: ({ node, ...props }) => <strong className="text-[#a5e7ff] font-bold" {...props} />,
                        em: ({ node, ...props }) => <em className="text-[#fface8] italic" {...props} />,
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator from the Oracle */}
        {isLoading && (
          <div className="self-start text-left flex flex-col gap-1 max-w-[80%] mb-2">
            <span className="text-[9px] font-sans font-bold tracking-widest text-[#bbc9cf]/40 uppercase px-1.5">
              {copy.meditating}
            </span>
            <div className="glass-panel border-l-2 border-[#fface8] rounded-2xl px-5 py-4 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#fface8] animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#fface8] animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#a5e7ff] animate-bounce" />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input chat tray at the bottom */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#0f131f] via-[#0f131f]/95 to-transparent pt-6 pb-4 px-4 z-20 shrink-0">
        {/* Quick prompt guides */}
        <div className="flex gap-2.5 justify-center flex-wrap mb-4">
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(p.text)}
              disabled={isLoading}
              className="text-[10px] font-sans font-semibold border border-white/10 hover:border-[#fface8]/45 bg-[#1b1f2c]/55 hover:bg-[#1b1f2c] rounded-full px-4 py-1.5 text-[#bbc9cf] hover:text-[#fface8] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✦ {p.label}
            </button>
          ))}
        </div>

        {/* Underline console chat entry bar style */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage(userInput);
          }}
          className="relative max-w-3xl mx-auto"
        >
          <div className="flex items-center border border-white/10 rounded-full bg-[#1b1f2c]/40 backdrop-blur-xl px-4 py-2.5 shadow-2xl focus-within:border-[#fface8]/60 focus-within:ring-1 focus-within:ring-[#fface8]/30 transition-all">
            <input
              type="text"
              disabled={isLoading}
              className="flex-1 bg-transparent border-none text-[#dfe2f3] placeholder-[#bbc9cf]/30 font-sans text-sm py-1.5 px-3 focus:outline-none focus:ring-0 disabled:opacity-50"
              placeholder={copy.placeholder}
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
            />

            <button
              type="submit"
              disabled={!userInput.trim() || isLoading}
              className={`rounded-full p-2.5 transition-all ${
                userInput.trim() && !isLoading
                  ? 'bg-[#fface8] text-black hover:scale-105 shadow-[0_0_12px_rgba(255,172,232,0.8)] cursor-pointer'
                  : 'bg-white/5 text-[#bbc9cf]/40 cursor-not-allowed'
              }`}
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
