import { 
  get_current_weather, 
  get_forecast, 
  get_historical_trend, 
  get_seasonal_comparison, 
  get_active_alerts 
} from './tools.js';

async function runTests() {
  const location = 'Guwahati';
  console.log('=============================================');
  console.log(`🧪 Testing Tools for location: ${location}`);
  console.log('=============================================\n');

  console.log('--- 1. get_current_weather ---');
  const w1 = await get_current_weather({ location });
  console.log(JSON.stringify(w1, null, 2));
  console.log('\n');

  console.log('--- 2. get_forecast (daysAhead: 1) ---');
  const w2 = await get_forecast({ location, daysAhead: 1 });
  console.log(JSON.stringify(w2, null, 2));
  console.log('\n');

  console.log('--- 3. get_historical_trend (days: 7) ---');
  const w3 = await get_historical_trend({ location, days: 7 });
  console.log(JSON.stringify(w3, null, 2));
  console.log('\n');

  console.log('--- 4. get_seasonal_comparison ---');
  const w4 = await get_seasonal_comparison({ location });
  console.log(JSON.stringify(w4, null, 2));
  console.log('\n');

  console.log('--- 5. get_active_alerts ---');
  const w5 = await get_active_alerts({ location });
  console.log(JSON.stringify(w5, null, 2));
  console.log('\n');
}

runTests().catch(console.error);
