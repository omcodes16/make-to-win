/**
 * One-Time Multilingual UI Translation Generator Script for WeatherGPT
 * Uses Bhashini NMT (or AI translation fallback) to translate all English
 * UI labels into newly supported Indian languages in batch.
 *
 * Usage:
 *   node scripts/generate_translations.js --dry-run
 *   node scripts/generate_translations.js --lang mr
 *   node scripts/generate_translations.js --all
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { batchTranslateFromEnglish } from '../server/bhashini.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Target Indian languages to generate translations for
const TARGET_LANGUAGES = [
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
  { code: 'sa', name: 'Sanskrit', native: 'संस्कृतम्' },
  { code: 'mai', name: 'Maithili', native: 'मैथिली' },
  { code: 'ne', name: 'Nepali', native: 'नेपाली' },
  { code: 'kok', name: 'Konkani', native: 'कोंकणी' },
];

// Core UI translation keys from translations.js
const CORE_UI_KEYS = {
  tooltipHeatIndex: "Heat Index shows how hot it actually feels to the human body when humidity is combined with the air temperature.",
  tooltipNwp: "NWP Divergence indicates how much the world's top 3 forecasting supercomputers agree or disagree. High agreement means the forecast is highly reliable.",
  tooltipSeverity: "Severity levels indicate if you need to take action. Caution means be prepared, while Severe means you should take immediate safety measures.",
  tabChat: 'Ask WeatherGPT',
  tabStage: 'Weather View',
  tabAlerts: 'High Alerts & News',
  searchPlaceholder: 'Search city...',
  fallbackLocation: 'Location access unavailable — search for your city instead.',
  fallbackName: 'Your location',
  searchPrompt: 'Search for a city or use your location to view the weather stage.',
  tempTab: 'Temperature',
  precipTab: 'Precipitation',
  windTab: 'Wind',
  today: 'Today',
  kmh: 'km/h',
  in: 'in',
  hum: 'Humidity',
  vis: 'Visibility',
  heat: 'Heat Index',
  rain: 'Rain',
  uv: 'UV Index',
  feelsLike: 'Feels like',
  sunrise: 'Sunrise',
  sunset: 'Sunset',
  windDir: 'Wind Dir',
  unknownLocation: 'Location not found. Try another city.',
  fetchFailed: 'Failed to fetch weather data.',
  forecast7Day: '7-Day Forecast',
  clear: 'Clear Sky',
  mostlyClear: 'Mainly Clear',
  partlyCloudy: 'Partly Cloudy',
  overcast: 'Overcast',
  fog: 'Fog',
  rimeFog: 'Freezing Rime Fog',
  lightDrizzle: 'Light Drizzle',
  modDrizzle: 'Moderate Drizzle',
  denseDrizzle: 'Dense Drizzle',
  freezingDrizzle: 'Freezing Drizzle',
  slightRain: 'Slight Rain',
  modRain: 'Moderate Rain',
  heavyRain: 'Heavy Rain',
  freezingRain: 'Freezing Rain',
  slightSnow: 'Slight Snow',
  modSnow: 'Moderate Snow',
  heavySnow: 'Heavy Snow',
  snowGrains: 'Snow Grains',
  slightShowers: 'Slight Rain Showers',
  modShowers: 'Moderate Rain Showers',
  violentShowers: 'Violent Rain Showers',
  thunderstorm: 'Thunderstorm',
  thunderstormHail: 'Thunderstorm with Hail',
  unknown: 'Unknown'
};

async function translateDictionary(dict, targetLangCode) {
  const keys = Object.keys(dict);
  const values = Object.values(dict);

  console.log(`  Translating ${values.length} strings to ${targetLangCode}...`);
  // Translate in batches of 15 to stay within limits and prevent payload truncation
  const BATCH_SIZE = 15;
  const translatedValues = [];

  for (let i = 0; i < values.length; i += BATCH_SIZE) {
    const chunk = values.slice(i, i + BATCH_SIZE);
    try {
      const translatedChunk = await batchTranslateFromEnglish(chunk, targetLangCode);
      if (Array.isArray(translatedChunk) && translatedChunk.length === chunk.length) {
        translatedValues.push(...translatedChunk);
      } else {
        translatedValues.push(...chunk); // fallback to original
      }
    } catch (e) {
      console.warn(`    Batch ${i}-${i + BATCH_SIZE} failed, using fallback:`, e.message);
      translatedValues.push(...chunk);
    }
  }

  const result = {};
  keys.forEach((k, idx) => {
    result[k] = translatedValues[idx] || dict[k];
  });
  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const targetLangArg = args.find((_, i) => args[i - 1] === '--lang');

  console.log('🌐 WeatherGPT One-Time Bhashini UI Translation Generator\n');

  let languagesToProcess = TARGET_LANGUAGES;
  if (targetLangArg) {
    languagesToProcess = TARGET_LANGUAGES.filter(l => l.code === targetLangArg);
    if (languagesToProcess.length === 0) {
      console.error(`Unknown language code: ${targetLangArg}`);
      process.exit(1);
    }
  }

  const outputPath = path.join(ROOT_DIR, 'src', 'utils', 'translations_generated.json');
  let existingGenerated = {};
  if (fs.existsSync(outputPath)) {
    try {
      existingGenerated = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    } catch (e) {}
  }

  for (const lang of languagesToProcess) {
    console.log(`\n▶ Generating translation for: ${lang.name} (${lang.native} - ${lang.code})`);
    
    if (isDryRun) {
      console.log(`  [DRY RUN] Would translate ${Object.keys(CORE_UI_KEYS).length} keys for ${lang.code}.`);
      continue;
    }

    const translatedDict = await translateDictionary(CORE_UI_KEYS, lang.code);
    existingGenerated[lang.code] = translatedDict;
    console.log(`  ✓ Completed ${lang.name} translation.`);
  }

  if (!isDryRun) {
    fs.writeFileSync(outputPath, JSON.stringify(existingGenerated, null, 2), 'utf-8');
    console.log(`\n💾 Saved generated translations to: ${outputPath}`);
    console.log(`   You can review the output in translations_generated.json and merge as needed.`);
  } else {
    console.log('\n[DRY RUN] Completed without writing files.');
  }
}

main().catch(console.error);
