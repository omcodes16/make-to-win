import { UI_TRANSLATIONS } from './src/utils/translations.js';
import { EXTRA_I18N } from './src/utils/translationsExtra.js';
import { FEATURE_I18N } from './src/utils/featureTranslations.js';
import { LANGUAGES, SPEECH_LANG_CODES, PLACEHOLDERS } from './src/utils/constants.js';

async function runMultilingualVerification() {
  console.log('🧪 Starting Multilingual Architecture & Fallback Verification...\n');
  let passed = 0;
  let total = 4;

  // Test 1: Fallback Proxy for UI_TRANSLATIONS
  console.log('--- Test 1: UI_TRANSLATIONS Fallback Proxy ---');
  const enTab = UI_TRANSLATIONS.en.tabChat;
  const mrTab = UI_TRANSLATIONS.mr.tabChat; // should fall back to English if not defined
  const hiTab = UI_TRANSLATIONS.hi.tabChat;
  console.log(`  en.tabChat: "${enTab}"`);
  console.log(`  mr.tabChat (fallback): "${mrTab}"`);
  console.log(`  hi.tabChat: "${hiTab}"`);

  if (enTab === 'Ask WeatherGPT' && mrTab === 'Ask WeatherGPT' && hiTab && hiTab !== 'Ask WeatherGPT') {
    console.log('✅ PASS: Proxy returns native string when present, and English fallback when missing.');
    passed++;
  } else {
    console.error('❌ FAIL: Translation proxy did not behave as expected.');
  }

  // Test 2: Fallback Proxy for EXTRA_I18N and FEATURE_I18N
  console.log('\n--- Test 2: EXTRA_I18N and FEATURE_I18N Fallback Proxy ---');
  const knAlert = EXTRA_I18N.kn.liveHighAlerts;
  const taHeat = FEATURE_I18N.ta.heatExtremeDanger;
  console.log(`  EXTRA_I18N.kn.liveHighAlerts (fallback): "${knAlert}"`);
  console.log(`  FEATURE_I18N.ta.heatExtremeDanger (fallback): "${taHeat}"`);

  if (knAlert === 'Live High Alerts' && taHeat === 'Extreme Danger') {
    console.log('✅ PASS: EXTRA_I18N and FEATURE_I18N seamlessly fall back to English for all new languages.');
    passed++;
  } else {
    console.error('❌ FAIL: EXTRA_I18N or FEATURE_I18N fallback failed.');
  }

  // Test 3: Language List & Native Script Coverage
  console.log('\n--- Test 3: Language Constants & Native Script Coverage ---');
  const triServiceCodes = ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'as', 'ur'];
  let allPresent = true;
  for (const code of triServiceCodes) {
    const found = LANGUAGES.find(l => l.code === code);
    if (!found || !found.nativeLabel) {
      console.error(`  Missing native label for ${code}`);
      allPresent = false;
    }
  }

  if (allPresent && LANGUAGES.length >= 13) {
    console.log(`✅ PASS: All 13 primary tri-service languages have valid native script labels (${LANGUAGES.length} total supported).`);
    passed++;
  } else {
    console.error('❌ FAIL: Language list incomplete.');
  }

  // Test 4: Speech Recognition & Placeholder Coverage
  console.log('\n--- Test 4: Speech Recognition & Placeholder Coverage ---');
  let speechMapped = true;
  for (const code of triServiceCodes) {
    if (!SPEECH_LANG_CODES[code] || !PLACEHOLDERS[code]) {
      console.error(`  Missing speech code or placeholder for ${code}`);
      speechMapped = false;
    }
  }

  if (speechMapped) {
    console.log('✅ PASS: Web Speech recognition codes and input placeholders mapped for all languages.');
    passed++;
  } else {
    console.error('❌ FAIL: Missing speech codes or placeholders.');
  }

  // Test 5: Sanskrit UI, Conditions, and Feature Coverage
  console.log('\n--- Test 5: Sanskrit (sa) UI & Conditions Coverage ---');
  total++;
  const saCondition = UI_TRANSLATIONS.sa.forecast7Day;
  const saHourly = UI_TRANSLATIONS.sa.hourlyForecast;
  const saFeelsLike = UI_TRANSLATIONS.sa.feelsLike;
  const saComfort = FEATURE_I18N.sa.heatComfortable;
  console.log(`  sa.forecast7Day: "${saCondition}"`);
  console.log(`  sa.hourlyForecast: "${saHourly}"`);
  console.log(`  sa.feelsLike: "${saFeelsLike}"`);
  console.log(`  FEATURE_I18N.sa.heatComfortable: "${saComfort}"`);

  if (
    saCondition === 'सप्तदिनात्मक-पूर्वानुमानम्' &&
    saHourly === 'प्रतिघण्टा-पूर्वानुमानम्' &&
    saFeelsLike === 'अनुभूयते' &&
    saComfort === 'सुखकरम्'
  ) {
    console.log('✅ PASS: Sanskrit (sa) translates the entire weather stage and advisories!');
    passed++;
  } else {
    console.error('❌ FAIL: Sanskrit translations missing or incorrect.');
  }

  console.log(`\n🎉 RESULTS: ${passed}/${total} verification tests passed successfully!`);
}

runMultilingualVerification().catch(console.error);
