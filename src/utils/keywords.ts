import { getLocalizedCardName } from '../data/tarotCards';
import { Language, UI_COPY } from '../data/localization';

/**
 * Localize a single card keyword for display.
 *
 * Cards fall back to `[EnglishName, 'Upright'/'Reversed']` when no custom
 * keywords are defined, so map those sentinel values to their localized form
 * and pass any real keyword through unchanged.
 */
export function localizeKeyword(keyword: string, cardName: string, language: Language): string {
  const common = UI_COPY[language].common;

  if (keyword === cardName) {
    return getLocalizedCardName(cardName, language);
  }

  if (keyword === 'Upright') {
    return common.upright;
  }

  if (keyword === 'Reversed') {
    return common.reversed;
  }

  return keyword;
}
