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
app.use(express.json({ limit: '10mb' }));

import http from 'http';
import { WebSocketServer } from 'ws';
import { logChatPrediction, verifyChatPredictions, getChatAccuracyFeed } from './server/chatAccuracy.js';
import { startNdmaPoller } from './server/ndmaPoller.js';
import { 
  getVapidPublicKey, 
  addSubscription, 
  removeSubscription, 
  getSubscriptionsCount, 
  sendNotificationToSub, 
  broadcastPushNotification 
} from './server/pushService.js';
import { extractLocation } from './src/services/locationExtractor.js';

// Scheduled jobs will be started later

const server = http.createServer(app);
export const wss = new WebSocketServer({ server });

// Track client heartbeat and drop broken connections
const wsHeartbeat = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(wsHeartbeat);
});

wss.on('connection', (ws, req) => {
  ws.isAlive = true;
  ws.clientLocation = null; // { lat, lng, state, district }
  ws.trackedSosIds = new Set();

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'register_location') {
        ws.clientLocation = {
          lat: typeof data.lat === 'number' ? data.lat : parseFloat(data.lat),
          lng: typeof data.lng === 'number' ? data.lng : parseFloat(data.lng),
          state: (data.state || '').toLowerCase().trim(),
          district: (data.district || '').toLowerCase().trim()
        };
        ws.send(JSON.stringify({ 
          type: 'location_ack', 
          status: 'registered', 
          lat: ws.clientLocation.lat, 
          lng: ws.clientLocation.lng 
        }));
      } else if (data.type === 'register_sos') {
        if (data.sosId) {
          ws.trackedSosIds.add(data.sosId);
          ws.send(JSON.stringify({ type: 'sos_ack', sosId: data.sosId }));
        }
      } else if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      }
    } catch (e) {
      // Ignore malformed client messages
    }
  });

  console.log('🔌 New WebSocket connection established for Live Alerts');
  ws.send(JSON.stringify({ 
    type: 'connected', 
    message: 'Connected to WeatherGPT Real-Time Disaster Alert System',
    timestamp: new Date().toISOString()
  }));
});

/**
 * Broadcast an authority alert to matching connected WebSocket clients:
 * - 'radius': Only clients within alert.radius km using haversineDistance
 * - 'district': Clients whose district matches alert.district
 * - 'state': Clients whose state matches alert.state
 * - 'all' or untargeted: Broadcast to all connected clients
 */
export function broadcastAuthorityAlert(alert) {
  const payload = JSON.stringify({
    type: 'authority_alert',
    alert: {
      id: alert.id || `mgr-${Date.now()}`,
      title: alert.title,
      description: alert.description,
      severity: alert.severity || 'severe',
      state: alert.state,
      district: alert.district,
      targetMode: alert.targetMode,
      lat: alert.lat,
      lng: alert.lng,
      radius: alert.radius,
      issuedAt: alert.issuedAt || Date.now(),
      expiresAt: alert.expiresAt || (Date.now() + 24 * 60 * 60 * 1000),
      source: alert.source || 'WeatherGPT Disaster Manager'
    }
  });

  let dispatchedCount = 0;

  wss.clients.forEach((client) => {
    if (client.readyState !== 1) return; // 1 === WebSocket.OPEN

    const loc = client.clientLocation;

    // Filter by GPS Radius
    if (alert.targetMode === 'radius' && alert.lat && alert.lng && alert.radius) {
      if (!loc || isNaN(loc.lat) || isNaN(loc.lng)) {
        // Client has not provided GPS coordinates; skip radius-specific push
        return;
      }
      const dist = haversineDistance(alert.lat, alert.lng, loc.lat, loc.lng);
      if (dist > alert.radius) {
        // Outside target radius; skip
        return;
      }
    }
    // Filter by District
    else if (alert.targetMode === 'district' && alert.district) {
      if (loc && loc.district && !loc.district.includes(alert.district.toLowerCase()) && !alert.district.toLowerCase().includes(loc.district)) {
        return;
      }
    }
    // Filter by State
    else if (alert.targetMode === 'state' && alert.state) {
      if (loc && loc.state && !loc.state.includes(alert.state.toLowerCase()) && !alert.state.toLowerCase().includes(loc.state)) {
        return;
      }
    }

    client.send(payload);
    dispatchedCount++;
  });

  console.log(`📡 [WS BROADCAST] Alert "${alert.title}" delivered to ${dispatchedCount} client(s) (Target: ${alert.targetMode})`);

  // Dispatch Web Push notification to registered mobile & desktop devices (works offline/background)
  broadcastPushNotification(alert).catch((err) => {
    console.warn('⚠️ [Push Service] Background push error:', err.message);
  });

  return dispatchedCount;
}

/**
 * Broadcast an SOS status update (dispatched, resolved)
 */
export function broadcastSosUpdate(sosId, status) {
  const payload = JSON.stringify({
    type: 'sos_status_update',
    sosId,
    status,
    updatedAt: new Date().toISOString()
  });

  let count = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(payload);
      count++;
    }
  });
  console.log(`🚑 [WS SOS UPDATE] SOS ${sosId} -> ${status} pushed to ${count} client(s)`);
  return count;
}

/**
 * Broadcast a newly received SOS incident (including offline vault flushes) to authorities
 */
export function broadcastNewSos(sos) {
  const payload = JSON.stringify({
    type: 'new_sos_alert',
    sos
  });

  let count = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(payload);
      count++;
    }
  });
  console.log(`🆘 [WS NEW SOS] Alert from "${sos.name || 'Citizen'}" pushed to ${count} client(s)`);
  return count;
}

import { 
  WEATHER_TOOLS, 
  get_current_weather, 
  get_forecast, 
  get_historical_trend, 
  get_seasonal_comparison, 
  get_active_alerts,
  get_marine_weather,
  get_climate_indices
} from './server/tools.js';

import { geocodeLocation } from './src/services/weatherApi.js';

import {
  linearTrend,
  zScoreAnomaly,
  consecutiveDryDays,
  consecutiveWetDays,
  heatwaveDays,
  extremeRainDays,
  growingDegreeDays
} from './server/climateStats.js';

import { 
  detectIndianLanguage, 
  translateToEnglish, 
  batchTranslateFromEnglish 
} from './server/bhashini.js';

import mongoose from 'mongoose';
import { Alert, Snapshot, AccuracyLog, SosRequest, CommunityReport, SmsRecipient, SmsLog, Review, UserSetting } from './server/models.js';

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
   - MANDATORY LOCATION INCLUSION: EVERY SINGLE suggested question MUST explicitly include the specific location name being discussed (e.g. "What is the forecast for tomorrow in Loktak Lake?", "Will it rain later today in Guwahati?", "Are there any active alerts in Bhopal?").
   - NEVER EVER output generic questions like "What is the forecast for tomorrow?" or "Are there any active alerts?" without the location.
   - NEVER use vague words like "here", "this area", "the city", or omit the location name. The specific location name MUST appear in EVERY suggestion.
   - Follow-ups must represent genuinely different next steps a real user would take — not just rephrasing the same question.
   - If the current answer fully resolves the query (or user said thanks), return an empty array.
   - Never repeat a question from the conversation history.
   - Each suggestion must be in the EXACT same language as the user, phrased as the user (first person).

WEATHER WIDGET CONTROL:
10. You control whether the UI displays a live weather widget. Set "showWeatherWidget" to TRUE *only* if the user's question is about current/live weather conditions or forecasting for their location. Set it to FALSE if they ask about a past event (like yesterday's flood), a general fact, or a different location entirely.

EFFICIENCY & ONE-SHOT TOOL RESOLUTION:
11. Be decisive: Call whatever tool(s) you need in parallel in your VERY FIRST turn.
12. For standard queries (e.g. "weather today", "will it rain?", "current temp", upcoming forecast), calling get_current_weather or get_forecast alone provides all the necessary temperature, rain, wind, humidity, AQI, UV, and weather codes.
13. NEVER make secondary follow-up tool calls for seasonal comparisons or historical archives unless the user explicitly asked about past climate records or historical trends.
14. Once you receive your tool results, immediately output the final JSON response in that turn. Do NOT loop for additional data.

