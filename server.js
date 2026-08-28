import express from 'express';
import fs from 'fs';
import crypto from 'crypto';
import * as googleTTS from 'google-tts-api';
import { XMLParser } from 'fast-xml-parser';

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
  get_active_alerts,
  get_marine_weather
} from './server/tools.js';

import mongoose from 'mongoose';
import { Alert, Snapshot, AccuracyLog, SosRequest } from './server/models.js';

export let USE_MONGODB = false;
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("✅ Connected to MongoDB Atlas");
      USE_MONGODB = true;
    })
    .catch(err => console.error("❌ MongoDB connection error:", err));
} else {
  console.log("⚠️ No MONGODB_URI found. Falling back to local JSON files.");
}


// System prompt for Groq — PS 26068 enhanced
const SYSTEM_PROMPT = `You are WeatherGPT, a friendly and highly knowledgeable weather assistant built for India.
Your goal is to answer ANY weather-related query in a way that is incredibly EASY and UNDERSTANDABLE — especially for farmers, rural workers, and common people.

You have access to tools to fetch real weather data. Call the appropriate tool(s) based on what the user is asking. You may call multiple tools if the question needs multiple types of data (e.g. both current weather AND alerts). Only call tools you actually need — don't call all 5 for a simple question.

Core Rules:
1. ONLY answer questions about weather, agriculture, climate, human health impacts, or travel. Politely decline unrelated topics.
2. If the user greets you ("hello", "hi", "namaste"), reply warmly and ask how you can help with weather today.
3. ALWAYS respond in the EXACT SAME LANGUAGE the user asked in.
4. Simple language only. "Heavy rain after 4 PM — plan travel earlier" NOT "Precipitation probability: 78%".
5. USER PROFILE AWARENESS: You will be provided the user's profile. Tailor your answer's framing and terminology to the user's profile:
   - If Farmer (किसान): Prioritize agricultural concerns (spraying, field work, crops).
   - If Fisherman (मछुआरा): Prioritize marine/boating safety (wind, waves, storm risk). Use fishing terminology. You MUST call get_marine_weather to get wave height data.
   - If Aviation (उड्डयन): Prioritize flight-relevant conditions (wind, visibility, storms) using general-aviation language.
   - If Urban Planner (शहरी योजनाकार): Prioritize city-infrastructure and public-preparedness framing (flooding, heatwaves, AQI).
   - If General: Answer in plain everyday terms.
6. Severe conditions (rain >50mm, wind >60km/h, thunderstorm, flooding): CLEARLY FLAG with a plain-language advisory + concrete action.
7. For "relevantStat", pick the single most important number (e.g. "Rain chance: 85%").

ACTIVITY AND HEAT RISK AWARENESS:
8. When the user mentions an activity (hiking, farming, fishing, travel), reason using HEAT INDEX (not just temperature). High humidity slows sweat evaporation.

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
  "relevantStat": "Single most relevant data point as a short label (e.g. 'RAIN: 0 MM', 'HUMIDITY: 80%'). DO NOT include Temperature here, as it is already shown in the UI.",
  "advisory": "Plain-language advisory with concrete action if conditions warrant caution, or empty string.",
  "severity": "none or caution or severe",
  "confidence": "high | medium | low",
  "suggestedQuestions": ["Question 1?", "Question 2?"]
}`;

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function fetchWithRetry(url, options, maxRetries = 4) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);
    if (response.status === 429) {
      console.warn(`[429 Rate Limit] TPM limit hit. Waiting 4 seconds before retry (Attempt ${i + 1}/${maxRetries})...`);
      await sleep(4000);
      continue;
    }
    return response;
  }
  return fetch(url, options);
}

