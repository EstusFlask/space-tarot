import { type FormEvent, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { KeyRound, Lock, Settings, Unlock } from 'lucide-react';
import type { Language } from '../data/localization';
import { UI_COPY } from '../data/localization';
import type { AISettings } from '../utils/aiSettings';
import { DEFAULT_GLM_MODEL } from '../utils/aiSettings';
import ViewportPortal from './ViewportPortal';

interface AISettingsDialogProps {
  open: boolean;
  settings: AISettings;
  language: Language;
  onCancel: () => void;
  onSave: (settings: AISettings) => void;
}

export default function AISettingsDialog({
  open,
  settings,
  language,
  onCancel,
  onSave,
}: AISettingsDialogProps) {
  const copy = UI_COPY[language].aiSettings;
  const shouldReduceMotion = useReducedMotion();
  const [model, setModel] = useState(settings.model || DEFAULT_GLM_MODEL);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [isModelLocked, setIsModelLocked] = useState(true);

  useEffect(() => {
    if (!open) return;

    setModel(settings.model || DEFAULT_GLM_MODEL);
    setApiKey(settings.apiKey);
    setIsModelLocked(true);
  }, [open, settings]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave({
      model: model.trim() || DEFAULT_GLM_MODEL,
      apiKey: apiKey.trim(),
    });
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
              className="liquid-glass liquid-glass-card relative w-full max-w-md overflow-hidden rounded-2xl border border-[#a5e7ff]/20 p-5 text-left shadow-[0_0_40px_rgba(165,231,255,0.12)]"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="noise-overlay" />

            <div className="relative z-20 mb-5 flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="liquid-glass-control flex h-10 w-10 items-center justify-center rounded-full border border-[#a5e7ff]/30 text-[#a5e7ff]">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold tracking-wider text-white">
                  {copy.title}
                </h2>
                <p className="font-sans text-[11px] font-semibold uppercase tracking-widest text-[#fface8]">
                  {copy.subtitle}
                </p>
              </div>
            </div>

            <div className="relative z-20 space-y-4">
              <div>
                <label className="mb-2 block font-sans text-[10px] font-bold uppercase tracking-widest text-[#a5e7ff]">
                  {copy.modelLabel}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={model}
                    disabled={isModelLocked}
                    onChange={event => setModel(event.target.value)}
                    placeholder={DEFAULT_GLM_MODEL}
                    className="liquid-glass-input min-w-0 flex-1 rounded-full px-4 py-2.5 font-sans text-sm text-[#dfe2f3] placeholder-[#bbc9cf]/30 outline-none transition-all focus:border-[#a5e7ff]/70 disabled:text-[#bbc9cf]/70"
                  />
                  <button
                    type="button"
                    onClick={() => setIsModelLocked(current => !current)}
                    title={isModelLocked ? copy.unlockTitle : copy.lockTitle}
                    aria-pressed={!isModelLocked}
                    className={`liquid-glass-control flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-all active:scale-95 ${
                      isModelLocked
                        ? 'border-[#ffdb40]/35 bg-[#ffdb40]/10 text-[#ffdb40] hover:bg-[#ffdb40]/20'
                        : 'border-[#a5e7ff]/40 bg-[#a5e7ff]/15 text-[#a5e7ff] hover:bg-[#a5e7ff]/25'
                    }`}
                  >
                    {isModelLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block font-sans text-[10px] font-bold uppercase tracking-widest text-[#a5e7ff]">
                  {copy.apiKeyLabel}
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#fface8]/80" />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={event => setApiKey(event.target.value)}
                    placeholder={copy.apiKeyPlaceholder}
                    className="liquid-glass-input w-full rounded-full py-2.5 pl-10 pr-4 font-sans text-sm text-[#dfe2f3] placeholder-[#bbc9cf]/30 outline-none transition-all focus:border-[#fface8]/70"
                  />
                </div>
                <a
                  href="https://bigmodel.cn/apikey/platform"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block font-sans text-xs font-semibold text-[#a5e7ff] underline decoration-[#a5e7ff]/40 underline-offset-4 transition-colors hover:text-white"
                >
                  {copy.apiKeyLink}
                </a>
              </div>
            </div>

            <div className="relative z-20 mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="liquid-glass-control cursor-pointer rounded-full border border-white/10 px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-[#bbc9cf] transition-all hover:bg-white/5 hover:text-white active:scale-95"
              >
                {copy.cancel}
              </button>
              <button
                type="submit"
                className="liquid-glass-primary cursor-pointer rounded-full px-6 py-2.5 font-serif text-xs font-bold uppercase tracking-widest text-black transition-all hover:opacity-90 active:scale-95"
              >
                {copy.save}
              </button>
            </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </ViewportPortal>
  );
}
