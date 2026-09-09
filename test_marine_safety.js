import { getMarineSafetyReport, calculateImblProximity, detectKallakkadal } from './server/marineSafety.js';

async function runTest() {
  console.log('--- TESTING SAGAR-RAKSHAK MARINE SERVICE ---');

  // 1. Test IMBL calculation for Rameswaram (near Sri Lanka)
  console.log('1. Testing IMBL proximity for Rameswaram (9.2876, 79.3129)...');
  const rameswaramImbl = calculateImblProximity(9.2876, 79.3129);
  console.log('✅ Rameswaram IMBL:', {
    distanceKm: rameswaramImbl.distanceKm,
    status: rameswaramImbl.status,
    nearestBorderName: rameswaramImbl.nearestBorderName
  });

  // 2. Test Kallakkadal detection (high swell period)
  console.log('2. Testing Kallakkadal swell surge trigger (Swell: 2.8m, Period: 15s)...');
  const kallakkadalTest = detectKallakkadal(2.8, 15.0, 10);
  console.log('✅ Kallakkadal detected:', kallakkadalTest.isTriggered, 'Severity:', kallakkadalTest.severity);

  // 3. Test full Marine Safety Report for Vizhinjam / Kerala
  console.log('3. Testing getMarineSafetyReport for Vizhinjam, Kerala...');
  const vizhinjam = await getMarineSafetyReport({
    lat: 8.3820,
    lng: 76.9940,
    locationName: 'Vizhinjam Harbor, Kerala',
    language: 'hi'
  });

  console.log('✅ Marine Telemetry:', vizhinjam.telemetry);
  console.log('✅ Sea State:', vizhinjam.seaState.label);
  console.log('✅ Port Signal:', vizhinjam.portSignal.signalName);
  console.log('✅ Catamaran Limit:', vizhinjam.boatLimits.catamaran.status, `(${vizhinjam.boatLimits.catamaran.maxDistance})`);
  console.log('✅ Trawler Limit:', vizhinjam.boatLimits.trawler.status, `(${vizhinjam.boatLimits.trawler.maxDistance})`);
  console.log('✅ Audio Bulletin:', vizhinjam.spokenAudioScript);
  console.log('--- TEST PASSED SUCCESSFULLY ---');
}

runTest().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
