import { useState, useEffect } from 'react';
import { X, Calendar, BookOpen, Trash2, ShieldAlert } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ReadingsArchiveProps {
  onClose: () => void;
}

export default function ReadingsArchive({ onClose }: ReadingsArchiveProps) {
  const [readings, setReadings] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tarot_readings_archive');
      if (saved) {
        setReadings(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleClearArchive = () => {
    if (confirm('Are you absolutely sure you want to purge your entire divination diary history? This action is irreversible.')) {
      localStorage.removeItem('tarot_readings_archive');
      setReadings([]);
    }
  };

  const handleToggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0f131f]/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative glass-panel rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-fade-in">
        <div className="noise-overlay" />
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center relative z-20">
          <div>
            <h3 className="font-serif text-2xl font-bold text-[#a5e7ff] tracking-wide flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              DIVINATION DIARY
            </h3>
            <p className="font-sans text-xs text-[#bbc9cf] mt-1">
              Your chronicled history of cosmic consults and fated alignments.
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-white/5 text-gray-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Readings List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 chat-scroll relative z-20">
          {readings.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center justify-center gap-3">
              <ShieldAlert className="w-12 h-12 text-[#fface8]/40 animate-pulse" />
              <p className="font-serif text-[#dfe2f3] text-lg">
                The Diary Lies Empty
              </p>
              <p className="font-sans text-xs text-[#bbc9cf] max-w-sm leading-relaxed">
                Once you select a spread, choose your cards, and complete the celestial consulting with the Oracle, click "Archive Reading" to chronicle your fate.
              </p>
            </div>
          ) : (
            readings.map((r: any) => {
              const isExpanded = expandedId === r.id;
              return (
                <div 
                  key={r.id}
                  className="rounded-xl border border-white/5 bg-[#1b1f2c]/35 p-4 hover:border-[#a5e7ff]/30 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <span className="bg-[#fface8]/10 text-[#fface8] border border-[#fface8]/20 text-[9px] font-bold tracking-widest px-2.5 py-0.5 rounded-full uppercase">
                        {r.spreadName}
                      </span>
                      <h4 className="font-serif text-base text-[#dfe2f3] font-bold mt-1 max-w-[340px] truncate">
                        Focus: <span className="italic text-[#a5e7ff]">"{r.question}"</span>
                      </h4>
                    </div>
                    
                    <div className="flex items-center gap-2 text-[11px] text-[#bbc9cf]/60">
                      <Calendar className="w-3.5 h-3.5" />
                      {r.date} @ {r.time}
                    </div>
                  </div>

                  {/* Draw brief cards overview */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {r.cards.map((c: any, index: number) => (
                      <span 
                        key={index} 
                        className="text-[10px] bg-[#0f131f] text-[#bbc9cf] border border-white/[0.02] rounded px-2 py-0.5"
                      >
                        {c.position}: <strong className="text-white">{c.name}</strong> {c.isUpright ? '' : '↺'}
                      </span>
                    ))}
                  </div>

                  {/* Expand / Collapsible details layout */}
                  <div className="mt-3 text-right">
                    <button
                      onClick={() => handleToggleExpand(r.id)}
                      className="text-xs text-[#a5e7ff] hover:underline font-bold uppercase tracking-wider cursor-pointer"
                    >
                      {isExpanded ? 'Collapse Divine Scroll' : 'Read Divine Scroll'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 border-t border-white/5 pt-4 text-left font-sans text-sm text-[#dfe2f3] whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto chat-scroll p-2 bg-[#0f131f]/45 rounded-lg">
                      <ReactMarkdown
                        components={{
                          h1: ({node, ...props}) => <h2 className="font-serif text-[#a5e7ff] text-base font-bold pb-1 uppercase tracking-wider mt-3" {...props} />,
                          h2: ({node, ...props}) => <h3 className="font-serif text-[#fface8] text-sm font-bold uppercase tracking-wide mt-2" {...props} />,
                          p: ({node, ...props}) => <p className="font-sans text-[#dfe2f3] leading-relaxed text-xs my-1.5" {...props} />,
                        }}
                      >
                        {r.summary}
                      </ReactMarkdown>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* Footer controls */}
        {readings.length > 0 && (
          <div className="p-4 border-t border-white/5 flex justify-end items-center relative z-20 shrink-0">
            <button
              onClick={handleClearArchive}
              className="text-red-400 hover:text-red-300 font-sans text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer px-3 py-2 rounded hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4" />
              Purge Divine History
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
