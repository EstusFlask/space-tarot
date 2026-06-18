import { useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import NebulaBackground from './components/NebulaBackground';
import SpreadSelection from './components/SpreadSelection';
import CardSelectionWheel from './components/CardSelectionWheel';
import CardRevealView from './components/CardRevealView';
import OracleChatView from './components/OracleChatView';
import ReadingSnapshot from './components/ReadingSnapshot';
import PageTransition from './components/PageTransition';
import AISettingsDialog from './components/AISettingsDialog';
import { TarotScreen, DrawnCard, ChatMessage } from './types';
import { getTarotImageByName, TarotSpread } from './data/tarotCards';
import { DEFAULT_LANGUAGE, Language } from './data/localization';
import { AISettings, readAISettings, saveAISettings } from './utils/aiSettings';
import { buildReadingSnapshotFilename, downloadElementAsPng } from './utils/downloadSnapshot';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<TarotScreen>('spread_selection');
  const [selectedSpread, setSelectedSpread] = useState<TarotSpread | null>(null);
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [question, setQuestion] = useState('');
  const [preloadedAIAnalysis, setPreloadedAIAnalysis] = useState('');
  const [allCardsRevealed, setAllCardsRevealed] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [aiSettings, setAISettings] = useState<AISettings>(() => readAISettings());
  const snapshotRef = useRef<HTMLDivElement | null>(null);
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const storedLanguage = localStorage.getItem('tarot-language');
      return storedLanguage === 'en' ? 'en' : DEFAULT_LANGUAGE;
    } catch {
      return DEFAULT_LANGUAGE;
    }
  });

  useEffect(() => {
    localStorage.setItem('tarot-language', language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    drawnCards.forEach(({ card }) => {
      const imageSrc = getTarotImageByName(card.name);
      if (!imageSrc) return;

      const image = new Image();
      image.decoding = 'async';
      image.src = imageSrc;
      void image.decode().catch(() => undefined);
    });
  }, [drawnCards]);

  const handleSelectSpread = (spread: TarotSpread) => {
    setSelectedSpread(spread);
    setCurrentScreen('choose_cards');
  };

  const handleCardsSelected = (drawn: DrawnCard[], userQuestion: string) => {
    setDrawnCards(drawn);
    setQuestion(userQuestion);
    setAllCardsRevealed(false);
    setChatMessages([]);
    setPreloadedAIAnalysis('');
    setCurrentScreen('reveal');
  };

  const handleProceedToChat = (analysis: string, nextQuestion?: string) => {
    if (nextQuestion !== undefined) {
      setQuestion(nextQuestion);
    }

    setPreloadedAIAnalysis(analysis);
    setAllCardsRevealed(true);
    setChatMessages([
      {
        id: 'init-oracle',
        role: 'ai',
        text: analysis,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setCurrentScreen('chat');
  };

  const handleSaveAISettings = (nextSettings: AISettings) => {
    saveAISettings(nextSettings);
    setAISettings(nextSettings);
    setShowAISettings(false);
  };

  const handleResetReading = () => {
    if (confirm('Are you sure you want to clear your current reading and selection?')) {
      setSelectedSpread(null);
      setDrawnCards([]);
      setQuestion('');
      setPreloadedAIAnalysis('');
      setAllCardsRevealed(false);
      setChatMessages([]);
      setCurrentScreen('spread_selection');
    }
  };

  const handleNavigateHome = () => {
    setSelectedSpread(null);
    setDrawnCards([]);
    setQuestion('');
    setPreloadedAIAnalysis('');
    setAllCardsRevealed(false);
    setChatMessages([]);
    setCurrentScreen('spread_selection');
  };

  const handleReturnToSpread = () => {
    setAllCardsRevealed(true);
    setCurrentScreen('reveal');
  };

  const handleToggleLanguage = () => {
    setLanguage(current => (current === 'zh' ? 'en' : 'zh'));
  };

  const canSaveReading = Boolean(
    selectedSpread && drawnCards.length > 0 && (currentScreen === 'chat' || allCardsRevealed),
  );

  const handleSaveReadingSnapshot = async () => {
    if (!canSaveReading || !selectedSpread || !snapshotRef.current || isSavingSnapshot) {
      return false;
    }

    setIsSavingSnapshot(true);

    try {
      await downloadElementAsPng(
        snapshotRef.current,
        buildReadingSnapshotFilename(selectedSpread.name),
      );
      return true;
    } catch (err) {
      console.error('Failed to save reading snapshot:', err);
      alert(language === 'zh' ? '截图保存失败，请稍后重试。' : 'Failed to save the screenshot. Please try again.');
      return false;
    } finally {
      setIsSavingSnapshot(false);
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'spread_selection':
        return <SpreadSelection onSelectSpread={handleSelectSpread} language={language} />;

      case 'choose_cards':
        return selectedSpread ? (
          <CardSelectionWheel
            spread={selectedSpread}
            onCardsSelected={handleCardsSelected}
            language={language}
          />
        ) : null;

      case 'reveal':
        return selectedSpread ? (
          <CardRevealView
            spread={selectedSpread}
            drawnCards={drawnCards}
            question={question}
            onProceedToChat={handleProceedToChat}
            language={language}
            aiSettings={aiSettings}
            onOpenAISettings={() => setShowAISettings(true)}
            onRevealStatusChange={setAllCardsRevealed}
            initialAllRevealed={allCardsRevealed}
            hasExistingOracleSession={chatMessages.length > 0 && Boolean(preloadedAIAnalysis)}
            onReturnToChat={() => setCurrentScreen('chat')}
          />
        ) : null;

      case 'chat':
        return selectedSpread ? (
          <OracleChatView
            spread={selectedSpread}
            drawnCards={drawnCards}
            initialAnalysis={preloadedAIAnalysis}
            question={question}
            onReset={handleNavigateHome}
            language={language}
            aiSettings={aiSettings}
            onOpenAISettings={() => setShowAISettings(true)}
            storedMessages={chatMessages}
            onMessagesChange={setChatMessages}
            onSaveReading={handleSaveReadingSnapshot}
            isSavingReading={isSavingSnapshot}
            onReturnToSpread={handleReturnToSpread}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen text-[#dfe2f3] select-none">
      
      {/* Immersive WebGL Shader Backdrop */}
      <NebulaBackground />

      {/* Global Navigation Header */}
      <Header
        currentScreen={currentScreen}
        onNavigateHome={handleNavigateHome}
        onResetReading={currentScreen !== 'spread_selection' ? handleResetReading : undefined}
        onSaveReading={handleSaveReadingSnapshot}
        canSaveReading={canSaveReading}
        isSavingReading={isSavingSnapshot}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        onOpenAISettings={() => setShowAISettings(true)}
      />

      {/* Main Content Area Container with padding for floating action bars */}
      <main className="w-full px-4 h-full">
        <PageTransition screenKey={currentScreen}>{renderScreen()}</PageTransition>
      </main>

      {canSaveReading && selectedSpread && drawnCards.length > 0 && (
        <div
          aria-hidden="true"
          style={{ position: 'fixed', top: 0, left: -10000, width: 960, pointerEvents: 'none' }}
        >
          <ReadingSnapshot
            ref={snapshotRef}
            spread={selectedSpread}
            drawnCards={drawnCards}
            question={question}
            messages={currentScreen === 'chat' ? chatMessages : []}
            language={language}
          />
        </div>
      )}

      <AISettingsDialog
        open={showAISettings}
        settings={aiSettings}
        language={language}
        onCancel={() => setShowAISettings(false)}
        onSave={handleSaveAISettings}
      />

    </div>
  );
}
