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

// System prompt for Groq — PS 26068 enhanced
const SYSTEM_PROMPT = `You are WeatherGPT, a friendly and highly knowledgeable weather assistant built for India.
Your goal is to answer ANY weather-related query in a way that is incredibly EASY and UNDERSTANDABLE — especially for farmers, rural workers, and common people.

Core Rules:
1. ONLY answer questions about weather, agriculture, climate, human health impacts, or travel. Politely decline unrelated topics.
2. If the user greets you ("hello", "hi", "namaste"), reply warmly and ask how you can help with weather today.
3. ALWAYS respond in the EXACT SAME LANGUAGE the user asked in (English, Hindi, Assamese, Bengali, or any other language).
4. Simple language only. "Heavy rain after 4 PM — plan travel earlier" NOT "Precipitation probability: 78%".
5. 2–4 sentences of detailed, actionable advice. Farmer? Give field guidance. Traveler? Give road safety. Hiker? Give heat + terrain risk.
6. Severe conditions (rain >50mm, wind >60km/h, thunderstorm, flooding): CLEARLY FLAG with a plain-language advisory + concrete action.
7. For "relevantStat", pick the single most important number (e.g. "Rain chance: 85%").

SEASONAL AWARENESS (Critical for PS 26068):
8. You will receive the current month and typical seasonal norms for the location. ALWAYS compare current conditions against these norms.
   - If rain is unusually heavy for this month: mention it ("This is above the August average for this region").
   - If it is unusually dry during monsoon: flag it ("This is much drier than the typical July rainfall").
   - If temperature is anomalous: note it.
   Tie this to the PS 26068 requirement: "Climate Trend and Historical Weather Analysis."

ACTIVITY AND HEAT RISK AWARENESS:
9. When the user mentions an activity (hiking, farming, spraying, sports, travel), reason using HEAT INDEX (not just temperature).
   High humidity slows sweat evaporation making the body work harder. 30C at 85% humidity is MORE dangerous than 35C at 20% humidity.
   Example: "24C sounds mild, but at 85% humidity the heat index is 28C — more exhausting than it sounds. Pace yourself and hydrate."
   Use the heat index context provided to you.

RESPOND ONLY IN THIS EXACT JSON FORMAT, no markdown fences:
{
  "answer": "Detailed, easy-to-understand, conversational answer with actionable advice.",
  "followUp": "Optional seasonal comparison or anomaly note, or empty string.",
  "relevantStat": "Single most relevant data point as a short label.",
  "advisory": "Plain-language advisory with concrete action if conditions warrant caution, or empty string.",
  "severity": "none or caution or severe"
}`;

// POST /api/chat
app.post('/api/chat', async (req, res) => {
  try {
    const { message, language, weatherData } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Groq API key not configured. Add GROQ_API_KEY to .env file.' });
    }

    // Build enriched context for the AI
    const now = new Date();
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const currentMonth = monthNames[now.getMonth()];
    const monthIndex = now.getMonth();

    // Seasonal context lookup (mirrors climateSeasonal.js logic — server-side static table)
    const SEASONAL_SERVER = {
      guwahati: { rainfall: [10,18,57,134,253,330,324,274,175,83,15,5], maxTemp: [21,24,29,32,32,32,32,32,31,29,25,21] },
      shillong: { rainfall: [17,31,93,268,425,600,620,480,290,160,30,12], maxTemp: [14,15,19,22,22,23,23,23,22,20,16,14] },
      mumbai:   { rainfall: [1,1,1,1,9,500,704,531,296,66,12,2], maxTemp: [31,32,33,34,34,32,30,30,31,33,33,31] },
      delhi:    { rainfall: [21,19,17,7,8,65,211,233,150,14,4,10], maxTemp: [20,23,29,36,40,40,36,35,34,33,28,22] },
      kolkata:  { rainfall: [10,25,36,57,140,279,330,321,255,128,27,7], maxTemp: [26,29,34,36,36,34,32,32,32,32,29,26] },
      chennai:  { rainfall: [25,10,6,15,40,53,93,122,119,307,309,139], maxTemp: [29,31,33,35,38,38,36,35,34,31,29,28] },
    };

    let seasonalNote = '';
    if (weatherData?.location) {
      const locKey = Object.keys(SEASONAL_SERVER).find(k => weatherData.location.toLowerCase().includes(k));
      if (locKey) {
        const norm = SEASONAL_SERVER[locKey];
        seasonalNote = `Seasonal norm for ${weatherData.location} in ${currentMonth}: avg rainfall ~${norm.rainfall[monthIndex]}mm/month, avg max temp ~${norm.maxTemp[monthIndex]}°C.`;
      }
    }

    // Compute heat index (Rothfusz simplified for server)
    let heatIndexNote = '';
    if (weatherData?.temperature >= 27 && weatherData?.humidity) {
      const T = (weatherData.temperature * 9/5) + 32;
      const R = weatherData.humidity;
      let HI = -42.379 + 2.04901523*T + 10.14333127*R - 0.22475541*T*R - 0.00683783*T*T - 0.05481717*R*R + 0.00122874*T*T*R + 0.00085282*T*R*R - 0.00000199*T*T*R*R;
      const hiC = Math.round(((HI - 32) * 5) / 9);
      heatIndexNote = `Heat Index: ${hiC}°C (actual temperature ${weatherData.temperature}°C + humidity ${weatherData.humidity}% effect).`;
    }

    const userPrompt = `User question (language: ${language}): "${message}"

Current weather data:
- Location: ${weatherData?.location || 'Unknown'}, ${weatherData?.state || ''}
- Temperature: ${weatherData?.temperature}°C, Feels Like: ${weatherData?.feelsLike}°C
- Humidity: ${weatherData?.humidity}%, Wind: ${weatherData?.windSpeed} km/h
- Precipitation: ${weatherData?.precipitation}mm, Rain: ${weatherData?.rain}mm
- Weather Code: ${weatherData?.weatherCode}, UV Index: ${weatherData?.uvIndex}
- AQI: ${weatherData?.aqi}
${heatIndexNote ? '- ' + heatIndexNote : ''}

Seasonal context (${currentMonth}):
${seasonalNote || 'No seasonal data available for this location.'}

Current month: ${currentMonth} (month ${monthIndex + 1} of 12)`;

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-20b',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 1024
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq API error:', response.status, errText);
      return res.status(502).json({ error: 'Weather AI is temporarily unavailable. Try again in a moment.' });
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;

    if (!text) {
      return res.status(502).json({ error: 'Received an empty response. Try again.' });
    }

    // Parse the JSON response from Groq
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
      // If Groq didn't return valid JSON (e.g. truncated), try to extract the "answer" string manually
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
