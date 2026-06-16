import { TarotSpread, TAROT_SPREADS } from '../data/tarotCards';
import { HelpCircle, History, Eye, TrendingUp, Compass } from 'lucide-react';
import { Language, UI_COPY, getLocalizedSpread } from '../data/localization';

interface SpreadSelectionProps {
  onSelectSpread: (spread: TarotSpread) => void;
  language: Language;
}

export default function SpreadSelection({ onSelectSpread, language }: SpreadSelectionProps) {
  const getSpreadById = (id: string) => TAROT_SPREADS.find(s => s.id === id);
  const copy = UI_COPY[language].spreadSelection;

  const yesNoSpread = getSpreadById('yesno');
  const threeCardSpread = getSpreadById('threecard');
  const celticCrossSpread = getSpreadById('celticcross');
  const localizedYesNoSpread = yesNoSpread ? getLocalizedSpread(yesNoSpread, language) : null;
  const localizedThreeCardSpread = threeCardSpread ? getLocalizedSpread(threeCardSpread, language) : null;
  const localizedCelticCrossSpread = celticCrossSpread ? getLocalizedSpread(celticCrossSpread, language) : null;

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[calc(100vh-100px)] pt-24 md:pt-32">
      <div className="text-center mb-12 w-full px-4 text-glow-container">
        <h2 className="font-serif text-3xl md:text-5xl text-[#dfe2f3] mb-3 drop-shadow-md tracking-normal">
          {copy.title}
        </h2>
        <p className="font-sans text-base md:text-lg text-[#bbc9cf] max-w-2xl mx-auto leading-relaxed">
          {copy.description}
        </p>
      </div>

      {/* Bento Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full max-w-5xl px-4 mx-auto pb-12">
        
        {/* Yes or No Spread Card */}
        {yesNoSpread && (
          <button
            onClick={() => onSelectSpread(yesNoSpread)}
            className="col-span-1 md:col-span-4 group relative text-left rounded-xl glass-panel glass-card-hover p-6 flex flex-col items-center justify-center min-h-[300px] overflow-hidden cursor-pointer"
          >
            <div className="noise-overlay" />
            
            {/* Internal ambient neon gold glow */}
            <div className="absolute inset-0 opacity-40 group-hover:opacity-75 transition-opacity duration-500 bg-[radial-gradient(circle_at_center,_rgba(255,219,64,0.35)_0%,_transparent_70%)] blur-xl" />

            <div className="relative z-20 flex flex-col items-center gap-6">
              {/* Card Shape */}
              <div className="w-24 h-36 rounded-md border border-[#ffdb40]/40 neon-rim-gold flex items-center justify-center bg-[#1b1f2c]/50 backdrop-blur-md shadow-inner transition-transform duration-300 group-hover:scale-105">
                <HelpCircle className="w-12 h-12 text-[#ffdb40] drop-shadow-[0_0_8px_rgba(255,219,64,0.8)]" />
              </div>
              
              <div className="text-center">
                <h3 className="font-serif text-xl font-bold text-[#dfe2f3] mb-1 group-hover:text-[#ffdb40] transition-colors uppercase tracking-wider">
                  {localizedYesNoSpread?.name ?? copy.yesNoTitle}
                </h3>
                <p className="font-sans text-sm text-[#bbc9cf]">
                  {localizedYesNoSpread?.description ?? copy.yesNoDescription}
                </p>
              </div>
            </div>
          </button>
        )}

        {/* Three-Card Spread Card */}
        {threeCardSpread && (
          <button
            onClick={() => onSelectSpread(threeCardSpread)}
            className="col-span-1 md:col-span-8 group relative text-left rounded-xl glass-panel glass-card-hover p-6 flex flex-col sm:flex-row items-center justify-center gap-8 min-h-[300px] overflow-hidden cursor-pointer"
          >
            <div className="noise-overlay" />
            
            {/* Internal ambient glowing nebula */}
            <div className="absolute inset-0 opacity-30 group-hover:opacity-65 transition-opacity duration-500 bg-[radial-gradient(circle_at_center,_rgba(165,231,255,0.25)_0%,_rgba(255,172,232,0.15)_40%,_transparent_75%)] blur-2xl" />

            {/* Simulated 3-Card layout */}
            <div className="relative z-20 flex items-center justify-center gap-3">
              {/* Past */}
              <div className="w-20 h-32 rounded-md border border-[#a5e7ff]/30 neon-rim-blue flex items-center justify-center bg-[#1b1f2c]/50 backdrop-blur-md -rotate-6 transform translate-y-3 shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                <div className="w-full h-full rounded border border-white/5 m-1 bg-gradient-to-b from-[#a5e7ff]/10 to-transparent flex items-center justify-center">
                  <History className="w-6 h-6 text-[#a5e7ff]/60" />
                </div>
              </div>
              
              {/* Present */}
              <div className="w-24 h-36 rounded-md border border-[#fface8]/45 neon-rim-magenta flex items-center justify-center bg-[#1b1f2c]/60 backdrop-blur-md z-10 shadow-[0_15px_30px_rgba(0,0,0,0.6)] transform scale-105 transition-transform duration-300 group-hover:scale-110">
                <div className="w-full h-full rounded border border-white/10 m-1 bg-gradient-to-b from-[#fface8]/20 to-transparent flex items-center justify-center">
                  <Eye className="w-8 h-8 text-[#fface8] drop-shadow-[0_0_8px_rgba(255,172,232,0.8)]" />
                </div>
              </div>

              {/* Future */}
              <div className="w-20 h-32 rounded-md border border-[#a5e7ff]/30 neon-rim-blue flex items-center justify-center bg-[#1b1f2c]/50 backdrop-blur-md rotate-6 transform translate-y-3 shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                <div className="w-full h-full rounded border border-white/5 m-1 bg-gradient-to-b from-[#a5e7ff]/10 to-transparent flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-[#a5e7ff]/60" />
                </div>
              </div>
            </div>

            <div className="relative z-20 text-center sm:text-left sm:max-w-[280px]">
              <h3 className="font-serif text-2xl font-bold text-[#dfe2f3] mb-2 group-hover:text-[#a5e7ff] transition-colors uppercase tracking-wider">
                {localizedThreeCardSpread?.name ?? copy.threeCardTitle}
              </h3>
              <p className="font-sans text-sm text-[#bbc9cf] leading-relaxed">
                {localizedThreeCardSpread?.description ?? copy.threeCardDescription}
              </p>
            </div>
          </button>
        )}

        {/* Celtic Cross Card */}
        {celticCrossSpread && (
          <button
            onClick={() => onSelectSpread(celticCrossSpread)}
            className="col-span-1 md:col-span-12 group relative text-left rounded-xl glass-panel glass-card-hover p-8 flex flex-col md:flex-row items-center justify-center gap-10 min-h-[350px] overflow-hidden cursor-pointer mt-3"
          >
            <div className="noise-overlay" />
            
            {/* Internal ambient gold/bronze flow */}
            <div className="absolute inset-0 opacity-25 group-hover:opacity-55 transition-opacity duration-700 bg-[radial-gradient(circle_at_center,_rgba(255,219,64,0.22)_0%,_rgba(27,31,44,0.1)_60%,_transparent_80%)] blur-[40px]" />

            {/* Abstract representation of Celtic Cross */}
            <div className="relative z-20 flex-1 flex justify-center items-center h-full min-h-[240px]">
              <div className="relative w-[240px] h-[240px] scale-90 sm:scale-100">
                {/* Center Core Card 1 */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-22 border border-[#ffdb40]/30 rounded bg-[#1b1f2c]/65 backdrop-blur-sm z-20 shadow-lg" />
                {/* Crossing Card 2 (Rotated 12-deg over card 1) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-22 h-14 border border-[#fface8]/35 rounded bg-[#1b1f2c]/65 backdrop-blur-sm z-30 rotate-12 shadow-lg shadow-[#fface8]/5" />
                
                {/* Surrounding cross points */}
                {/* Bottom Card 3 */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-10 h-14 border border-white/10 rounded bg-[#0f131f]/35 backdrop-blur-xs z-10" />
                {/* Left Card 4 */}
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-14 border border-white/10 rounded bg-[#0f131f]/35 backdrop-blur-xs z-10" />
                {/* Top Card 5 */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-14 border border-white/10 rounded bg-[#0f131f]/35 backdrop-blur-xs z-10" />
                {/* Right Card 6 */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-14 border border-white/10 rounded bg-[#0f131f]/35 backdrop-blur-xs z-10" />

                {/* Vertical column staff (Right side) */}
                <div className="absolute right-0 bottom-0 w-10 h-14 border border-white/10 rounded bg-[#0f131f]/35 backdrop-blur-xs z-10 translate-x-14 -translate-y-1" />
                <div className="absolute right-0 bottom-0 w-10 h-14 border border-white/10 rounded bg-[#0f131f]/35 backdrop-blur-xs z-10 translate-x-14 -translate-y-16" />
                <div className="absolute right-0 top-0 w-10 h-14 border border-white/10 rounded bg-[#0f131f]/35 backdrop-blur-xs z-10 translate-x-14 translate-y-16" />
                {/* Dynamic Outcome glowing gold on top of column */}
                <div className="absolute right-0 top-0 w-10 h-14 border border-[#ffdb40]/40 neon-rim-gold rounded bg-[#1b1f2c]/75 backdrop-blur-md z-20 translate-x-14 translate-y-1 flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-105">
                  <span className="text-[10px] text-[#ffdb40] font-bold">OUT</span>
                </div>
              </div>
            </div>

            <div className="relative z-20 flex-1 text-center md:text-left max-w-md">
              <h3 className="font-serif text-2xl md:text-3xl font-bold text-[#dfe2f3] mb-3 group-hover:text-[#ffdb40] transition-colors uppercase tracking-wider">
                {localizedCelticCrossSpread?.name ?? copy.celticCrossTitle}
              </h3>
              <p className="font-sans text-sm md:text-base text-[#bbc9cf] mb-4 leading-relaxed">
                {localizedCelticCrossSpread?.description ?? copy.celticCrossDescription}
              </p>
              
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#ffdb40]/30 bg-[#ffdb40]/10 text-[#ffdb40] font-sans font-bold text-xs uppercase tracking-widest transition-colors group-hover:bg-[#ffdb40]/20">
                <Compass className="w-4 h-4 animate-spin-slow" />
                {copy.deepDive}
              </div>
            </div>
          </button>
        )}

      </div>
    </div>
  );
}