RESPOND ONLY IN THIS EXACT JSON FORMAT, no markdown fences:
{
  "answer": "Detailed, easy-to-understand, conversational answer with actionable advice.",
  "followUp": "Optional seasonal comparison or anomaly note, or empty string.",
  "relevantStat": "Single most relevant data point as a short label (e.g. 'RAIN: 0 MM', 'HUMIDITY: 80%'). DO NOT include Temperature here, as it is already shown in the UI.",
  "advisory": "Plain-language advisory with concrete action if conditions warrant caution, or empty string.",
  "severity": "none or caution or severe",
  "confidence": "high | medium | low",
  "showWeatherWidget": true,
  "suggestedQuestions": ["What is the 3-day forecast in [Location]?", "Are there any active alerts in [Location]?"]
}`;

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function fetchWithRetry(url, options, maxRetries = 2) {
  for (let i = 0; i < maxRetries; i++) {
    const fetchOpts = { ...options, signal: AbortSignal.timeout(15000) };
    const response = await fetch(url, fetchOpts);
    if (response.status === 429) {
      console.warn(`[429 Rate Limit] TPM limit hit. Waiting 2 seconds before retry (Attempt ${i + 1}/${maxRetries})...`);
      await sleep(2000);
      continue;
    }
    return response;
  }
  return fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
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

  // Instantly broadcast over WebSocket to matching clients (GPS-radius or state/district filtered)
  try {
    broadcastAuthorityAlert(alert);
  } catch (err) {
    console.warn('[WS BROADCAST ERROR]', err.message);
  }

  res.json(alert);
});

app.delete("/api/manager/alerts/:id", verifyToken, (req, res) => {
  const alertId = req.params.id;
  managerAlerts = managerAlerts.filter(a => a.id !== alertId);
  saveAlerts();

  // Broadcast dismissal event so client UI can remove the banner
  try {
    const payload = JSON.stringify({ type: 'authority_alert_dismissed', alertId });
    wss.clients.forEach((client) => {
      if (client.readyState === 1) client.send(payload);
    });
  } catch (err) { /* non-critical */ }

  res.json({ success: true });
});

// --- SOS EMERGENCY RESPONSE ROUTES ---
let sosFallback = [];
let communityReportsFallback = [];
export let smsRecipientsFallback = [
  { id: 'sim1', phone: '+919876543210', name: 'Ramesh Kumar', district: 'Kamrup', state: 'Assam', language: 'Assamese', registeredAt: new Date() },
  { id: 'sim2', phone: '+919123456789', name: 'Priya Singh', district: 'Kamrup', state: 'Assam', language: 'Hindi', registeredAt: new Date() },
  { id: 'sim3', phone: '+918765432109', name: 'Abdul Rahman', district: 'Mumbai Suburban', state: 'Maharashtra', language: 'Hindi', registeredAt: new Date() },
  { id: 'sim4', phone: '+917654321098', name: 'Sunita Devi', district: 'Patna', state: 'Bihar', language: 'Hindi', registeredAt: new Date() },
  { id: 'sim5', phone: '+916543210987', name: 'Tapas Mondal', district: 'South 24 Parganas', state: 'West Bengal', language: 'Bengali', registeredAt: new Date() },
  { id: 'sim6', phone: '+915432109876', name: 'Kiran Das', district: 'Kamrup', state: 'Assam', language: 'Bengali', registeredAt: new Date() },
  { id: 'sim7', phone: '+914321098765', name: 'John Doe', district: 'Kamrup', state: 'Assam', language: 'English', registeredAt: new Date() },
];
export let smsLogsFallback = [];

// --- REVIEWS API ---
app.get('/api/reviews', async (req, res) => {
  try {
    if (USE_MONGODB) {
      const reviews = await Review.find().sort({ createdAt: -1 });
      res.json(reviews);
    } else {
      res.json([]);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const reviewsData = req.body; // Can be an array or single
    if (USE_MONGODB) {
      if (Array.isArray(reviewsData)) {
        for (const review of reviewsData) {
          await Review.findOneAndUpdate({ id: review.id }, review, { upsert: true, new: true });
        }
      } else {
        await Review.findOneAndUpdate({ id: reviewsData.id }, reviewsData, { upsert: true, new: true });
      }
      res.json({ success: true });
    } else {
      res.json({ success: false, message: 'No MongoDB' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- AAWAZ-E-MAUSAM TTS AUDIO SYNTHESIS API ---
app.post('/api/tts', async (req, res) => {
  try {
    const { text, lang = 'hi' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for TTS synthesis' });
    }

    const langCodeMap = {
      hi: 'hi',
      en: 'en',
      bn: 'bn',
      as: 'bn', // Google TTS uses Bengali phonetic engine for Assamese text
      mr: 'mr',
      ta: 'ta',
      te: 'te',
      gu: 'gu',
      kn: 'kn',
      ml: 'ml',
      pa: 'pa',
      ur: 'ur'
    };
    const targetLang = langCodeMap[lang] || 'hi';

    const audioList = await googleTTS.getAllAudioBase64(text, {
      lang: targetLang,
      slow: false,
      host: 'https://translate.google.com',
      timeout: 10000,
    });

    res.json({
      success: true,
      audioChunks: audioList.map(item => item.base64),
      lang: targetLang
    });
  } catch (error) {
    console.error('❌ [TTS API ERROR]:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// --- SETTINGS API ---
const SETTINGS_FILE = join(__dirname, "user_settings.json");
let localUserSettings = {};
try {
  if (fs.existsSync(SETTINGS_FILE)) {
    localUserSettings = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
  }
} catch (e) {
  console.error("Failed to load user settings file:", e);
}

const saveLocalSettings = () => {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(localUserSettings, null, 2));
  } catch (e) {
    console.error("Failed to save user settings file:", e);
  }
};

app.get('/api/settings/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    if (USE_MONGODB) {
      const settings = await UserSetting.findOne({ userId });
      if (settings) {
        return res.json(settings);
      }
    }
    const fallback = localUserSettings[userId] || {};
    res.json(fallback);
  } catch (error) {
    const fallback = localUserSettings[req.params.userId] || {};
    res.json(fallback);
  }
});

app.post('/api/settings/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const data = { ...req.body, userId, updatedAt: new Date() };

    localUserSettings[userId] = {
      ...(localUserSettings[userId] || {}),
      ...data
    };
    saveLocalSettings();

    if (USE_MONGODB) {
      try {
        const settings = await UserSetting.findOneAndUpdate(
          { userId },
          data,
          { upsert: true, new: true }
        );
        return res.json(settings);
      } catch (dbErr) {
        console.error("MongoDB setting update warning, used file fallback:", dbErr.message);
      }
    }

    res.json(localUserSettings[userId]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/community-reports?location=X — returns reports for a location, newest first, capped at 20
app.get('/api/community-reports', async (req, res) => {
  const { location } = req.query;
  if (!location) return res.status(400).json({ error: 'location query param required' });
  if (USE_MONGODB) {
    try {
      const reports = await CommunityReport.find({ location: { $regex: location, $options: 'i' } })
        .sort({ createdAt: -1 }).limit(20);
      return res.json(reports);
    } catch (e) { return res.status(500).json({ error: 'DB error' }); }
  } else {
    const filtered = communityReportsFallback
      .filter(r => r.location.toLowerCase().includes(location.toLowerCase()))
      .slice(0, 20);
    return res.json(filtered);
  }
});

// POST /api/community-reports — save a new report, return the saved document
app.post('/api/community-reports', async (req, res) => {
  const { location, lat, lng, condition, intensity, desc, userName } = req.body;
  if (!location || !condition || !intensity) {
    return res.status(400).json({ error: 'location, condition, and intensity are required' });
  }
  const entry = {
    location,
    lat: lat || null,
    lng: lng || null,
    condition,
    intensity,
    desc: desc || '',
    userName: userName || 'Anonymous',
    verified: false,
    createdAt: new Date()
  };
  if (USE_MONGODB) {
    try {
      const saved = await CommunityReport.create(entry);
      return res.json(saved);
    } catch (e) { return res.status(500).json({ error: 'Failed to save report' }); }
  } else {
    entry.id = 'cr-' + Date.now();
    communityReportsFallback.unshift(entry);
    return res.json(entry);
  }
});

// POST /api/sos — Public: citizen sends GPS + message
app.post("/api/sos", async (req, res) => {
  const { name, phone, message, lat, lng, helpType, image, locationSource, locationNote, isOfflineVault } = req.body;
  const numLat = Number(lat);
  const numLng = Number(lng);
  if (isNaN(numLat) || isNaN(numLng)) return res.status(400).json({ error: "Location coordinates are required" });

  const isOffline = isOfflineVault || 
    (typeof locationNote === 'string' && locationNote.toLowerCase().includes('offline')) || 
    (typeof message === 'string' && message.includes('Offline Vault')) ||
    (typeof locationSource === 'string' && (locationSource.includes('cached') || locationSource.includes('default') || locationSource.includes('offline')));

  const resolvedNote = locationNote || (isOffline ? 'Offline Device Cache' : `Live Coordinates (${numLat.toFixed(4)}°, ${numLng.toFixed(4)}°)`);

  const entry = { 
    name: name || 'Anonymous', 
    phone: phone || '', 
    message: message || '', 
    lat: numLat, 
    lng: numLng, 
    helpType: helpType || 'General Emergency',
    image: image || null,
    locationSource: locationSource || (isOffline ? 'offline_vault' : 'live_gps'),
    locationNote: resolvedNote,
    isOfflineVault: Boolean(isOffline),
    status: 'pending', 
    timestamp: new Date() 
  };
  if (USE_MONGODB) {
    try { 
      const saved = await SosRequest.create(entry);
      const sosData = { ...entry, _id: saved._id, id: saved._id.toString() };
      broadcastNewSos(sosData);
      return res.json({ success: true, id: saved._id, sos: sosData }); 
    }
    catch (e) { 
      console.error("Failed to save SOS in MongoDB:", e);
      return res.status(500).json({ error: "Failed to save SOS" }); 
    }
  } else {
    entry.id = 'sos-' + Date.now();
    sosFallback.push(entry);
    broadcastNewSos(entry);
    return res.json({ success: true, id: entry.id, sos: entry });
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
    try { 
      await SosRequest.findByIdAndUpdate(req.params.id, { status }); 
      broadcastSosUpdate(req.params.id, status);
      return res.json({ success: true }); 
    }
    catch (e) { return res.status(500).json({ error: "DB Error" }); }
  } else {
    const sos = sosFallback.find(s => s.id === req.params.id);
    if (sos) sos.status = status;
    broadcastSosUpdate(req.params.id, status);
    return res.json({ success: true });
  }
});

// --- SMS SIMULATOR ROUTES ---

// 1. Get registry (filter by state/district)
app.get('/api/sms/registry', async (req, res) => {
  const { state, district } = req.query;
  try {
    let users = [];
    if (USE_MONGODB) {
      const query = {};
      if (state) query.state = state;
      if (district) query.district = district;
      users = await SmsRecipient.find(query).sort({ registeredAt: -1 });
    } else {
      users = smsRecipientsFallback.filter(u => {
        let match = true;
        if (state && u.state !== state) match = false;
        if (district && u.district !== district) match = false;
        return match;
      });
    }
    res.json(users);
  } catch (err) { res.status(500).json({ error: 'DB Error' }); }
});

// 2. Register new number
app.post('/api/sms/register', async (req, res) => {
  const { phone, name, district, state, language, category, village, pincode } = req.body;
  const entry = { id: Date.now().toString(), phone, name, district, state, language, category, village, pincode, registeredAt: new Date() };
  try {
    if (USE_MONGODB) {
      await new SmsRecipient(entry).save();
    } else {
      smsRecipientsFallback.unshift(entry);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'DB Error' }); }
});

// 3. Send/Simulate SMS Broadcast
app.post('/api/sms/send', async (req, res) => {
  const { alertId, title, description, recipients } = req.body;
  if (!recipients || !Array.isArray(recipients)) return res.status(400).json({ error: 'No recipients provided' });

  // Fallback translated templates (if AI fails or for speed)
  const templates = {
    'English': `WEATHERGPT ALERT: ${title}. ${description.substring(0, 80)}... Take precautions.`,
    'Hindi': `चेतावनी: ${title}. ${description.substring(0, 60)}... सुरक्षित रहें।`,
    'Bengali': `সতর্কতা: ${title}. ${description.substring(0, 60)}... নিরাপদে থাকুন।`,
    'Assamese': `সতৰ্কতা: ${title}. ${description.substring(0, 60)}... সাৱধানে থাকক।`
  };
  
  const logs = recipients.map(r => ({
    id: Math.random().toString(36).substring(7),
    alertId,
    phone: r.phone,
    name: r.name,
    message: templates[r.language] || templates['English'],
    language: r.language,
    status: 'delivered',
    sentAt: new Date()
  }));

  try {
    if (USE_MONGODB) {
      await SmsLog.insertMany(logs);
    } else {
      smsLogsFallback.push(...logs);
    }
    res.json({ success: true, logs });
  } catch (err) { res.status(500).json({ error: 'DB Error' }); }
});

// ==================================================================
// MAPPLS (MAPMYINDIA) & NOMINATIM GEOLOCATION PROXY SERVICE
// Covers small villages, tehsils, and districts across India
// ==================================================================
const LOCATION_SEARCH_CACHE = new Map();
const LOC_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_LOC_CACHE_ENTRIES = 500;

function getCachedLocation(key) {
  const entry = LOCATION_SEARCH_CACHE.get(key);
  if (entry && (Date.now() - entry.timestamp) < LOC_CACHE_TTL) {
    return entry.data;
  }
  return null;
}

function setCachedLocation(key, data) {
  if (LOCATION_SEARCH_CACHE.size >= MAX_LOC_CACHE_ENTRIES) {
    const oldestKey = LOCATION_SEARCH_CACHE.keys().next().value;
    LOCATION_SEARCH_CACHE.delete(oldestKey);
  }
  LOCATION_SEARCH_CACHE.set(key, { data, timestamp: Date.now() });
}

let mapplsTokenCache = { token: null, expiresAt: 0 };

async function getMapplsToken() {
  const apiKey = process.env.MAPPLS_API_KEY;
  const clientId = process.env.MAPPLS_CLIENT_ID;
  const clientSecret = process.env.MAPPLS_CLIENT_SECRET;

  if (apiKey && !clientId) {
    return apiKey;
  }

  if (clientId && clientSecret) {
    if (mapplsTokenCache.token && Date.now() < mapplsTokenCache.expiresAt - 60000) {
      return mapplsTokenCache.token;
    }
    try {
      const tokenRes = await fetch('https://outpost.mappls.com/api/security/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret
        }),
        signal: AbortSignal.timeout(3500)
      });
      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        if (tokenData.access_token) {
          mapplsTokenCache = {
            token: tokenData.access_token,
            expiresAt: Date.now() + ((tokenData.expires_in || 86400) * 1000)
          };
          return mapplsTokenCache.token;
        }
      }
    } catch (err) {
      console.warn('[MAPPLS OAUTH NOTICE] OAuth token fetch failed:', err.message);
    }
  }

  return apiKey || null;
}

async function searchMappls(query) {
  const token = await getMapplsToken();
  if (!token) return null;

  try {
    // 1. Search via Mappls AutoSuggest / Search API
    const url = `https://atlas.mappls.com/api/places/search/json?query=${encodeURIComponent(query)}&region=ind`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
      signal: AbortSignal.timeout(3500)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.suggestedLocations && data.suggestedLocations.length > 0) {
        const results = [];
        for (const loc of data.suggestedLocations.slice(0, 6)) {
          let lat = parseFloat(loc.latitude);
          let lng = parseFloat(loc.longitude);

          // If coordinates are missing, attempt eLoc lookup
          if ((isNaN(lat) || isNaN(lng)) && loc.eLoc) {
            try {
              const elocRes = await fetch(`https://atlas.mappls.com/api/places/eloc/${loc.eLoc}`, {
                headers: { 'Authorization': `Bearer ${token}` },
                signal: AbortSignal.timeout(2000)
              });
              if (elocRes.ok) {
                const elocData = await elocRes.json();
                lat = parseFloat(elocData.latitude);
                lng = parseFloat(elocData.longitude);
              }
            } catch (e) { /* non-critical */ }
          }

          if (!isNaN(lat) && !isNaN(lng)) {
            const addrParts = (loc.placeAddress || '').split(',').map(s => s.trim());
            const state = addrParts.length >= 2 ? addrParts[addrParts.length - 2] : '';
            const district = addrParts.length >= 3 ? addrParts[addrParts.length - 3] : '';

            results.push({
              lat,
              lng,
              name: loc.placeName || loc.poi || query,
              district: district || '',
              state: state || '',
              country: 'India',
              source: 'mappls'
            });
          }
        }
        if (results.length > 0) return results;
      }
    }

    // 2. Fallback to Mappls Geocode API if AutoSuggest didn't resolve
    const geoUrl = `https://atlas.mappls.com/api/places/geocode?address=${encodeURIComponent(query)}&region=ind`;
    const geoRes = await fetch(geoUrl, {
      headers: { 'Authorization': `Bearer ${token}` },
      signal: AbortSignal.timeout(3500)
    });

    if (geoRes.ok) {
      const geoData = await geoRes.json();
      if (geoData.copResults && geoData.copResults.length > 0) {
        return geoData.copResults.map(r => ({
          lat: parseFloat(r.latitude),
          lng: parseFloat(r.longitude),
          name: r.village || r.subDistrict || r.locality || r.city || r.district || query,
          district: r.district || r.subDistrict || '',
          state: r.state || '',
          country: 'India',
          source: 'mappls'
        })).filter(r => !isNaN(r.lat) && !isNaN(r.lng));
      }
    }
  } catch (err) {
    console.warn('[MAPPLS NOTICE] Mappls search unavailable, falling back to OSM:', err.message);
  }
  return null;
}

