import { useState } from 'react';
import Header from './components/Header';
import NebulaBackground from './components/NebulaBackground';
import SpreadSelection from './components/SpreadSelection';
import CardSelectionWheel from './components/CardSelectionWheel';
import CardRevealView from './components/CardRevealView';
import OracleChatView from './components/OracleChatView';
import ReadingsArchive from './components/ReadingsArchive';
import { TarotScreen, DrawnCard } from './types';
import { TarotSpread } from './data/tarotCards';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<TarotScreen>('spread_selection');
  const [selectedSpread, setSelectedSpread] = useState<TarotSpread | null>(null);
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [question, setQuestion] = useState('');
  const [preloadedAIAnalysis, setPreloadedAIAnalysis] = useState('');
  const [showArchive, setShowArchive] = useState(false);

  const handleSelectSpread = (spread: TarotSpread) => {
    setSelectedSpread(spread);
    setCurrentScreen('choose_cards');
  };

  const handleCardsSelected = (drawn: DrawnCard[], userQuestion: string) => {
    setDrawnCards(drawn);
    setQuestion(userQuestion);
    setCurrentScreen('reveal');
  };

  const handleProceedToChat = (analysis: string) => {
    setPreloadedAIAnalysis(analysis);
    setCurrentScreen('chat');
  };

  const handleResetReading = () => {
    if (confirm('Are you sure you want to clear your current reading and selection?')) {
      setSelectedSpread(null);
      setDrawnCards([]);
      setQuestion('');
      setPreloadedAIAnalysis('');
      setCurrentScreen('spread_selection');
    }
  };

  const handleNavigateHome = () => {
    setSelectedSpread(null);
    setDrawnCards([]);
    setQuestion('');
    setPreloadedAIAnalysis('');
    setCurrentScreen('spread_selection');
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
        onShowHistory={() => setShowArchive(true)}
      />

      {/* Main Content Area Container with padding for floating action bars */}
      <main className="w-full px-4 h-full">
        {currentScreen === 'spread_selection' && (
          <div className="animate-fade-in">
            <SpreadSelection onSelectSpread={handleSelectSpread} />
          </div>
        )}

        {currentScreen === 'choose_cards' && selectedSpread && (
          <div className="animate-fade-in">
            <CardSelectionWheel
              spread={selectedSpread}
              onCardsSelected={handleCardsSelected}
            />
          </div>
        )}

        {currentScreen === 'reveal' && selectedSpread && (
          <div className="animate-fade-in">
            <CardRevealView
              spread={selectedSpread}
              drawnCards={drawnCards}
              question={question}
              onProceedToChat={handleProceedToChat}
            />
          </div>
        )}

        {currentScreen === 'chat' && selectedSpread && (
          <div className="animate-fade-in">
            <OracleChatView
              spread={selectedSpread}
              drawnCards={drawnCards}
              initialAnalysis={preloadedAIAnalysis}
              question={question}
              onReset={handleNavigateHome}
            />
          </div>
        )}
      </main>

      {/* Persistent Saved Readings Collapsible Archive overlay panel */}
      {showArchive && (
        <ReadingsArchive onClose={() => setShowArchive(false)} />
      )}

    </div>
  );
}
