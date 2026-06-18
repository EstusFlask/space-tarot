import type { TarotCard, TarotSpread } from './tarotCards';

export type Language = 'zh' | 'en';

export const DEFAULT_LANGUAGE: Language = 'zh';

type LocalizedText = {
  zh: string;
  en: string;
};

type LocalizedSpreadPosition = {
  name: LocalizedText;
  description: LocalizedText;
  compactName: LocalizedText;
};

type LocalizedSpreadCopy = {
  name: LocalizedText;
  description: LocalizedText;
  positions: LocalizedSpreadPosition[];
};

type LocalizedSpread = {
  name: string;
  description: string;
  positions: Array<{
    name: string;
    description: string;
    compactName: string;
  }>;
};

const SPREAD_COPY: Record<string, LocalizedSpreadCopy> = {
  yesno: {
    name: {
      zh: '是 / 否',
      en: 'YES OR NO',
    },
    description: {
      zh: '快速回答一个明确的问题。',
      en: 'A swift, decisive answer to a clear question.',
    },
    positions: [
      {
        name: {
          zh: '答案',
          en: 'The Answer',
        },
        description: {
          zh: '围绕问题的核心能量与最直接的前进方向。',
          en: 'The absolute raw energy behind your question, directing a clear path forward.',
        },
        compactName: {
          zh: '答案',
          en: 'Answer',
        },
      },
    ],
  },
  threecard: {
    name: {
      zh: '三张牌牌阵',
      en: 'THREE-CARD SPREAD',
    },
    description: {
      zh: '经典的过去、现在与未来布局。',
      en: 'The classic constellation revealing Past, Present, and Future energies.',
    },
    positions: [
      {
        name: {
          zh: '过去',
          en: 'Past',
        },
        description: {
          zh: '奠定当前状态的基础力量与过往经历。',
          en: 'Foundational forces and past experiences shaping your current state.',
        },
        compactName: {
          zh: '过去',
          en: 'Past',
        },
      },
      {
        name: {
          zh: '现在',
          en: 'Present',
        },
        description: {
          zh: '正在发挥作用的影响、即时挑战与当下心境。',
          en: 'Active influences, immediate challenges, and current mental space.',
        },
        compactName: {
          zh: '现在',
          en: 'Present',
        },
      },
      {
        name: {
          zh: '未来',
          en: 'Future',
        },
        description: {
          zh: '延伸中的前景、即将到来的可能性，以及当前走势下的结果。',
          en: 'The unfolding horizon, upcoming potential, and logical outcome if currents persist.',
        },
        compactName: {
          zh: '未来',
          en: 'Future',
        },
      },
    ],
  },
  celticcross: {
    name: {
      zh: '凯尔特十字',
      en: 'CELTIC CROSS',
    },
    description: {
      zh: '一套完整且细腻的十张牌解读，适合探索复杂局势、隐藏影响与长期走向。',
      en: 'A comprehensive, deeply nuanced reading involving ten cards. Ideal for exploring complex situations, uncovering hidden influences, and projecting long-term outcomes.',
    },
    positions: [
      {
        name: {
          zh: '当前处境',
          en: 'Present Situation',
        },
        description: {
          zh: '你当下的核心状态、局面主轴与整体氛围。',
          en: 'The core state, immediate vibe, and primary layer of your query.',
        },
        compactName: {
          zh: '现状',
          en: 'Present',
        },
      },
      {
        name: {
          zh: '主要阻力',
          en: 'Immediate Obstacle',
        },
        description: {
          zh: '与核心状态交叉的推动力、摩擦点或触发因素。',
          en: 'The crossing force, the friction, or the catalyst challenging the primary state.',
        },
        compactName: {
          zh: '阻力',
          en: 'Obstacle',
        },
      },
      {
        name: {
          zh: '潜意识',
          en: 'Subconscious',
        },
        description: {
          zh: '表层之下的隐藏锚点、深层情绪与核心信念。',
          en: 'Invisible anchors, deep feelings, and core beliefs that sit below the surface.',
        },
        compactName: {
          zh: '潜意',
          en: 'Subconscious',
        },
      },
      {
        name: {
          zh: '过往基础',
          en: 'Past Base',
        },
        description: {
          zh: '构成当前局面的过去事件与近期发展。',
          en: 'Passing events and recent developments that laid the foundation.',
        },
        compactName: {
          zh: '过往',
          en: 'Base',
        },
      },
      {
        name: {
          zh: '有意识目标',
          en: 'Conscious Goals',
        },
        description: {
          zh: '你正在主动关注、渴望或投射的方向。',
          en: 'What is actively being focused on, desired, or projected as the immediate goal.',
        },
        compactName: {
          zh: '目标',
          en: 'Goals',
        },
      },
      {
        name: {
          zh: '近期未来',
          en: 'Immediate Future',
        },
        description: {
          zh: '接下来将迅速到来的下一步。',
          en: 'The next step on your timeline, approaching fast.',
        },
        compactName: {
          zh: '未来',
          en: 'Future',
        },
      },
      {
        name: {
          zh: '自我态度',
          en: "Querent's Attitude",
        },
        description: {
          zh: '你如何看待自己、内在力量与应对方式。',
          en: 'How you view yourself, your inner strengths, or how you approach this situation.',
        },
        compactName: {
          zh: '自我',
          en: 'Self',
        },
      },
      {
        name: {
          zh: '外部影响',
          en: 'Environmental Influences',
        },
        description: {
          zh: '他人的行动、家庭氛围、外部期待与社会力量。',
          en: 'The actions of others, home vibes, external expectations, and social forces.',
        },
        compactName: {
          zh: '环境',
          en: 'World',
        },
      },
      {
        name: {
          zh: '希望与恐惧',
          en: 'Hopes & Fears',
        },
        description: {
          zh: '你最渴望或最害怕发生的心理投射。',
          en: 'The psychological projection of what we desperately want or are afraid will happen.',
        },
        compactName: {
          zh: '希望',
          en: 'Hope',
        },
      },
      {
        name: {
          zh: '神圣结果',
          en: 'The Divine Outcome',
        },
        description: {
          zh: '最终的综合结局、更高层面的学习与远景。',
          en: 'The ultimate synthesis, long-term outcome, and higher-level key learning.',
        },
        compactName: {
          zh: '结果',
          en: 'Outcome',
        },
      },
    ],
  },
};

