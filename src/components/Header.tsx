import { TarotScreen } from '../types';
import { Home, Sparkles, Download, Settings, RefreshCw } from 'lucide-react';
import { Language, UI_COPY } from '../data/localization';

interface HeaderProps {
  currentScreen: TarotScreen;
  onNavigateHome: () => void;
  onResetReading?: () => void;
  onSaveReading: () => void | Promise<boolean>;
  canSaveReading: boolean;
  isSavingReading: boolean;
  onOpenAISettings: () => void;
  language: Language;
  onToggleLanguage: () => void;
}

export default function Header({
  currentScreen,
  onNavigateHome,
  onResetReading,
  onSaveReading,
  canSaveReading,
  isSavingReading,
  onOpenAISettings,
  language,
  onToggleLanguage,
}: HeaderProps) {
  const copy = UI_COPY[language].header;
  const saveTitle = isSavingReading
    ? copy.savingTitle
    : canSaveReading
      ? copy.saveTitle
      : copy.saveDisabledTitle;

  return (
    <header className="fixed top-0 w-full z-50 bg-[#0f131f]/40 backdrop-blur-xl border-b border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] flex justify-between items-center px-6 h-16 transition-all duration-300">
      <div className="flex items-center gap-4">
        {currentScreen !== 'spread_selection' && (
          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateHome}
              title={copy.homeTitle}
              className="glass-panel rounded-full p-2 flex items-center justify-center text-[#a5e7ff] hover:drop-shadow-[0_0_8px_rgba(165,231,255,0.8)] transition-all active:scale-95 duration-200 cursor-pointer"
            >
              <Home className="w-4 h-4" />
            </button>
            {onResetReading && (
              <button
                onClick={onResetReading}
                title={copy.resetTitle}
                className="glass-panel rounded-full p-2 flex items-center justify-center text-[#fface8] hover:drop-shadow-[0_0_8px_rgba(255,172,232,0.8)] transition-all active:scale-95 duration-200 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#a5e7ff] drop-shadow-[0_0_8px_rgba(165,231,255,0.8)]" />
          <h1 
            onClick={onNavigateHome}
            className="font-serif text-lg md:text-xl tracking-widest text-[#a5e7ff] drop-shadow-[0_0_8px_rgba(165,231,255,0.8)] cursor-pointer select-none font-bold"
          >
            {copy.title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onToggleLanguage}
          title={language === 'zh' ? '切换为 English' : 'Switch to 中文'}
          aria-pressed={language === 'en'}
          className="glass-panel rounded-full px-3 py-1.5 flex items-center justify-center text-[10px] font-bold tracking-[0.3em] text-[#a5e7ff] uppercase hover:text-white hover:drop-shadow-[0_0_8px_rgba(165,231,255,0.8)] transition-all active:scale-95 duration-200 cursor-pointer"
        >
          {copy.languageLabel}
        </button>
        <button
          onClick={onSaveReading}
          disabled={!canSaveReading || isSavingReading}
          title={saveTitle}
          className={`p-1 transition-colors active:scale-95 duration-200 ${
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
          className="text-[#bbc9cf] hover:text-[#a5e7ff] transition-colors active:scale-95 duration-200 cursor-pointer p-1"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