async function searchNominatimFallback(query, lang = 'en') {
  const results = [];

  // 1. Nominatim (OpenStreetMap) strictly for India with Address Details (Villages, Tehsils, Districts)
  try {
    const nomRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&countrycodes=in&accept-language=${lang}&addressdetails=1`,
      {
        headers: { 'User-Agent': 'WeatherGPT-SIH2026/1.0 (weathergpt.sih2026@gmail.com)' },
        signal: AbortSignal.timeout(3500)
      }
    );
    if (nomRes.ok) {
      const data = await nomRes.json();
      if (Array.isArray(data)) {
        data.forEach(r => {
          const lat = parseFloat(r.lat);
          const lng = parseFloat(r.lon);
          if (!isNaN(lat) && !isNaN(lng)) {
            const addr = r.address || {};
            const rawName = r.name || addr.village || addr.town || addr.city || addr.suburb || r.display_name.split(',')[0].trim();
            const district = addr.state_district || addr.county || addr.district || '';
            const state = addr.state || '';
            results.push({ lat, lng, name: rawName, district, state, country: 'India', source: 'nominatim' });
          }
        });
      }
    }
  } catch (err) {
    console.warn('[NOMINATIM NOTICE] Nominatim search timed out or error:', err.message);
  }

  // 2. Open-Meteo Geocoding to supplement if results are sparse
  if (results.length < 3) {
    try {
      const omRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=${lang}`,
        { signal: AbortSignal.timeout(3500) }
      );
      if (omRes.ok) {
        const omData = await omRes.json();
        if (omData.results) {
          const indiaOnly = omData.results.filter(r => r.country_code === 'IN' || r.country === 'India');
          indiaOnly.forEach(r => {
            const duplicate = results.some(ex => Math.abs(ex.lat - r.latitude) < 0.05 && Math.abs(ex.lng - r.longitude) < 0.05);
            if (!duplicate) {
              results.push({
                lat: r.latitude,
                lng: r.longitude,
                name: r.name,
                district: r.admin2 || '',
                state: r.admin1 || '',
                country: 'India',
                source: 'open-meteo'
              });
            }
          });
        }
      }
    } catch (err) {
      console.warn('[OPEN-METEO NOTICE] Open-Meteo search error:', err.message);
    }
  }

  return results;
}