// POST /api/chat
// --- SINGLE SOURCE OF TRUTH FOR CONFIDENCE ---
function calculateConfidence(contextData) {
  if (!contextData?.modelData?.daily) return "high";
  const { gfs, icon, ecmwf } = contextData.modelData.daily;
  if (!gfs || !icon || !ecmwf) return "high";

  const temps = [gfs.maxTemp?.[0], icon.maxTemp?.[0], ecmwf.maxTemp?.[0]].filter(t => t != null);
  const precips = [gfs.precipProbMax?.[0], icon.precipProbMax?.[0], ecmwf.precipProbMax?.[0]].filter(p => p != null);

  if (temps.length < 2) return "high";

  const maxTemp = Math.max(...temps);
  const minTemp = Math.min(...temps);
  const tempDiff = maxTemp - minTemp;

  let precipDiff = 0;
  if (precips.length >= 2) {
    const maxPrecip = Math.max(...precips);
    const minPrecip = Math.min(...precips);
    precipDiff = maxPrecip - minPrecip;
  }

  // EXACT BOOLEAN LOGIC REQUESTED BY USER
  if (tempDiff < 1 && precipDiff < 15) {
    return "high";
  } else if (tempDiff <= 2.5 || precipDiff <= 30) {
    return "medium";
  } else {
    return "low";
  }
}
// ----------------------------------------------


// --- NDMA SACHET ALERTS INTEGRATION ---

// --- DISASTER MANAGER SYSTEM ---
const MANAGER_PASSCODE = process.env.MANAGER_PASSCODE || "weather2026";
const MANAGER_SECRET = process.env.MANAGER_SECRET || "super-secret-key-123";
const ALERTS_FILE = join(__dirname, "manager_alerts.json");

let managerAlerts = [];
try {
  if (fs.existsSync(ALERTS_FILE)) {
    managerAlerts = JSON.parse(fs.readFileSync(ALERTS_FILE, "utf8"));
  }
} catch (e) {
  console.error("Failed to load manager alerts:", e);
}

const saveAlerts = () => {
  try {
    fs.writeFileSync(ALERTS_FILE, JSON.stringify(managerAlerts, null, 2));
  } catch (e) {
    console.error("Failed to save manager alerts:", e);
  }
};

const verifyToken = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const token = auth.split(" ")[1];
  
  try {
    const [payloadB64, signature] = token.split(".");
    const expectedSig = crypto.createHmac("sha256", MANAGER_SECRET).update(payloadB64).digest("hex");
    if (signature !== expectedSig) return res.status(401).json({ error: "Invalid token" });
    
    const payload = JSON.parse(Buffer.from(payloadB64, "base64").toString());
    if (payload.exp < Date.now()) return res.status(401).json({ error: "Token expired" });
    
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

app.post("/api/manager/login", (req, res) => {
  const { passcode } = req.body; console.log("Received passcode:", passcode);
  if (!passcode || passcode.trim() !== MANAGER_PASSCODE) return res.status(401).json({ error: "Invalid passcode" });
  
  const payload = { exp: Date.now() + 24 * 60 * 60 * 1000 }; // 24 hours
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64");
  const signature = crypto.createHmac("sha256", MANAGER_SECRET).update(payloadB64).digest("hex");
  
  res.json({ token: `${payloadB64}.${signature}` });
});

app.get("/api/manager/alerts", verifyToken, (req, res) => {
  // Clean up expired ones silently
  const now = Date.now();
  const valid = managerAlerts.filter(a => a.expiresAt > now);
  if (valid.length !== managerAlerts.length) {
    managerAlerts = valid;
    saveAlerts();
  }
  res.json(managerAlerts);
});

app.post("/api/manager/alerts", verifyToken, (req, res) => {
  const { state, district, lat, lng, radius, targetMode, severity, title, description, durationHours = 24 } = req.body;
  const alert = {
    id: "mgr-" + Date.now(),
    state,
    district,
    lat,
    lng,
    radius,
    targetMode, // 'state', 'district', or 'radius'
    severity,
    title,
    description,
    issuedAt: Date.now(),
    expiresAt: Date.now() + durationHours * 60 * 60 * 1000,
    source: "Authority Alert"
  };
  managerAlerts.push(alert);
  saveAlerts();
  res.json(alert);
});

app.delete("/api/manager/alerts/:id", verifyToken, (req, res) => {
  managerAlerts = managerAlerts.filter(a => a.id !== req.params.id);
  saveAlerts();
  res.json({ success: true });
});

// --- SOS EMERGENCY RESPONSE ROUTES ---
let sosFallback = [];

// POST /api/sos — Public: citizen sends GPS + message
app.post("/api/sos", async (req, res) => {
  const { name, phone, message, lat, lng } = req.body;
  if (!lat || !lng) return res.status(400).json({ error: "Location coordinates are required" });
  const entry = { name: name || 'Anonymous', phone: phone || '', message: message || 'Emergency assistance needed', lat, lng, status: 'pending', timestamp: new Date() };
  if (USE_MONGODB) {
    try { const saved = await SosRequest.create(entry); return res.json({ success: true, id: saved._id }); }
    catch (e) { return res.status(500).json({ error: "Failed to save SOS" }); }
  } else {
    entry.id = 'sos-' + Date.now();
    sosFallback.push(entry);
    return res.json({ success: true, id: entry.id });
  }
});

// GET /api/manager/sos — Manager only: see all active SOS requests
app.get("/api/manager/sos", verifyToken, async (req, res) => {
  if (USE_MONGODB) {
    try { const requests = await SosRequest.find({ status: { $ne: 'resolved' } }).sort({ timestamp: -1 }); return res.json(requests); }
    catch (e) { return res.status(500).json({ error: "DB Error" }); }
  } else {
    return res.json(sosFallback.filter(s => s.status !== 'resolved'));
  }
});

// PUT /api/manager/sos/:id — Manager only: update SOS status
app.put("/api/manager/sos/:id", verifyToken, async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'dispatched', 'resolved'].includes(status)) return res.status(400).json({ error: "Invalid status" });
  if (USE_MONGODB) {
    try { await SosRequest.findByIdAndUpdate(req.params.id, { status }); return res.json({ success: true }); }
    catch (e) { return res.status(500).json({ error: "DB Error" }); }
  } else {
    const sos = sosFallback.find(s => s.id === req.params.id);
    if (sos) sos.status = status;
    return res.json({ success: true });
  }
});

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const ALERTS_CACHE = { data: null, timestamp: 0 };
const CACHE_TTL = 15 * 60 * 1000; // 15 mins