export const UI_COPY = {
  zh: {
    header: {
      title: '星空塔罗',
      homeTitle: '返回首页',
      resetTitle: '重置解读',
      historyTitle: '保存占卜截图',
      saveTitle: '保存占卜截图',
      saveDisabledTitle: '翻开所有卡牌后可保存',
      savingTitle: '正在保存截图',
      aiSettingsTitle: 'AI 设置',
      languageLabel: 'EN',
    },
    aiSettings: {
      title: 'AI 设置',
      subtitle: '智谱 GLM',
      modelLabel: '请求的 AI 模型',
      apiKeyLabel: 'API key',
      apiKeyPlaceholder: '填写你的 GLM API key',
      apiKeyLink: '创建 GLM API key（免费）',
      unlockTitle: '解锁后修改模型',
      lockTitle: '锁定模型',
      cancel: '取消',
      save: '保存',
    },
    questionPrompt: {
      title: '提问塔罗',
      placeholder: '你想询问什么？例如：这段关系接下来会怎样……',
      cancel: '取消',
      send: '发送',
    },
    spreadSelection: {
      title: '选择你的牌阵',
      description: '选择一组牌阵来解读你的路径。每种布局都会带来不同层面的洞见。',
      yesNoTitle: '是 / 否',
      yesNoDescription: '快速回答一个明确的问题。',
      threeCardTitle: '三张牌牌阵',
      threeCardDescription: '揭示过去、现在与未来的经典布局。',
      celticCrossTitle: '凯尔特十字',
      celticCrossDescription:
        '一套更完整、更细腻的十张牌解读，适合探索复杂局势、隐藏影响与长期走向。',
      deepDive: '深入解读',
    },
    cardSelection: {
      panelTitle: '已抽出的牌位',
      cancelTitle: '点击即可取消这张牌的选择',
      hintTitle: '从下方牌轮抽取卡牌来填入该位置',
      drawn: '已抽',
      empty: '空位',
      label: '输入你的意向或问题（可选）',
      placeholder: '你想询问什么？例如：我的事业走向……',
      confirmQuestionTitle: '确认问题',
      title: '选择你的卡牌',
      drawMore: (remaining: number, spreadName: string, positionName: string) =>
        `还需抽取 ${remaining} 张牌，用于 ${spreadName} 的「${positionName}」位置`,
      complete: '牌阵已全部抽满，前往查看你的命运！',
      confirm: '确认抽牌',
      selectMore: (remaining: number) => `再选 ${remaining} 张牌，以绑定你的意念`,
      faceDownLabel: '占卜',
    },
    cardReveal: {
      titlePending: '你的命运正在显现',
      titleComplete: '星盘已完全显影',
      subtitlePending: '轻触背面卡牌，唤醒它们的讯息。',
      subtitleComplete: '点击已抽出的卡牌，查看它们的传统含义，然后启动 AI 分析。',
      focusQuery: '聚焦问题：',
      upright: '正位',
      reversed: '逆位',
      guidanceKeywords: '指引关键词：',
      revealAll: '查看所有卡牌',
      allDrawnHint: '卡牌已抽出并显现。问题已准备就绪。现在可在此启动完整的 AI 星图诊断。',
      askOracle: '询问塔罗',
      consulting: '正在咨询塔罗……',
      loadingTitle: '正在汇聚以太流',
      loadingBody: (spreadName: string) =>
        `请稍作冥想，智谱 GLM 正在解析你的 ${spreadName} 牌阵，并生成你的专属灵性解读……`,
      errorTitle: '占卜中断',
      retry: '重试咨询',
      fallbackError: '占卜连接刚刚受到干扰，请稍后重试。',
      consultationError: '咨询失败。请确认 GLM API key 已正确填写。',
      positions: [
        '1. 现状',
        '2. 阻力',
        '3. 潜意识',
        '4. 过往',
        '5. 目标',
        '6. 未来',
        '7. 自我',
        '8. 环境',
        '9. 希望',
        '10. 结果',
      ],
    },
    oracleChat: {
      title: '当前牌阵解析',
      subtitle: '活动牌阵解析',
      archiveReading: '保存截图',
      archiveSaved: '已下载',
      newSpread: '重新抽牌',
      backToSpread: '返回牌阵',
      focusLabel: '聚焦：',
      querent: '问卜者',
      analyst: '塔罗 AI 解读师',
      meditating: '塔罗 AI 解读师正在冥想……',
      quickPrompts: [
        {
          label: '即时警示',
          text: '请分析这组牌中隐藏的即时警示或阴影阻塞。',
        },
        {
          label: '成长启示',
          text: '这组牌揭示的最关键灵性成长课题是什么？',
        },
        {
          label: '冥想箴言',
          text: '给我一条与这组牌频率相匹配的专属冥想箴言。',
        },
      ],
      placeholder: '继续向星界塔罗提问……',
      errorText: '塔罗线程暂时失去共振。请稍作休息后再次提问。',
    },
    archive: {
      title: '占卜档案',
      subtitle: '你的灵性咨询与命运对话记录。',
      emptyTitle: '档案仍是空白',
      emptyBody: '完成一次牌阵选择、抽牌与塔罗咨询后，点击「存档本次解读」即可记录你的命运。',
      focusLabel: '聚焦：',
      readScroll: '阅读占卜卷轴',
      collapseScroll: '收起占卜卷轴',
      purge: '清空占卜记录',
      purgeConfirm: '你确定要清空全部占卜记录吗？此操作不可撤销。',
      readingSaved: '已抽',
    },
    common: {
      upright: '正位',
      reversed: '逆位',
      languageButton: 'EN',
    },
  },
  en: {
    header: {
      title: 'Space Tarot',
      homeTitle: 'Home',
      resetTitle: 'Reset Reading',
      historyTitle: 'Save Reading Screenshot',
      saveTitle: 'Save Reading Screenshot',
      saveDisabledTitle: 'Reveal all cards before saving',
      savingTitle: 'Saving Screenshot',
      aiSettingsTitle: 'AI Settings',
      languageLabel: '中文',
    },
    aiSettings: {
      title: 'AI Settings',
      subtitle: 'Zhipu GLM',
      modelLabel: 'AI Model',
      apiKeyLabel: 'API key',
      apiKeyPlaceholder: 'Enter your GLM API key',
      apiKeyLink: 'Create GLM API key (free)',
      unlockTitle: 'Unlock to edit model',
      lockTitle: 'Lock model',
      cancel: 'Cancel',
      save: 'Save',
    },
    questionPrompt: {
      title: 'Ask the Oracle',
      placeholder: 'What would you like to ask? e.g. What comes next in this relationship...',
      cancel: 'Cancel',
      send: 'Send',
    },
    spreadSelection: {
      title: 'Select Your Spread',
      description:
        'Choose the constellation of cards to divine your path. Each spread offers unique insights into the energies surrounding your query.',
      yesNoTitle: 'YES OR NO',
      yesNoDescription: 'A swift answer to a clear question.',
      threeCardTitle: 'THREE-CARD SPREAD',
      threeCardDescription: 'The classic constellation revealing Past, Present, and Future energies.',
      celticCrossTitle: 'CELTIC CROSS',
      celticCrossDescription:
        'A comprehensive, deeply nuanced reading involving ten cards. Ideal for exploring complex situations, uncovering hidden influences, and projecting long-term outcomes.',
      deepDive: 'Deep Dive',
    },
    cardSelection: {
      panelTitle: 'Drawn Tapestry',
      cancelTitle: 'Click to cancel this card selection',
      hintTitle: 'Draw from the wheel below to fill this slot',
      drawn: 'Card Drawn',
      empty: 'Empty Slot',
      label: 'Inscribe Your Focus or Query (Optional)',
      placeholder: 'What secrets are you seeking? e.g. My career path...',
      confirmQuestionTitle: 'Confirm question',
      title: 'Choose Your Cards',
      drawMore: (remaining: number, spreadName: string, positionName: string) =>
        `Draw ${remaining} more card${remaining === 1 ? '' : 's'} for ${spreadName}: "${positionName}"`,
      complete: 'The cosmic constellation is fully drawn. Proceed to view your fate!',
      confirm: 'CONFIRM SELECTION',
      selectMore: (remaining: number) =>
        `Select ${remaining} more card${remaining === 1 ? '' : 's'} to bind your intent`,
      faceDownLabel: 'divination',
    },
    cardReveal: {
      titlePending: 'Your Fate Awaits',
      titleComplete: 'The Constellation is Revealed',
      subtitlePending: 'Touch the face-down cards to channel input energy and reveal their secrets.',
      subtitleComplete:
        'Explore drawn cards to analyze their traditional meanings, then initiate AI Analyst integration.',
      focusQuery: 'Focus Query:',
      upright: 'Upright',
      reversed: 'Reversed',
      guidanceKeywords: 'Guidance Keywords:',
      revealAll: 'Reveal All Cards',
      allDrawnHint:
        'All cards drawn and revealed. Query is prepared. Initiate full celestial AI diagnostics inside.',
      askOracle: 'ASK THE ORACLE',
      consulting: 'CONSULTING THE ORACLE...',
      loadingTitle: 'GATHERING THE ETHEREAL CURRENTS',
      loadingBody: (spreadName: string) =>
        `Please sit in brief contemplation while Zhipu GLM analyzes your ${spreadName} constellation and shapes your custom spiritual reading...`,
      errorTitle: 'Divination Disrupted',
      retry: 'Retry Consultation',
      fallbackError: 'The Oracle was momentarily disrupted. Please retry.',
      consultationError:
        'Consultation failed. Make sure your GLM API key is correctly set.',
      positions: [
        '1. Present',
        '2. Obstacle',
        '3. Deep Roots',
        '4. Behind You',
        '5. Ideals',
        '6. Before You',
        '7. Self',
        '8. World',
        '9. Hope',
        '10. Outcome',
      ],
    },
    oracleChat: {
      title: 'ACTIVE SPREAD ANALYSIS',
      subtitle: 'Active Spread Analysis',
      archiveReading: 'Save Screenshot',
      archiveSaved: 'Downloaded',
      newSpread: 'Draw New Spread',
      backToSpread: 'Back to Spread',
      focusLabel: 'Focus:',
      querent: 'Querent',
      analyst: 'Oracle AI Analyst',
      meditating: 'Oracle AI Analyst is meditating...',
      quickPrompts: [
        {
          label: 'Immediate Warning',
          text: 'Analyze any immediate warnings or shadow blockages hidden within this constellation.',
        },
        {
          label: 'Fated Growth',
          text: 'What is the most critical spiritual growth lesson these drawn cards reveal?',
        },
        {
          label: 'Meditation Mantra',
          text: 'Provide a customized cosmic meditation mantra matching the frequency of this spread.',
        },
      ],
      placeholder: 'Inquire further details from the Celestial Oracle...',
      errorText:
        'The Oracle lost alignment with the cosmic thread. Please rest your thoughts for a moment and retry asking your focus question.',
    },
    archive: {
      title: 'DIVINATION DIARY',
      subtitle: 'Your chronicled history of cosmic consults and fated alignments.',
      emptyTitle: 'The Diary Lies Empty',
      emptyBody:
        'Once you select a spread, choose your cards, and complete the celestial consulting with the Oracle, click "Archive Reading" to chronicle your fate.',
      focusLabel: 'Focus:',
      readScroll: 'Read Divine Scroll',
      collapseScroll: 'Collapse Divine Scroll',
      purge: 'Purge Divine History',
      purgeConfirm:
        'Are you absolutely sure you want to purge your entire divination diary history? This action is irreversible.',
      readingSaved: 'Card Drawn',
    },
    common: {
      upright: 'Upright',
      reversed: 'Reversed',
      languageButton: '中文',
    },
  },
} as const;

