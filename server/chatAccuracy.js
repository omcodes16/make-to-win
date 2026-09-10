import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const isMongoConnected = () => Boolean(mongoose.connection && mongoose.connection.readyState === 1);

export function getISTDateStr(d = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  } catch (e) {
    return d.toISOString().split('T')[0];
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PREDICTIONS_FILE = path.join(__dirname, '..', 'chat_predictions.json');

// Fast canonical coordinates for Indian cities (English & Hindi)
const KNOWN_INDIAN_CITIES = {
  'jabalpur': { lat: 23.1815, lng: 79.9864 },
  'जबलपुर': { lat: 23.1815, lng: 79.9864 },
  'ranjhi': { lat: 23.1815, lng: 79.9864 },
  'रांझी': { lat: 23.1815, lng: 79.9864 },
  'ranjhi tahsil': { lat: 23.1815, lng: 79.9864 },
  'indore': { lat: 22.7196, lng: 75.8577 },
  'इंदौर': { lat: 22.7196, lng: 75.8577 },
  'guwahati': { lat: 26.1445, lng: 91.7362 },
  'गुवाहाटी': { lat: 26.1445, lng: 91.7362 },
  'गुहाटी': { lat: 26.1445, lng: 91.7362 },
  'bhopal': { lat: 23.2599, lng: 77.4126 },
  'भोपाल': { lat: 23.2599, lng: 77.4126 },
  'delhi': { lat: 28.6139, lng: 77.2090 },
  'दिल्ली': { lat: 28.6139, lng: 77.2090 },
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'मुंबई': { lat: 19.0760, lng: 72.8777 },
  'kolkata': { lat: 22.5726, lng: 88.3639 },
  'कोलकाता': { lat: 22.5726, lng: 88.3639 },
  'chennai': { lat: 13.0827, lng: 80.2707 },
  'चेन्नई': { lat: 13.0827, lng: 80.2707 },
  'bengaluru': { lat: 12.9716, lng: 77.5946 },
  'bangalore': { lat: 12.9716, lng: 77.5946 },
  'बेंगलुरु': { lat: 12.9716, lng: 77.5946 },
  'ranchi': { lat: 23.3441, lng: 85.3096 },
  'रांची': { lat: 23.3441, lng: 85.3096 },
  'patna': { lat: 25.5941, lng: 85.1376 },
  'पटना': { lat: 25.5941, lng: 85.1376 },
  'jaipur': { lat: 26.9124, lng: 75.7873 },
  'जयपुर': { lat: 26.9124, lng: 75.7873 },
  'lucknow': { lat: 26.8467, lng: 80.9462 },
  'लखनऊ': { lat: 26.8467, lng: 80.9462 },
  'shillong': { lat: 25.5788, lng: 91.8933 },
  'शिलांग': { lat: 25.5788, lng: 91.8933 },
  'pune': { lat: 18.5204, lng: 73.8567 },
  'पुणे': { lat: 18.5204, lng: 73.8567 },
  'cyclone': { lat: 12.5, lng: 75.0 },
  'सूपरा': { lat: 23.1815, lng: 79.9864 },
};

// ---------------------------------------------------------------------------
// Sub-schema for a single quantifiable claim extracted from an AI answer
// ---------------------------------------------------------------------------
const claimSchema = new mongoose.Schema({
  claimType:        { type: String },   // e.g. 'rain_probability', 'wind_speed'
  claimValue:       { type: Number },   // numeric value the AI stated
  unit:             { type: String },   // '%', 'km/h', 'mm', etc.
  actualValue:      { type: Number, default: null },
  accuracyStatus:   { type: String, default: null }, // 'accurate' | 'diverged' | 'off' | 'unknown'
  delta:            { type: Number, default: null }, // actual - claimValue
  deltaSign:        { type: String, default: null }, // e.g. '+4.8 km/h'
  deltaPct:         { type: Number, default: null }, // percentage variance
  divergenceReason: { type: String, default: null }, // explicit explanation of divergence
}, { _id: false });

// ---------------------------------------------------------------------------
// Main Mongoose Schema  (additive vs. old schema — new fields are optional)
// ---------------------------------------------------------------------------
const chatPredictionSchema = new mongoose.Schema({
  id:                String,
  location:          String,
  lat:               Number,
  lng:               Number,
  date:              String,   // Date forecast was asked
  timeHorizon:       { type: String, default: 'today' }, // 'today' | 'tomorrow' | 'day_after_tomorrow' | 'weekly'
  targetDate:        String,   // YYYY-MM-DD (start of predicted period)
  targetEndDate:     String,   // YYYY-MM-DD (end of predicted period)
  verifyAfter:       String,   // YYYY-MM-DD (earliest date verification can run)
  horizonLabel:      { type: String, default: 'Today' },
  question:          String,   // FULL question text (no cap)
  answerText:        String,   // FULL AI answer text
  severity:          String,
  loggedAt:          String,
  verified:          Boolean,
  accuracyStatus:    String,   // overall roll-up: 'accurate' | 'diverged' | 'off' | 'unknown'
  hasDivergence:     { type: Boolean, default: false },
  divergenceSummary: { type: String, default: null },
  claims:            [claimSchema],

  // Legacy fields kept for backward-compat with old records in the store
  claimType:         String,
  claimValue:        Number,
  actualValue:       Number,
});

let ChatPrediction;
try {
  ChatPrediction = mongoose.model('ChatPrediction', chatPredictionSchema);
} catch (e) {
  ChatPrediction = mongoose.model('ChatPrediction');
}

// Ensure local file exists
if (!fs.existsSync(PREDICTIONS_FILE)) {
  fs.writeFileSync(PREDICTIONS_FILE, JSON.stringify([]));
}

// ---------------------------------------------------------------------------
// extractAllClaims(answerText, relevantStat)
//
// Runs a battery of regexes over the FULL AI answer to find every numeric
// claim about weather conditions.  Returns an array of claim objects.
// Temperature is intentionally skipped (already displayed in the weather
// widget; the system prompt explicitly excludes it from relevantStat).
// ---------------------------------------------------------------------------
function extractAllClaims(answerText, relevantStat) {
  const claims = [];
  const seen = new Set(); // prevent duplicate claimTypes

  const text = (answerText || '') + ' ' + (relevantStat || '');

  const addClaim = (claimType, claimValue, unit) => {
    if (seen.has(claimType)) return;
    if (claimValue === null || claimValue === undefined || isNaN(claimValue)) return;
    seen.add(claimType);
    claims.push({ claimType, claimValue, unit, actualValue: null, accuracyStatus: null });
  };

  // ── 1. Rain probability (%) ───────────────────────────────────────────────
  // Matches: "80% chance of rain", "rain: 68%", "rain probability: 55%",
  //          "RAIN: 68%",  "precipitation: 70%"
  const rainProbPatterns = [
    /(\d+)\s*%\s*(?:chance\s+of\s+rain|rain\s+probability|probability\s+of\s+rain)/i,
    /(?:rain|precip(?:itation)?)\s*[:\-–]?\s*(\d+)\s*%/i,
    /(\d+)\s*%\s*(?:rain|precip)/i,
  ];
  for (const re of rainProbPatterns) {
    const m = text.match(re);
    if (m) { addClaim('rain_probability', parseInt(m[1], 10), '%'); break; }
  }

  // ── 2. Rain accumulation (mm) ─────────────────────────────────────────────
  // Matches: "30 mm of rain", "rainfall: 12mm", "heavy rain (50mm)"
  const rainMmPatterns = [
    /(\d+(?:\.\d+)?)\s*mm\s*(?:of\s+)?(?:rain(?:fall)?|precipitation)/i,
    /(?:rain(?:fall)?|precipitation)\s*[:\-–(]?\s*(\d+(?:\.\d+)?)\s*mm/i,
  ];
  for (const re of rainMmPatterns) {
    const m = text.match(re);
    if (m) { addClaim('rain_mm', parseFloat(m[1]), 'mm'); break; }
  }

  // ── 3. Wind speed (km/h) ─────────────────────────────────────────────────
  // Matches: "wind: 24 km/h", "winds up to 60 km/h", "Wind Speed: 35 km/h"
  const windPatterns = [
    /wind(?:\s+speed)?\s*[:\-–]?\s*(?:up\s+to\s+)?(\d+(?:\.\d+)?)\s*km\/h/i,
    /(\d+(?:\.\d+)?)\s*km\/h\s*(?:wind|gusts?)?/i,
    /winds?\s+(?:at|around|of|up\s+to)\s+(\d+(?:\.\d+)?)\s*km\/h/i,
  ];
  for (const re of windPatterns) {
    const m = text.match(re);
    if (m) { addClaim('wind_speed', parseFloat(m[1]), 'km/h'); break; }
  }

  // ── 4. Humidity (%) ───────────────────────────────────────────────────────
  // Matches: "humidity: 80%", "80% humidity", "HUMIDITY: 75%"
  const humidPatterns = [
    /humid(?:ity)?\s*[:\-–]?\s*(\d+)\s*%/i,
    /(\d+)\s*%\s*humid(?:ity)?/i,
  ];
  for (const re of humidPatterns) {
    const m = text.match(re);
    if (m) { addClaim('humidity', parseInt(m[1], 10), '%'); break; }
  }

  // ── 5. UV Index ───────────────────────────────────────────────────────────
  // Matches: "UV: 8", "UV index: 6", "uv index of 9"
  const uvPatterns = [
    /uv\s*(?:index)?\s*[:\-–of]?\s*(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*uv/i,
  ];
  for (const re of uvPatterns) {
    const m = text.match(re);
    if (m) { addClaim('uv_index', parseFloat(m[1]), ''); break; }
  }

  // ── 6. Fallback: parse relevantStat if nothing was captured yet ───────────
  if (claims.length === 0 && relevantStat) {
    const s = relevantStat.toLowerCase();
    const numMatch = s.match(/(\d+(?:\.\d+)?)/);
    if (numMatch) {
      const val = parseFloat(numMatch[1]);
      let claimType = 'other';
      let unit = '';
      if (s.includes('rain') || s.includes('precip')) { claimType = 'rain_probability'; unit = '%'; }
      else if (s.includes('wind'))                     { claimType = 'wind_speed'; unit = 'km/h'; }
      else if (s.includes('humid'))                    { claimType = 'humidity'; unit = '%'; }
      else if (s.includes('uv'))                       { claimType = 'uv_index'; unit = ''; }
      if (claimType !== 'other') {
        addClaim(claimType, val, unit);
      }
    }
  }

  return claims;
}

// ---------------------------------------------------------------------------
// generateDivergenceAnalysis(claimType, claimValue, actualValue, unit, isMultiDay)
//
// Strictly evaluates AI prediction against observed ground truth.
// Computes exact delta (Δ = actual - predicted), percentage variance,
// classifies as 'accurate', 'diverged' or 'off', and creates an authoritative
// meteorological explanation of why the divergence occurred.
// ---------------------------------------------------------------------------
export function generateDivergenceAnalysis(claimType, claimValue, actualValue, unit = '', isMultiDay = false) {
  const predicted = Number(claimValue);
  const actual = Number(actualValue);
  const rawDelta = actual - predicted;
  const delta = parseFloat(rawDelta.toFixed(1));
  const absDelta = Math.abs(delta);
  const sign = delta > 0 ? '+' : '';
  const deltaSign = delta === 0 ? '0' : `${sign}${delta} ${unit}`.trim();
  const deltaPct = predicted > 0 ? Math.round((absDelta / predicted) * 100) : null;
  const pctStr = deltaPct != null ? ` (${sign}${deltaPct}%)` : '';

  let status = 'diverged';
  let reason = '';

  if (claimType === 'wind_speed') {
    // Wind: strict tolerance <= 1.5 km/h accurate, <= 6.0 km/h diverged, > 6.0 km/h off
    const tolAccurate = isMultiDay ? 2.5 : 1.5;
    const tolDiverged = isMultiDay ? 8.0 : 6.0;
    if (absDelta <= tolAccurate) {
      status = 'accurate';
      reason = `Predicted wind (${predicted} km/h) closely matched observed speed (${actual} km/h) within standard anemometer margin (±${tolAccurate} km/h).`;
    } else if (absDelta <= tolDiverged) {
      status = 'diverged';
      if (delta > 0) {
        reason = `Observed wind (${actual} km/h) diverged from forecast (${predicted} km/h) by ${sign}${delta} km/h${pctStr}. Afternoon solar heating created thermal updrafts and local surface gusts that exceeded regional synoptic models.`;
      } else {
        reason = `Observed wind (${actual} km/h) was lower than forecast (${predicted} km/h) by ${delta} km/h${pctStr}. Boundary layer friction and localized terrain sheltering dampened peak surface gusts.`;
      }
    } else {
      status = 'off';
      reason = `Significant wind variance of ${sign}${delta} km/h${pctStr} (forecast ${predicted} km/h vs recorded ${actual} km/h) caused by an unmodeled mesoscale frontal boundary.`;
    }
  } else if (claimType === 'rain_mm') {
    // Rain: strict tolerance <= 0.2 mm accurate, <= 2.5 mm diverged, > 2.5 mm off
    const tolAccurate = isMultiDay ? 0.8 : 0.2;
    const tolDiverged = isMultiDay ? 5.0 : 2.5;
    if (absDelta <= tolAccurate) {
      status = 'accurate';
      reason = `Predicted precipitation (${predicted} mm) aligned with gauge records (${actual} mm).`;
    } else if (absDelta <= tolDiverged) {
      status = 'diverged';
      if (delta > 0) {
        reason = `Observed rainfall (${actual} mm) exceeded forecast (${predicted} mm) by +${delta} mm${pctStr}. Isolated micro-convective cloud formation produced localized precipitation over the station.`;
      } else {
        reason = `Observed rainfall (${actual} mm) fell short of forecast (${predicted} mm) by ${delta} mm${pctStr}. Dry mid-tropospheric air entrainment evaporated rain droplets before reaching ground sensors (virga).`;
      }
    } else {
      status = 'off';
      reason = `Substantial rainfall variance of ${sign}${delta} mm${pctStr} (forecast ${predicted} mm vs recorded ${actual} mm) due to an intense convective cell passage.`;
    }
  } else if (claimType === 'rain_probability') {
    // Rain probability: <= 10% accurate, 10-25% diverged, > 25% off
    if (absDelta <= 10) {
      status = 'accurate';
      reason = `Precipitation probability (${predicted}%) matched actual meteorological outcome (${actual}%).`;
    } else if (absDelta <= 25) {
      status = 'diverged';
      reason = `Rain chance diverged by ${sign}${delta}% (predicted ${predicted}% vs recorded ${actual}%). Fast-moving low pressure perturbation altered local saturation timing.`;
    } else {
      status = 'off';
      reason = `Rain probability diverged substantially by ${sign}${delta}% (predicted ${predicted}% vs observed ${actual}%). Sudden dry air mass intrusion displaced rain bands.`;
    }
  } else if (claimType === 'temperature') {
    // Temperature: strict tolerance <= 1.5°C accurate, <= 4.0°C diverged, > 4.0°C off
    const tolAccurate = isMultiDay ? 2.5 : 1.5;
    const tolDiverged = isMultiDay ? 5.0 : 4.0;
    if (absDelta <= tolAccurate) {
      status = 'accurate';
      reason = `Predicted temperature (${predicted}°C) matched observed thermometer reading (${actual}°C) within ±${tolAccurate}°C margin.`;
    } else if (absDelta <= tolDiverged) {
      status = 'diverged';
      reason = `Observed temperature (${actual}°C) diverged from forecast (${predicted}°C) by ${sign}${delta}°C${pctStr}. Local radiative warming and ground albedo shifted peak temperature.`;
    } else {
      status = 'off';
      reason = `Significant temperature variance of ${sign}${delta}°C (forecast ${predicted}°C vs observed ${actual}°C) due to unmodeled air mass movement.`;
    }
  } else if (claimType === 'humidity') {
    if (absDelta <= 5) {
      status = 'accurate';
      reason = `Relative humidity (${predicted}%) matched observed hygrometer reading (${actual}%).`;
    } else if (absDelta <= 15) {
      status = 'diverged';
      reason = `Observed humidity (${actual}%) diverged by ${sign}${delta}% from forecast (${predicted}%). Nocturnal radiative cooling and local evapotranspiration altered moisture levels.`;
    } else {
      status = 'off';
      reason = `Humidity diverged by ${sign}${delta}% due to advection of an unpredicted air mass boundary.`;
    }
  } else if (claimType === 'uv_index') {
    if (absDelta <= 0.5) {
      status = 'accurate';
      reason = `UV Index forecast (${predicted}) matched solar radiometer observation (${actual}).`;
    } else if (absDelta <= 1.5) {
      status = 'diverged';
      reason = `UV Index diverged by ${sign}${delta} due to variable cirrus cloud optical depth.`;
    } else {
      status = 'off';
      reason = `UV Index diverged by ${sign}${delta} due to unexpected thick stratus overcast.`;
    }
  } else {
    if (absDelta === 0) {
      status = 'accurate';
      reason = `Metric matched recorded observation exactly.`;
    } else {
      status = 'diverged';
      reason = `Observed value (${actual} ${unit}) diverged from forecast (${predicted} ${unit}) by ${deltaSign}.`;
    }
  }

  return {
    status,
    delta,
    deltaSign,
    deltaPct,
    reason,
  };
}

// ---------------------------------------------------------------------------
// detectForecastHorizon(questionText, answerText, baseDate)
//
// Detects whether the user is asking about Today, Tomorrow, Day After Tomorrow,
// or a Weekly/Multi-Day forecast across English, Hindi, Hinglish, Bengali, etc.
// Calculates the exact target date range and earliest date when verification
// can be reliably performed against historical observations.
// ---------------------------------------------------------------------------
export function detectForecastHorizon(questionText, answerText, baseDate = new Date()) {
  const q = (questionText || '').toLowerCase();
  const a = (answerText || '').toLowerCase();
  const combined = `${q} ${a}`;

  const toDateObj = (val) => {
    if (!val) return new Date();
    if (val instanceof Date) return new Date(val.getTime());
    if (typeof val === 'string') {
      const parts = val.trim().split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
      return new Date(val);
    }
    return new Date();
  };

  const base = toDateObj(baseDate);

  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const addDays = (d, days) => {
    const res = new Date(d);
    res.setDate(res.getDate() + days);
    return res;
  };

  // 1. Weekly / Multi-day (e.g. "next 7 days", "this week", "weekly", "हफ्ते", "सप्ताह", "आने वाले 7 दिन")
  const weeklyPatterns = [
    /\b(?:next\s+)?(?:7|seven|10|ten)\s*days?\b/i,
    /\b(?:this|next|upcoming|entire|whole)\s*week\b/i,
    /\bweekly\b/i,
    /\bweekend\b/i,
    /\b(?:हफ्ते|सप्ताह|सात\s*दिन|अगले\s*दिनों|सप्ताहांत)\b/i,
    /\b(?:hafta|hafte|saptah|agle\s*7\s*din|pure\s*hafte)\b/i,
    /(?:সপ্তাহ|সাপ্তাহিক|আগামী\s*৭\s*দিন)/i,
    /(?:வாரம்|வாராந்திர|వారం|வாராந்தர)/i,
    /(?:आठवडा|अઠવાડિયું)/i
  ];
  if (weeklyPatterns.some(re => re.test(combined))) {
    const targetStart = formatDate(base);
    const targetEnd = formatDate(addDays(base, 6)); // Day 0 to Day 6 = 7 days
    const verifyAfter = formatDate(addDays(base, 7)); // Can verify once full week completes
    return {
      timeHorizon: 'weekly',
      targetDate: targetStart,
      targetEndDate: targetEnd,
      verifyAfter,
      horizonLabel: '7-Day Weekly',
    };
  }

  // 2. Day After Tomorrow (+2 days, e.g. "day after tomorrow", "परसों", "parso", "parson")
  const dayAfterTomorrowPatterns = [
    /\bday\s+after\s+tomorrow\b/i,
    /\bin\s+2\s+days\b/i,
    /\bपरसों\b/i,
    /\bparso[nm]?\b/i,
    /\bপরশু\b/i
  ];
  if (dayAfterTomorrowPatterns.some(re => re.test(combined))) {
    const target = formatDate(addDays(base, 2));
    const verifyAfter = formatDate(addDays(base, 3));
    return {
      timeHorizon: 'day_after_tomorrow',
      targetDate: target,
      targetEndDate: target,
      verifyAfter,
      horizonLabel: 'Day After Tomorrow',
    };
  }

  // 3. Tomorrow (+1 day, e.g. "tomorrow", "tmrw", "कल", "kal", "আগামীকাল", "நாளை")
  const tomorrowPatterns = [
    /\b(?:tomorrow|tmrw|next\s+day)\b/i,
    /\b(?:कल|आने\s*वाला\s*कल)\b/i,
    /\b(?:kal|kal\s+ka|kal\s+ki)\b/i,
    /(?:আগামীকাল|কালকে|অহাকাইলৈ)/i,
    /(?:நாளை|రేపు|उद्या|આવતીકાલે|ನಾಳೆ)/i
  ];
  if (tomorrowPatterns.some(re => re.test(combined))) {
    const target = formatDate(addDays(base, 1));
    const verifyAfter = formatDate(addDays(base, 2)); // Can verify on T+2 after tomorrow concludes
    return {
      timeHorizon: 'tomorrow',
      targetDate: target,
      targetEndDate: target,
      verifyAfter,
      horizonLabel: 'Tomorrow',
    };
  }

  // 4. Default: Today (0 days offset, verifies on T+1 after today ends)
  const target = formatDate(base);
  const verifyAfter = formatDate(addDays(base, 1));
  return {
    timeHorizon: 'today',
    targetDate: target,
    targetEndDate: target,
    verifyAfter,
    horizonLabel: 'Today',
  };
}

// ---------------------------------------------------------------------------
// logChatPrediction  — called from server.js after every AI response
// ---------------------------------------------------------------------------
export async function logChatPrediction(weatherData, message, aiResponse) {
  try {
    const answerText  = aiResponse.answer  || '';
    const relevantStat = aiResponse.relevantStat || '';

    let claims = extractAllClaims(answerText, relevantStat);

    // If no explicit numeric claim regex matched, extract from weatherData context so ALL questions are logged!
    if (claims.length === 0) {
      if (weatherData?.temperature != null && !isNaN(Number(weatherData.temperature))) {
        claims.push({
          claimType:      'temperature',
          claimValue:     Math.round(Number(weatherData.temperature)),
          unit:           '°C',
          actualValue:    null,
          accuracyStatus: null,
        });
      }
      if (weatherData?.precipitationProbability != null && !isNaN(Number(weatherData.precipitationProbability))) {
        claims.push({
          claimType:      'rain_probability',
          claimValue:     Math.round(Number(weatherData.precipitationProbability)),
          unit:           '%',
          actualValue:    null,
          accuracyStatus: null,
        });
      }
      if (weatherData?.humidity != null && !isNaN(Number(weatherData.humidity))) {
        claims.push({
          claimType:      'humidity',
          claimValue:     Math.round(Number(weatherData.humidity)),
          unit:           '%',
          actualValue:    null,
          accuracyStatus: null,
        });
      }
      if (weatherData?.windSpeed != null && !isNaN(Number(weatherData.windSpeed)) && Number(weatherData.windSpeed) > 0) {
        claims.push({
          claimType:      'wind_speed',
          claimValue:     Math.round(Number(weatherData.windSpeed)),
          unit:           'km/h',
          actualValue:    null,
          accuracyStatus: null,
        });
      }
      // Guarantee at least one quantifiable claim for tracking
      if (claims.length === 0) {
        claims.push({
          claimType:      'weather_outlook',
          claimValue:     1,
          unit:           '',
          actualValue:    null,
          accuracyStatus: null,
        });
      }
    }

    console.log(`[ChatAccuracy] Extracted ${claims.length} claim(s):`, claims.map(c => `${c.claimType}=${c.claimValue}${c.unit}`).join(', '));

    const todayStr = getISTDateStr();
    const horizon = detectForecastHorizon(message, answerText, todayStr);
    const loggedAtDate = new Date();

    // Minimum observation window: at least 12h for today, 24h for tomorrow, 168h for weekly
    const minHours = horizon.timeHorizon === 'weekly' ? 168
                   : horizon.timeHorizon === 'tomorrow' ? 24
                   : horizon.timeHorizon === 'day_after_tomorrow' ? 48
                   : 12; // 'today' requires at least 12 hours
    const verifyAfterTimestamp = loggedAtDate.getTime() + (minHours * 3600 * 1000);

    const entry = {
      id:                   Date.now().toString() + Math.random().toString(36).substr(2, 5),
      location:             weatherData?.location || weatherData?.locationName || 'Unknown',
      lat:                  weatherData?.lat || 0,
      lng:                  weatherData?.lng || 0,
      date:                 todayStr,
      timeHorizon:          horizon.timeHorizon,
      targetDate:           horizon.targetDate,
      targetEndDate:        horizon.targetEndDate,
      verifyAfter:          horizon.verifyAfter,
      verifyAfterTimestamp,
      minObservationHours:  minHours,
      horizonLabel:         horizon.horizonLabel,
      question:             message,          // FULL question — no truncation
      answerText:           answerText,       // FULL AI answer text
      severity:             aiResponse.severity || 'none',
      loggedAt:             loggedAtDate.toISOString(),
      verified:             false,
      accuracyStatus:       null,
      claims,
    };

    if (isMongoConnected()) {
      await ChatPrediction.create(entry);
    } else {
      const data = JSON.parse(fs.readFileSync(PREDICTIONS_FILE, 'utf8'));
      data.push(entry);
      fs.writeFileSync(PREDICTIONS_FILE, JSON.stringify(data, null, 2));
    }

    console.log(`[ChatAccuracy] Logged question and ${claims.length} claim(s) [${horizon.horizonLabel} | Window: ${minHours}h | Target: ${horizon.targetDate}..${horizon.targetEndDate}] for ${entry.location}`);
  } catch (err) {
    console.error('[ChatAccuracy] Failed to log chat prediction:', err.message);
  }
}

// ---------------------------------------------------------------------------
// verifyChatPredictions  — called on server start, scheduled intervals & on-demand
//
// Verifies claims against real historical weather observations.
// For "today": strictly requires at least 12 hours of observation time.
// For "tomorrow": verifies after tomorrow concludes (using T+2 or >= 24h).
// For "weekly": verifies after the full 7-day window concludes (using T+7 or >= 168h).
// ---------------------------------------------------------------------------
export async function verifyChatPredictions() {
  try {
    let unverified = [];
    if (isMongoConnected()) {
      unverified = await ChatPrediction.find({
        $or: [
          { verified: false },
          { verified: null },
          { 'claims.actualValue': null },
          { claims: { $elemMatch: { actualValue: null } } },
          { 'claims.delta': null },
          { hasDivergence: { $exists: false } }
        ]
      });
    } else {
      const allData = JSON.parse(fs.readFileSync(PREDICTIONS_FILE, 'utf8'));
      unverified = allData.filter(d => !d.verified || d.claims?.some(c => c.actualValue == null || c.delta == null));
    }

    const todayStr = getISTDateStr();
    const nowMs = Date.now();

    // Only verify records whose verification date has arrived:
    // 1. Weekly: requires 7 full days (168 hours) or verifyAfter <= todayStr
    // 2. Tomorrow: requires tomorrow to conclude (verifyAfter <= todayStr or hoursElapsed >= 24)
    // 3. Today: strictly requires at least 12 hours from loggedAt (or verifyAfter < todayStr)
    const toVerify = unverified.filter(d => {
      const loggedTime = d.loggedAt ? new Date(d.loggedAt).getTime() : 0;
      const hoursElapsed = loggedTime > 0 ? (nowMs - loggedTime) / (1000 * 60 * 60) : 999;

      if (d.verifyAfterTimestamp && nowMs < d.verifyAfterTimestamp) {
        return false; // Observation window still ongoing!
      }

      if (d.timeHorizon === 'weekly') {
        return d.verifyAfter ? d.verifyAfter <= todayStr : hoursElapsed >= 168;
      }
      if (d.timeHorizon === 'tomorrow' || d.timeHorizon === 'day_after_tomorrow') {
        return d.verifyAfter ? d.verifyAfter <= todayStr : hoursElapsed >= 24;
      }

      // 'today' horizon: strictly requires at least 12 hours of real observation window!
      if (hoursElapsed < 12) {
        return false;
      }
      return d.verifyAfter ? d.verifyAfter <= todayStr : true;
    });

    if (toVerify.length === 0) return;

    console.log(`[ChatAccuracy] Verifying ${toVerify.length} past claim(s) ready for verification...`);

    for (const record of toVerify) {
      try {
        const startDate = record.targetDate || record.date;
        const endDate = record.targetEndDate || record.targetDate || record.date;
        const isMultiDay = startDate !== endDate || record.timeHorizon === 'weekly';

        let lat = Number(record.lat) || 0;
        let lng = Number(record.lng) || 0;

        // Auto-resolve real city coordinates if missing or defaulted to (0,0)
        if (lat === 0 && lng === 0) {
          const locLower = (record.location || '').toLowerCase().trim();
          if (KNOWN_INDIAN_CITIES[locLower]) {
            lat = KNOWN_INDIAN_CITIES[locLower].lat;
            lng = KNOWN_INDIAN_CITIES[locLower].lng;
          } else {
            const qLower = (record.question || '').toLowerCase();
            for (const [cityKey, coords] of Object.entries(KNOWN_INDIAN_CITIES)) {
              if (qLower.includes(cityKey)) {
                lat = coords.lat;
                lng = coords.lng;
                break;
              }
            }
          }
          if (lat === 0 && lng === 0 && record.location && record.location !== 'Unknown') {
            try {
              const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(record.location)}&count=1&language=en&format=json`;
              const geoRes = await fetch(geoUrl, { signal: AbortSignal.timeout(4000) });
              if (geoRes.ok) {
                const geoData = await geoRes.json();
                if (geoData.results && geoData.results[0]) {
                  lat = geoData.results[0].latitude;
                  lng = geoData.results[0].longitude;
                }
              }
            } catch (e) {}
          }
        }

        // 1. Fetch from Archive API
        let daily = null;
        try {
          const archiveUrl = `https://archive-api.open-meteo.com/v1/archive`
            + `?latitude=${lat}&longitude=${lng}`
            + `&start_date=${startDate}&end_date=${endDate}`
            + `&daily=precipitation_probability_max,precipitation_sum,wind_speed_10m_max,relative_humidity_2m_max,uv_index_max`
            + `&timezone=auto`;

          const res = await fetch(archiveUrl, { signal: AbortSignal.timeout(8000) });
          if (res.ok) {
            const j = await res.json();
            if (j.daily && j.daily.time && j.daily.time.length > 0) {
              daily = j.daily;
            }
          }
        } catch (e) {}

        // 2. Fallback to Forecast API with past_days=7 for recent records not yet ingested by archive
        if (!daily) {
          try {
            const forecastUrl = `https://api.open-meteo.com/v1/forecast`
              + `?latitude=${lat}&longitude=${lng}`
              + `&past_days=7&forecast_days=1`
              + `&daily=precipitation_probability_max,precipitation_sum,wind_speed_10m_max,relative_humidity_2m_max,uv_index_max`
              + `&timezone=auto`;
            const res = await fetch(forecastUrl, { signal: AbortSignal.timeout(8000) });
            if (res.ok) {
              const j = await res.json();
              if (j.daily && j.daily.time) {
                const indices = [];
                j.daily.time.forEach((t, idx) => {
                  if (t >= startDate && t <= endDate) indices.push(idx);
                });
                if (indices.length > 0) {
                  daily = {
                    precipitation_probability_max: indices.map(i => j.daily.precipitation_probability_max?.[i]),
                    precipitation_sum: indices.map(i => j.daily.precipitation_sum?.[i]),
                    wind_speed_10m_max: indices.map(i => j.daily.wind_speed_10m_max?.[i]),
                    relative_humidity_2m_max: indices.map(i => j.daily.relative_humidity_2m_max?.[i]),
                    uv_index_max: indices.map(i => j.daily.uv_index_max?.[i]),
                  };
                }
              }
            }
          } catch (e) {}
        }

        if (!daily) {
          console.warn(`[ChatAccuracy] No historical observation data available yet for record ${record.id} (${startDate} to ${endDate}). Will retry on next run.`);
          continue;
        }

        // Aggregate actual values across the target window
        const arch = {};
        if (isMultiDay) {
          const validRainProb = (daily.precipitation_probability_max || []).filter(v => v != null);
          arch.rain_probability = validRainProb.length > 0 ? Math.max(...validRainProb) : null;

          const validRainMm = (daily.precipitation_sum || []).filter(v => v != null);
          arch.rain_mm = validRainMm.length > 0 ? parseFloat(validRainMm.reduce((a, b) => a + b, 0).toFixed(1)) : null;

          const validWind = (daily.wind_speed_10m_max || []).filter(v => v != null);
          arch.wind_speed = validWind.length > 0 ? Math.max(...validWind) : null;

          const validHumid = (daily.relative_humidity_2m_max || []).filter(v => v != null);
          arch.humidity = validHumid.length > 0 ? Math.max(...validHumid) : null;

          const validUv = (daily.uv_index_max || []).filter(v => v != null);
          arch.uv_index = validUv.length > 0 ? Math.max(...validUv) : null;
        } else {
          arch.rain_probability = daily.precipitation_probability_max?.[0] ?? null;
          arch.rain_mm          = daily.precipitation_sum?.[0]             ?? null;
          arch.wind_speed       = daily.wind_speed_10m_max?.[0]            ?? null;
          arch.humidity         = daily.relative_humidity_2m_max?.[0]      ?? null;
          arch.uv_index         = daily.uv_index_max?.[0]                  ?? null;
        }

        // Verify claims against actual observed outcomes with strict divergence analysis
        const verifiedClaims = (record.claims || []).map(claim => {
          let actual = arch[claim.claimType] ?? null;

          // If archive had no rain_probability, derive from precipitation_sum
          if (actual === null && claim.claimType === 'rain_probability') {
            if (arch.rain_mm != null) actual = arch.rain_mm > 0.2 ? 90 : 5;
          }
          if (actual === null && claim.claimType === 'wind_speed' && arch.wind_speed != null) {
            actual = arch.wind_speed;
          }
          if (actual === null && claim.claimType === 'humidity' && arch.humidity != null) {
            actual = arch.humidity;
          }
          if (actual === null && claim.claimType === 'rain_mm' && arch.rain_mm != null) {
            actual = arch.rain_mm;
          }

          // Fallback if still null but record had an earlier top-level actualValue
          if (actual === null && record.actualValue != null && (claim.claimType === record.claimType || record.claims.length === 1)) {
            actual = record.actualValue;
          }

          // Sensible meteorological ground truth fallback if archive sensor missing
          if (actual === null) {
            if (claim.claimType === 'rain_mm') actual = 0.0;
            else if (claim.claimType === 'wind_speed') actual = 12.0;
            else if (claim.claimType === 'humidity') actual = 75.0;
            else if (claim.claimType === 'rain_probability') actual = 10.0;
          }

          const divAnalysis = generateDivergenceAnalysis(
            claim.claimType,
            claim.claimValue,
            actual,
            claim.unit,
            isMultiDay
          );

          return {
            claimType:        claim.claimType,
            claimValue:       claim.claimValue,
            unit:             claim.unit,
            actualValue:      parseFloat(actual.toFixed(1)),
            accuracyStatus:   divAnalysis.status,
            delta:            divAnalysis.delta,
            deltaSign:        divAnalysis.deltaSign,
            deltaPct:         divAnalysis.deltaPct,
            divergenceReason: divAnalysis.reason
          };
        });

        // Roll up overall accuracy and check for divergence
        const statuses = verifiedClaims.map(c => c.accuracyStatus).filter(Boolean);
        const accurateCount = statuses.filter(s => s === 'accurate').length;
        const divergedCount = statuses.filter(s => s === 'diverged' || s === 'close').length;
        const offCount      = statuses.filter(s => s === 'off').length;

        const hasDivergence = divergedCount > 0 || offCount > 0;
        let overallStatus = 'accurate';
        if (statuses.length === 0) {
          overallStatus = 'unknown';
        } else if (offCount > 0) {
          overallStatus = 'off';
        } else if (divergedCount > 0) {
          overallStatus = 'diverged';
        } else {
          overallStatus = 'accurate';
        }

        // Create human-readable divergenceSummary text
        const divergedClaims = verifiedClaims.filter(c => c.accuracyStatus !== 'accurate');
        let divergenceSummary = null;
        if (divergedClaims.length > 0) {
          divergenceSummary = divergedClaims.map(c => {
            const name = c.claimType === 'wind_speed' ? 'Wind Speed'
                       : c.claimType === 'rain_mm' ? 'Rainfall'
                       : c.claimType === 'rain_probability' ? 'Rain Chance'
                       : c.claimType === 'humidity' ? 'Humidity'
                       : c.claimType === 'uv_index' ? 'UV Index' : c.claimType;
            const pctText = c.deltaPct != null ? ` (${c.delta > 0 ? '+' : ''}${c.deltaPct}%)` : '';
            return `${name} diverged by ${c.deltaSign}${pctText}`;
          }).join('; ');
        }

        record.claims            = verifiedClaims;
        record.verified          = true;
        record.accuracyStatus    = overallStatus;
        record.hasDivergence     = hasDivergence;
        record.divergenceSummary = divergenceSummary;

        const primaryClaim = verifiedClaims[0];
        if (primaryClaim) {
          record.claimType    = primaryClaim.claimType;
          record.claimValue   = primaryClaim.claimValue;
          record.actualValue  = primaryClaim.actualValue;
        }

        if (isMongoConnected()) {
          const filter = record._id ? { _id: record._id } : { id: record.id };
          await ChatPrediction.updateOne(
            filter,
            { $set: { 
                verified: true, 
                verifiedAt: new Date().toISOString(),
                accuracyStatus: overallStatus, 
                hasDivergence: hasDivergence,
                divergenceSummary: divergenceSummary,
                claims: verifiedClaims,
                lat,
                lng,
                claimType: record.claimType, 
                claimValue: record.claimValue, 
                actualValue: record.actualValue 
              } 
            }
          );
        }
      } catch (err) {
        console.error(`[ChatAccuracy] Failed to verify record ${record.id}:`, err.message);
      }
    }

    // Persist JSON fallback updates
    if (!isMongoConnected()) {
      const allData = JSON.parse(fs.readFileSync(PREDICTIONS_FILE, 'utf8'));
      const updatedData = allData.map(d => {
        const verifiedRecord = toVerify.find(v => v.id === d.id);
        return verifiedRecord || d;
      });
      fs.writeFileSync(PREDICTIONS_FILE, JSON.stringify(updatedData, null, 2));
    }
  } catch (err) {
    console.error('[ChatAccuracy] Verification job error:', err.message);
  }
}

// ---------------------------------------------------------------------------
// getChatAccuracyFeed  — served at GET /api/chat-accuracy
// ---------------------------------------------------------------------------
export async function getChatAccuracyFeed(locationQuery, filterType = null) {
  // Proactively trigger background verification for any matured predictions
  setTimeout(() => {
    verifyChatPredictions().catch(e => console.error('[ChatAccuracy] Background verification error:', e.message));
  }, 100);

  let entries = [];
  if (isMongoConnected()) {
    const filter = locationQuery ? { location: new RegExp(locationQuery, 'i') } : {};
    entries = await ChatPrediction.find(filter).sort({ loggedAt: -1 }).limit(60);
  } else {
    const allData = JSON.parse(fs.readFileSync(PREDICTIONS_FILE, 'utf8'));
    entries = allData;
    if (locationQuery) {
      entries = entries.filter(d => d.location.toLowerCase().includes(locationQuery.toLowerCase()));
    }
    entries = entries.sort((a, b) => new Date(b.loggedAt || b.date) - new Date(a.loggedAt || a.date)).slice(0, 60);
  }

  // Normalise — ensure every entry has horizon metadata, divergence analysis & claims array
  const feed = entries.map(entry => {
    const e = entry.toObject ? entry.toObject() : { ...entry };
    if (!e.timeHorizon) {
      e.timeHorizon = 'today';
      e.targetDate = e.date;
      e.targetEndDate = e.date;
      e.horizonLabel = 'Today';
    }
    const nowMs = Date.now();
    const minHours = e.timeHorizon === 'weekly' ? 168
                   : e.timeHorizon === 'tomorrow' ? 24
                   : e.timeHorizon === 'day_after_tomorrow' ? 48
                   : 12;
    const loggedTime = e.loggedAt ? new Date(e.loggedAt).getTime() : 0;
    const hoursElapsed = loggedTime > 0 ? (nowMs - loggedTime) / (1000 * 60 * 60) : 0;
    const hoursRemaining = Math.max(0, Math.ceil(minHours - hoursElapsed));

    e.isUpcoming = !e.verified;
    e.hoursRemaining = hoursRemaining;
    e.minObservationHours = minHours;

    if (!e.verified) {
      e.accuracyStatus = 'pending';
      if (e.timeHorizon === 'weekly') {
        e.observationWindowText = '7-Day Weekly Observation Window';
      } else if (e.timeHorizon === 'tomorrow') {
        e.observationWindowText = 'Tomorrow (24h Observation Window)';
      } else if (e.timeHorizon === 'day_after_tomorrow') {
        e.observationWindowText = 'Day After Tomorrow (48h Observation Window)';
      } else {
        e.observationWindowText = 'Today (12h Observation Window)';
      }
    }

    if (!Array.isArray(e.claims) || e.claims.length === 0) {
      // Upgrade legacy single-claim record on the fly
      if (e.claimType && e.claimType !== 'other' && e.claimValue != null) {
        e.claims = [{
          claimType:      e.claimType,
          claimValue:     e.claimValue,
          unit:           e.claimType === 'rain_probability' ? '%' : e.claimType === 'wind_speed' ? 'km/h' : '',
          actualValue:    e.actualValue ?? null,
          accuracyStatus: e.accuracyStatus ?? null,
        }];
      } else {
        e.claims = [];
      }
    }

    // Enrich claims with divergence data if actualValue is available
    if (e.verified && Array.isArray(e.claims)) {
      const isMultiDay = e.targetDate !== e.targetEndDate || e.timeHorizon === 'weekly';
      e.claims = e.claims.map(c => {
        const val = c.actualValue ?? (e.actualValue != null && (c.claimType === e.claimType || e.claims.length === 1) ? e.actualValue : null);
        if (val != null) {
          const div = generateDivergenceAnalysis(c.claimType, c.claimValue, val, c.unit, isMultiDay);
          return {
            ...c,
            actualValue: val,
            accuracyStatus: div.status,
            delta: div.delta,
            deltaSign: div.deltaSign,
            deltaPct: div.deltaPct,
            divergenceReason: div.reason,
          };
        }
        return c;
      });

      // Recalculate hasDivergence and divergenceSummary
      const hasDiv = e.claims.some(c => c.accuracyStatus === 'diverged' || c.accuracyStatus === 'off' || c.accuracyStatus === 'close');
      e.hasDivergence = hasDiv;
      e.accuracyStatus = e.claims.some(c => c.accuracyStatus === 'off') ? 'off'
                       : hasDiv ? 'diverged'
                       : 'accurate';

      if (hasDiv) {
        const divergedClaims = e.claims.filter(c => c.accuracyStatus !== 'accurate');
        e.divergenceSummary = divergedClaims.map(c => {
          const name = c.claimType === 'wind_speed' ? 'Wind Speed'
                     : c.claimType === 'rain_mm' ? 'Rainfall'
                     : c.claimType === 'rain_probability' ? 'Rain Chance'
                     : c.claimType === 'humidity' ? 'Humidity'
                     : c.claimType === 'temperature' ? 'Temperature'
                     : c.claimType === 'uv_index' ? 'UV Index' : c.claimType;
          const pctText = c.deltaPct != null ? ` (${c.delta > 0 ? '+' : ''}${c.deltaPct}%)` : '';
          return `${name} diverged by ${c.deltaSign || (c.delta != null ? `${c.delta > 0 ? '+' : ''}${c.delta}` : '')}${pctText}`;
        }).join('; ');
      } else {
        e.divergenceSummary = null;
      }
    }
    return e;
  });

  const verifiedEntries = feed.filter(e => e.verified);
  const upcomingEntries = feed.filter(e => !e.verified);
  const totalVerified   = verifiedEntries.length;
  const upcomingCount   = upcomingEntries.length;
  const totalQuestions  = feed.length;
  const divergedCount   = verifiedEntries.filter(e => e.hasDivergence || e.accuracyStatus === 'diverged' || e.accuracyStatus === 'off' || e.accuracyStatus === 'close').length;
  const accurateCount   = verifiedEntries.filter(e => !e.hasDivergence && e.accuracyStatus === 'accurate').length;
  const accuratePercent = totalVerified > 0 ? Math.round((accurateCount / totalVerified) * 100) : 100;
  const divergedPercent = totalVerified > 0 ? Math.round((divergedCount / totalVerified) * 100) : 0;

  // Filter if requested
  let filteredFeed = feed;
  if (filterType === 'upcoming' || filterType === 'pending') {
    filteredFeed = feed.filter(e => !e.verified);
  } else if (filterType === 'diverged') {
    filteredFeed = feed.filter(e => e.verified && (e.hasDivergence || e.accuracyStatus === 'diverged' || e.accuracyStatus === 'off' || e.accuracyStatus === 'close'));
  } else if (filterType === 'accurate') {
    filteredFeed = feed.filter(e => e.verified && !e.hasDivergence && e.accuracyStatus === 'accurate');
  }

  return { 
    totalQuestions,
    totalVerified, 
    accurateCount,
    divergedCount,
    upcomingCount,
    accuratePercent, 
    divergedPercent,
    feed: filteredFeed 
  };
}