app.get("/api/alerts", async (req, res) => {
  const { state, district, lat, lng } = req.query;
  const now = Date.now();
  
  // 1. Get active internal manager alerts that apply to this user's location
  let currentManagerAlerts = managerAlerts;
  if (USE_MONGODB) {
    try { currentManagerAlerts = await Alert.find({ expiresAt: { $gt: now } }); } catch (e) { currentManagerAlerts = []; }
  }
  
  const activeManagerAlerts = currentManagerAlerts.filter(a => {
    if (a.expiresAt <= now) return false;

    // Mode B: Radius Match
    if (a.targetMode === 'radius' && a.lat && a.lng && lat && lng) {
      const dist = haversineDistance(a.lat, a.lng, parseFloat(lat), parseFloat(lng));
      return dist <= (a.radius || 0);
    }
    
    // Mode A: District Match
    if (a.targetMode === 'district' && a.district) {
      if (district && a.district.toLowerCase() === district.toLowerCase()) {
        return true;
      }
      // If user lacks district data but state matches, keep as fallback? 
      // User requested: "fall back to state-level match if we don't have district data for the user's specific searched city"
      if (!district) {
        return !state || !a.state || a.state.toLowerCase() === state.toLowerCase();
      }
      return false; // User has district info, and it did not match
    }
    
    // Original / Fallback: State Match
    if (!a.targetMode || a.targetMode === 'state') {
      return !state || !a.state || a.state.toLowerCase() === state.toLowerCase();
    }

    return false;
  });
  
  // Format for frontend
  const formattedManagerAlerts = activeManagerAlerts.map(a => ({
    title: a.title,
    description: a.description,
    area: a.targetMode === 'district' ? a.district : a.targetMode === 'radius' ? `${a.radius}km around target` : a.state,
    severity: a.severity,
    source: a.source
  }));

  if (ALERTS_CACHE.data && (now - ALERTS_CACHE.timestamp) < CACHE_TTL) {
    const filtered = state ? ALERTS_CACHE.data.filter(a => a.area && a.area.toLowerCase().includes(state.toLowerCase())) : ALERTS_CACHE.data;
    return res.json([...formattedManagerAlerts, ...filtered]);
  }

  try {
    // Attempting to fetch from Sachet CAP endpoint
    const sachetUrl = "https://sachet.ndma.gov.in/cap_public_website/FetchAllCapAlerts";
    
    // We cannot use global fetch with AbortController easily in older nodes, 
    // but Node 24 has it.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(sachetUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[NDMA API] Feed unreachable, status: ${response.status}`);
      ALERTS_CACHE.data = [];
      ALERTS_CACHE.timestamp = now;
      return res.json([]);
    }

    const xmlText = await response.text();

    // Parse the CAP XML feed using fast-xml-parser
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    let parsed;
    try {
      parsed = parser.parse(xmlText);
    } catch (xmlErr) {
      console.warn('[NDMA API] XML parse error:', xmlErr.message);
      parsed = null;
    }

    // CAP feed structure: root > alert (or alerts > alert)
    let rawAlerts = [];
    if (parsed) {
      // Handle both single alert and array of alerts
      const root = parsed.alerts || parsed.feed || parsed;
      const alertNode = root?.alert;
      if (Array.isArray(alertNode)) {
        rawAlerts = alertNode;
      } else if (alertNode) {
        rawAlerts = [alertNode];
      }
    }

    const alerts = rawAlerts.map(a => {
      const info = Array.isArray(a.info) ? a.info[0] : (a.info || {});
      const area = Array.isArray(info.area) ? info.area[0] : (info.area || {});
      return {
        title: info.headline || info.event || a.identifier || 'Weather Alert',
        description: info.description || info.instruction || '',
        area: area.areaDesc || info.area?.areaDesc || 'India',
        severity: (info.severity || 'Moderate').toLowerCase() === 'extreme' ? 'severe'
                : (info.severity || 'Moderate').toLowerCase() === 'severe'  ? 'severe'
                : (info.severity || 'Moderate').toLowerCase() === 'moderate' ? 'caution'
                : 'info',
        source: 'NDMA Sachet'
      };
    });
    
    ALERTS_CACHE.data = alerts;
    ALERTS_CACHE.timestamp = now;
    
    res.json([...formattedManagerAlerts, ...alerts]);
  } catch (err) {
    console.error("[NDMA API] Feed fetch failed:", err.message);
    ALERTS_CACHE.data = [];
    ALERTS_CACHE.timestamp = now;
    res.json(formattedManagerAlerts);
  }
});

