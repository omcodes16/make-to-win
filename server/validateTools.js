// Removed node-fetch import, using native fetch.

const ENDPOINT = 'http://localhost:3001/api/chat';

const queries = [
  { desc: '1. Simple current weather', message: 'आज गुवाहाटी में मौसम कैसा है?' },
  { desc: '2. Forecast question', message: 'क्या कल बारिश होगी?' },
  { desc: '3. Historical/trend question', message: 'पिछले हफ्ते के मुकाबले आज कैसा है?' },
  { desc: '4. Multi-need question', message: 'क्या आज कीटनाशक छिड़कना सुरक्षित है और कोई चेतावनी है?' },
  { desc: '5. A casual greeting', message: 'नमस्ते' }
];

const mockWeatherData = {
  location: 'Guwahati',
  state: 'Assam',
  temperature: 33,
  feelsLike: 39,
  humidity: 70,
  windSpeed: 10,
  rain: 0,
  precipitation: 0
};

async function testQuery(q, forceLegacy = false) {
  console.log(`\n======================================================`);
  console.log(`Testing: ${q.desc}`);
  console.log(`Query: "${q.message}"`);
  console.log(`Mode: ${forceLegacy ? 'Legacy (Single-Shot)' : 'Tool-Calling Loop'}`);
  console.log(`======================================================`);

  const start = performance.now();
  
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: q.message,
        language: 'Hindi',
        weatherData: mockWeatherData,
        forceLegacy
      })
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    const end = performance.now();
    const latency = (end - start).toFixed(0);

    console.log(`\n⏱️  Latency: ${latency}ms`);
    console.log(`✅ Final Answer: ${data.answer}`);
    
    return latency;
  } catch (err) {
    console.error(`❌ Request Failed:`, err);
    return null;
  }
}

async function runValidation() {
  console.log('Starting E2E Validation of Tool Calling Architecture...\n');
  
  let toolLatencies = [];

  // Run the 5 standard queries
  for (const q of queries) {
    // Wait between requests to not hit rate limits on free tier
    await new Promise(r => setTimeout(r, 10000));
    const latency = await testQuery(q, false);
    if (latency) toolLatencies.push(Number(latency));
  }

  // Run a benchmark query in Legacy mode to compare latency
  console.log('\n\n--- LATENCY BENCHMARK ---');
  await new Promise(r => setTimeout(r, 10000));
  const legacyLatency = await testQuery({ desc: 'Benchmark (Complex Query)', message: 'क्या आज कीटनाशक छिड़कना सुरक्षित है और कोई चेतावनी है?' }, true);

  const avgToolLatency = toolLatencies.length ? (toolLatencies.reduce((a,b)=>a+b, 0) / toolLatencies.length).toFixed(0) : 0;
  
  console.log(`\n📊 RESULTS:`);
  console.log(`Average Tool-Calling Latency: ${avgToolLatency}ms`);
  console.log(`Legacy Single-Shot Latency (same query): ${legacyLatency}ms`);
  
  if (legacyLatency && avgToolLatency) {
    const diff = (avgToolLatency - legacyLatency).toFixed(0);
    console.log(`Difference: Tool-calling takes ~${diff}ms longer due to multi-round-trip architecture.`);
  }
}

runValidation();
