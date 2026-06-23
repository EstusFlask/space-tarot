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
import GitHubSupportDialog from './components/GitHubSupportDialog';
import ConfirmHomeDialog from './components/ConfirmHomeDialog';
import { TarotScreen, DrawnCard, ChatMessage, ThemeMode } from './types';
import { getTarotImageByName, TAROT_DECK, TAROT_SPREADS, TarotSpread } from './data/tarotCards';
import { DEFAULT_LANGUAGE, Language } from './data/localization';
import { AISettings, readAISettings, saveAISettings } from './utils/aiSettings';
import { AssetRefreshContext } from './utils/assetRefresh';
import { buildReadingSnapshotFilename, downloadElementAsPng } from './utils/downloadSnapshot';

interface DevDebugReading {
  spread: TarotSpread;
  drawnCards: DrawnCard[];
  question: string;
  analysis: string;
  messages: ChatMessage[];
}

type ResolvedTheme = Exclude<ThemeMode, 'system'>;

const THEME_STORAGE_KEY = 'tarot-theme-mode';

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'dark' || value === 'light' || value === 'system';
}

function readThemeMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(storedTheme) ? storedTheme : 'dark';
  } catch {
    return 'dark';
  }
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function getDevDebugReading(): DevDebugReading | null {
  if (!import.meta.env.DEV || typeof window === 'undefined') {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const debugTarget = params.get('debug');
  const isDebugChat =
    debugTarget === 'chat' ||
    debugTarget === 'oracle' ||
    window.location.pathname.endsWith('/debug/chat');

  if (!isDebugChat) {
    return null;
  }

  const requestedSpreadId = params.get('spread') ?? 'threecard';
  const spread =
    TAROT_SPREADS.find(item => item.id === requestedSpreadId) ??
    TAROT_SPREADS.find(item => item.id === 'threecard') ??
    TAROT_SPREADS[0];

  if (!spread || TAROT_DECK.length === 0) {
    return null;
  }

  const fallbackCardNames = [
    'The Fool',
    'The High Priestess',
    'The Star',
    'Temperance',
    'The World',
    'Strength',
    'Justice',
    'The Moon',
    'The Sun',
    'Wheel of Fortune',
  ];
  const requestedCardNames = (params.get('cards') ?? '')
    .split(',')
    .map(name => name.trim())
    .filter(Boolean);
  const debugCardNames = requestedCardNames.length ? requestedCardNames : fallbackCardNames;
  const pickedCards = debugCardNames
    .map(name => TAROT_DECK.find(card => card.name.toLowerCase() === name.toLowerCase()))
    .filter((card): card is (typeof TAROT_DECK)[number] => Boolean(card));
  const remainingCards = TAROT_DECK.filter(card => !pickedCards.includes(card));
  const debugCards = [...pickedCards, ...remainingCards].slice(0, spread.cardCount);

  const drawnCards: DrawnCard[] = debugCards.map((card, index) => {
    const position = spread.positions[index];
    const isUpright = index % 3 !== 1;
    const orientation: DrawnCard['orientation'] = isUpright ? 'upright' : 'reversed';

    return {
      card,
      orientation,
      isUpright,
      positionIndex: index,
      positionName: position?.name ?? `Card ${index + 1}`,
      positionDesc: position?.description ?? '',
    };
  });

  const question = params.get('q')?.trim() || '调试模式：我现在最需要看清什么？';
  const analysis = [
    '## 调试模式占位解读',
    '',
    '这是 dev 模式直接进入 AI 解析页的本地调试内容，用来检查聊天框、放牌框、滚动区和输入区的视觉状态。',
    '',
    '如果需要指定牌阵或牌，可以使用 `spread=threecard` 和 `cards=The Fool,The Star,Temperance`。',
  ].join('\n');
  const messages: ChatMessage[] = [
    {
      id: 'debug-oracle',
      role: 'ai',
      text: analysis,
      timestamp: 'Debug',
    },
  ];

  return { spread, drawnCards, question, analysis, messages };
}

export default function App() {
  const debugReading = getDevDebugReading();
  const [currentScreen, setCurrentScreen] = useState<TarotScreen>(debugReading ? 'chat' : 'spread_selection');
  const [selectedSpread, setSelectedSpread] = useState<TarotSpread | null>(debugReading?.spread ?? null);
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>(debugReading?.drawnCards ?? []);
  const [question, setQuestion] = useState(debugReading?.question ?? '');
  const [preloadedAIAnalysis, setPreloadedAIAnalysis] = useState(debugReading?.analysis ?? '');
  const [allCardsRevealed, setAllCardsRevealed] = useState(Boolean(debugReading));
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(debugReading?.messages ?? []);
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [showGitHubSupport, setShowGitHubSupport] = useState(false);
  const [showHomeConfirm, setShowHomeConfirm] = useState(false);
  const [aiSettings, setAISettings] = useState<AISettings>(() => readAISettings());
  const [assetRefreshKey, setAssetRefreshKey] = useState(0);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => readThemeMode());
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());
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
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const updateSystemTheme = () => {
      setSystemTheme(mediaQuery.matches ? 'light' : 'dark');
    };

    updateSystemTheme();
    mediaQuery.addEventListener('change', updateSystemTheme);
    return () => mediaQuery.removeEventListener('change', updateSystemTheme);
  }, []);

  const resolvedTheme: ResolvedTheme = themeMode === 'system' ? systemTheme : themeMode;

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    } catch {
      // Ignore storage failures; the theme still applies for this session.
    }

    document.documentElement.classList.remove('theme-dark', 'theme-light');
    document.documentElement.classList.add(`theme-${resolvedTheme}`);
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
    document.documentElement.dataset.themeMode = themeMode;
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme, themeMode]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [currentScreen]);

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

  const handleRefreshPage = () => {
    setAssetRefreshKey(currentKey => currentKey + 1);
  };

  const resetReadingToHome = () => {
    setSelectedSpread(null);
    setDrawnCards([]);
    setQuestion('');
    setPreloadedAIAnalysis('');
    setAllCardsRevealed(false);
    setChatMessages([]);
    setCurrentScreen('spread_selection');
  };

  const handleNavigateHome = () => {
    if (currentScreen !== 'spread_selection') {
      setShowHomeConfirm(true);
      return;
    }

    resetReadingToHome();
  };

  const handleConfirmNavigateHome = () => {
    setShowHomeConfirm(false);
    resetReadingToHome();
  };

  const handleReturnToSpread = () => {
    setAllCardsRevealed(true);
    setCurrentScreen('reveal');
  };

  const handleToggleLanguage = () => {
    setLanguage(current => (current === 'zh' ? 'en' : 'zh'));
  };

  const handleToggleTheme = () => {
    setThemeMode(current => {
      if (current === 'dark') return 'light';
      if (current === 'light') return 'system';
      return 'dark';
    });
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
        resolvedTheme === 'light' ? '#eef3f1' : '#0f131f',
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
            resolvedTheme={resolvedTheme}
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
            resolvedTheme={resolvedTheme}
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
    <AssetRefreshContext.Provider value={assetRefreshKey}>
      <div className="app-shell relative min-h-screen select-none">
      
      {/* Immersive WebGL Shader Backdrop */}
      <NebulaBackground />

      {/* Global Navigation Header */}
      <Header
        currentScreen={currentScreen}
        onNavigateHome={handleNavigateHome}
        onResetReading={currentScreen !== 'spread_selection' ? handleRefreshPage : undefined}
        onSaveReading={handleSaveReadingSnapshot}
        canSaveReading={canSaveReading}
        isSavingReading={isSavingSnapshot}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        themeMode={themeMode}
        resolvedTheme={resolvedTheme}
        onToggleTheme={handleToggleTheme}
        onOpenAISettings={() => setShowAISettings(true)}
        onOpenGitHubSupport={() => setShowGitHubSupport(true)}
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
            resolvedTheme={resolvedTheme}
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

      <GitHubSupportDialog
        open={showGitHubSupport}
        language={language}
        onClose={() => setShowGitHubSupport(false)}
      />

      <ConfirmHomeDialog
        open={showHomeConfirm}
        language={language}
        onCancel={() => setShowHomeConfirm(false)}
        onConfirm={handleConfirmNavigateHome}
      />

      </div>
    </AssetRefreshContext.Provider>
  );
}
