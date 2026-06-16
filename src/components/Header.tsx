import { TarotScreen } from '../types';
import { Home, Sparkles, HelpCircle, History, RotateCcw } from 'lucide-react';

interface HeaderProps {
  currentScreen: TarotScreen;
  onNavigateHome: () => void;
  onResetReading?: () => void;
  onShowHistory?: () => void;
}

export default function Header({
  currentScreen,
  onNavigateHome,
  onResetReading,
  onShowHistory
}: HeaderProps) {
  return (
    <header className="fixed top-0 w-full z-50 bg-[#0f131f]/40 backdrop-blur-xl border-b border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] flex justify-between items-center px-6 h-16 transition-all duration-300">
      <div className="flex items-center gap-4">
        {currentScreen !== 'spread_selection' && (
          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateHome}
              title="Home"
              className="glass-panel rounded-full p-2 flex items-center justify-center text-[#a5e7ff] hover:drop-shadow-[0_0_8px_rgba(165,231,255,0.8)] transition-all active:scale-95 duration-200 cursor-pointer"
            >
              <Home className="w-4 h-4" />
            </button>
            {onResetReading && (
              <button
                onClick={onResetReading}
                title="Reset Reading"
                className="glass-panel rounded-full p-2 flex items-center justify-center text-[#fface8] hover:drop-shadow-[0_0_8px_rgba(255,172,232,0.8)] transition-all active:scale-95 duration-200 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
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
            TAROT DIVINATION
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {onShowHistory && (
          <button
            onClick={onShowHistory}
            title="Readings Archive"
            className="text-[#bbc9cf] hover:text-[#a5e7ff] transition-colors active:scale-95 duration-200 cursor-pointer p-1"
          >
            <History className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={() => alert("Tarot Divination v2.0 - Powered by Google Gemini AI\nFocus your energy, select your spread, draw your cards, and read live spiritual interpretations.")}
          title="Oracle Guidance"
          className="text-[#bbc9cf] hover:text-[#a5e7ff] transition-colors active:scale-95 duration-200 cursor-pointer p-1"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