// API endpoint: Multi-source location autocomplete for India
app.get('/api/location/search', async (req, res) => {
  try {
    const query = (req.query.query || req.query.q || '').trim();
    const lang = req.query.lang || 'en';
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const cacheKey = `${query.toLowerCase()}_${lang}`;
    const cached = getCachedLocation(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // 1. Primary: Mappls (MapmyIndia)
    let results = await searchMappls(query);

    // 2. Secondary: Nominatim + Open-Meteo Fallback
    if (!results || results.length === 0) {
      results = await searchNominatimFallback(query, lang);
    }

    // Deduplicate by spatial proximity (~5km)
    const uniqueResults = [];
    for (const item of results) {
      const exists = uniqueResults.some(
        u => Math.abs(u.lat - item.lat) < 0.05 && Math.abs(u.lng - item.lng) < 0.05
      );
      if (!exists) {
        uniqueResults.push(item);
      }
    }

    const finalResults = uniqueResults.slice(0, 8);
    if (finalResults.length > 0) {
      setCachedLocation(cacheKey, finalResults);
    }

    res.json(finalResults);
  } catch (err) {
    console.error('[LOCATION SEARCH ROUTE ERROR]', err);
    res.json([]); // Fail-safe: Always return empty list on route error, never crash
  }
});

// API endpoint: Single location geocoder for tools & backend
app.get('/api/location/geocode', async (req, res) => {
  try {
    const query = (req.query.location || req.query.query || req.query.q || '').trim();
    const lang = req.query.lang || 'en';
    if (!query) return res.status(400).json({ error: 'Location required' });

    const cacheKey = `geo_${query.toLowerCase()}_${lang}`;
    const cached = getCachedLocation(cacheKey);
    if (cached) return res.json(cached);

    let results = await searchMappls(query);
    if (!results || results.length === 0) {
      results = await searchNominatimFallback(query, lang);
    }

    if (results && results.length > 0) {
      setCachedLocation(cacheKey, results[0]);
      return res.json(results[0]);
    }
    return res.status(404).json({ error: 'Location not found' });
  } catch (err) {
    res.status(500).json({ error: 'Geocoding service error' });
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
      return res.json(formattedManagerAlerts);
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

app.get('/api/chat-accuracy', async (req, res) => {
  try {
    const feed = await getChatAccuracyFeed(req.query.location);
    res.json(feed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chat accuracy feed' });
  }
});

app.post('/api/chat', async (req, res) => {
  const { message, language, weatherData, history = [], profile = 'general' } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (!geminiKey && !groqKey) {
    return res.status(500).json({ error: 'No AI API key configured. Add GEMINI_API_KEY or GROQ_API_KEY to .env file.' });
  }

  // --- BHASHINI LANGUAGE AUTO-DETECTION & PRE-TRANSLATION ---
  const rawLang = language || 'en';
  const detectedLang = detectIndianLanguage(message, rawLang);
  const targetLanguage = (rawLang !== 'en') ? rawLang : detectedLang;

  // Skip translation for English and Hindi (both reliably supported natively in prompt)
  const isRegionalLang = targetLanguage !== 'en' && targetLanguage !== 'hi';

  let englishQuery = message;
  if (isRegionalLang) {
    try {
      englishQuery = await translateToEnglish(message, targetLanguage);
      console.log(`🌐 [BHASHINI NMT] Translated query (${targetLanguage} -> en): "${message}" -> "${englishQuery}"`);
    } catch (nmtErr) {
      console.warn('[BHASHINI NMT NOTICE] Pre-translation skipped:', nmtErr.message);
    }
  }

  // Select the active API — prefer GROQ (no quota limits on free tier), fall back to Gemini
  const useGroq = false; // Forcing Gemini permanently because Groq's 8K TPM / 200K TPD limit is being repeatedly hit
  const apiKey = useGroq ? groqKey : geminiKey;
  const apiBase = useGroq
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
  
  // Use a currently supported Groq model that supports tool calling
  const apiModel = useGroq ? 'openai/gpt-oss-20b' : 'gemini-2.5-flash';

  let finalContent = null;
  let lastWeatherData = null;
  let toolLocation = null;

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
    const initialUserPrompt = isRegionalLang
      ? `User question (translated to English for accurate tool-calling from ${targetLanguage}): "${englishQuery}"\n(Original native script query: "${message}")${locHint}\nIMPORTANT: Answer in clear English using the required JSON schema; the system will translate your response back to ${targetLanguage}.`
      : `User question (language: ${targetLanguage}): "${message}"${locHint}`;

    let messages = [
      { role: 'system', content: SYSTEM_PROMPT + `\n\nActive User Profile: ${profile.toUpperCase()}` },
      ...history,
      { role: 'user', content: initialUserPrompt }
    ];

    let loopCount = 0;
    const MAX_LOOPS = 2; 

    if (req.body.forceLegacy) {
      throw new Error('Forced legacy bypass for testing.');
    }

    while (loopCount < MAX_LOOPS) {
      let response;
      try {
        response = await fetchWithRetry(apiBase, {
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
      } catch (e) {
        console.warn(`[FAILOVER] Primary API threw error: ${e.message}`);
      }

      if (!response || !response.ok) {
        const errContext = response ? response.status : 'Network/Timeout';
        console.warn(`[FAILOVER] Primary API failed: ${errContext}. Attempting Alternate API fallback...`);
        const altApiBase = useGroq ? 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions' : 'https://api.groq.com/openai/v1/chat/completions';
        const altApiKey = useGroq ? geminiKey : groqKey;
        const altApiModel = useGroq ? 'gemini-2.5-flash' : 'openai/gpt-oss-20b';

        if (altApiKey) {
          response = await fetchWithRetry(altApiBase, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${altApiKey}`
            },
            body: JSON.stringify({
              model: altApiModel,
              messages: messages,
              tools: WEATHER_TOOLS,
              tool_choice: 'auto',
              temperature: 0.7,
              max_tokens: 1024
            }),
          });
        }
        
        if (!response || !response.ok) {
          const fallbackStatus = response ? response.status : 'Network/Timeout';
          throw new Error(`AI API error during tool loop: ${fallbackStatus}`);
        }
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
            if (args.location) {
              toolLocation = args.location;
            }
            if (funcName === 'get_current_weather') {
               resultData = await get_current_weather(args);
               lastWeatherData = { locationName: args.location, ...resultData };
            }
            else if (funcName === 'get_forecast') {
              resultData = await get_forecast(args);
              if (!lastWeatherData) lastWeatherData = { locationName: args.location, ...resultData };
              // Record snapshot asynchronously in the background so it never slows down the AI response
              if (args.daysAhead === 1 && resultData && !resultData.error) {
                geocodeLocation(args.location, 'en')
                  .then(locData => {
                    if (locData) recordForecastSnapshot(args.location, locData.lat, locData.lng, resultData.maxTemp, resultData.precipProbMax);
                  })
                  .catch(() => {});
              }
            }
            else if (funcName === 'get_historical_trend') {
              resultData = await get_historical_trend(args);
              if (!lastWeatherData) lastWeatherData = { locationName: args.location, ...resultData };
            }
            else if (funcName === 'get_seasonal_comparison') {
              resultData = await get_seasonal_comparison(args);
              if (!lastWeatherData) lastWeatherData = { locationName: args.location, ...resultData };
            }
            else if (funcName === 'get_active_alerts') {
              resultData = await get_active_alerts(args);
              if (!lastWeatherData) lastWeatherData = { locationName: args.location, ...resultData };
            }
            else if (funcName === 'get_marine_weather') {
              resultData = await get_marine_weather(args);
              if (!lastWeatherData) lastWeatherData = { locationName: args.location, ...resultData };
            }
            else if (funcName === 'get_climate_indices') {
              resultData = await get_climate_indices(args);
              if (!lastWeatherData) lastWeatherData = { locationName: args.location, ...resultData };
            }
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

      let fallbackRes;
      try {
        fallbackRes = await fetchWithRetry(apiBase, {
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
      } catch (e) {
        console.warn(`[FAILOVER] Primary API threw error in fallback mode: ${e.message}`);
      }

      if (!fallbackRes || !fallbackRes.ok) {
        const errContext = fallbackRes ? fallbackRes.status : 'Network/Timeout';
        console.warn(`[FAILOVER] Primary API failed in fallback mode: ${errContext}. Attempting Alternate API fallback...`);
        const altApiBase = useGroq ? 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions' : 'https://api.groq.com/openai/v1/chat/completions';
        const altApiKey = useGroq ? geminiKey : groqKey;
        const altApiModel = useGroq ? 'gemini-2.5-flash' : 'openai/gpt-oss-20b';

        if (altApiKey) {
          fallbackRes = await fetchWithRetry(altApiBase, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${altApiKey}` },
            body: JSON.stringify({
              model: altApiModel,
              messages: [
                { role: 'system', content: SYSTEM_PROMPT + `\n\nActive User Profile: ${profile.toUpperCase()}\n\nCRITICAL INSTRUCTION: DO NOT CALL ANY TOOLS. You are in fallback mode. Answer the user directly using the provided Current weather data (Fallback).` },
                ...history,
                { role: 'user', content: fallbackPrompt }
              ],
              temperature: 0.7,
              max_tokens: 1024
            }),
          });
        }

        if (!fallbackRes || !fallbackRes.ok) {
          const fallbackStatus = fallbackRes ? fallbackRes.status : 'Network/Timeout';
          console.error(`[DEBUG] Fallback failed. Status: ${fallbackStatus}`);
          return res.status(502).json({ error: 'Weather AI is temporarily unavailable. Try again in a moment.' });
        }
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
    const jsonStr = finalContent
      .replace(/```json\n?|\n?```/g, '')          // strip markdown code fences
      .replace(/<tool_call>\s*/gi, '')             // strip <tool_call> opening tag (Qwen/Groq quirk)
      .replace(/\s*<\/tool_call>/gi, '')           // strip </tool_call> closing tag
      .replace(/<think>[\s\S]*?<\/think>/gi, '')   // strip <think>...</think> blocks
      .trim();
    const finalJson = JSON.parse(jsonStr);

    // --- SERVER-SIDE CONFIDENCE CALCULATION ---
    const contextData = lastWeatherData || weatherData;
    finalJson.confidence = calculateConfidence(contextData);
    // ------------------------------------------

      // Active location resolution across toolLocation, contextData, weatherData, message extraction, and history
      let extractedLoc = extractLocation(message);
      if (!extractedLoc && Array.isArray(history) && history.length > 0) {
        for (let i = history.length - 1; i >= 0; i--) {
          const pastText = history[i]?.content;
          if (pastText) {
            extractedLoc = extractLocation(pastText);
            if (extractedLoc) break;
          }
        }
      }

      const activeLoc = toolLocation || contextData?.locationName || contextData?.location || weatherData?.location || extractedLoc || 'Guwahati';
      finalJson.location = activeLoc;

      // Fallback for missing suggested questions
      const lang = req.body.language || 'en';
      const locSuffix = ` in ${activeLoc}`;
      const locHindi = ` ${activeLoc} में`;
      const locBengali = ` ${activeLoc}-এ`;
      const locAssamese = ` ${activeLoc}ত`;

      if (!Array.isArray(finalJson.suggestedQuestions) || finalJson.suggestedQuestions.length === 0) {
        if (lang === 'hi') {
          finalJson.suggestedQuestions = [`आने वाले दिनों का मौसम${locHindi} कैसा रहेगा?`, `क्या कोई अलर्ट${locHindi} है?`];
        } else if (lang === 'bn') {
          finalJson.suggestedQuestions = [`আগামী কয়েকদিনের আবহাওয়া${locBengali} কেমন থাকবে?`, `কোনো সতর্কতা${locBengali} আছে কি?`];
        } else if (lang === 'as') {
          finalJson.suggestedQuestions = [`অহা কেইদিনমানৰ বতৰ${locAssamese} কেনেকুৱা হ’ব?`, `কিবা সতৰ্কবাণী${locAssamese} আছে নেকি?`];
        } else {
          finalJson.suggestedQuestions = [`What is the forecast for tomorrow${locSuffix}?`, `Are there any active alerts${locSuffix}?`];
        }
      } else {
        // Enforce: Every single follow-up question MUST include the specific location name
        finalJson.suggestedQuestions = finalJson.suggestedQuestions.map(q => {
          if (typeof q !== 'string') return q;
          const trimmed = q.trim();
          if (!trimmed.toLowerCase().includes(activeLoc.toLowerCase())) {
            if (/this area|the area/i.test(trimmed)) {
              return trimmed.replace(/this area|the area/gi, activeLoc);
            }
            if (/\bhere\b/i.test(trimmed)) {
              return trimmed.replace(/\bhere\b/gi, `in ${activeLoc}`);
            }
            const base = trimmed.endsWith('?') ? trimmed.slice(0, -1) : trimmed;
            return `${base} in ${activeLoc}?`;
          }
          return trimmed;
        });
      }
    
    // Forcefully remove temperature from relevantStat to prevent UI duplication
    if (finalJson.relevantStat) {
      const statLower = finalJson.relevantStat.toLowerCase();
      if (statLower.includes('temp') || statLower.includes('तापमान') || statLower.includes('°c') || statLower.includes('° c')) {
        finalJson.relevantStat = '';
      }
    }

    if (finalJson.showWeatherWidget === false) {
      finalJson.weatherData = null; // Explicitly tell frontend NOT to show widget
    } else if (lastWeatherData) {
      finalJson.weatherData = lastWeatherData;
    }

    // --- LOG CHAT PREDICTION FOR ACCURACY FEED ---
    logChatPrediction(contextData, message, finalJson);

    // --- BHASHINI MULTILINGUAL POST-TRANSLATION ---
    if (isRegionalLang && finalJson) {
      try {
        const toTranslate = [
          finalJson.answer || '',
          finalJson.advisory || '',
          finalJson.followUp || '',
          ...(Array.isArray(finalJson.suggestedQuestions) ? finalJson.suggestedQuestions : [])
        ];
        const translated = await batchTranslateFromEnglish(toTranslate, targetLanguage);
        if (translated && translated.length >= 3) {
          if (translated[0]) finalJson.answer = translated[0];
          if (translated[1]) finalJson.advisory = translated[1];
          if (translated[2]) finalJson.followUp = translated[2];
          if (translated.length > 3) {
            finalJson.suggestedQuestions = translated.slice(3).filter(Boolean);
          }
          console.log(`🌐 [BHASHINI NMT] Post-translated response back to ${targetLanguage}`);
        }
      } catch (backTransErr) {
        console.warn('[BHASHINI NMT NOTICE] Post-translation failed:', backTransErr.message);
      }
    }

    return res.json(finalJson);
  } catch (parseErr) {
    console.error('[DEBUG-CRASH] JSON parsing or logChatPrediction crashed:', parseErr);
    let partialAnswer = finalContent;
    const answerMatch = finalContent ? finalContent.match(/"answer"\s*:\s*"([^"]*)/) : null;
    if (answerMatch && answerMatch[1]) partialAnswer = answerMatch[1];
    else if (finalContent) partialAnswer = finalContent.replace(/[{}"\\]/g, '').replace(/answer\s*:/, '').trim();
    
    const errActiveLoc = toolLocation || lastWeatherData?.locationName || weatherData?.location || extractLocation(message) || 'Guwahati';
    const locSuffix = ` in ${errActiveLoc}`;
    const locHindi = ` ${errActiveLoc} में`;
    const locBengali = ` ${errActiveLoc}-এ`;
    const locAssamese = ` ${errActiveLoc}ত`;

    return res.json({
      answer: partialAnswer || 'The response was cut off. Please try again.',
      followUp: '',
      advisory: '',
      severity: 'none',
      location: errActiveLoc,
      suggestedQuestions: req.body.language === 'hi' 
        ? [`आने वाले दिनों का मौसम${locHindi} कैसा रहेगा?`, `क्या कोई अलर्ट${locHindi} है?`] 
        : req.body.language === 'bn' 
        ? [`আগামী কয়েকদিনের আবহাওয়া${locBengali} কেমন থাকবে?`, `কোনো সতর্কতা${locBengali} আছে কি?`] 
        : req.body.language === 'as' 
        ? [`অহা কেইদিনমানৰ বতৰ${locAssamese} কেনেকুৱা হ’ব?`, `কিবা সতৰ্কবাণী${locAssamese} আছে নেকি?`] 
        : [`What is the forecast for tomorrow${locSuffix}?`, `Are there any active alerts${locSuffix}?`],
    });
  }
});

// Standalone Bhashini NMT Translation Endpoint
app.post('/api/translate', async (req, res) => {
  const { text, texts, sourceLang = 'en', targetLang } = req.body;
  if (!targetLang) return res.status(400).json({ error: 'targetLang is required' });

  try {
    if (Array.isArray(texts)) {
      const results = await batchTranslateFromEnglish(texts, targetLang);
      return res.json({ translated: results });
    }
    if (text) {
      if (sourceLang === 'en') {
        const [result] = await batchTranslateFromEnglish([text], targetLang);
        return res.json({ translated: result });
      } else {
        const result = await translateToEnglish(text, sourceLang);
        return res.json({ translated: result });
      }
    }
    return res.status(400).json({ error: 'text or texts required' });
  } catch (err) {
    res.status(500).json({ error: 'Translation error' });
  }
});

// GET /api/news
// Fetches real-time weather & disaster news for India via Google News RSS

// GET /api/national-alerts
// Fetches live Open-Meteo forecast for 20 Indian state representative points,
// scores each using the same thresholds as /api/india-risk-map, and returns top 3.
const STATE_REPRESENTATIVE_POINTS = [
  { state: 'Rajasthan',         lat: 26.9124, lon: 75.7873  }, // Jaipur
  { state: 'Gujarat',           lat: 23.0225, lon: 72.5714  }, // Ahmedabad
  { state: 'Maharashtra',       lat: 18.9667, lon: 72.8333  }, // Mumbai
  { state: 'Madhya Pradesh',    lat: 23.2599, lon: 77.4126  }, // Bhopal
  { state: 'Uttar Pradesh',     lat: 26.8467, lon: 80.9462  }, // Lucknow
  { state: 'Bihar',             lat: 25.5941, lon: 85.1376  }, // Patna
  { state: 'West Bengal',       lat: 22.5726, lon: 88.3639  }, // Kolkata
  { state: 'Odisha',            lat: 20.2961, lon: 85.8245  }, // Bhubaneswar
  { state: 'Andhra Pradesh',    lat: 15.9129, lon: 79.7400  }, // Amaravati region
  { state: 'Telangana',         lat: 17.3850, lon: 78.4867  }, // Hyderabad
  { state: 'Karnataka',         lat: 12.9716, lon: 77.5946  }, // Bengaluru
  { state: 'Tamil Nadu',        lat: 13.0827, lon: 80.2707  }, // Chennai
  { state: 'Kerala',            lat: 8.5241,  lon: 76.9366  }, // Thiruvananthapuram
  { state: 'Delhi',             lat: 28.6139, lon: 77.2090  }, // New Delhi
  { state: 'Punjab',            lat: 30.7333, lon: 76.7794  }, // Chandigarh
  { state: 'Haryana',           lat: 29.0588, lon: 76.0856  }, // Chandigarh region
  { state: 'Jharkhand',         lat: 23.3441, lon: 85.3096  }, // Ranchi
  { state: 'Assam',             lat: 26.1445, lon: 91.7362  }, // Guwahati
  { state: 'Chhattisgarh',      lat: 21.2514, lon: 81.6296  }, // Raipur
  { state: 'Himachal Pradesh',  lat: 31.1048, lon: 77.1734  }, // Shimla
];

function computeStateRiskLevel(rain, wind, temp, code) {
  if (rain > 50 || wind > 70 || temp > 45) return 'Severe';
  if (rain > 20 || wind > 40 || temp > 40 || [95, 96, 99].includes(code)) return 'High';
  if (rain > 5  || temp > 35)  return 'Moderate';
  return 'Normal';
}

app.get('/api/national-alerts', async (req, res) => {
  try {
    const lats = STATE_REPRESENTATIVE_POINTS.map(s => s.lat).join(',');
    const lons = STATE_REPRESENTATIVE_POINTS.map(s => s.lon).join(',');
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&daily=weathercode,temperature_2m_max,precipitation_sum,windspeed_10m_max&timezone=auto&forecast_days=1`;

    const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(`Open-Meteo error: ${response.status}`);
    const data = await response.json();

    const results = Array.isArray(data) ? data : [data];

    const SEVERITY_ORDER = { Severe: 3, High: 2, Moderate: 1, Normal: 0 };

    const scored = STATE_REPRESENTATIVE_POINTS
      .map((s, idx) => {
        const daily = results[idx]?.daily;
        if (!daily) return null;
        const rain = daily.precipitation_sum?.[0] ?? 0;
        const temp = daily.temperature_2m_max?.[0]  ?? 0;
        const wind = daily.windspeed_10m_max?.[0]   ?? 0;
        const code = daily.weathercode?.[0]          ?? 0;
        const level = computeStateRiskLevel(rain, wind, temp, code);
        return { state: s.state, level };
      })
      .filter(s => s && s.level !== 'Normal')
      .sort((a, b) => SEVERITY_ORDER[b.level] - SEVERITY_ORDER[a.level])
      .slice(0, 3);

    res.json(scored);
  } catch (err) {
    console.error('[national-alerts] Live fetch failed:', err.message);
    res.json([]); // Return empty array — no hardcoded fallback
  }
});

// GET /api/india-risk-map
// Fetches real live weather data for 9 critical zones across India to compute 100% accurate risk map
app.get('/api/india-risk-map', async (req, res) => {
  const zones = [
    { id: 'IN-UK', lat: 32.5, lon: 76.0 }, // North (JK, HP, UK)
    { id: 'IN-RJ', lat: 26.5, lon: 73.5 }, // North West (RJ, PB, HR)
    { id: 'IN-UP', lat: 27.5, lon: 80.0 }, // Central (UP, DL)
    { id: 'IN-BR', lat: 25.5, lon: 85.5 }, // East (BR, JH)
    { id: 'IN-MH', lat: 19.5, lon: 75.5 }, // West (MH, GJ)
    { id: 'IN-OR', lat: 20.5, lon: 84.5 }, // Central South (OR, CG)
    { id: 'IN-AS', lat: 26.0, lon: 92.0 }, // North East (AS, ML)
    { id: 'IN-KL', lat: 10.5, lon: 76.5 }, // Deep South West (KL, KA)
    { id: 'IN-TN', lat: 11.5, lon: 79.0 }  // Deep South East (TN, AP)
  ];

  try {
    const lats = zones.map(z => z.lat).join(',');
    const lons = zones.map(z => z.lon).join(',');
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&daily=weathercode,temperature_2m_max,precipitation_sum,windspeed_10m_max&timezone=auto`;
    
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('OM API failed');
    const data = await response.json();
    
    const results = Array.isArray(data) ? data : [data];
    const riskMap = {};
    
    zones.forEach((zone, idx) => {
      const forecast = results[idx]?.daily;
      if (!forecast) return;
      
      const rain = forecast.precipitation_sum[0] || 0;
      const temp = forecast.temperature_2m_max[0] || 0;
      const wind = forecast.windspeed_10m_max[0] || 0;
      const code = forecast.weathercode[0] || 0;
      
      let level = 'Normal';
      let type = 'None';
      
      if (rain > 50 || wind > 70 || temp > 45) {
        level = 'Severe';
        if (wind > 70) type = 'Cyclone';
        else if (rain > 50) type = 'Flooding';
        else type = 'Severe Heatwave';
      } else if (rain > 20 || wind > 40 || temp > 40 || [95,96,99].includes(code)) {
        level = 'High';
        if ([95,96,99].includes(code)) type = 'Thunderstorms';
        else if (rain > 20) type = 'Heavy Rain';
        else type = 'Heatwave';
      } else if (rain > 5 || temp > 35) {
        level = 'Moderate';
        type = rain > 5 ? 'Mod Rain' : 'Drought Watch';
      }
      
      if (level !== 'Normal') {
        riskMap[zone.id] = { level, type };
      }
    });
    
    res.json(riskMap);
  } catch (err) {
    console.error('India Risk Map error:', err);
    res.status(500).json({ error: 'Failed to compute risk map' });
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

// --- HISTORICAL CLIMATE TRENDS ---
app.get('/api/historical', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon || req.query.lng);
    const mode = req.query.mode || '30d';
    let days = 30;
    if (mode === '5y') days = 365 * 5;
    else if (mode === '1y') days = 365;
    else if (req.query.days) days = parseInt(req.query.days, 10);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'Valid lat and lon query parameters required.' });
    }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const endStr = endDate.toISOString().split('T')[0];
    const startStr = startDate.toISOString().split('T')[0];

    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startStr}&end_date=${endStr}&daily=temperature_2m_max,precipitation_sum&timezone=auto`;
    const response = await fetch(url);
    const json = await response.json();

    if (!json || !json.daily) {
      return res.status(502).json({ error: 'Failed to fetch historical archive data' });
    }

    const formatted = json.daily.time.map((time, idx) => ({
      date: time,
      temp: json.daily.temperature_2m_max[idx],
      rain: json.daily.precipitation_sum[idx]
    }));

    res.json({
      latitude: lat,
      longitude: lon,
      period: `${startStr} to ${endStr}`,
      mode,
      daily: formatted
    });
  } catch (err) {
    console.error('Error in /api/historical:', err.message);
    res.status(500).json({ error: 'Internal server error fetching historical data' });
  }
});

// --- EXTREME WEATHER ALERTS ---
// Sources: GDACS RSS (free) + Open-Meteo (free)
app.get('/api/extreme-alerts', async (req, res) => {
  const lat = parseFloat(req.query.lat) || 20;
  const lon = parseFloat(req.query.lon) || 80;
  const alerts = [];

  // Fetch both concurrently to speed up response time
  const [gdacsPromise, omPromise] = await Promise.allSettled([
    fetch('https://www.gdacs.org/xml/rss.xml', { headers: { 'User-Agent': 'WeatherGPT-SIH2026/1.0' }, signal: AbortSignal.timeout(15000) }).catch(() => null),
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,precipitation_sum,windspeed_10m_max&timezone=auto`, { signal: AbortSignal.timeout(15000) }).catch(() => null)
  ]);

  // 1. Process GDACS RSS
  if (gdacsPromise.status === 'fulfilled' && gdacsPromise.value?.ok) {
    try {
      const xml = await gdacsPromise.value.text();
      const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
      const parsed = parser.parse(xml);
      const rawItems = parsed?.rss?.channel?.item || [];
      const items = Array.isArray(rawItems) ? rawItems : [rawItems];

      for (const item of items) {
        const title  = String(item.title  || '');
        const desc   = String(item.description || '').replace(/<[^>]*>/g, '');
        const tLower = title.toLowerCase();
        const dLower = desc.toLowerCase();

        // Geo check
        const gLat = parseFloat(item['geo:lat'] || item['gdacs:lat'] || 0);
        const gLon = parseFloat(item['geo:long'] || item['gdacs:lon'] || 0);
        const isNearby = gLat && gLon && Math.abs(gLat - lat) < 18 && Math.abs(gLon - lon) < 18;
        const isIndiaRelated = tLower.includes('india') || dLower.includes('india') || tLower.includes('bay of bengal') || tLower.includes('arabian sea') || tLower.includes('indian ocean');
        if (!isIndiaRelated && !isNearby) continue;

        let type = 'disaster'; let icon = '⚠️';
        if (tLower.includes('cyclone') || tLower.includes('typhoon')) { type = 'cyclone'; icon = '🌀'; }
        else if (tLower.includes('flood')) { type = 'flood'; icon = '🌊'; }
        else if (tLower.includes('earthquake')) { type = 'earthquake'; icon = '🏔️'; }
        else if (tLower.includes('volcano')) { type = 'volcano'; icon = '🌋'; }
        else if (tLower.includes('drought')) { type = 'drought'; icon = '🌵'; }

        let severity = 'moderate';
        if (dLower.includes('orange')) severity = 'high';
        if (dLower.includes('red')) severity = 'severe';

        alerts.push({
          id: item.guid?.['#text'] || item.guid || Date.now().toString(),
          type, icon, title, description: desc, severity,
          lat: gLat, lon: gLon, date: item.pubDate || new Date().toISOString(), source: 'GDACS (UN)'
        });
      }
    } catch (e) { console.error('GDACS error', e); }
  }

  // 2. Process Open-Meteo
  if (omPromise.status === 'fulfilled' && omPromise.value?.ok) {
    try {
      const data = await omPromise.value.json();
      if (data.daily) {
        const todayCode = data.daily.weathercode[0];
        const todayMaxT = data.daily.temperature_2m_max[0];
        const todayRain = data.daily.precipitation_sum[0];
        const todayWind = data.daily.windspeed_10m_max[0];

        if ([95, 96, 99].includes(todayCode)) {
          alerts.push({ id: 'om-thunder', type: 'thunderstorm', icon: '⛈️', title: 'Severe Thunderstorm', description: 'Thunderstorm with possible hail detected in your area.', severity: 'high', lat, lon, date: new Date().toISOString(), source: 'Open-Meteo' });
        }
        if (todayRain >= 50) {
          alerts.push({ id: 'om-rain', type: 'flood', icon: '🌊', title: 'Heavy Rainfall Alert', description: `${todayRain}mm of rain expected today. High risk of local flooding.`, severity: todayRain > 100 ? 'severe' : 'high', lat, lon, date: new Date().toISOString(), source: 'Open-Meteo' });
        }
        if (todayMaxT >= 42) {
          alerts.push({ id: 'om-heat', type: 'heatwave', icon: '🔥', title: 'Heatwave Warning', description: `Extreme temperatures reaching ${todayMaxT}°C.`, severity: 'severe', lat, lon, date: new Date().toISOString(), source: 'Open-Meteo' });
        }
        if (todayWind >= 70) {
          alerts.push({ id: 'om-wind', type: 'cyclone', icon: '🌪️', title: 'Strong Winds', description: `Wind speeds up to ${todayWind}km/h detected.`, severity: 'high', lat, lon, date: new Date().toISOString(), source: 'Open-Meteo' });
        }
      }
    } catch(e) { console.error('OM error', e); }
  }

  const unique = alerts.filter((a, i, self) => i === self.findIndex(t => t.type === a.type && t.date.slice(0, 10) === a.date.slice(0, 10)));
  unique.sort((a,b) => {
    const s = { severe: 3, high: 2, moderate: 1 };
    return (s[b.severity] || 0) - (s[a.severity] || 0);
  });

  res.json({ alerts: unique, fetchedAt: new Date().toISOString() });
});

