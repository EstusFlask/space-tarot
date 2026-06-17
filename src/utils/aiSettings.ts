export const DEFAULT_GLM_MODEL = 'GLM-4.7-Flash';

export interface AISettings {
  model: string;
  apiKey: string;
}

const STORAGE_KEY = 'space-tarot-ai-settings';

export function readAISettings(): AISettings {
  const fallback: AISettings = {
    model: DEFAULT_GLM_MODEL,
    apiKey: '',
  };

  try {
    const rawSettings = localStorage.getItem(STORAGE_KEY);
    if (!rawSettings) return fallback;

    const parsed = JSON.parse(rawSettings) as Partial<AISettings>;

    return {
      model: typeof parsed.model === 'string' && parsed.model.trim() ? parsed.model : fallback.model,
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
    };
  } catch {
    return fallback;
  }
}

export function saveAISettings(settings: AISettings) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      model: settings.model.trim() || DEFAULT_GLM_MODEL,
      apiKey: settings.apiKey.trim(),
    }),
  );
}

export function hasAIKey(settings: AISettings) {
  return settings.apiKey.trim().length > 0;
}

export function normalizeGLMModelName(model: string) {
  return (model.trim() || DEFAULT_GLM_MODEL).toLowerCase();
}
