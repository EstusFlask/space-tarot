import { useState, useRef, useEffect } from 'react';
import { ChatMessage, DrawnCard } from '../types';
import { getLocalizedCardName, getTarotImageByName, TarotSpread } from '../data/tarotCards';
import ReactMarkdown from 'react-markdown';
import { Send, Sparkles, Download, CheckCircle, RefreshCw, ArrowLeft, RotateCcw } from 'lucide-react';
import { Language, UI_COPY, getLocalizedArcanaLabel, getLocalizedSpread } from '../data/localization';
import type { AISettings } from '../utils/aiSettings';
import { hasAIKey } from '../utils/aiSettings';
import { getTarotFallbackText, requestTarotInterpretation } from '../utils/glmClient';
import ViewportPortal from './ViewportPortal';
import RetryingImage from './RetryingImage';

interface OracleChatViewProps {
  spread: TarotSpread;
  drawnCards: DrawnCard[];
  initialAnalysis: string;
  question: string;
  onReset: () => void;
  language: Language;
  aiSettings: AISettings;
  onOpenAISettings: () => void;
  storedMessages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
  onSaveReading: () => Promise<boolean> | boolean;
  isSavingReading: boolean;
  onReturnToSpread: () => void;
}

export default function OracleChatView({
  spread,
  drawnCards,
  initialAnalysis,
  question,
  onReset,
  language,
  aiSettings,
  onOpenAISettings,
  storedMessages,
  onMessagesChange,
  onSaveReading,
  isSavingReading,
  onReturnToSpread,
}: OracleChatViewProps) {
  const copy = UI_COPY[language].oracleChat;
  const commonCopy = UI_COPY[language].common;
  const localizedSpread = getLocalizedSpread(spread, language);
  const fallbackText = getTarotFallbackText(language);
  const retryFallbackLabel = language === 'zh' ? '重新询问' : 'Ask again';
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
  const getTimestamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const createAIMessage = (text: string, retryText?: string, id = `ai-${Date.now()}`): ChatMessage => {
    const isFallback = text === fallbackText;

    return {
      id,
      role: 'ai',
      text,
      timestamp: getTimestamp(),
      isFallback,
      retryText: isFallback ? retryText : undefined,
    };
  };
  const attachFallbackRetry = (message: ChatMessage): ChatMessage => {
    if (message.role !== 'ai' || message.text !== fallbackText) return message;

    return {
      ...message,
      isFallback: true,
      retryText: typeof message.retryText === 'string' ? message.retryText : question,
    };
  };
  const [messages, setMessages] = useState<ChatMessage[]>(() => (
    storedMessages.length
      ? storedMessages.map(attachFallbackRetry)
      : [createAIMessage(initialAnalysis, question, 'init-oracle')]
  ));
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [retryingMessageId, setRetryingMessageId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    onMessagesChange(messages);
  }, [messages, onMessagesChange]);

  // Auto-scroll to the latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const requestAIMessage = async (textToSend: string, historyMessages: ChatMessage[], id?: string) => {
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
      history: historyMessages
        .filter(msg => !msg.isFallback)
        .map(msg => ({
          role: msg.role,
          text: msg.text,
        })),
    };

    const interpretation = await requestTarotInterpretation({
      ...payload,
      settings: aiSettings,
    });

    return createAIMessage(interpretation, textToSend, id);
  };

  const handleSendMessage = async (rawTextToSend: string) => {
    const textToSend = rawTextToSend.trim();
    if (!textToSend || isLoading) return;

    if (!hasAIKey(aiSettings)) {
      onOpenAISettings();
      return;
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: getTimestamp(),
    };
    const historyMessages = messages;

    setMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setIsLoading(true);

    try {
      const aiMsg = await requestAIMessage(textToSend, historyMessages);
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'ai',
        text: copy.errorText,
        timestamp: getTimestamp(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryFallback = async (message: ChatMessage) => {
    if (isLoading || typeof message.retryText !== 'string') return;

    if (!hasAIKey(aiSettings)) {
      onOpenAISettings();
      return;
    }

    const messageIndex = messages.findIndex(item => item.id === message.id);
    if (messageIndex === -1) return;

    const retryHistory = messages.slice(0, messageIndex);
    const previousMessage = retryHistory[retryHistory.length - 1];
    const historyMessages =
      previousMessage?.role === 'user' && previousMessage.text === message.retryText
        ? retryHistory.slice(0, -1)
        : retryHistory;

    setIsLoading(true);
    setRetryingMessageId(message.id);

    try {
      const aiMsg = await requestAIMessage(message.retryText, historyMessages, message.id);
      setMessages(prev => prev.map(item => (item.id === message.id ? aiMsg : item)));
    } catch (err: any) {
      console.error(err);
      setMessages(prev =>
        prev.map(item =>
          item.id === message.id
            ? {
                ...item,
                text: copy.errorText,
                timestamp: getTimestamp(),
                isFallback: false,
                retryText: undefined,
              }
            : item,
        ),
      );
    } finally {
      setIsLoading(false);
      setRetryingMessageId(null);
    }
  };

  const handleSaveReading = async () => {
    if (isLoading || isSavingSnapshot || isSavingReading || isSaved) return;

    setIsSavingSnapshot(true);

    try {
      const didSave = await onSaveReading();
      if (!didSave) return;

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (e) {
      console.error('Failed to save reading snapshot:', e);
    } finally {
      setIsSavingSnapshot(false);
    }
  };

  const quickPrompts = copy.quickPrompts;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-[calc(100vh-100px)] pt-20 relative">
      {/* Top Session Context Header info */}
      <div className="liquid-glass liquid-glass-card oracle-clean-panel border border-[#a5e7ff]/10 rounded-xl px-5 py-3.5 mb-4 flex flex-col md:flex-row items-center justify-between gap-3 text-left relative overflow-hidden shrink-0 mx-4">
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

        <div className="flex flex-wrap items-center gap-2 relative z-20 w-full md:w-auto shrink-0 justify-center md:justify-end">
          <button
            onClick={onReturnToSpread}
            className="liquid-glass-control px-4 py-2 rounded-full border border-[#a5e7ff]/25 text-[#a5e7ff] hover:bg-[#a5e7ff]/10 transition-all text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {copy.backToSpread}
          </button>

          <button
            onClick={handleSaveReading}
            disabled={isLoading || isSavingSnapshot || isSavingReading || isSaved}
            className={`liquid-glass-control px-4 py-2 rounded-full border text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all ${
              isSaved
                ? 'bg-emerald-400/20 border-emerald-400/50 text-emerald-300'
                : isLoading || isSavingSnapshot || isSavingReading
                  ? 'border-white/10 text-[#bbc9cf]/40 cursor-not-allowed'
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
                {isSavingSnapshot || isSavingReading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                {copy.archiveReading}
              </>
            )}
          </button>

          <button
            onClick={onReset}
            className="liquid-glass-control px-4 py-2 rounded-full border border-[#fface8]/30 text-[#fface8] hover:bg-[#fface8]/20 transition-all text-xs font-bold tracking-wider uppercase cursor-pointer"
          >
            {copy.newSpread}
          </button>
        </div>
      </div>

      {/* Main Chat Conversation Stream container */}
      <div className="oracle-chat-stream flex-1 overflow-y-auto px-4 pb-32 pt-2 gap-4 flex flex-col chat-scroll">
        {/* Draw cards presentation summary for quick references */}
        <div className="liquid-glass liquid-glass-card oracle-clean-panel border border-white/5 rounded-xl p-4 flex flex-wrap gap-2.5 justify-center items-center shrink-0 mb-2 relative overflow-hidden">
          {drawnCards.map((dc, i) => (
            <div
              key={i}
              className="liquid-glass-chip flex items-center gap-2 border border-white/[0.04] rounded-lg px-3 py-1.5 text-left"
            >
              <div className="h-12 w-8 shrink-0 overflow-hidden rounded border border-white/10 bg-black/20">
                <RetryingImage
                  src={getTarotImageByName(dc.card.name)}
                  alt={getLocalizedCardName(dc.card.name, language)}
                  draggable={false}
                  decoding="async"
                  className={`h-full w-full object-contain ${dc.isUpright ? '' : 'rotate-180'}`}
                />
              </div>
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
          const canRetryFallback = isAi && msg.isFallback && typeof msg.retryText === 'string';
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

              <div className={`flex items-start gap-2 ${isAi ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`rounded-2xl px-5 py-4 text-sm leading-relaxed relative overflow-hidden max-w-full ${
                    isAi
                      ? 'liquid-glass liquid-glass-card oracle-clean-panel border border-white/10 text-[#dfe2f3]'
                      : 'liquid-glass liquid-glass-card oracle-clean-panel border border-[#a5e7ff]/30 text-[#dfe2f3]'
                  }`}
                >
                {isAi && <div className="noise-overlay" />}

                <div className={`markdown-body select-text relative z-20 ${isAi ? 'space-y-3' : 'white-space-pre-wrap'}`}>
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

                {canRetryFallback && (
                  <button
                    type="button"
                    aria-label={retryFallbackLabel}
                    title={retryFallbackLabel}
                    onClick={() => handleRetryFallback(msg)}
                    disabled={isLoading}
                    className="liquid-glass-control mt-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#fface8]/35 text-[#fface8] transition-all hover:bg-[#fface8]/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {retryingMessageId === msg.id ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator from the Oracle */}
        {isLoading && !retryingMessageId && (
          <div className="self-start text-left flex flex-col gap-1 max-w-[80%] mb-2">
            <span className="text-[9px] font-sans font-bold tracking-widest text-[#bbc9cf]/40 uppercase px-1.5">
              {copy.meditating}
            </span>
            <div className="liquid-glass liquid-glass-card oracle-clean-panel border border-white/10 rounded-2xl px-5 py-4 flex items-center gap-1.5 relative overflow-hidden">
              <span className="w-2.5 h-2.5 rounded-full bg-[#fface8] animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#fface8] animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#a5e7ff] animate-bounce" />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input chat tray at the bottom */}
      <ViewportPortal>
        <div className="fixed inset-x-0 bottom-0 z-40 w-full bg-transparent to-transparent px-4 pb-4 pt-6 shrink-0">
          <div className="mx-auto w-full max-w-4xl">
        {/* Quick prompt guides */}
        <div className="flex gap-2.5 justify-center flex-wrap mb-4">
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(p.text)}
              disabled={isLoading}
              className="liquid-glass-chip text-[10px] font-sans font-semibold border border-white/10 hover:border-[#fface8]/45 rounded-full px-4 py-1.5 text-[#bbc9cf] hover:text-[#fface8] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="liquid-glass flex items-center border border-white/10 rounded-full px-4 py-2.5 focus-within:border-[#fface8]/60 focus-within:ring-1 focus-within:ring-[#fface8]/30 transition-all">
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
                  ? 'liquid-glass-primary text-black hover:scale-105 cursor-pointer'
                  : 'liquid-glass-chip text-[#bbc9cf]/40 cursor-not-allowed'
              }`}
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>
          </div>
        </div>
      </ViewportPortal>
    </div>
  );
}
