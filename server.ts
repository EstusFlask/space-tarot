import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

type Language = 'zh' | 'en';

function getLanguage(value: unknown): Language {
  return value === 'en' ? 'en' : 'zh';
}

// REST endpoint for Tarot AI Interpretation
app.post('/api/interpret-tarot', async (req, res) => {
  let fallbackErrorMessage = 'An error occurred when consulting the Oracle. Check your Gemini API Secrets configuration.';

  try {
    const { spreadName, cardsDrawn, question, history, language: requestedLanguage } = req.body;
    const language = getLanguage(requestedLanguage);
    const copy =
      language === 'zh'
        ? {
            position: '位置',
            keywords: '关键词',
            arcana: '传统牌系/花色',
            essence: '核心含义',
            upright: '正位',
            reversed: '逆位',
            fallback: '塔罗师正在静心冥想，请重新抽牌后再试。',
            invalidCards: 'cardsDrawn 数组是必需的。',
            keepAnalyzing: '请继续解读我的牌阵。',
            initialPrompt: '汇聚能量并解读我的牌阵。',
            error: '在咨询塔罗时发生错误。请检查 Gemini API 密钥配置。',
          }
        : {
            position: 'Position',
            keywords: 'Keywords',
            arcana: 'Traditional Arcana/Suit',
            essence: 'Core Essence',
            upright: 'Upright',
            reversed: 'Reversed',
            fallback: 'The Oracle remains in quiet meditation. Try drawing the cards again.',
            invalidCards: 'cardsDrawn array is required.',
            keepAnalyzing: 'Keep analyzing my spread.',
            initialPrompt: 'Gather the energies and interpret my spread.',
            error: 'An error occurred when consulting the Oracle. Check your Gemini API Secrets configuration.',
          };

    fallbackErrorMessage = copy.error;

    if (!cardsDrawn || !Array.isArray(cardsDrawn) || cardsDrawn.length === 0) {
      res.status(400).json({ error: copy.invalidCards });
      return;
    }

    const ai = getGenAI();

    const cardsDesc = cardsDrawn
      .map((c: any, index: number) => {
        return `${copy.position} ${index + 1} (${c.positionName}): ${c.name} (${c.isUpright ? copy.upright : copy.reversed})
${copy.keywords}: ${c.keywords.join(', ')}
${copy.arcana}: ${c.arcana}
${copy.essence}: ${c.description}`;
      })
      .join('\n\n');

    const questionText =
      question
        ? language === 'zh'
          ? `问卜者最在意的问题或聚焦点：「${question}」`
          : `The Querent's burning question or target of focus: "${question}"`
        : language === 'zh'
          ? '他们的聚焦点是整体人生流向与灵性校准。'
          : 'Their focus was on general life currents and spiritual alignment.';

    const systemPrompt =
      language === 'zh'
        ? `你是一位深刻、睿智且具备高科技感的「塔罗 AI 解读师」，专精于直觉型塔罗占卜。
你将古老的神秘学智慧与清晰、前卫的心理洞察融为一体。

用户正在进行一个「${spreadName}」牌阵。
以下是他们依序抽到的牌：
${cardsDesc}

${questionText}

请按照以下要求作答：
1. 语气要沉浸、精致、鼓舞人心且充满神秘感，同时保持绝对清晰。
2. 使用干净的 Markdown 结构。
3. 先以优雅的开场总结整组牌阵的主能量流向。
4. 逐张分析每一张牌，并把它的核心含义与「${spreadName}」布局中的位置职责联系起来。
5. 如果用户提供了具体问题，请直接回应它如何被这组牌解答、补充或澄清。
6. 结尾给出一个有力而简洁的「关键结论」或塔罗提醒。
7. 内容要足够精炼，适合在优雅的玻璃控制台上阅读，同时使用项目符号、加粗与引用块。`
        : `You are a profound, wise, and high-tech "Oracle AI Analyst" specialized in intuitive tarot card divination.
You bridge historical esoteric wisdom with pristine, futuristic psychological insights.

The user is doing a "${spreadName}" read.
Here are the dynamic cards they drew, in order:
${cardsDesc}

${questionText}

Instructions for your response:
1. Adopt a tone that is highly immersive, premium, encouraging, and deeply mystical, while retaining absolute clarity.
2. Structure your analysis using clean Markdown.
3. Start with an elegant welcome or prologue summarizing the primary energetic flow of the constellation.
4. Go through each drawn card systematically. Relate the card's essence back to its specific position role in the "${spreadName}" layout.
5. If the user provided a specific question, directly address how this mystical tapestry answers or untangles their query.
6. Provide a powerful, concise synthesized "Key Takeaway" or oracle warning at the end.
7. Keep the response compact enough for reading on an elegant glass console, yet deeply insightful. Always use bullet points, bold accents, and blockquotes to match the high-end iOS modular layout.`;

    const chatMessages: any[] = [];

    if (history && Array.isArray(history) && history.length > 0) {
      history.forEach((msg: any) => {
        chatMessages.push({
          role: msg.role === 'ai' ? 'model' : 'user',
          parts: [{ text: msg.text }],
        });
      });
      chatMessages.push({
        role: 'user',
        parts: [{ text: question || copy.keepAnalyzing }],
      });
    } else {
      chatMessages.push({
        role: 'user',
        parts: [{ text: copy.initialPrompt }],
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: chatMessages,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.85,
      },
    });

    const outputText = response.text || copy.fallback;
    res.json({ interpretation: outputText });
  } catch (error: any) {
    console.error('Gemini error:', error);
    res.status(500).json({
      error: error.message || fallbackErrorMessage,
    });
  }
});

// Vite Server Configuration for Full-stack Integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Tarot Server running on http://localhost:${PORT}`);
  });
}

startServer();
