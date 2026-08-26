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

import { 
  WEATHER_TOOLS, 
  get_current_weather, 
  get_forecast, 
  get_historical_trend, 
  get_seasonal_comparison, 
  get_active_alerts 
} from './server/tools.js';

// System prompt for Groq — PS 26068 enhanced
const SYSTEM_PROMPT = `You are WeatherGPT, a friendly and highly knowledgeable weather assistant built for India.
Your goal is to answer ANY weather-related query in a way that is incredibly EASY and UNDERSTANDABLE — especially for farmers, rural workers, and common people.

You have access to tools to fetch real weather data. Call the appropriate tool(s) based on what the user is asking. You may call multiple tools if the question needs multiple types of data (e.g. both current weather AND alerts). Only call tools you actually need — don't call all 5 for a simple question.

Core Rules:
1. ONLY answer questions about weather, agriculture, climate, human health impacts, or travel. Politely decline unrelated topics.
2. If the user greets you ("hello", "hi", "namaste"), reply warmly and ask how you can help with weather today.
3. ALWAYS respond in the EXACT SAME LANGUAGE the user asked in (English, Hindi, Assamese, Bengali, or any other language).
4. Simple language only. "Heavy rain after 4 PM — plan travel earlier" NOT "Precipitation probability: 78%".
5. 2–4 sentences of detailed, actionable advice. Farmer? Give field guidance. Traveler? Give road safety. Hiker? Give heat + terrain risk.
6. Severe conditions (rain >50mm, wind >60km/h, thunderstorm, flooding): CLEARLY FLAG with a plain-language advisory + concrete action.
7. For "relevantStat", pick the single most important number (e.g. "Rain chance: 85%").

ACTIVITY AND HEAT RISK AWARENESS:
8. When the user mentions an activity (hiking, farming, spraying, sports, travel), reason using HEAT INDEX (not just temperature). High humidity slows sweat evaporation making the body work harder.

FOLLOW-UP SUGGESTIONS:
9. Generate exactly 2-3 natural follow-up questions based on the user's question, your answer, and recent conversation history.
   - Follow-ups must represent genuinely different next steps a real user would take — not just rephrasing the same question.
   - If the current answer fully resolves the query (or user said thanks), return an empty array.
   - Never repeat a question from the conversation history.
   - Each suggestion must be under 8 words, in the EXACT same language as the user, phrased as the user (first person).

RESPOND ONLY IN THIS EXACT JSON FORMAT, no markdown fences:
{
  "answer": "Detailed, easy-to-understand, conversational answer with actionable advice.",
  "followUp": "Optional seasonal comparison or anomaly note, or empty string.",
  "relevantStat": "Single most relevant data point as a short label.",
  "advisory": "Plain-language advisory with concrete action if conditions warrant caution, or empty string.",
  "severity": "none or caution or severe",
  "suggestedQuestions": ["Question 1?", "Question 2?"]
}`;

