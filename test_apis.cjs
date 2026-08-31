
const BASE_URL = 'http://localhost:3001';
const errors = [];

async function testEndpoint(name, url, options = {}) {
  try {
    const res = await fetch(BASE_URL + url, options);
    if (!res.ok) {
      errors.push(`${name} failed with status: ${res.status}`);
      return;
    }
    const data = await res.text();
    try {
      JSON.parse(data);
    } catch {
      errors.push(`${name} returned invalid JSON: ${data.substring(0, 50)}...`);
    }
  } catch (err) {
    errors.push(`${name} threw error: ${err.message}`);
  }
}

async function runTests() {
  console.log("Running regression tests...");
  
  await testEndpoint('Chat API', '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: "hello", profile: "farmer", language: "en" })
  });

  await testEndpoint('Extreme Alerts', '/api/extreme-alerts?lat=26&lon=91');
  
  await testEndpoint('Historical (30 day)', '/api/historical?lat=26&lon=91&mode=30d');
  
  await testEndpoint('National Alerts', '/api/national-alerts');
  
  await testEndpoint('Confidence API', '/api/confidence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contextData: {} })
  });

  if (errors.length > 0) {
    console.error("FAILURES FOUND:");
    errors.forEach(e => console.error("- " + e));
  } else {
    console.log("All API endpoints responded successfully (200 OK + valid JSON).");
  }
}

runTests();