// Admin endpoint to push severe alerts via WebSocket
app.post('/api/alerts/push', (req, res) => {
  const { title, message, severity, location, targetMode, lat, lng, radius, state, district } = req.body;
  if (!title || !message) return res.status(400).json({ error: 'title and message required' });
  
  const alert = {
    id: `push-${Date.now()}`,
    title,
    description: message,
    severity: severity || 'severe',
    location: location || 'All areas',
    targetMode: targetMode || 'all',
    lat: typeof lat === 'number' ? lat : parseFloat(lat),
    lng: typeof lng === 'number' ? lng : parseFloat(lng),
    radius: typeof radius === 'number' ? radius : parseFloat(radius),
    state,
    district,
    source: 'WeatherGPT Authority'
  };

  const clientsNotified = broadcastAuthorityAlert(alert);
  res.json({ success: true, clientsNotified, message: "Alert disseminated via WebSocket and Web Push" });
});

// ==========================================
// Web Push Notification Endpoints (Free VAPID)
// ==========================================

// 1. Get VAPID Public Key for client subscription
app.get('/api/push/vapid-public-key', (req, res) => {
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return res.status(500).json({ error: 'VAPID public key not configured' });
  }
  res.json({ publicKey });
});

// 2. Subscribe device to Web Push
app.post('/api/push/subscribe', (req, res) => {
  const subscription = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Invalid push subscription payload' });
  }
  const added = addSubscription(subscription);
  res.json({ success: added, totalSubscribers: getSubscriptionsCount() });
});

