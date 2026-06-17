import {
  CARD_DESCRIPTIONS,
  DESCRIPTION_PLACEHOLDER,
} from './cardDescriptions';
import type { Language } from './localization';

export type CardOrientation = 'upright' | 'reversed';
export type CardColorTheme = 'cyan' | 'magenta' | 'gold' | 'emerald' | 'amber';

export interface TarotCard {
  id: string;
  name: string;
  imageSrc: string;
  type: 'major' | 'minor';
  suit?: 'wands' | 'cups' | 'swords' | 'pentacles';
  arcana: string;
  number: number;
  uprightKeywords: string[];
  reversedKeywords: string[];
  description: string;
  iconName: string;
  colorTheme: CardColorTheme;
}

export interface TarotSpread {
  id: string;
  name: string;
  description: string;
  cardCount: number;
  layout: string;
  positions: {
    index: number;
    name: string;
    description: string;
    glow: 'cyan' | 'magenta' | 'gold';
    gridArea?: string;
  }[];
}

export const TAROT_SPREADS: TarotSpread[] = [
  {
    id: 'yesno',
    name: 'YES OR NO',
    description: 'A swift, decisive answer to a clear question.',
    cardCount: 1,
    layout: 'single',
    positions: [
      { index: 1, name: 'The Answer', description: 'The absolute raw energy behind your question, directing a clear path forward.', glow: 'gold' }
    ]
  },
  {
    id: 'threecard',
    name: 'THREE-CARD SPREAD',
    description: 'The classic constellation revealing Past, Present, and Future energies.',
    cardCount: 3,
    layout: 'linear',
    positions: [
      { index: 1, name: 'PAST', description: 'Foundational forces and past experiences shaping your current state.', glow: 'cyan' },
      { index: 2, name: 'PRESENT', description: 'Active influences, immediate challenges, and current mental space.', glow: 'magenta' },
      { index: 3, name: 'FUTURE', description: 'The unfolding horizon, upcoming potential, and logical outcome if currents persist.', glow: 'cyan' }
    ]
  },
  {
    id: 'celticcross',
    name: 'CELTIC CROSS',
    description: 'A comprehensive, deeply nuanced reading involving ten cards. Ideal for exploring complex situations, uncovering hidden influences, and projecting long-term outcomes.',
    cardCount: 10,
    layout: 'cross',
    positions: [
      { index: 1, name: 'The Present Situation', description: 'The core state, immediate vibe, and primary layer of your query.', glow: 'magenta' },
      { index: 2, name: 'The Immediate Obstacle', description: 'The crossing force, the friction, or the catalyst challenging the primary state.', glow: 'magenta' },
      { index: 3, name: 'The Subconscious', description: 'Invisible anchors, deep feelings, and core beliefs that sit below the surface.', glow: 'cyan' },
      { index: 4, name: 'The Past Base', description: 'Passing events and recent developments that laid the foundation.', glow: 'cyan' },
      { index: 5, name: 'The Conscious goals', description: 'What is actively being focused on, desired, or projected as the immediate goal.', glow: 'cyan' },
      { index: 6, name: 'The Immediate Future', description: 'The next step on your timeline, approaching fast.', glow: 'gold' },
      { index: 7, name: 'The Querent\'s Attitude', description: 'How you view yourself, your inner strengths, or how you approach this situation.', glow: 'cyan' },
      { index: 8, name: 'Environmental Influences', description: 'The actions of others, home vibes, external expectations, and social forces.', glow: 'cyan' },
      { index: 9, name: 'Hopes & Fears', description: 'The psychological projection of what we desperately want or are afraid will happen.', glow: 'magenta' },
      { index: 10, name: 'The Divine Outcome', description: 'The ultimate synthesis, long-term outcome, and higher-level key learning.', glow: 'gold' }
    ]
  }
];

const tarotImageModules = import.meta.glob<string>('../../images/tarots/*.png', {
  eager: true,
  import: 'default',
  query: '?url',
});

const MAJOR_ARCANA_ORDER = [
  'The Fool',
  'The Magician',
  'The High Priestess',
  'The Empress',
  'The Emperor',
  'The Hierophant',
  'The Lovers',
  'The Chariot',
  'Strength',
  'The Hermit',
  'Wheel of Fortune',
  'Justice',
  'The Hanged Man',
  'Death',
  'Temperance',
  'The Devil',
  'The Tower',
  'The Star',
  'The Moon',
  'The Sun',
  'Judgement',
  'The World',
];

const SUIT_ORDER = ['wands', 'cups', 'swords', 'pentacles'] as const;

const RANK_VALUES: Record<string, number> = {
  Ace: 1,
  One: 1,
  Two: 2,
  Three: 3,
  Four: 4,
  Five: 5,
  Six: 6,
  Seven: 7,
  Eight: 8,
  Nine: 9,
  Ten: 10,
  Page: 11,
  Knight: 12,
  Queen: 13,
  King: 14,
};

const SUIT_DETAILS: Record<
  TarotCard['suit'] & string,
  { arcana: string; colorTheme: CardColorTheme; iconName: string }
> = {
  wands: { arcana: 'Suit of Wands', colorTheme: 'amber', iconName: 'Zap' },
  cups: { arcana: 'Suit of Cups', colorTheme: 'magenta', iconName: 'Waves' },
  swords: { arcana: 'Suit of Swords', colorTheme: 'cyan', iconName: 'Sword' },
  pentacles: { arcana: 'Suit of Pentacles', colorTheme: 'emerald', iconName: 'Coins' },
};

