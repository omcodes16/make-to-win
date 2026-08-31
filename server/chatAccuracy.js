import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { USE_MONGODB } from '../server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PREDICTIONS_FILE = path.join(__dirname, '..', 'chat_predictions.json');

// ---------------------------------------------------------------------------
// Sub-schema for a single quantifiable claim extracted from an AI answer
// ---------------------------------------------------------------------------
const claimSchema = new mongoose.Schema({
  claimType:      { type: String },   // e.g. 'rain_probability', 'wind_speed'
  claimValue:     { type: Number },   // numeric value the AI stated
  unit:           { type: String },   // '%', 'km/h', 'mm', etc.
  actualValue:    { type: Number, default: null },
  accuracyStatus: { type: String, default: null }, // 'accurate' | 'close' | 'off' | 'unknown'
}, { _id: false });

// ---------------------------------------------------------------------------
// Main Mongoose Schema  (additive vs. old schema — new fields are optional)
// ---------------------------------------------------------------------------
const chatPredictionSchema = new mongoose.Schema({
  id:             String,
  location:       String,
  lat:            Number,
  lng:            Number,
  date:           String,
  question:       String,   // FULL question text (no cap)
  answerText:     String,   // FULL AI answer text
  severity:       String,
  loggedAt:       String,
  verified:       Boolean,
  accuracyStatus: String,   // overall roll-up: 'accurate' | 'close' | 'off' | 'unknown'
  claims:         [claimSchema],

  // Legacy fields kept for backward-compat with old records in the store
  claimType:      String,
  claimValue:     Number,
  actualValue:    Number,
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
// logChatPrediction  — called from server.js after every AI response
// ---------------------------------------------------------------------------
export async function logChatPrediction(weatherData, message, aiResponse) {
  try {
    const answerText  = aiResponse.answer  || '';
    const relevantStat = aiResponse.relevantStat || '';

    const claims = extractAllClaims(answerText, relevantStat);

    if (claims.length === 0) {
      console.log('[ChatAccuracy] No quantifiable claims found in answer. Skipping log.');
      return;
    }

    console.log(`[ChatAccuracy] Extracted ${claims.length} claim(s):`, claims.map(c => `${c.claimType}=${c.claimValue}${c.unit}`).join(', '));

    const todayStr = new Date().toISOString().split('T')[0];

    const entry = {
      id:         Date.now().toString() + Math.random().toString(36).substr(2, 5),
      location:   weatherData?.location || weatherData?.locationName || 'Unknown',
      lat:        weatherData?.lat || 0,
      lng:        weatherData?.lng || 0,
      date:       todayStr,
      question:   message,          // FULL question — no truncation
      answerText: answerText,       // FULL AI answer text
      severity:   aiResponse.severity || 'none',
      loggedAt:   new Date().toISOString(),
      verified:   false,
      accuracyStatus: null,
      claims,
    };

    if (USE_MONGODB) {
      await ChatPrediction.create(entry);
    } else {
      const data = JSON.parse(fs.readFileSync(PREDICTIONS_FILE, 'utf8'));
      data.push(entry);
      fs.writeFileSync(PREDICTIONS_FILE, JSON.stringify(data, null, 2));
    }

    console.log(`[ChatAccuracy] Logged ${claims.length} claim(s) for ${entry.location} on ${todayStr}`);
  } catch (err) {
    console.error('[ChatAccuracy] Failed to log chat prediction:', err.message);
  }
}

// ---------------------------------------------------------------------------
// verifyChatPredictions  — called on server start and by daily cron
//
// For every unverified record whose date < today, fetch the Open-Meteo
// archive and verify EACH claim in the `claims` array independently.
// ---------------------------------------------------------------------------
export async function verifyChatPredictions() {
  try {
    let unverified = [];
    if (USE_MONGODB) {
      unverified = await ChatPrediction.find({ verified: false });
    } else {
      const allData = JSON.parse(fs.readFileSync(PREDICTIONS_FILE, 'utf8'));
      unverified = allData.filter(d => !d.verified);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const toVerify = unverified.filter(d => d.date < todayStr);

    if (toVerify.length === 0) return;

    console.log(`[ChatAccuracy] Verifying ${toVerify.length} past claims...`);

    for (const record of toVerify) {
      try {
        // Fetch all the fields we might need in one call
        const archiveUrl = `https://archive-api.open-meteo.com/v1/archive`
          + `?latitude=${record.lat}&longitude=${record.lng}`
          + `&start_date=${record.date}&end_date=${record.date}`
          + `&daily=precipitation_probability_max,precipitation_sum,wind_speed_10m_max,relative_humidity_2m_max,uv_index_max`
          + `&timezone=auto`;

        const res = await fetch(archiveUrl, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) continue;
        const j = await res.json();
        if (!j.daily) continue;

        const arch = {
          rain_probability: j.daily.precipitation_probability_max?.[0] ?? null,
          rain_mm:          j.daily.precipitation_sum?.[0]             ?? null,
          wind_speed:       j.daily.wind_speed_10m_max?.[0]            ?? null,
          humidity:         j.daily.relative_humidity_2m_max?.[0]      ?? null,
          uv_index:         j.daily.uv_index_max?.[0]                  ?? null,
        };

        // Verify each claim individually
        const verifiedClaims = (record.claims || []).map(claim => {
          const actual = arch[claim.claimType] ?? null;
          if (actual === null) {
            return { ...claim, actualValue: null, accuracyStatus: 'unknown' };
          }

          let status = 'off';
          const predicted = claim.claimValue;

          if (claim.claimType === 'rain_probability') {
            // Compare as directional category (both low, both high, or mismatch)
            if ((predicted > 60 && actual > 50) || (predicted <= 20 && actual <= 10)) status = 'accurate';
            else if (Math.abs(predicted - actual) <= 25) status = 'close';
          } else if (claim.claimType === 'rain_mm') {
            const diff = Math.abs(predicted - actual);
            if (diff <= 2)  status = 'accurate';
            else if (diff <= 8) status = 'close';
          } else if (claim.claimType === 'wind_speed') {
            const diff = Math.abs(predicted - actual);
            if (diff <= 5)  status = 'accurate';
            else if (diff <= 15) status = 'close';
          } else if (claim.claimType === 'humidity') {
            const diff = Math.abs(predicted - actual);
            if (diff <= 5)  status = 'accurate';
            else if (diff <= 15) status = 'close';
          } else if (claim.claimType === 'uv_index') {
            const diff = Math.abs(predicted - actual);
            if (diff <= 1)  status = 'accurate';
            else if (diff <= 2) status = 'close';
          } else {
            status = 'unknown';
          }

          return { ...claim, actualValue: parseFloat(actual.toFixed(1)), accuracyStatus: status };
        });

        // Roll up an overall accuracy status for the record
        const statuses = verifiedClaims.map(c => c.accuracyStatus).filter(Boolean);
        const accurateCount = statuses.filter(s => s === 'accurate').length;
        const closeCount    = statuses.filter(s => s === 'close').length;
        let overallStatus = 'off';
        if (statuses.length === 0) {
          overallStatus = 'unknown';
        } else if (accurateCount / statuses.length >= 0.5) {
          overallStatus = 'accurate';
        } else if (accurateCount + closeCount > 0) {
          overallStatus = 'close';
        }

        record.claims         = verifiedClaims;
        record.verified       = true;
        record.accuracyStatus = overallStatus;

        // Legacy fields for backward-compat with any old queries
        const primaryClaim = verifiedClaims[0];
        if (primaryClaim) {
          record.claimType    = primaryClaim.claimType;
          record.claimValue   = primaryClaim.claimValue;
          record.actualValue  = primaryClaim.actualValue;
        }

        if (USE_MONGODB) {
          await ChatPrediction.updateOne(
            { id: record.id },
            { $set: { verified: true, accuracyStatus: overallStatus, claims: verifiedClaims,
                      claimType: record.claimType, claimValue: record.claimValue, actualValue: record.actualValue } }
          );
        }
      } catch (err) {
        console.error(`[ChatAccuracy] Failed to verify record ${record.id}:`, err.message);
      }
    }

    // Persist JSON fallback updates
    if (!USE_MONGODB) {
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
export async function getChatAccuracyFeed(locationQuery) {
  let entries = [];
  if (USE_MONGODB) {
    const filter = locationQuery ? { location: new RegExp(locationQuery, 'i') } : {};
    entries = await ChatPrediction.find(filter).sort({ loggedAt: -1 }).limit(20);
  } else {
    const allData = JSON.parse(fs.readFileSync(PREDICTIONS_FILE, 'utf8'));
    entries = allData;
    if (locationQuery) {
      entries = entries.filter(d => d.location.toLowerCase().includes(locationQuery.toLowerCase()));
    }
    entries = entries.sort((a, b) => new Date(b.loggedAt || b.date) - new Date(a.loggedAt || a.date)).slice(0, 20);
  }

  const verifiedEntries = entries.filter(e => e.verified);
  const totalVerified   = verifiedEntries.length;
  const accurateCount   = verifiedEntries.filter(e => e.accuracyStatus === 'accurate' || e.accuracyStatus === 'close').length;
  const accuratePercent = totalVerified > 0 ? Math.round((accurateCount / totalVerified) * 100) : 0;

  // Normalise — ensure every entry has a `claims` array even if it's an old
  // record that was logged before this schema existed
  const feed = entries.map(entry => {
    const e = entry.toObject ? entry.toObject() : { ...entry };
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
    return e;
  });

  return { totalVerified, accuratePercent, feed };
}
