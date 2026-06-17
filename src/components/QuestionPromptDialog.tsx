import { type FormEvent, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { MessageCircleQuestion } from 'lucide-react';
import type { Language } from '../data/localization';
import { UI_COPY } from '../data/localization';
import ViewportPortal from './ViewportPortal';

interface QuestionPromptDialogProps {
  open: boolean;
  language: Language;
  onCancel: () => void;
  onSubmit: (question: string) => void;
}

export default function QuestionPromptDialog({
  open,
  language,
  onCancel,
  onSubmit,
}: QuestionPromptDialogProps) {
  const copy = UI_COPY[language].questionPrompt;
  const shouldReduceMotion = useReducedMotion();
  const [question, setQuestion] = useState('');

  useEffect(() => {
    if (open) {
      setQuestion('');
    }
  }, [open]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!question.trim()) return;
    onSubmit(question.trim());
  };

  return (
    <ViewportPortal>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center px-4 py-6 bg-[#0f131f]/75 backdrop-blur-lg"
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <motion.form
              onSubmit={handleSubmit}
              className="glass-panel relative w-full max-w-md overflow-hidden rounded-2xl border border-[#fface8]/20 p-5 text-left shadow-[0_0_40px_rgba(255,172,232,0.12)]"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="noise-overlay" />

            <div className="relative z-20 mb-5 flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#fface8]/30 bg-[#fface8]/10 text-[#fface8]">
                <MessageCircleQuestion className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold tracking-wider text-white">
                  {copy.title}
                </h2>
              </div>
            </div>

            <div className="relative z-20">
              <input
                type="text"
                value={question}
                onChange={event => setQuestion(event.target.value)}
                placeholder={copy.placeholder}
                autoFocus
                className="w-full rounded-full border border-white/10 bg-[#1b1f2c]/55 px-5 py-3 font-sans text-sm text-[#dfe2f3] placeholder-[#bbc9cf]/35 outline-none transition-all focus:border-[#fface8]/70 focus:ring-1 focus:ring-[#fface8]/30"
              />
            </div>

            <div className="relative z-20 mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full border border-white/10 px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-[#bbc9cf] transition-all hover:bg-white/5 hover:text-white active:scale-95"
              >
                {copy.cancel}
              </button>
              <button
                type="submit"
                disabled={!question.trim()}
                className={`rounded-full px-6 py-2.5 font-serif text-xs font-bold uppercase tracking-widest transition-all active:scale-95 ${
                  question.trim()
                    ? 'bg-gradient-to-r from-[#fface8] to-[#a5e7ff] text-black shadow-[0_0_16px_rgba(255,172,232,0.28)] hover:opacity-90'
                    : 'cursor-not-allowed border border-white/10 bg-white/5 text-[#bbc9cf]/40'
                }`}
              >
                {copy.send}
              </button>
            </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </ViewportPortal>
  );
}
