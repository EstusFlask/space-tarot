import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialization of GoogleGenAI helper
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

// REST endpoint for Tarot AI Interpretation
app.post('/api/interpret-tarot', async (req, res) => {
  try {
    const { spreadName, cardsDrawn, question, history } = req.body;

    if (!cardsDrawn || !Array.isArray(cardsDrawn) || cardsDrawn.length === 0) {
      res.status(400).json({ error: 'cardsDrawn array is required.' });
      return;
    }

    const ai = getGenAI();

    // Prepare card descriptions
    const cardsDesc = cardsDrawn
      .map((c: any, index: number) => {
        return `Position ${index + 1} (${c.positionName}): ${c.name} (${c.isUpright ? 'Upright' : 'Reversed'})
Keywords: ${c.keywords.join(', ')}
Traditional Arcana/Suit: ${c.arcana}
Core Essence: ${c.description}`;
      })
      .join('\n\n');

    const systemPrompt = `You are a profound, wise, and high-tech "Oracle AI Analyst" specialized in intuitive tarot card divination.
You bridge historical esoteric wisdom with pristine, futuristic psychological insights.

The user is doing a "${spreadName}" read. 
Here are the dynamic cards they drew, in order:
${cardsDesc}

${question ? `The Querent's burning question or target of focus: "${question}"` : 'Their focus was on general life currents and spiritual alignment.'}

Instructions for your response:
1. Adopt a tone that is highly immersive, premium, encouraging, and deeply mystical, while retaining absolute clarity.
2. Structure your analysis using clean Markdown.
3. Start with an elegant welcome or prologue summarizing the primary energetic flow of the constellation.
4. Go through each drawn card systematically. Relate the card's essence back to its specific position role in the "${spreadName}" layout.
5. If the user provided a specific question, directly address how this mystical tapestry answers or untangles their query.
6. Provide a powerful, concise synthesized "Key Takeaway" or oracle warning at the end.
7. Keep the response compact enough for reading on an elegant glass console, yet deeply insightful. Always use bullet points, bold accents, and blockquotes to match the high-end iOS modular layout.`;

    const chatMessages: any[] = [];

    // If there is continuous conversation history, we handle it
    if (history && Array.isArray(history) && history.length > 0) {
      // Feed historical conversation
      history.forEach((msg: any) => {
        chatMessages.push({
          role: msg.role === 'ai' ? 'model' : 'user',
          parts: [{ text: msg.text }],
        });
      });
      // Append the newest question
      chatMessages.push({
        role: 'user',
        parts: [{ text: question || "Keep analyzing my spread." }],
      });
    } else {
      // Initial spread interpretation
      chatMessages.push({
        role: 'user',
        parts: [{ text: "Gather the energies and interpret my spread." }],
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

    const outputText = response.text || "The Oracle remains in quiet meditation. Try drawing the cards again.";
    res.json({ interpretation: outputText });
  } catch (error: any) {
    console.error('Gemini error:', error);
    res.status(500).json({
      error: error.message || 'An error occurred when consulting the Oracle. Check your Gemini API Secrets configuration.',
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