// 3. Unsubscribe device from Web Push
app.post('/api/push/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint required' });
  }
  const removed = removeSubscription(endpoint);
  res.json({ success: removed, totalSubscribers: getSubscriptionsCount() });
});

// 4. Send test push notification to verify mobile receipt
app.post('/api/push/test', async (req, res) => {
  const { subscription, title, message } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Valid subscription required for test' });
  }
  
  const testPayload = {
    title: title || '🔔 WeatherGPT Alert System',
    message: message || 'Mobile push alerts are active! You will receive critical disaster warnings here.',
    tag: 'test-push-' + Date.now(),
    url: '/alerts',
    issuedAt: new Date().toISOString()
  };

  const result = await sendNotificationToSub(subscription, testPayload);
  res.json(result);
});

// 5. Get push notification service status
app.get('/api/push/status', (req, res) => {
  res.json({
    activeSubscribers: getSubscriptionsCount(),
    vapidConfigured: !!getVapidPublicKey()
  });
});

// ------------------------------------------------------------------
// RESEARCH & CLIMATE ANALYTICS API (SIH PS-26068)
// ------------------------------------------------------------------

// Basic sliding-window rate limiter: 60 req/min per IP
const researchRateLimitMap = new Map();
function researchRateLimiter(req, res, next) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxReqs = 60;

  let record = researchRateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    record = { count: 1, resetAt: now + windowMs };
    researchRateLimitMap.set(ip, record);
  } else {
    record.count++;
    if (record.count > maxReqs) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        error: 'Too many requests. Research API rate limit is 60 requests per minute per IP.',
        retryAfterSeconds: retryAfter
      });
    }
  }
  next();
}