// --- FORECAST ACCURACY TRACKER (REAL SNAPSHOT SYSTEM) ---
const SNAPSHOT_FILE = join(__dirname, 'forecast_snapshots.json');
const ACCURACY_LOG_FILE = join(__dirname, 'accuracy_log.json');

// Load snapshot and log files from disk (persist across restarts)
let forecastSnapshots = [];
let accuracyLog = [];
try { forecastSnapshots = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf8')); } catch (e) { forecastSnapshots = []; }
try { accuracyLog = JSON.parse(fs.readFileSync(ACCURACY_LOG_FILE, 'utf8')); } catch (e) { accuracyLog = []; }

const saveSnapshots = () => { try { fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(forecastSnapshots, null, 2)); } catch (e) {} };
const saveAccuracyLog = () => { try { fs.writeFileSync(ACCURACY_LOG_FILE, JSON.stringify(accuracyLog, null, 2)); } catch (e) {} };

// Called internally to record today's forecast for a location
function recordForecastSnapshot(locationName, lat, lng, forecastMaxTemp, forecastPrecipProb) {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  // Avoid duplicate snapshots for same location + date
  const exists = forecastSnapshots.find(s => s.location === locationName && s.forecastDate === tomorrow);
  if (!exists && forecastMaxTemp != null) {
    forecastSnapshots.push({
      location: locationName,
      lat, lng,
      snapshotDate: today,
      forecastDate: tomorrow,
      predictedMaxTemp: forecastMaxTemp,
      predictedPrecipProb: forecastPrecipProb,
    });
    // Keep only last 30 snapshots per location
    if (forecastSnapshots.length > 200) forecastSnapshots = forecastSnapshots.slice(-200);
    saveSnapshots();
  }
}

