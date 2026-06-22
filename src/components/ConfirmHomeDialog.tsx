import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AlertTriangle, Home } from 'lucide-react';
import type { Language } from '../data/localization';
import ViewportPortal from './ViewportPortal';

interface ConfirmHomeDialogProps {
  open: boolean;
  language: Language;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmHomeDialog({
  open,
  language,
  onCancel,
  onConfirm,
}: ConfirmHomeDialogProps) {
  const shouldReduceMotion = useReducedMotion();
  const copy = language === 'zh'
    ? {
      title: '返回主页？',
      subtitle: '本次抽牌尚未保留',
      body: '返回主页会放弃当前牌阵、已抽取的卡牌、问题和对话内容。确定要继续吗？',
      cancel: '继续抽牌',
      confirm: '放弃并返回',
    }
    : {
      title: 'Return Home?',
      subtitle: 'This reading is not kept',
      body: 'Returning home will discard the current spread, drawn cards, question, and conversation. Continue?',
      cancel: 'Keep Drawing',
      confirm: 'Discard and Return',
    };

  return (
    <ViewportPortal>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0f131f]/75 px-4 py-6 backdrop-blur-lg"
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-home-title"
              className="liquid-glass liquid-glass-card relative w-full max-w-md overflow-hidden rounded-2xl border border-[#fface8]/20 p-5 text-left shadow-[0_0_40px_rgba(255,172,232,0.12)]"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="noise-overlay" />

              <div className="relative z-20 mb-5 flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="liquid-glass-control flex h-10 w-10 items-center justify-center rounded-full border border-[#fface8]/30 text-[#fface8]">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h2
                    id="confirm-home-title"
                    className="font-serif text-xl font-bold tracking-wider text-white"
                  >
                    {copy.title}
                  </h2>
                  <p className="font-sans text-[11px] font-semibold uppercase tracking-widest text-[#a5e7ff]">
                    {copy.subtitle}
                  </p>
                </div>
              </div>

              <p className="relative z-20 font-sans text-sm leading-6 text-[#dfe2f3]">
                {copy.body}
              </p>

              <div className="relative z-20 mt-6 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="liquid-glass-control cursor-pointer rounded-full border border-white/10 px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-[#bbc9cf] transition-all hover:bg-white/5 hover:text-white active:scale-95"
                >
                  {copy.cancel}
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className="liquid-glass-primary inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-6 py-2.5 font-serif text-xs font-bold uppercase tracking-widest text-black transition-all hover:opacity-90 active:scale-95"
                >
                  <Home className="h-4 w-4" />
                  {copy.confirm}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ViewportPortal>
  );
}
