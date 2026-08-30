import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { USE_MONGODB } from '../server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PREDICTIONS_FILE = path.join(__dirname, '..', 'chat_predictions.json');

// Mongoose Schema
const chatPredictionSchema = new mongoose.Schema({
  id: String,
  location: String,
  lat: Number,
  lng: Number,
  date: String,
  question: String,
  claimType: String,
  claimValue: Number,
  severity: String,
  loggedAt: String,
  verified: Boolean,
  actualValue: Number,
  accuracyStatus: String
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

function parseRelevantStat(statString) {
  if (!statString) return null;
  // e.g. "RAIN: 68%", "Temperature: 33°C", "Wind: 24 km/h"
  const str = statString.toLowerCase();
  let claimType = 'other';
  if (str.includes('rain') || str.includes('precip')) claimType = 'rain_probability';
  else if (str.includes('temp')) claimType = 'temperature';
  else if (str.includes('wind')) claimType = 'wind_speed';
  
  const match = str.match(/(\d+)/);
  if (!match) return null;
  
  return {
    claimType,
    claimValue: parseInt(match[1], 10)
  };
}

export async function logChatPrediction(weatherData, message, aiResponse) {
  try {
    console.log('[DEBUG-ACCURACY] logChatPrediction called with relevantStat:', aiResponse.relevantStat);
    const statObj = parseRelevantStat(aiResponse.relevantStat);
    if (!statObj) {
      console.log('[DEBUG-ACCURACY] No parseable statObj found. Skipping.');
      return; 
    }
    console.log('[DEBUG-ACCURACY] statObj parsed:', statObj);

    const todayStr = new Date().toISOString().split('T')[0];

    const entry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      location: weatherData?.location || 'Unknown',
      lat: weatherData?.lat || 0,
      lng: weatherData?.lng || 0,
      date: todayStr, // Scope to today's claims for now
      question: message.substring(0, 100), // Keep it short
      claimType: statObj.claimType,
      claimValue: statObj.claimValue,
      severity: aiResponse.severity || 'low',
      loggedAt: new Date().toISOString(),
      verified: false,
      actualValue: null,
      accuracyStatus: null
    };

    if (USE_MONGODB) {
      console.log('[DEBUG-ACCURACY] Inserting into MongoDB...');
      await ChatPrediction.create(entry);
      console.log('[DEBUG-ACCURACY] MongoDB insert successful.');
    } else {
      console.log('[DEBUG-ACCURACY] Inserting into JSON file...');
      const data = JSON.parse(fs.readFileSync(PREDICTIONS_FILE, 'utf8'));
      data.push(entry);
      fs.writeFileSync(PREDICTIONS_FILE, JSON.stringify(data, null, 2));
    }
    console.log(`[ChatAccuracy] Logged claim for ${entry.location}: ${entry.claimType} = ${entry.claimValue}`);
  } catch (err) {
    console.error("[ChatAccuracy] Failed to log chat prediction:", err.message);
  }
}

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
    
    for (const claim of toVerify) {
      try {
        const archiveUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${claim.lat}&longitude=${claim.lng}&start_date=${claim.date}&end_date=${claim.date}&daily=temperature_2m_max,precipitation_sum,wind_speed_10m_max&timezone=auto`;
        const res = await fetch(archiveUrl, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) continue;
        const j = await res.json();
        if (!j.daily) continue;

        let actualValue = null;
        let accuracyStatus = 'off';

        if (claim.claimType === 'rain_probability') {
          actualValue = j.daily.precipitation_sum?.[0] || 0;
          if ((claim.claimValue > 50 && actualValue > 1) || (claim.claimValue <= 20 && actualValue <= 1)) {
            accuracyStatus = 'accurate';
          } else if ((claim.claimValue > 20 && claim.claimValue <= 50 && actualValue > 0)) {
            accuracyStatus = 'close';
          }
        } else if (claim.claimType === 'temperature') {
          actualValue = j.daily.temperature_2m_max?.[0] || 0;
          const diff = Math.abs(claim.claimValue - actualValue);
          if (diff <= 2) accuracyStatus = 'accurate';
          else if (diff <= 4) accuracyStatus = 'close';
        } else if (claim.claimType === 'wind_speed') {
          actualValue = j.daily.wind_speed_10m_max?.[0] || 0;
          const diff = Math.abs(claim.claimValue - actualValue);
          if (diff <= 5) accuracyStatus = 'accurate';
          else if (diff <= 15) accuracyStatus = 'close';
        } else {
          accuracyStatus = 'unknown';
        }

        claim.verified = true;
        claim.actualValue = actualValue;
        claim.accuracyStatus = accuracyStatus;

        if (USE_MONGODB) {
          await ChatPrediction.updateOne({ id: claim.id }, { verified: true, actualValue, accuracyStatus });
        }
      } catch (err) {
        console.error(`[ChatAccuracy] Failed to verify claim ${claim.id}:`, err.message);
      }
    }

    if (!USE_MONGODB) {
      const allData = JSON.parse(fs.readFileSync(PREDICTIONS_FILE, 'utf8'));
      const updatedData = allData.map(d => {
        const verifiedClaim = toVerify.find(v => v.id === d.id);
        return verifiedClaim ? verifiedClaim : d;
      });
      fs.writeFileSync(PREDICTIONS_FILE, JSON.stringify(updatedData, null, 2));
    }
  } catch (err) {
    console.error("[ChatAccuracy] Verification job error:", err.message);
  }
}

export async function getChatAccuracyFeed(locationQuery) {
  let entries = [];
  if (USE_MONGODB) {
    const filter = locationQuery ? { location: new RegExp(locationQuery, 'i') } : {};
    entries = await ChatPrediction.find(filter).sort({ date: -1 }).limit(20);
  } else {
    const allData = JSON.parse(fs.readFileSync(PREDICTIONS_FILE, 'utf8'));
    entries = allData;
    if (locationQuery) {
      entries = entries.filter(d => d.location.toLowerCase().includes(locationQuery.toLowerCase()));
    }
    entries = entries.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);
  }

  const verifiedEntries = entries.filter(e => e.verified);
  const totalVerified = verifiedEntries.length;
  const accurateCount = verifiedEntries.filter(e => e.accuracyStatus === 'accurate' || e.accuracyStatus === 'close').length;
  const accuratePercent = totalVerified > 0 ? Math.round((accurateCount / totalVerified) * 100) : 0;

  return {
    totalVerified,
    accuratePercent,
    feed: entries
  };
}
