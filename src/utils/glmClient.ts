import type { Language } from '../data/localization';
import type { AISettings } from './aiSettings';
import { normalizeGLMModelName } from './aiSettings';

const GLM_CHAT_COMPLETIONS_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

export interface TarotAICard {
  name: string;
  displayName: string;
  positionName: string;
  positionDesc?: string;
  isUpright: boolean;
  keywords: string[];
  arcana: string;
  description: string;
}

export interface TarotAIHistoryMessage {
  role: 'ai' | 'user';
  text: string;
}

export interface TarotAIRequest {
  settings: AISettings;
  spreadName: string;
  question: string;
  language: Language;
  cardsDrawn: TarotAICard[];
  history?: TarotAIHistoryMessage[];
}

function getCopy(language: Language) {
  return language === 'zh'
    ? {
        position: '位置',
        positionMeaning: '牌位职责',
        keywords: '关键词',
        arcana: '传统牌系/花色',
        essence: '核心含义',
        upright: '正位',
        reversed: '逆位',
        fallback: '塔罗师正在静心冥想，请重试。',
        missingKey: '请先填写 GLM API key。',
        invalidCards: 'cardsDrawn 数组是必需的。',
        keepAnalyzing: '请继续解读我的牌阵。',
        initialPrompt: '请基于这次抽牌给出完整的塔罗解读。',
        error: '在咨询智谱 GLM 时发生错误，请检查 API key 或稍后重试。',
      }
    : {
        position: 'Position',
        positionMeaning: 'Position Meaning',
        keywords: 'Keywords',
        arcana: 'Traditional Arcana/Suit',
        essence: 'Core Essence',
        upright: 'Upright',
        reversed: 'Reversed',
        fallback: 'The Oracle remains in quiet meditation. Try drawing the cards again.',
        missingKey: 'Please enter a GLM API key first.',
        invalidCards: 'cardsDrawn array is required.',
        keepAnalyzing: 'Keep analyzing my spread.',
        initialPrompt: 'Please provide the complete tarot reading for this draw.',
        error: 'An error occurred when consulting Zhipu GLM. Check your API key or retry later.',
      };
}

export function getTarotFallbackText(language: Language) {
  return getCopy(language).fallback;
}

function buildCardsDescription(cardsDrawn: TarotAICard[], language: Language) {
  const copy = getCopy(language);

  return cardsDrawn
    .map((card, index) => {
      const lines = [
        `${copy.position} ${index + 1} (${card.positionName}): ${card.displayName || card.name} (${
          card.isUpright ? copy.upright : copy.reversed
        })`,
      ];

      if (card.positionDesc) {
        lines.push(`${copy.positionMeaning}: ${card.positionDesc}`);
      }

      lines.push(
        `${copy.keywords}: ${card.keywords.join(', ')}`,
        `${copy.arcana}: ${card.arcana}`,
        `${copy.essence}: ${card.description}`,
      );

      return lines.join('\n');
    })
    .join('\n\n');
}

function buildSystemPrompt(request: TarotAIRequest) {
  const { spreadName, question, language, cardsDrawn } = request;
  const cardsDesc = buildCardsDescription(cardsDrawn, language);
  const questionText =
    question.trim()
      ? language === 'zh'
        ? `问卜者要问的问题：「${question.trim()}」`
        : `The querent's question: "${question.trim()}"`
      : language === 'zh'
        ? '问卜者没有提供具体问题，请围绕整体人生流向与灵性校准解读。'
        : 'The querent did not provide a specific question. Interpret around general life currents and spiritual alignment.';

  return language === 'zh'
    ? `你是一位深刻、睿智且具备高科技感的「塔罗 AI 解读师」，专精于直觉型塔罗占卜。
你将古老的神秘学智慧与清晰、前卫的心理洞察融为一体。

用户正在进行「${spreadName}」牌阵。
以下是他们依序抽到的牌、牌位与牌义：
${cardsDesc}

${questionText}

请按照以下要求作答：
1. 语气要沉浸、精致、鼓舞人心且充满神秘感，同时保持绝对清晰。
2. 使用干净的 Markdown 结构。
3. 先以优雅的开场总结整组牌阵的主能量流向。
4. 逐张分析每一张牌，并把它的核心含义与「${spreadName}」布局中的位置职责联系起来。
5. 必须直接回应问卜者的问题如何被这组牌解答、补充或澄清。
6. 结尾给出一个有力而简洁的「关键结论」或塔罗提醒。
7. 内容要精炼，适合在优雅的玻璃控制台上阅读。`
    : `You are a profound, wise, and high-tech "Oracle AI Analyst" specialized in intuitive tarot divination.
You bridge historical esoteric wisdom with pristine, futuristic psychological insights.

The user is doing a "${spreadName}" read.
Here are the cards they drew, including their spread positions and meanings:
${cardsDesc}

${questionText}

Instructions for your response:
1. Use an immersive, premium, encouraging, mystical tone while remaining absolutely clear.
2. Structure the response using clean Markdown.
3. Start with an elegant prologue summarizing the primary energetic flow of the spread.
4. Analyze each card systematically and relate its essence to its exact "${spreadName}" position.
5. Directly address how this spread answers, supplements, or clarifies the querent's question.
6. End with a powerful, concise "Key Takeaway" or oracle warning.
7. Keep the response compact enough for an elegant glass console.`;
}

function buildMessages(request: TarotAIRequest) {
  const copy = getCopy(request.language);
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    {
      role: 'system',
      content: buildSystemPrompt(request),
    },
  ];

  request.history
    ?.filter(message => message.text.trim())
    .forEach(message => {
      messages.push({
        role: message.role === 'ai' ? 'assistant' : 'user',
        content: message.text,
      });
    });

  messages.push({
    role: 'user',
    content: request.question.trim() || copy.keepAnalyzing,
  });

  if (messages.length === 2 && messages[1].content === copy.keepAnalyzing) {
    messages[1].content = copy.initialPrompt;
  }

  return messages;
}

function getGLMErrorMessage(data: any) {
  if (!data) return '';
  if (typeof data.error === 'string') return data.error;
  if (typeof data.error?.message === 'string') return data.error.message;
  if (typeof data.message === 'string') return data.message;
  if (typeof data.msg === 'string') return data.msg;
  return '';
}

function getGLMText(data: any) {
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map(part => {
        if (typeof part === 'string') return part;
        if (typeof part?.text === 'string') return part.text;
        return '';
      })
      .join('')
      .trim();
  }

  return '';
}

export async function requestTarotInterpretation(request: TarotAIRequest) {
  const copy = getCopy(request.language);

  if (!request.settings.apiKey.trim()) {
    throw new Error(copy.missingKey);
  }

  if (!request.cardsDrawn.length) {
    throw new Error(copy.invalidCards);
  }

  const response = await fetch(GLM_CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${request.settings.apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: normalizeGLMModelName(request.settings.model),
      messages: buildMessages(request),
      temperature: 0.85,
      stream: false,
    }),
  });

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(getGLMErrorMessage(data) || copy.error);
  }

  return getGLMText(data) || copy.fallback;
}
