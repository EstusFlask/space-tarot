import { TarotScreen, ThemeMode } from '../types';
import { Home, Sparkles, Download, Settings, RefreshCw, Github, Moon, Sun, Monitor } from 'lucide-react';
import { Language, UI_COPY } from '../data/localization';

interface HeaderProps {
  currentScreen: TarotScreen;
  onNavigateHome: () => void;
  onResetReading?: () => void;
  onSaveReading: () => void | Promise<boolean>;
  canSaveReading: boolean;
  isSavingReading: boolean;
  onOpenAISettings: () => void;
  onOpenGitHubSupport: () => void;
  language: Language;
  onToggleLanguage: () => void;
  themeMode: ThemeMode;
  resolvedTheme: Exclude<ThemeMode, 'system'>;
  onToggleTheme: () => void;
}

export default function Header({
  currentScreen,
  onNavigateHome,
  onResetReading,
  onSaveReading,
  canSaveReading,
  isSavingReading,
  onOpenAISettings,
  onOpenGitHubSupport,
  language,
  onToggleLanguage,
  themeMode,
  resolvedTheme,
  onToggleTheme,
}: HeaderProps) {
  const copy = UI_COPY[language].header;
  const saveTitle = isSavingReading
    ? copy.savingTitle
    : canSaveReading
      ? copy.saveTitle
      : copy.saveDisabledTitle;
  const ThemeIcon = themeMode === 'dark' ? Moon : themeMode === 'light' ? Sun : Monitor;
  const themeTitle =
    language === 'zh'
      ? themeMode === 'dark'
        ? '深色模式，点击切换到浅色模式'
        : themeMode === 'light'
          ? '浅色模式，点击切换到跟随系统'
          : `跟随系统（当前${resolvedTheme === 'dark' ? '深色' : '浅色'}），点击切换到深色模式`
      : themeMode === 'dark'
        ? 'Dark mode, switch to light mode'
        : themeMode === 'light'
          ? 'Light mode, switch to system mode'
          : `System mode (${resolvedTheme}), switch to dark mode`;

  return (
    <header className="liquid-glass-bar fixed top-0 w-full z-50 border-b border-white/10 flex justify-between items-center px-4 md:px-6 h-16 transition-all duration-300">
      <div className="flex min-w-0 items-center gap-3 md:gap-4">
        {currentScreen !== 'spread_selection' && (
          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateHome}
              title={copy.homeTitle}
              className="liquid-glass-control rounded-full p-2 flex items-center justify-center text-[#a5e7ff] hover:drop-shadow-[0_0_8px_rgba(165,231,255,0.8)] transition-all active:scale-95 duration-200 cursor-pointer"
            >
              <Home className="w-4 h-4" />
            </button>
            {onResetReading && (
              <button
                onClick={onResetReading}
                title={copy.resetTitle}
                className="liquid-glass-control rounded-full p-2 flex items-center justify-center text-[#fface8] hover:drop-shadow-[0_0_8px_rgba(255,172,232,0.8)] transition-all active:scale-95 duration-200 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles className="w-5 h-5 text-[var(--theme-accent)] drop-shadow-[0_0_8px_rgba(165,231,255,0.8)]" />
          <h1 
            onClick={onNavigateHome}
            className="max-w-[34vw] cursor-pointer select-none truncate whitespace-nowrap font-serif text-lg font-bold tracking-widest text-[var(--theme-accent)] drop-shadow-[0_0_8px_rgba(165,231,255,0.8)] md:max-w-none md:text-xl"
          >
            {copy.title}
          </h1>
          <button
            onClick={onOpenGitHubSupport}
            title={copy.githubSupportTitle}
            className="liquid-glass-control flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-[var(--theme-muted)] transition-all duration-200 hover:text-[var(--theme-fg-strong)] hover:drop-shadow-[0_0_8px_rgba(165,231,255,0.8)] active:scale-95"
          >
            <Github className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleTheme}
            title={themeTitle}
            aria-label={themeTitle}
            className="liquid-glass-control flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-[var(--theme-muted)] transition-all duration-200 hover:text-[var(--theme-fg-strong)] hover:drop-shadow-[0_0_8px_rgba(165,231,255,0.8)] active:scale-95"
          >
            <ThemeIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          onClick={onToggleLanguage}
          title={language === 'zh' ? '切换为 English' : 'Switch to 中文'}
          aria-pressed={language === 'en'}
          className="liquid-glass-control flex h-8 min-w-12 items-center justify-center rounded-full px-0 text-center text-[10px] font-bold tracking-[0.2em] [text-indent:0.2em] text-[#a5e7ff] uppercase hover:text-white hover:drop-shadow-[0_0_8px_rgba(165,231,255,0.8)] transition-all active:scale-95 duration-200 cursor-pointer"
        >
          {copy.languageLabel}
        </button>
        <button
          onClick={onSaveReading}
          disabled={!canSaveReading || isSavingReading}
          title={saveTitle}
          className={`liquid-glass-control rounded-full p-2 transition-colors active:scale-95 duration-200 ${
            canSaveReading && !isSavingReading
              ? 'text-[#bbc9cf] hover:text-[#a5e7ff] cursor-pointer'
              : 'text-[#bbc9cf]/35 cursor-not-allowed'
          }`}
        >
          {isSavingReading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
        </button>
        <button
          onClick={onOpenAISettings}
          title={copy.aiSettingsTitle}
          className="liquid-glass-control rounded-full text-[#bbc9cf] hover:text-[#a5e7ff] transition-colors active:scale-95 duration-200 cursor-pointer p-2"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