// POST /api/chat
app.post('/api/chat', async (req, res) => {
  const { message, language, weatherData, history = [] } = req.body;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Groq API key not configured. Add GROQ_API_KEY to .env file.' });
  }

  let finalContent = null;

  try {
    // ---------------------------------------------------------
    // PRIMARY STRATEGY: FUNCTION CALLING LOOP
    // ---------------------------------------------------------
    const locHint = weatherData?.location ? `\n(Hint: The user's location is generally ${weatherData.location}${weatherData.state ? ', ' + weatherData.state : ''}. Use tools to fetch precise data if needed.)` : '';
    const initialUserPrompt = `User question (language: ${language}): "${message}"${locHint}`;

    let messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: initialUserPrompt }
    ];

    let loopCount = 0;
    const MAX_LOOPS = 3;

    while (loopCount < MAX_LOOPS) {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama3-groq-70b-8192-tool-use-preview', // highly capable tool model, or fallback to llama3-70b-8192
          messages: messages,
          tools: WEATHER_TOOLS,
          tool_choice: 'auto',
          temperature: 0.7,
          max_tokens: 1024
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error during tool loop: ${response.status} ${await response.text()}`);
      }

      const data = await response.json();
      const responseMessage = data?.choices?.[0]?.message;

      if (!responseMessage) {
        throw new Error('Empty response from Groq');
      }

      // Check if Groq wants to call tools
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        messages.push(responseMessage); // Add assistant's tool request to history

        // Execute each tool concurrently
        const toolPromises = responseMessage.tool_calls.map(async (tc) => {
          const funcName = tc.function.name;
          let resultData;
          try {
            const args = JSON.parse(tc.function.arguments);
            if (funcName === 'get_current_weather') resultData = await get_current_weather(args);
            else if (funcName === 'get_forecast') resultData = await get_forecast(args);
            else if (funcName === 'get_historical_trend') resultData = await get_historical_trend(args);
            else if (funcName === 'get_seasonal_comparison') resultData = await get_seasonal_comparison(args);
            else if (funcName === 'get_active_alerts') resultData = await get_active_alerts(args);
            else resultData = { error: 'Unknown function' };
          } catch (err) {
            resultData = { error: err.message };
          }
          return {
            role: 'tool',
            tool_call_id: tc.id,
            name: funcName,
            content: JSON.stringify(resultData)
          };
        });

        const toolResults = await Promise.all(toolPromises);
        messages.push(...toolResults); // Add tool results to history
        loopCount++;
      } else {
        // No tool calls -> final answer!
        finalContent = responseMessage.content;
        break;
      }
    }

    if (!finalContent) {
      throw new Error('Exceeded max tool loops without generating a final answer.');
    }

  } catch (err) {
    console.warn('Tool loop failed, falling back to legacy single-shot strategy:', err.message);
    
    // ---------------------------------------------------------
    // FALLBACK STRATEGY (Legacy Single-Shot)
    // ---------------------------------------------------------
    try {
      const now = new Date();
      const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const currentMonth = monthNames[now.getMonth()];
      const monthIndex = now.getMonth();

      let seasonalNote = '';
      if (weatherData?.location) {
        // Extremely simplified fallback seasonal check
        seasonalNote = `Seasonal context: It's ${currentMonth}.`; 
      }

      let heatIndexNote = '';
      if (weatherData?.temperature >= 27 && weatherData?.humidity) {
        heatIndexNote = `High heat index likely due to ${weatherData.humidity}% humidity.`;
      }

      let modelNote = '';
      if (weatherData?.modelData?.daily?.gfs && weatherData?.modelData?.daily?.ecmwf) {
        modelNote = `\nMulti-model forecast: Data provided by GFS and ECMWF.`;
      }

      const fallbackPrompt = `User question (language: ${language}): "${message}"\n
Current weather data (Fallback):
- Location: ${weatherData?.location || 'Unknown'}
- Temp: ${weatherData?.temperature}°C, Feels Like: ${weatherData?.feelsLike}°C
- Humidity: ${weatherData?.humidity}%, Wind: ${weatherData?.windSpeed} km/h
- Rain: ${weatherData?.rain}mm
${heatIndexNote ? '- ' + heatIndexNote : ''}
${modelNote}`;

      const fallbackRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'openai/gpt-oss-20b',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history,
            { role: 'user', content: fallbackPrompt }
          ],
          temperature: 0.7,
          max_tokens: 1024
        }),
      });

      if (!fallbackRes.ok) {
        return res.status(502).json({ error: 'Weather AI is temporarily unavailable. Try again in a moment.' });
      }

      const fallbackData = await fallbackRes.json();
      finalContent = fallbackData?.choices?.[0]?.message?.content;

      if (!finalContent) {
        return res.status(502).json({ error: 'Received an empty response. Try again.' });
      }
    } catch (fallbackErr) {
      console.error('Fallback error:', fallbackErr);
      return res.status(500).json({ error: 'Something went wrong. Try again.' });
    }
  }

  // ---------------------------------------------------------
  // FINAL RESPONSE PARSING
  // ---------------------------------------------------------
  try {
    const cleanText = finalContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanText);
    return res.json({
      answer: parsed.answer || 'I couldn\'t process that. Try asking again.',
      followUp: parsed.followUp || '',
      relevantStat: parsed.relevantStat || '',
      advisory: parsed.advisory || '',
      severity: parsed.severity || 'none',
      suggestedQuestions: Array.isArray(parsed.suggestedQuestions) ? parsed.suggestedQuestions.slice(0, 3) : [],
    });
  } catch (parseErr) {
    let partialAnswer = finalContent;
    const answerMatch = finalContent.match(/"answer"\s*:\s*"([^"]*)/);
    if (answerMatch && answerMatch[1]) partialAnswer = answerMatch[1];
    else partialAnswer = finalContent.replace(/[{}"\\]/g, '').replace(/answer\s*:/, '').trim();
    
    return res.json({
      answer: partialAnswer || 'The response was cut off. Please try again.',
      followUp: '',
      advisory: '',
      severity: 'none',
      suggestedQuestions: [],
    });
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
        const match = itemBlock.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`, 's'));
        return match ? match[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : '';
      };
      
      const titleFull = getTag('title');
      const desc = getTag('description');
      
      // Google News often appends " - Publisher" to the title. We can split it.
      const lastDash = titleFull.lastIndexOf(' - ');
      const title = lastDash > 0 ? titleFull.substring(0, lastDash) : titleFull;
      const source = lastDash > 0 ? titleFull.substring(lastDash + 3) : 'Google News';
      
      // Try to extract image from description
      let imageMatch = desc.match(/<img[^>]+src=["']([^"']+)["']/i);
      let image = imageMatch ? imageMatch[1] : null;

      // Fallbacks if no image found in RSS
      if (!image) {
        const tLower = title.toLowerCase();
        if (tLower.includes('flood') || tLower.includes('rain')) {
          image = 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=200&q=80';
        } else if (tLower.includes('cyclone') || tLower.includes('storm')) {
          image = 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=200&q=80';
        } else if (tLower.includes('heat') || tLower.includes('sun') || tLower.includes('warm')) {
          image = 'https://images.unsplash.com/photo-1504370805625-d32c54b16100?auto=format&fit=crop&w=200&q=80';
        } else {
          image = 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=200&q=80';
        }
      }

      return {
        id: getTag('guid') || Math.random().toString(36),
        title: title,
        link: getTag('link'),
        source: source,
        time: getTag('pubDate'),
        image: image
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
app.get('/', (req, res) => {
  res.json({ status: 'active', message: 'WeatherGPT Backend is running!' });
});

app.listen(PORT, () => {
  console.log(`WeatherGPT server running on http://localhost:${PORT}`);
});
