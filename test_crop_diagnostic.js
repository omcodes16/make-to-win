import { diagnoseCropLeaf, getMicroclimateAndForecast } from './server/cropDiagnostic.js';
import dotenv from 'dotenv';
dotenv.config();

async function runTest() {
  console.log('--- TESTING MAUSAM-DRISHTI BACKEND SERVICE ---');
  
  // 1. Test Microclimate and Forecast retrieval
  console.log('1. Testing getMicroclimateAndForecast for Bhopal...');
  const weather = await getMicroclimateAndForecast(23.2599, 77.4126);
  console.log('✅ Microclimate summary:', {
    avgRH: weather.pastMicroclimate.avgRH,
    highHumidityHours: weather.pastMicroclimate.highHumidityHours,
    past7DayRainSum: weather.pastMicroclimate.past7DayRainSum,
    immediate6hRainRisk: weather.forecast48h.immediate6hRainRisk,
    hourlyCount: weather.forecast48h.hourly.length
  });

  // 2. Test Multimodal Vision with dummy 1x1 base64 pixel (to verify pipeline flow)
  console.log('2. Testing diagnoseCropLeaf with sample image payload...');
  // A tiny valid 1x1 pixel JPEG
  const sample1x1Jpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

  const result = await diagnoseCropLeaf({
    imageBase64: sample1x1Jpeg,
    lat: 23.2599,
    lng: 77.4126,
    locationName: 'Bhopal, Madhya Pradesh',
    cropType: 'potato',
    language: 'hi'
  });

  console.log('✅ Diagnostic Result Received:');
  console.log('Crop:', result.diagnostic?.crop, `(${result.diagnostic?.cropLocalName})`);
  console.log('Condition:', result.diagnostic?.condition, `(${result.diagnostic?.conditionLocalName})`);
  console.log('Can spray today:', result.diagnostic?.sprayDecision?.canSprayToday);
  console.log('Optimal window:', result.diagnostic?.sprayDecision?.optimalSprayWindow);
  console.log('Chemical treatment:', result.diagnostic?.sprayDecision?.chemicalTreatment);
  console.log('Audio script:', result.diagnostic?.audioBulletinScript);
  console.log('--- TEST PASSED SUCCESSFULLY ---');
}

runTest().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
