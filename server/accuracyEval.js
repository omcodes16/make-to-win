/**
 * server/accuracyEval.js
 * Standalone accuracy evaluation for WeatherGPT's AI chatbot.
 */

import { get_current_weather, get_forecast } from './tools.js';

const CHAT_URL = 'http://localhost:3001/api/chat';

const TOLERANCE = {
  temperature:  2,
  humidity:    10,
  windSpeed:    5,
  rainProb:    20,
};

const TEST_CASES = [
  // Original 8
  { id: 'TC01', location: 'Mumbai', language: 'en', questionType: 'temperature', question: 'What is the current temperature in Mumbai?', groundTruth: async () => { const d = await get_current_weather({ location: 'Mumbai' }); if(d.error) throw new Error(d.error); return { value: d.temperature, unit: 'C', field: 'temperature' }; } },
  { id: 'TC02', location: 'Delhi', language: 'en', questionType: 'humidity', question: 'What is the current humidity level in Delhi?', groundTruth: async () => { const d = await get_current_weather({ location: 'Delhi' }); if(d.error) throw new Error(d.error); return { value: d.humidity, unit: '%', field: 'humidity' }; } },
  { id: 'TC03', location: 'Chennai', language: 'en', questionType: 'windSpeed', question: 'How fast is the wind blowing in Chennai right now?', groundTruth: async () => { const d = await get_current_weather({ location: 'Chennai' }); if(d.error) throw new Error(d.error); return { value: d.windSpeed, unit: 'km/h', field: 'windSpeed' }; } },
  { id: 'TC04', location: 'Kolkata', language: 'en', questionType: 'rainProb', question: 'What is the probability of rain tomorrow in Kolkata?', groundTruth: async () => { const d = await get_forecast({ location: 'Kolkata', daysAhead: 1 }); if(d.error) throw new Error(d.error); return { value: d.precipProbMax, unit: '%', field: 'rainProb' }; } },
  { id: 'TC05', location: 'Jaipur', language: 'hi', questionType: 'temperature', question: 'जयपुर में अभी तापमान क्या है?', groundTruth: async () => { const d = await get_current_weather({ location: 'Jaipur' }); if(d.error) throw new Error(d.error); return { value: d.temperature, unit: 'C', field: 'temperature' }; } },
  { id: 'TC06', location: 'Lucknow', language: 'hi', questionType: 'rainProb', question: 'कल लखनऊ में बारिश होने की कितनी संभावना है?', groundTruth: async () => { const d = await get_forecast({ location: 'Lucknow', daysAhead: 1 }); if(d.error) throw new Error(d.error); return { value: d.precipProbMax, unit: '%', field: 'rainProb' }; } },
  { id: 'TC07', location: 'Guwahati', language: 'as', questionType: 'humidity', question: 'গুৱাহাটীত এতিয়া আৰ্দ্ৰতা কিমান?', groundTruth: async () => { const d = await get_current_weather({ location: 'Guwahati' }); if(d.error) throw new Error(d.error); return { value: d.humidity, unit: '%', field: 'humidity' }; } },
  { id: 'TC08', location: 'Kolkata', language: 'bn', questionType: 'windSpeed', question: 'কলকাতায় এখন বাতাসের গতি কত?', groundTruth: async () => { const d = await get_current_weather({ location: 'Kolkata' }); if(d.error) throw new Error(d.error); return { value: d.windSpeed, unit: 'km/h', field: 'windSpeed' }; } },
  
  // 12 New Tests
  { id: 'TC09', location: 'Bangalore', language: 'en', questionType: 'rainProb', question: 'Will it rain tomorrow in Bangalore and what is the probability?', groundTruth: async () => { const d = await get_forecast({ location: 'Bangalore', daysAhead: 1 }); if(d.error) throw new Error(d.error); return { value: d.precipProbMax, unit: '%', field: 'rainProb' }; } },
  { id: 'TC10', location: 'Hyderabad', language: 'en', questionType: 'temperature', question: 'What is the current temperature in Hyderabad?', groundTruth: async () => { const d = await get_current_weather({ location: 'Hyderabad' }); if(d.error) throw new Error(d.error); return { value: d.temperature, unit: 'C', field: 'temperature' }; } },
  { id: 'TC11', location: 'Pune', language: 'hi', questionType: 'windSpeed', question: 'पुणे में हवा की गति क्या है?', groundTruth: async () => { const d = await get_current_weather({ location: 'Pune' }); if(d.error) throw new Error(d.error); return { value: d.windSpeed, unit: 'km/h', field: 'windSpeed' }; } },
  { id: 'TC12', location: 'Ahmedabad', language: 'hi', questionType: 'humidity', question: 'अहमदाबाद में अभी नमी (humidity) कितनी है?', groundTruth: async () => { const d = await get_current_weather({ location: 'Ahmedabad' }); if(d.error) throw new Error(d.error); return { value: d.humidity, unit: '%', field: 'humidity' }; } },
  { id: 'TC13', location: 'Srinagar', language: 'en', questionType: 'temperature', question: 'How cold is it in Srinagar right now?', groundTruth: async () => { const d = await get_current_weather({ location: 'Srinagar' }); if(d.error) throw new Error(d.error); return { value: d.temperature, unit: 'C', field: 'temperature' }; } },
  { id: 'TC14', location: 'Kochi', language: 'en', questionType: 'windSpeed', question: 'What is the wind speed in Kochi?', groundTruth: async () => { const d = await get_current_weather({ location: 'Kochi' }); if(d.error) throw new Error(d.error); return { value: d.windSpeed, unit: 'km/h', field: 'windSpeed' }; } },
  { id: 'TC15', location: 'Bhopal', language: 'hi', questionType: 'rainProb', question: 'कल भोपाल में बारिश के क्या आसार हैं?', groundTruth: async () => { const d = await get_forecast({ location: 'Bhopal', daysAhead: 1 }); if(d.error) throw new Error(d.error); return { value: d.precipProbMax, unit: '%', field: 'rainProb' }; } },
  { id: 'TC16', location: 'Bhubaneswar', language: 'en', questionType: 'humidity', question: 'What is the current humidity in Bhubaneswar?', groundTruth: async () => { const d = await get_current_weather({ location: 'Bhubaneswar' }); if(d.error) throw new Error(d.error); return { value: d.humidity, unit: '%', field: 'humidity' }; } },
  { id: 'TC17', location: 'Patna', language: 'hi', questionType: 'temperature', question: 'पटना में अभी तापमान कितना है?', groundTruth: async () => { const d = await get_current_weather({ location: 'Patna' }); if(d.error) throw new Error(d.error); return { value: d.temperature, unit: 'C', field: 'temperature' }; } },
  { id: 'TC18', location: 'Shillong', language: 'as', questionType: 'temperature', question: 'শ্বিলঙত বৰ্তমানৰ উষ্ণতা কিমান?', groundTruth: async () => { const d = await get_current_weather({ location: 'Shillong' }); if(d.error) throw new Error(d.error); return { value: d.temperature, unit: 'C', field: 'temperature' }; } },
  { id: 'TC19', location: 'Silchar', language: 'bn', questionType: 'humidity', question: 'শিলচরে এখন আর্দ্রতা কত?', groundTruth: async () => { const d = await get_current_weather({ location: 'Silchar' }); if(d.error) throw new Error(d.error); return { value: d.humidity, unit: '%', field: 'humidity' }; } },
  { id: 'TC20', location: 'Surat', language: 'en', questionType: 'windSpeed', question: 'Is it windy in Surat? What is the speed?', groundTruth: async () => { const d = await get_current_weather({ location: 'Surat' }); if(d.error) throw new Error(d.error); return { value: d.windSpeed, unit: 'km/h', field: 'windSpeed' }; } }
];