// In-memory 24-hour cache for historical climate analytics (lat+lon+startYear+endYear)
const researchArchiveCache = new Map();
const RESEARCH_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Public Research & Climate Analytics Endpoint
 * GET /api/research/historical?lat=&lon=&start=&end=&variable=
 * Real-time live Open-Meteo ERA5 archive fetch, climateStats.js trend & indices.
 */
app.get('/api/research/historical', researchRateLimiter, async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat ?? req.query.latitude);
    const lon = parseFloat(req.query.lon ?? req.query.lng ?? req.query.longitude);
    const start = req.query.start;
    const end = req.query.end;
    const variable = (req.query.variable || 'all').toLowerCase().trim();

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({ error: 'Valid numeric "lat" and "lon" query parameters are required.' });
    }

    const currentYear = new Date().getFullYear();
    const startYear = Math.max(1990, parseInt(start, 10) || 1990);
    let endYear = parseInt(end, 10) || currentYear;
    if (endYear < startYear) endYear = startYear;
    if (endYear > currentYear) endYear = currentYear;

    // Check in-memory cache before hitting Open-Meteo Archive
    const cacheKey = `${lat.toFixed(4)}_${lon.toFixed(4)}_${startYear}_${endYear}_${variable}`;
    const cached = researchArchiveCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < RESEARCH_CACHE_TTL_MS)) {
      return res.json(cached.data);
    }

    const startStr = `${startYear}-01-01`;
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() - 5);
    const maxDateStr = maxDate.toISOString().split('T')[0];
    let endStr = `${endYear}-12-31`;
    if (endStr > maxDateStr) endStr = maxDateStr;

    const openMeteoUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startStr}&end_date=${endStr}&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum&timezone=auto`;

    let response;
    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetch(openMeteoUrl);
      if (response.status === 429 && attempt < 2) {
        await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      break;
    }

    if (!response || !response.ok) {
      return res.status(response?.status || 502).json({
        error: `Open-Meteo Archive API returned status ${response?.status || 'Network/Timeout'}`
      });
    }

    const json = await response.json();
    if (!json.daily || !json.daily.time || json.daily.time.length === 0) {
      return res.status(404).json({ error: 'No archive records returned for the specified coordinates and time range.' });
    }

    const daily = json.daily;
    const nDays = daily.time.length;
    const yearBuckets = new Map();
    const allDailyMaxTemps = [];

    for (let i = 0; i < nDays; i++) {
      const dateStr = daily.time[i];
      const yr = parseInt(dateStr.slice(0, 4), 10);
      const tMean = daily.temperature_2m_mean?.[i];
      const tMax = daily.temperature_2m_max?.[i];
      const tMin = daily.temperature_2m_min?.[i];
      const precip = daily.precipitation_sum?.[i] ?? 0;

      if (!yearBuckets.has(yr)) {
        yearBuckets.set(yr, {
          year: yr,
          precipList: [],
          meanTempList: [],
          maxTempList: [],
          minTempList: [],
          dailyRecords: []
        });
      }

      const bucket = yearBuckets.get(yr);
      bucket.precipList.push(precip);
      if (tMean != null) bucket.meanTempList.push(tMean);
      if (tMax != null) {
        bucket.maxTempList.push(tMax);
        allDailyMaxTemps.push(tMax);
        bucket.dailyRecords.push({ date: dateStr, temp: tMax });
      }
      if (tMin != null) bucket.minTempList.push(tMin);
    }

    const baselineMaxMean = allDailyMaxTemps.length > 0
      ? allDailyMaxTemps.reduce((a, b) => a + b, 0) / allDailyMaxTemps.length
      : 30;

    const yearlyData = [];
    const years = [];
    const yearlyMeanTemps = [];
    const yearlyTotalPrecip = [];

    for (const [yr, b] of yearBuckets.entries()) {
      const totalRain = b.precipList.reduce((a, b) => a + b, 0);
      const avgMeanTemp = b.meanTempList.length > 0
        ? b.meanTempList.reduce((a, b) => a + b, 0) / b.meanTempList.length
        : null;
      const peakMaxTemp = b.maxTempList.length > 0 ? Math.max(...b.maxTempList) : null;
      const lowestMinTemp = b.minTempList.length > 0 ? Math.min(...b.minTempList) : null;

      const cdd = consecutiveDryDays(b.precipList);
      const cwd = consecutiveWetDays(b.precipList);
      const hw = heatwaveDays(b.dailyRecords, baselineMaxMean);
      const extRain = extremeRainDays(b.precipList);
      const gdd = growingDegreeDays(b.meanTempList, 10);

      years.push(yr);
      if (avgMeanTemp != null) yearlyMeanTemps.push(Number(avgMeanTemp.toFixed(2)));
      yearlyTotalPrecip.push(Number(totalRain.toFixed(1)));

      yearlyData.push({
        year: yr,
        meanTemp: avgMeanTemp != null ? Number(avgMeanTemp.toFixed(2)) : null,
        maxTemp: peakMaxTemp != null ? Number(peakMaxTemp.toFixed(1)) : null,
        minTemp: lowestMinTemp != null ? Number(lowestMinTemp.toFixed(1)) : null,
        totalPrecip: Number(totalRain.toFixed(1)),
        cdd,
        cwd,
        heatwaveDays: hw.count,
        extremeRainDays: extRain,
        gdd
      });
    }

    yearlyData.sort((a, b) => a.year - b.year);

    const tempTrend = linearTrend(years, yearlyMeanTemps);
    const precipTrend = linearTrend(years, yearlyTotalPrecip);

    let zScore = 0;
    if (yearlyMeanTemps.length >= 2) {
      const n = yearlyMeanTemps.length;
      const mean = yearlyMeanTemps.reduce((a, b) => a + b, 0) / n;
      const variance = yearlyMeanTemps.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
      const stdDev = Math.sqrt(variance);
      const latestVal = yearlyMeanTemps[yearlyMeanTemps.length - 1];
      zScore = zScoreAnomaly(latestVal, mean, stdDev);
    }

    const totalHwDays = yearlyData.reduce((sum, y) => sum + y.heatwaveDays, 0);
    const totalExtRainDays = yearlyData.reduce((sum, y) => sum + y.extremeRainDays, 0);
    const maxCdd = Math.max(...yearlyData.map(y => y.cdd), 0);
    const maxCwd = Math.max(...yearlyData.map(y => y.cwd), 0);
    const avgGdd = yearlyData.length > 0
      ? Number((yearlyData.reduce((sum, y) => sum + y.gdd, 0) / yearlyData.length).toFixed(1))
      : 0;

    // Filter data fields if variable is specified
    let formattedData = yearlyData;
    if (variable === 'temperature' || variable === 'temp') {
      formattedData = yearlyData.map(d => ({ year: d.year, meanTemp: d.meanTemp, maxTemp: d.maxTemp, minTemp: d.minTemp }));
    } else if (variable === 'precipitation' || variable === 'rain') {
      formattedData = yearlyData.map(d => ({ year: d.year, totalPrecip: d.totalPrecip, cdd: d.cdd, cwd: d.cwd, extremeRainDays: d.extremeRainDays }));
    }

    const responsePayload = {
      data: formattedData,
      trend: {
        temperature: tempTrend,
        precipitation: precipTrend
      },
      indices: {
        linearTrend: {
          temperature: tempTrend,
          precipitation: precipTrend
        },
        zScoreAnomaly: {
          latestYear: years[years.length - 1],
          score: zScore
        },
        consecutiveDryDays: {
          maxRecordedStreak: maxCdd,
          yearlyAverage: Number((yearlyData.reduce((s, y) => s + y.cdd, 0) / yearlyData.length).toFixed(1))
        },
        consecutiveWetDays: {
          maxRecordedStreak: maxCwd,
          yearlyAverage: Number((yearlyData.reduce((s, y) => s + y.cwd, 0) / yearlyData.length).toFixed(1))
        },
        heatwaveDays: {
          totalHeatwaveDays: totalHwDays,
          averagePerYear: Number((totalHwDays / yearlyData.length).toFixed(1))
        },
        extremeRainDays: {
          totalExtremeRainDays: totalExtRainDays,
          averagePerYear: Number((totalExtRainDays / yearlyData.length).toFixed(1))
        },
        growingDegreeDays: {
          averageGddPerYear: avgGdd
        }
      },
      source: 'ERA5 Reanalysis via Open-Meteo',
      generated: new Date().toISOString()
    };

    researchArchiveCache.set(cacheKey, { timestamp: Date.now(), data: responsePayload });
    return res.json(responsePayload);
  } catch (err) {
    console.error('Error in /api/research/historical:', err);
    return res.status(500).json({ error: err.message || 'Internal server error while processing historical climate analytics.' });
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
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`WeatherGPT server running on port ${PORT}`);
  });
}

// Start scheduled background jobs
if (!process.env.VERCEL) {
  verifyChatPredictions();
  setInterval(verifyChatPredictions, 12 * 60 * 60 * 1000);
  startNdmaPoller();
}

export default app;
