import { searchLocationSuggestions, getWeather } from './src/services/weatherApi.js';

async function test() {
  const locs = await searchLocationSuggestions('shillong');
  const data = await getWeather(locs[0].lat, locs[0].lng);
  console.log('modelData gfs', data.modelData.daily.gfs);
}
test().catch(console.error);
