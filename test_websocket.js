import WebSocket from 'ws';

async function runTest() {
  console.log('🧪 Starting Real-Time WebSocket & GPS Spatial Filtering Integration Test...\n');

  const BASE_URL = 'http://localhost:3001';
  const WS_URL = 'ws://localhost:3001';
  let passedTests = 0;
  const totalTests = 3;

  // 1. Authenticate as Disaster Manager
  const loginRes = await fetch(`${BASE_URL}/api/manager/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode: 'weather2026' })
  });
  const { token } = await loginRes.json();
  if (!token) throw new Error('Manager login failed');
  console.log('🔑 Authenticated as Disaster Manager');

  // 2. Setup Client 1 (Pune: lat 18.5204, lng 73.8567)
  const clientPune = new WebSocket(WS_URL);
  const clientPuneMessages = [];

  clientPune.on('message', (data) => {
    try { clientPuneMessages.push(JSON.parse(data.toString())); } catch(e){}
  });

  // 3. Setup Client 2 (Delhi: lat 28.6139, lng 77.2090)
  const clientDelhi = new WebSocket(WS_URL);
  const clientDelhiMessages = [];

  clientDelhi.on('message', (data) => {
    try { clientDelhiMessages.push(JSON.parse(data.toString())); } catch(e){}
  });

  // Wait for both connections to open
  await new Promise((resolve) => {
    let openCount = 0;
    const onOpen = () => {
      openCount++;
      if (openCount === 2) resolve();
    };
    clientPune.on('open', onOpen);
    clientDelhi.on('open', onOpen);
  });

  console.log('🔌 Both simulated clients connected to WebSocket server');

  // Register locations
  clientPune.send(JSON.stringify({
    type: 'register_location',
    lat: 18.5204,
    lng: 73.8567,
    state: 'Maharashtra',
    district: 'Pune'
  }));

  clientDelhi.send(JSON.stringify({
    type: 'register_location',
    lat: 28.6139,
    lng: 77.2090,
    state: 'Delhi',
    district: 'New Delhi'
  }));

  // Wait 500ms for location registration
  await new Promise(r => setTimeout(r, 500));

  // -------------------------------------------------------------
  // TEST 1: GPS Radius Spatial Filtering (50km around Pune)
  // -------------------------------------------------------------
  console.log('\n--- Test 1: Testing GPS Radius Broadcast (Pune 50km radius) ---');
  clientPuneMessages.length = 0;
  clientDelhiMessages.length = 0;

  const radiusAlert = {
    title: 'Flash Flood Warning - Pune Basin',
    description: 'High discharge from Khadakwasla Dam. Low-lying areas in Pune alerted.',
    severity: 'severe',
    targetMode: 'radius',
    lat: 18.52,
    lng: 73.85,
    radius: 50 // 50 km radius
  };

  const alertRes = await fetch(`${BASE_URL}/api/manager/alerts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(radiusAlert)
  });
  await alertRes.json();

  // Wait for WebSocket delivery
  await new Promise(r => setTimeout(r, 600));

  const puneGotRadiusAlert = clientPuneMessages.some(
    m => m.type === 'authority_alert' && m.alert?.title?.includes('Flash Flood Warning')
  );
  const delhiGotRadiusAlert = clientDelhiMessages.some(
    m => m.type === 'authority_alert' && m.alert?.title?.includes('Flash Flood Warning')
  );

  if (puneGotRadiusAlert && !delhiGotRadiusAlert) {
    console.log('✅ PASS: Pune client (inside 50km) received the alert. Delhi client (>1100km away) was filtered out.');
    passedTests++;
  } else {
    console.error(`❌ FAIL: Pune received: ${puneGotRadiusAlert}, Delhi received: ${delhiGotRadiusAlert}`);
  }

  // -------------------------------------------------------------
  // TEST 2: Regional State Filtering (Maharashtra only)
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Testing Regional State Filter (Maharashtra) ---');
  clientPuneMessages.length = 0;
  clientDelhiMessages.length = 0;

  const stateAlert = {
    title: 'Heatwave Advisory - Maharashtra',
    description: 'Severe heatwave conditions expected across Maharashtra.',
    severity: 'moderate',
    targetMode: 'state',
    state: 'Maharashtra'
  };

  await fetch(`${BASE_URL}/api/manager/alerts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(stateAlert)
  });

  await new Promise(r => setTimeout(r, 600));

  const puneGotStateAlert = clientPuneMessages.some(
    m => m.type === 'authority_alert' && m.alert?.title?.includes('Heatwave Advisory')
  );
  const delhiGotStateAlert = clientDelhiMessages.some(
    m => m.type === 'authority_alert' && m.alert?.title?.includes('Heatwave Advisory')
  );

  if (puneGotStateAlert && !delhiGotStateAlert) {
    console.log('✅ PASS: Pune client (Maharashtra) received state alert. Delhi client was filtered out.');
    passedTests++;
  } else {
    console.error(`❌ FAIL: Pune received: ${puneGotStateAlert}, Delhi received: ${delhiGotStateAlert}`);
  }

  // -------------------------------------------------------------
  // TEST 3: Real-Time SOS Dispatch Status Push
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Testing Real-Time SOS Dispatch Status Push ---');
  clientPuneMessages.length = 0;

  // 1. Citizen posts an emergency SOS
  const sosRes = await fetch(`${BASE_URL}/api/sos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Ramesh Patil',
      phone: '+919876543210',
      message: 'Trapped in flash flood near riverside road.',
      lat: 18.5204,
      lng: 73.8567,
      helpType: 'Evacuation Needed'
    })
  });
  const sosData = await sosRes.json();
  const sosId = sosData.id || sosData._id;
  console.log('Citizen submitted SOS, id:', sosId);

  // 2. Disaster Manager marks it as "dispatched"
  const dispatchRes = await fetch(`${BASE_URL}/api/manager/sos/${sosId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status: 'dispatched' })
  });
  const dispatchData = await dispatchRes.json();
  console.log('Manager updated SOS status:', dispatchData);

  await new Promise(r => setTimeout(r, 600));

  const gotSosDispatch = clientPuneMessages.some(
    m => m.type === 'sos_status_update' && (m.sosId === sosId || m.sosId === String(sosId)) && m.status === 'dispatched'
  );

  if (gotSosDispatch) {
    console.log('✅ PASS: Real-time SOS dispatch update was pushed to connected client over WebSocket.');
    passedTests++;
  } else {
    console.error('❌ FAIL: Client did not receive real-time SOS status update. Messages:', clientPuneMessages);
  }

  // Cleanup
  clientPune.close();
  clientDelhi.close();

  console.log(`\n🎉 RESULTS: ${passedTests}/${totalTests} integration tests passed successfully!`);
}

runTest().catch(console.error);