const ARCANA_COPY: Record<string, LocalizedText> = {
  wands: {
    zh: '权杖组',
    en: 'Suit of Wands',
  },
  cups: {
    zh: '圣杯组',
    en: 'Suit of Cups',
  },
  swords: {
    zh: '宝剑组',
    en: 'Suit of Swords',
  },
  pentacles: {
    zh: '星币组',
    en: 'Suit of Pentacles',
  },
};

export function getLocalizedSpread(spread: TarotSpread, language: Language): LocalizedSpread {
  const copy = SPREAD_COPY[spread.id];

  if (!copy) {
    return {
      name: spread.name,
      description: spread.description,
      positions: spread.positions.map(position => ({
        name: position.name,
        description: position.description,
        compactName: position.name,
      })),
    };
  }

  return {
    name: copy.name[language],
    description: copy.description[language],
    positions: copy.positions.map(position => ({
      name: position.name[language],
      description: position.description[language],
      compactName: position.compactName[language],
    })),
  };
}

export function getLocalizedArcanaLabel(card: TarotCard, language: Language): string {
  if (card.type === 'major') {
    return language === 'zh' ? `大阿卡那 ${card.number}` : `Major Arcana ${card.number}`;
  }

  if (card.suit && ARCANA_COPY[card.suit]) {
    return ARCANA_COPY[card.suit][language];
  }

  return card.arcana;
}
