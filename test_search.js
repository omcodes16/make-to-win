import { searchLocationSuggestions } from './src/services/weatherApi.js';
searchLocationSuggestions('khandala').then(console.log).catch(console.error);
