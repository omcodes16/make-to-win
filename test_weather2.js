import { searchLocationSuggestions, getWeather } from './src/services/weatherApi.js';
import { checkSeverity } from './src/utils/weatherConditions.jsx';

async function test() {
  const locs = await searchLocationSuggestions('guwahati');
  const data = await getWeather(locs[0].lat, locs[0].lng);
  const severityCheck = checkSeverity(data, locs[0].name);
  console.log('severityCheck', severityCheck);
}
test().catch(console.error);