// Called internally to verify yesterday's snapshots against Open-Meteo archive
async function verifyPendingSnapshots() {
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const pending = forecastSnapshots.filter(s => s.forecastDate === yesterday && !accuracyLog.find(l => l.location === s.location && l.date === yesterday));
  
  for (const snap of pending) {
    try {
      const archiveUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${snap.lat}&longitude=${snap.lng}&start_date=${yesterday}&end_date=${yesterday}&daily=temperature_2m_max,precipitation_probability_max&timezone=auto`;
      const r = await fetch(archiveUrl);
      if (!r.ok) continue;
      const j = await r.json();
      if (!j.daily) continue;
      const actualTemp = j.daily.temperature_2m_max?.[0];
      const actualPrecip = j.daily.precipitation_probability_max?.[0];
      if (actualTemp == null) continue;
      const tempDiff = Math.abs(snap.predictedMaxTemp - actualTemp);
      const status = tempDiff < 1.5 ? 'accurate' : tempDiff <= 3 ? 'close' : 'off';
      accuracyLog.push({
        location: snap.location,
        date: yesterday,
        predictedTemp: snap.predictedMaxTemp,
        actualTemp: parseFloat(actualTemp.toFixed(1)),
        predictedRainProb: snap.predictedPrecipProb,
        actualRainProb: actualPrecip != null ? Math.round(actualPrecip) : null,
        tempDiff: parseFloat(tempDiff.toFixed(1)),
        accuracyStatus: status,
        isSample: false,
      });
    } catch (e) { /* archive unavailable for this entry */ }
  }
  if (accuracyLog.length > 200) accuracyLog = accuracyLog.slice(-200);
  saveAccuracyLog();
}

app.get('/api/accuracy', async (req, res) => {
  const { location } = req.query;
  const now = new Date();

  // Verify any unverified yesterday snapshots first
  try { await verifyPendingSnapshots(); } catch (e) {}

  // Filter real log entries by location (if specified)
  let realData = location
    ? accuracyLog.filter(l => l.location && l.location.toLowerCase().includes(location.toLowerCase()))
    : accuracyLog;

  // Sort descending
  realData = [...realData].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 7);

  res.json({
    location: location || 'Global',
    trackingStartedAt: now.toISOString(),
    data: realData,
    message: realData.length === 0
      ? 'Accuracy tracking started. Data will appear after the first 24 hours of operation.'
      : undefined,
  });
});

app.post('/api/chat', async (req, res) => {
  const { message, language, weatherData, history = [], profile = 'general' } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (!geminiKey && !groqKey) {
    return res.status(500).json({ error: 'No AI API key configured. Add GEMINI_API_KEY or GROQ_API_KEY to .env file.' });
  }

  // Select the active API — prefer GROQ (no quota limits on free tier), fall back to Gemini
  const useGroq = !!groqKey;
  const apiKey = useGroq ? groqKey : geminiKey;
  const apiBase = useGroq
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
  // qwen3.8-27b supports function/tool calling; groq/compound does not
  const apiModel = useGroq ? 'qwen/qwen3.8-27b' : 'gemini-3.6-flash';

  let finalContent = null;

  try {
    // ---------------------------------------------------------
    // PRIMARY STRATEGY: FUNCTION CALLING LOOP
    // ---------------------------------------------------------
    let localContext = '';
    const locNameLower = (weatherData?.location || '').toLowerCase();
    
    if (locNameLower.includes('betul')) {
      localContext = '\n[LOCAL GEOGRAPHY (BETUL): Tapti and Machna rivers originate near Betul in the Satpura range. Mention river conditions or tribal agriculture (Soyabean, Maize) if relevant to the query.]';
    } else if (locNameLower.includes('ujjain')) {
      localContext = '\n[LOCAL GEOGRAPHY (UJJAIN): Located on the banks of the Kshipra river. Mention Kshipra river water levels and Malwa plateau agricultural impact if relevant.]';
    } else if (locNameLower.includes('indore')) {
      localContext = '\n[LOCAL GEOGRAPHY (INDORE): Located near Khan and Saraswati rivers in Malwa plateau. Mention urban heat island effect or local crop conditions.]';
    } else if (locNameLower.includes('guwahati') || locNameLower.includes('assam')) {
      localContext = '\n[LOCAL GEOGRAPHY (ASSAM): Brahmaputra river dominates the landscape. Flood risks and tea garden impacts are highly relevant.]';
    }
    
    const locHint = weatherData?.location ? `\n(Hint: The user's location is generally ${weatherData.location}${weatherData.state ? ', ' + weatherData.state : ''}. Use tools to fetch precise data if needed.)${localContext}` : '';
    const initialUserPrompt = `User question (language: ${language}): "${message}"${locHint}`;

    let messages = [
      { role: 'system', content: SYSTEM_PROMPT + `\n\nActive User Profile: ${profile.toUpperCase()}` },
      ...history,
      { role: 'user', content: initialUserPrompt }
    ];

    let loopCount = 0;
    const MAX_LOOPS = 3; 
    let lastWeatherData = null;

    if (req.body.forceLegacy) {
      throw new Error('Forced legacy bypass for testing.');
    }

    while (loopCount < MAX_LOOPS) {
      const response = await fetchWithRetry(apiBase, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: apiModel,
          messages: messages,
          tools: WEATHER_TOOLS,
          tool_choice: 'auto',
          temperature: 0.7,
          max_tokens: 1024
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error during tool loop: ${response.status} ${await response.text()}`);
      }

      const data = await response.json();
      const responseMessage = data?.choices?.[0]?.message;

      console.log(`[DEBUG] Loop ${loopCount} responseMessage:`, JSON.stringify(responseMessage));

      if (!responseMessage) {
        throw new Error('Empty response from AI');
      }

      // Check if the model wants to call tools
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        messages.push(responseMessage); // Add assistant's tool request to history

        // Execute each tool concurrently
        const toolPromises = responseMessage.tool_calls.map(async (tc) => {
          const funcName = tc.function.name;
          let resultData;
          try {
            const args = JSON.parse(tc.function.arguments);
            console.log(`[TOOL CALLED] ${funcName} with args:`, args);
            if (funcName === 'get_current_weather') {
               resultData = await get_current_weather(args);
               lastWeatherData = { locationName: args.location, ...resultData };
            }
            else if (funcName === 'get_forecast') {
              resultData = await get_forecast(args);
              // Record snapshot for accuracy tracking (day 1 = tomorrow)
              if (args.daysAhead === 1 && resultData && !resultData.error) {
                try {
                  const locData = await import('./src/services/weatherApi.js').then(m => m.geocodeLocation(args.location, 'en'));
                  if (locData) await recordForecastSnapshot(args.location, locData.lat, locData.lng, resultData.maxTemp, resultData.precipProbMax);
                } catch (snapshotErr) { /* non-critical, skip */ }
              }
            }
            else if (funcName === 'get_historical_trend') resultData = await get_historical_trend(args);
            else if (funcName === 'get_seasonal_comparison') resultData = await get_seasonal_comparison(args);
            else if (funcName === 'get_active_alerts') resultData = await get_active_alerts(args);
            else if (funcName === 'get_marine_weather') resultData = await get_marine_weather(args);
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
        if (!finalContent) {
           console.log('AI RETURNED EMPTY CONTENT. Full response:', JSON.stringify(responseMessage));
        }
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

      const fallbackRes = await fetchWithRetry(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: apiModel,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT + `\n\nActive User Profile: ${profile.toUpperCase()}\n\nCRITICAL INSTRUCTION: DO NOT CALL ANY TOOLS. You are in fallback mode. Answer the user directly using the provided Current weather data (Fallback).` },
            ...history,
            { role: 'user', content: fallbackPrompt }
          ],
          temperature: 0.7,
          max_tokens: 1024
        }),
      });

      if (!fallbackRes.ok) {
        console.error(`[DEBUG] Fallback failed. Status: ${fallbackRes.status} Text:`, await fallbackRes.text());
        return res.status(502).json({ error: 'Weather AI is temporarily unavailable. Try again in a moment.' });
      }

      const fallbackData = await fallbackRes.json();
      console.log(`[DEBUG] Fallback Data:`, JSON.stringify(fallbackData));
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
    const jsonStr = finalContent.replace(/```json\n?|\n?```/g, '').trim();
    const finalJson = JSON.parse(jsonStr);

    // --- SERVER-SIDE CONFIDENCE CALCULATION ---
    const contextData = lastWeatherData || weatherData;
    finalJson.confidence = calculateConfidence(contextData);
    // ------------------------------------------

      // Fallback for missing suggested questions
      if (!Array.isArray(finalJson.suggestedQuestions) || finalJson.suggestedQuestions.length === 0) {
        const lang = req.body.language || 'en';
        if (lang === 'hi') {
          finalJson.suggestedQuestions = ['आने वाले दिनों का मौसम कैसा रहेगा?', 'क्या कोई अलर्ट है?'];
        } else if (lang === 'bn') {
          finalJson.suggestedQuestions = ['আগামী কয়েকদিনের আবহাওয়া কেমন থাকবে?', 'কোনো সতর্কতা আছে কি?'];
        } else if (lang === 'as') {
          finalJson.suggestedQuestions = ['অহা কেইদিনমানৰ বতৰ কেনেকুৱা হ’ব?', 'কিবা সতৰ্কবাণী আছে নেকি?'];
        } else {
          finalJson.suggestedQuestions = ['What is the forecast for tomorrow?', 'Are there any active alerts?'];
        }
      }
    
    // Forcefully remove temperature from relevantStat to prevent UI duplication
    if (finalJson.relevantStat) {
      const statLower = finalJson.relevantStat.toLowerCase();
      if (statLower.includes('temp') || statLower.includes('तापमान') || statLower.includes('°c') || statLower.includes('° c')) {
        finalJson.relevantStat = '';
      }
    }

    if (lastWeatherData) {
       finalJson.weatherData = lastWeatherData;
    }
    return res.json(finalJson);
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
      suggestedQuestions: req.body.language === 'hi' ? ['आने वाले दिनों का मौसम कैसा रहेगा?'] : req.body.language === 'bn' ? ['আগামী কয়েকদিনের আবহাওয়া কেমন থাকবে?'] : req.body.language === 'as' ? ['অহা কেইদিনমানৰ বতৰ কেনেকুৱা হ’ব?'] : ['What is the forecast for tomorrow?', 'Are there any active alerts?'],
    });
  }
});

// GET /api/news
// Fetches real-time weather & disaster news for India via Google News RSS

// GET /api/national-alerts
// Uses Gemini to determine current top 3 high-risk states in India realistically
app.get('/api/national-alerts', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.json([{ state: "Assam", level: "High" }, { state: "West Bengal", level: "High" }, { state: "Bihar", level: "Moderate" }]);

    const response = await fetchWithRetry('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gemini-3.6-flash',
        messages: [{
          role: 'system',
          content: 'You are a meteorologist. Output ONLY a valid JSON array of the 3 Indian states with the highest weather risks today based on current season/events. Each object must have: "state" (string), "level" (must be "Severe", "High", or "Moderate"). No markdown, no other text.'
        }],
        temperature: 0.1
      })
    });
    
    if (!response.ok) throw new Error('API failed');
    const data = await response.json();
    let content = data.choices[0].message.content.replace(/```json\n?|\n?```/g, '').trim();
    res.json(JSON.parse(content));
  } catch (err) {
    console.error('National alerts error:', err);
    res.json([{ state: "Assam", level: "High" }, { state: "West Bengal", level: "High" }, { state: "Bihar", level: "Moderate" }]);
  }
});

// POST /api/tts
// Uses Google TTS to generate high-quality audio buffers for any language

// POST /api/confidence
// Exposes the server-side calculation for the frontend dashboard
app.post("/api/confidence", (req, res) => {
  const { contextData } = req.body;
  const confidence = calculateConfidence(contextData);
  res.json({ confidence });
});

app.post('/api/tts', async (req, res) => {
  const { text, lang } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });
  
  try {
    const results = await googleTTS.getAllAudioBase64(text, {
      lang: lang || 'en',
      slow: false,
      host: 'https://translate.google.com',
      splitPunct: ',.?!'
    });
    // results is an array of { shortText, base64 }
    res.json({ chunks: results.map(r => r.base64) });
  } catch (err) {
    console.error('TTS Error:', err);
    res.status(500).json({ error: 'Failed to generate TTS' });
  }
});

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

// Serve built React frontend in production (Docker)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({ status: 'active', message: 'WeatherGPT Backend is running!' });
  });
}

// Start server on Render or local (Vercel Serverless functions do not need app.listen)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`WeatherGPT server running on port ${PORT}`);
  });
}

export default app;