const MAJOR_ARCANA_ZH: Record<string, string> = {
  'The Fool': '愚者',
  'The Magician': '魔术师',
  'The High Priestess': '女祭司',
  'The Empress': '女皇',
  'The Emperor': '皇帝',
  'The Hierophant': '教皇',
  'The Lovers': '恋人',
  'The Chariot': '战车',
  'Strength': '力量',
  'The Hermit': '隐者',
  'Wheel of Fortune': '命运之轮',
  'Justice': '正义',
  'The Hanged Man': '倒吊人',
  'Death': '死神',
  'Temperance': '节制',
  'The Devil': '恶魔',
  'The Tower': '高塔',
  'The Star': '星星',
  'The Moon': '月亮',
  'The Sun': '太阳',
  'Judgement': '审判',
  'The World': '世界',
};

const SUIT_ZH: Record<NonNullable<TarotCard['suit']>, string> = {
  wands: '权杖',
  cups: '圣杯',
  swords: '宝剑',
  pentacles: '星币',
};

const MINOR_RANK_ZH: Record<string, string> = {
  Ace: '首牌',
  One: '首牌',
  Two: '二',
  Three: '三',
  Four: '四',
  Five: '五',
  Six: '六',
  Seven: '七',
  Eight: '八',
  Nine: '九',
  Ten: '十',
  Page: '侍者',
  Knight: '骑士',
  Queen: '王后',
  King: '国王',
};

function imagePathToName(imagePath: string): string {
  const filename = imagePath.split('/').pop() ?? imagePath;
  return filename.replace(/\.[^.]+$/, '').replace(/_/g, ' ');
}

function toId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parseMinorCard(name: string) {
  const match = /^(.+) of (Wands|Cups|Swords|Pentacles)$/.exec(name);
  if (!match) return null;

  const rank = match[1];
  const suit = match[2].toLowerCase() as TarotCard['suit'] & string;
  return {
    rank,
    suit,
    number: RANK_VALUES[rank] ?? 0,
  };
}

export function getLocalizedCardName(name: string, language: Language): string {
  if (language === 'en') {
    return name;
  }

  const majorName = MAJOR_ARCANA_ZH[name];
  if (majorName) {
    return majorName;
  }

  const minor = parseMinorCard(name);
  if (minor) {
    return `${SUIT_ZH[minor.suit]}${MINOR_RANK_ZH[minor.rank] ?? minor.rank}`;
  }

  return name;
}

function getDeckSortIndex(name: string): number {
  const majorIndex = MAJOR_ARCANA_ORDER.indexOf(name);
  if (majorIndex >= 0) return majorIndex;

  const minor = parseMinorCard(name);
  if (!minor) return 1000;

  return 100 + SUIT_ORDER.indexOf(minor.suit) * 20 + minor.number;
}

function getMajorTheme(number: number): CardColorTheme {
  const themes: CardColorTheme[] = ['cyan', 'gold', 'magenta', 'emerald', 'amber'];
  return themes[number % themes.length];
}

function buildTarotCard(imagePath: string, imageSrc: string): TarotCard {
  const name = imagePathToName(imagePath);
  const text = CARD_DESCRIPTIONS[name];
  const majorIndex = MAJOR_ARCANA_ORDER.indexOf(name);
  const minor = parseMinorCard(name);

  if (minor) {
    const suitDetails = SUIT_DETAILS[minor.suit];

    return {
      id: toId(name),
      name,
      imageSrc,
      type: 'minor',
      suit: minor.suit,
      arcana: suitDetails.arcana,
      number: minor.number,
      uprightKeywords: text?.uprightKeywords?.length ? text.uprightKeywords : [name, 'Upright'],
      reversedKeywords: text?.reversedKeywords?.length ? text.reversedKeywords : [name, 'Reversed'],
      description: text?.description.trim() || DESCRIPTION_PLACEHOLDER,
      iconName: suitDetails.iconName,
      colorTheme: suitDetails.colorTheme,
    };
  }

  const number = Math.max(majorIndex, 0);

  return {
    id: toId(name),
    name,
    imageSrc,
    type: 'major',
    arcana: majorIndex >= 0 ? `Major Arcana ${majorIndex}` : 'Major Arcana',
    number,
    uprightKeywords: text?.uprightKeywords?.length ? text.uprightKeywords : [name, 'Upright'],
    reversedKeywords: text?.reversedKeywords?.length ? text.reversedKeywords : [name, 'Reversed'],
    description: text?.description.trim() || DESCRIPTION_PLACEHOLDER,
    iconName: 'Sparkles',
    colorTheme: getMajorTheme(number),
  };
}

export const TAROT_DECK: TarotCard[] = Object.entries(tarotImageModules)
  .map(([imagePath, imageSrc]) => buildTarotCard(imagePath, imageSrc))
  .sort((a, b) => getDeckSortIndex(a.name) - getDeckSortIndex(b.name) || a.name.localeCompare(b.name));

export const TAROT_IMAGE_BY_NAME: Record<string, string> = Object.fromEntries(
  TAROT_DECK.map(card => [card.name, card.imageSrc]),
);

export function getTarotImageByName(name: string): string {
  return TAROT_IMAGE_BY_NAME[name] ?? '';
}