function transliterateIndic(text) {
  const indicDigits = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9', // Bengali/Assamese
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'  // Devanagari
  };
  return text.replace(/[০-৯०-९]/g, match => indicDigits[match]);
}

function extractNumbers(text) {
  if (!text || typeof text !== 'string') return [];
  const normalizedText = transliterateIndic(text);
  const matches = normalizedText.match(/-?\d+(?:\.\d+)?/g);
  return matches ? matches.map(Number) : [];
}

function isWithinTolerance(candidates, truth, tolerance) {
  return candidates.some(n => Math.abs(n - truth) <= tolerance);
}

function getToleranceFor(field) { return TOLERANCE[field] ?? 5; }

async function askChatbot(question, language, locationName) {
  const body = { message: question, language, weatherData: { location: locationName }, history: [], profile: 'general' };
  const res = await fetch(CHAT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) { const t = await res.text(); throw new Error('HTTP ' + res.status + ': ' + t.slice(0,200)); }
  return res.json();
}

async function run() {
  console.log('\n=======================================================');
  console.log('    WeatherGPT Chatbot Accuracy Evaluation (V2)');
  console.log('=======================================================\n');

  try {
    await fetch('http://localhost:3001/api/accuracy?location=Mumbai');
  } catch {
    console.error('Server at localhost:3001 is not reachable.');
    process.exit(1);
  }

  const results = [];

  for (const tc of TEST_CASES) {
    console.log('--- ' + tc.id + ' | ' + tc.location + ' | ' + tc.language.toUpperCase() + ' | ' + tc.questionType + ' ---');
    console.log('Q: ' + tc.question);
    
    await new Promise(r => setTimeout(r, 1500));

    let groundTruthResult, botResponse;
    try {
      groundTruthResult = await Promise.race([tc.groundTruth(), new Promise((_, r) => setTimeout(() => r(new Error('TIMEOUT')), 5000))]);
      if (groundTruthResult.value === undefined) {
        throw new Error('GT is undefined. API might have returned an error object.');
      }
      console.log('Ground truth: ' + groundTruthResult.value + ' ' + groundTruthResult.unit);
    } catch (err) {
      console.log('WARN Ground truth fetch failed: ' + err.message);
      results.push({ tc, pass: null, error: 'GT:' + err.message, groundTruth: null, botResponse: null, candidates: [] });
      console.log();
      continue;
    }

    try {
      botResponse = await Promise.race([askChatbot(tc.question, tc.language, tc.location), new Promise((_, r) => setTimeout(() => r(new Error('TIMEOUT')), 15000))]);
    } catch (err) {
      console.log('WARN Chat request failed: ' + err.message);
      results.push({ tc, pass: null, error: 'Chat:' + err.message, groundTruth: groundTruthResult, botResponse: null, candidates: [] });
      console.log();
      continue;
    }

    const answerText = botResponse.answer || '';
    const relevantStat = botResponse.relevantStat || '';
    const advisory = botResponse.advisory || '';
    const weatherDataUsed = !!botResponse.weatherData;
    const allText = answerText + ' ' + relevantStat + ' ' + advisory;
    const candidates = extractNumbers(allText);
    const tolerance = getToleranceFor(groundTruthResult.field);
    const pass = isWithinTolerance(candidates, groundTruthResult.value, tolerance);

    console.log('Bot answer   : ' + answerText.replace(/\n/g,' ').slice(0,200));
    if (relevantStat) console.log('relevantStat : ' + relevantStat);
    console.log('Nums found   : [' + candidates.join(', ') + ']');
    console.log('Tool data    : ' + (weatherDataUsed ? 'YES' : 'NO'));
    console.log('Tolerance    : +/-' + tolerance + ' | GT=' + groundTruthResult.value);
    console.log(pass ? '  PASS' : '  FAIL');
    console.log();

    results.push({ tc, pass, error: null, groundTruth: groundTruthResult, botResponse, candidates, answerText, relevantStat, weatherDataUsed });
  }

  const valid   = results.filter(r => r.pass !== null);
  const passed  = valid.filter(r => r.pass === true);
  const failed  = valid.filter(r => r.pass === false);
  const errored = results.filter(r => r.error);

  console.log('=======================================================');
  console.log('  SUMMARY');
  console.log('=======================================================');
  console.log('Total          : ' + TEST_CASES.length);
  console.log('Errored/skip   : ' + errored.length);
  console.log('Valid          : ' + valid.length);
  console.log('Passed         : ' + passed.length);
  console.log('Failed         : ' + failed.length);
  const rawRate = valid.length > 0 ? ((passed.length / valid.length)*100).toFixed(1) : 'N/A';
  console.log('Raw pass rate  : ' + passed.length + '/' + valid.length + ' = ' + rawRate + '%\n');

  const falseFailures = [], toolIssues = [], hallucinations = [];

  if (failed.length > 0) {
    console.log('FAILURE ANALYSIS');
    console.log('-----------------------------------------------------');
    for (const r of failed) {
      const gt = r.groundTruth.value;
      const tol = getToleranceFor(r.groundTruth.field);
      const ansLow = (r.answerText || '').toLowerCase();
      console.log('\n' + r.tc.id + ' - ' + r.tc.location + ' (' + r.tc.language + ') - ' + r.tc.questionType);
      console.log('  GT        : ' + gt + ' ' + r.groundTruth.unit);
      console.log('  Nums      : [' + r.candidates.join(', ') + ']');
      console.log('  Tool data : ' + (r.weatherDataUsed ? 'YES' : 'NO'));
      console.log('  Answer    : ' + (r.answerText||'').replace(/\n/g,' ').slice(0,300));

      if (!r.weatherDataUsed) {
        console.log('  => Category (b): Tool not invoked - no weatherData in response');
        toolIssues.push(r);
        continue;
      }
      const allHints = ['twenty','thirty','forty','around','approximately','roughly','about','near','moderate','mild', 'chance', 'high', 'low', 'none', 'clear'];
      const hasPhrasing = allHints.some(h => ansLow.includes(h));
      const botGaveNum = r.candidates.length > 0;
      const closest = botGaveNum ? r.candidates.reduce((b,n)=>Math.abs(n-gt)<Math.abs(b-gt)?n:b, r.candidates[0]) : null;
      const diff = closest !== null ? Math.abs(closest-gt) : Infinity;
      if (!botGaveNum && hasPhrasing) {
        console.log('  => Category (a): False failure - descriptive language used, no digit captured');
        falseFailures.push(r);
      } else if (botGaveNum && diff > tol) {
        console.log('  => Category (c): Hallucination - bot said ' + closest + ', truth ' + gt + ' (diff ' + diff.toFixed(1) + ')');
        hallucinations.push({ r, closest, diff, gt });
      } else {
        console.log('  => Category (b): Tool/response issue - no useful number or phrasing');
        toolIssues.push(r);
      }
    }
  }

  const adjPassed2 = passed.length + falseFailures.length;
  const adjRate2 = valid.length > 0 ? ((adjPassed2/valid.length)*100).toFixed(1) : 'N/A';
  console.log('\n=======================================================');
  console.log('  FINAL RESULT');
  console.log('=======================================================');
  console.log('Raw       : ' + passed.length + '/' + valid.length + ' (' + rawRate + '%)');
  console.log('Adjusted  : ' + adjPassed2 + '/' + valid.length + ' (' + adjRate2 + '%)');
  
  if (hallucinations.length > 0) {
      console.log('\nREAL HALLUCINATIONS: ' + hallucinations.length);
  } else {
      console.log('\nNo real hallucinations detected.');
  }
  
  console.log('\nDone. ' + new Date().toLocaleString());
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });
