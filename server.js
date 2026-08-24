import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

config(); // Load .env

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// System prompt for Gemini — referenced only via GEMINI_API_KEY from env, never hardcoded
const SYSTEM_PROMPT = `You are WeatherGPT, a friendly, detailed, and highly knowledgeable weather assistant for the North Eastern Region of India. You help farmers, commuters, travelers, and local officials understand weather conditions and make practical, informed decisions.

Rules:
1. ALWAYS respond in the SAME LANGUAGE the user asked in (English, Hindi, Assamese, or Bengali).
2. Give detailed, actionable advice. If a farmer asks, give them agricultural context (e.g., when to spray, when to harvest). If a traveler asks, give road safety and timing advice. Do not just give one-liners; be genuinely helpful and thorough (2-4 sentences).
3. Use plain language: "Heavy rain expected after 4 PM — plan travel earlier" NOT "Precipitation probability: 78%"
4. Pick ONLY the 1–3 most relevant stats for the specific question asked.
5. If conditions are severe (heavy rain >50mm, wind >60km/h, thunderstorms, flooding risk, very low visibility <1km), clearly FLAG it with a plain-language advisory and a concrete suggested action.
6. For the "relevantStat" field, pick the single most important number for this question (e.g. "Rain chance: 85%", "Wind: 45 km/h").
7. ALWAYS respond with valid JSON in this exact format:
{
  "answer": "Your detailed, conversational direct answer with actionable advice.",
  "followUp": "Optional elaboration or helpful context, or empty string.",
  "relevantStat": "The single most relevant data point as a short label.",
  "advisory": "Plain-language advisory with suggested action if conditions warrant caution, or empty string.",
  "severity": "none" | "caution" | "severe"
}
8. Provide pure JSON only.`;

// POST /api/chat
app.post('/api/chat', async (req, res) => {
  try {
    const { message, language, weatherData } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key not configured. Add GEMINI_API_KEY to .env file.' });
    }

    const userPrompt = `User question (language: ${language}): "${message}"

Current weather data for the location:
${JSON.stringify(weatherData, null, 2)}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', response.status, errText);
      return res.status(502).json({ error: 'Weather AI is temporarily unavailable. Try again in a moment.' });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(502).json({ error: 'Received an empty response. Try again.' });
    }

    // Parse the JSON response from Gemini
    try {
      // Strip any markdown code fences if present
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanText);
      return res.json({
        answer: parsed.answer || 'I couldn\'t process that. Try asking again.',
        followUp: parsed.followUp || '',
        relevantStat: parsed.relevantStat || '',
        advisory: parsed.advisory || '',
        severity: parsed.severity || 'none',
      });
    } catch (parseErr) {
      // If Gemini didn't return valid JSON (e.g. truncated), try to extract the "answer" string manually
      let partialAnswer = text;
      const answerMatch = text.match(/"answer"\s*:\s*"([^"]*)/);
      if (answerMatch && answerMatch[1]) {
        partialAnswer = answerMatch[1];
      } else {
        // Just clean up the raw string so it doesn't look like code
        partialAnswer = text.replace(/[{}"\\]/g, '').replace(/answer\s*:/, '').trim();
      }
      
      return res.json({
        answer: partialAnswer || 'The response was cut off. Please try again.',
        followUp: '',
        advisory: '',
        severity: 'none',
      });
    }
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Something went wrong. Try again.' });
  }
});

// GET /api/news
// Fetches real-time weather & disaster news for India via Google News RSS
app.get('/api/news', async (req, res) => {
  try {
    const q = encodeURIComponent('weather OR flood OR cyclone OR disaster India');
    const response = await fetch(`https://news.google.com/rss/search?q=${q}&hl=en-IN&gl=IN&ceid=IN:en`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch news feed');
    }
    
    const xml = await response.text();
    
    // Simple robust regex parsing for RSS XML
    const items = xml.split('<item>').slice(1).map(itemBlock => {
      const getTag = (tag) => {
        const match = itemBlock.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`));
        return match ? match[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : '';
      };
      
      const titleFull = getTag('title');
      // Google News often appends " - Publisher" to the title. We can split it.
      const lastDash = titleFull.lastIndexOf(' - ');
      const title = lastDash > 0 ? titleFull.substring(0, lastDash) : titleFull;
      const source = lastDash > 0 ? titleFull.substring(lastDash + 3) : 'Google News';
      
      return {
        id: getTag('guid') || Math.random().toString(36),
        title: title,
        link: getTag('link'),
        source: source,
        time: getTag('pubDate')
      };
    });
    
    // Return top 6 latest real news items
    res.json({ news: items.slice(0, 6) });
  } catch (err) {
    console.error('News API error:', err);
    res.status(500).json({ error: 'Failed to fetch real-time news.' });
  }
});

// Serve static files in production
app.use(express.static(join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`WeatherGPT server running on http://localhost:${PORT}`);
});
