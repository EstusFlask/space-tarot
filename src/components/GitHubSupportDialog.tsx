import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ExternalLink, Github, X } from 'lucide-react';
import type { Language } from '../data/localization';
import { UI_COPY } from '../data/localization';
import ViewportPortal from './ViewportPortal';

interface GitHubSupportDialogProps {
  open: boolean;
  language: Language;
  onClose: () => void;
}

const GITHUB_REPO_URL = 'https://github.com/EstusFlask/space-tarot';

export default function GitHubSupportDialog({
  open,
  language,
  onClose,
}: GitHubSupportDialogProps) {
  const copy = UI_COPY[language].githubSupport;
  const shouldReduceMotion = useReducedMotion();

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
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="github-support-title"
              className="glass-panel relative w-full max-w-md overflow-hidden rounded-2xl border border-[#a5e7ff]/20 p-5 text-left shadow-[0_0_40px_rgba(165,231,255,0.12)]"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="noise-overlay" />

              <button
                type="button"
                onClick={onClose}
                title={copy.close}
                className="absolute right-4 top-4 z-30 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-[#bbc9cf] transition-all hover:bg-white/5 hover:text-white active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative z-20 mb-5 flex items-center gap-3 border-b border-white/10 pb-4 pr-10">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#a5e7ff]/30 bg-[#a5e7ff]/10 text-[#a5e7ff]">
                  <Github className="h-5 w-5" />
                </div>
                <div>
                  <h2
                    id="github-support-title"
                    className="font-serif text-xl font-bold tracking-wider text-white"
                  >
                    {copy.title}
                  </h2>
                  <p className="font-sans text-[11px] font-semibold uppercase tracking-widest text-[#fface8]">
                    {copy.subtitle}
                  </p>
                </div>
              </div>

              <div className="relative z-20 space-y-4">
                <p className="font-sans text-sm leading-6 text-[#dfe2f3]">
                  {copy.body}
                </p>

                <div className="rounded-xl border border-white/10 bg-[#1b1f2c]/45 px-4 py-3">
                  <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-[#a5e7ff]">
                    {copy.repoLabel}
                  </p>
                  <p className="mt-1 font-mono text-sm text-white">EstusFlask/space-tarot</p>
                </div>
              </div>

              <div className="relative z-20 mt-6 flex justify-end">
                <a
                  href={GITHUB_REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#fface8] to-[#a5e7ff] px-6 py-2.5 font-serif text-xs font-bold uppercase tracking-widest text-black shadow-[0_0_16px_rgba(165,231,255,0.28)] transition-all hover:opacity-90 active:scale-95"
                >
                  <ExternalLink className="h-4 w-4" />
                  {copy.openGitHub}
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ViewportPortal>
  );
}
