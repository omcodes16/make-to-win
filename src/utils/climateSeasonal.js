/**
 * Seasonal Climate Baseline
 * Real 5-Year Historical Averages computed from Open-Meteo Archive API.
 * Rainfall mm/month, temp °C.
 */
export const SEASONAL_DATA = {
  guwahati: { name: "Guwahati", region: "Assam", rainfall: [14,31,71,143,320,465,538,468,244,176,14,10], maxTemp: [23,25,29,30,31,31,32,31,32,30,28,24], minTemp: [12,14,17,20,22,24,25,25,25,22,17,14] },
  shillong: { name: "Shillong", region: "Meghalaya", rainfall: [14,21,39,71,222,263,222,199,151,142,25,16], maxTemp: [17,19,22,24,24,25,25,25,25,23,21,18], minTemp: [6,8,12,15,16,19,19,19,18,15,11,8] },
  cherrapunji: { name: "Cherrapunji", region: "Meghalaya", rainfall: [12,34,86,242,441,797,739,568,206,232,18,13], maxTemp: [16,17,21,22,22,23,23,23,24,22,20,17], minTemp: [6,7,11,15,16,18,19,19,18,15,10,7] },
  imphal: { name: "Imphal", region: "Manipur", rainfall: [9,15,35,35,160,210,288,213,121,83,27,27], maxTemp: [22,24,27,30,29,29,29,28,29,28,25,22], minTemp: [8,9,13,17,19,22,22,22,21,19,13,10] },
  agartala: { name: "Agartala", region: "Tripura", rainfall: [5,13,79,121,240,228,262,311,275,164,28,38], maxTemp: [25,28,32,34,33,32,32,31,32,31,29,26], minTemp: [13,15,19,23,24,25,26,25,25,23,18,14] },
  itanagar: { name: "Itanagar", region: "Arunachal Pradesh", rainfall: [39,148,295,563,580,671,388,317,235,239,12,22], maxTemp: [21,22,26,27,29,30,31,31,31,28,26,23], minTemp: [10,12,16,18,21,23,24,24,24,20,15,12] },
  dibrugarh: { name: "Dibrugarh", region: "Assam", rainfall: [28,115,212,476,489,593,468,478,270,237,17,11], maxTemp: [22,23,26,27,29,31,32,32,32,29,27,24], minTemp: [12,14,17,20,22,25,26,25,25,22,17,14] },
  kohima: { name: "Kohima", region: "Nagaland", rainfall: [38,79,96,199,428,831,842,725,437,310,49,46], maxTemp: [16,18,22,24,24,25,25,25,25,23,20,18], minTemp: [6,6,10,13,15,18,19,19,18,15,10,7] },
  aizawl: { name: "Aizawl", region: "Mizoram", rainfall: [4,13,28,73,181,184,309,280,199,113,36,24], maxTemp: [20,23,26,28,28,27,27,26,27,26,24,21], minTemp: [5,6,11,15,17,19,19,19,18,16,11,7] },
  gangtok: { name: "Gangtok", region: "Sikkim", rainfall: [72,201,236,245,479,669,557,489,329,278,55,49], maxTemp: [15,16,20,22,23,24,24,24,24,22,19,16], minTemp: [3,4,8,11,13,16,18,17,16,12,8,4] },
  mumbai: { name: "Mumbai", region: "Maharashtra", rainfall: [2,0,3,1,47,438,968,418,478,95,7,20], maxTemp: [30,32,34,34,33,31,28,28,28,31,33,31], minTemp: [19,21,23,25,27,27,25,25,25,24,22,21] },
  delhi: { name: "Delhi", region: "Delhi", rainfall: [34,13,31,8,23,64,219,188,168,30,6,11], maxTemp: [18,24,30,37,39,38,34,33,33,31,27,21], minTemp: [7,11,16,22,26,28,27,26,25,20,14,9] },
  kolkata: { name: "Kolkata", region: "West Bengal", rainfall: [16,21,68,63,179,260,367,417,374,193,19,28], maxTemp: [25,29,33,36,35,34,32,32,31,31,29,26], minTemp: [14,17,22,26,26,27,26,26,26,24,19,16] },
  chennai: { name: "Chennai", region: "Tamil Nadu", rainfall: [46,4,15,14,103,80,108,179,149,251,427,246], maxTemp: [28,30,32,34,35,36,34,34,33,31,28,28], minTemp: [22,23,24,27,28,28,27,26,26,25,24,23] },
  hyderabad: { name: "Hyderabad", region: "Telangana", rainfall: [3,1,15,25,57,118,253,147,211,78,24,13], maxTemp: [28,32,35,37,36,33,29,29,29,30,29,28], minTemp: [17,19,22,25,25,25,23,23,22,21,19,18] },
  bangalore: { name: "Bangalore", region: "Karnataka", rainfall: [5,0,14,20,143,114,158,180,105,189,109,36], maxTemp: [27,30,33,35,31,29,27,28,28,27,26,26], minTemp: [16,17,20,21,21,20,20,20,19,19,18,17] },
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function getSeason(m) {
  if (m >= 5 && m <= 8) return 'Southwest Monsoon';
  if (m >= 9 && m <= 10) return 'Post-Monsoon';
  if (m >= 11 || m <= 1) return 'Winter';
  return 'Pre-Monsoon / Summer';
}
import { FEATURE_I18N } from './featureTranslations';

export function getSeasonalContext(locationName, monthIndex, lang = 'en') {
  if (!locationName) return { found: false };
  const t = FEATURE_I18N[lang] || FEATURE_I18N.en;
  const norm = locationName.toLowerCase().trim();
  const month = monthIndex ?? new Date().getMonth();
  let match = null;
  for (const [key, data] of Object.entries(SEASONAL_DATA)) {
    if (norm.includes(key) || key.includes(norm.split(' ')[0])) { match = data; break; }
    if (norm.includes(data.region.toLowerCase())) { match = data; break; }
  }
  if (!match) return { found: false };
  return {
    found: true,
    city: match.name, region: match.region,
    month: MONTHS[month], season: getSeason(month),
    avgRainfall: match.rainfall[month],
    avgMaxTemp: match.maxTemp[month],
    avgMinTemp: match.minTemp[month],
    summary: t.seasonSummary(MONTHS[month], match.name, match.rainfall[month], match.minTemp[month], match.maxTemp[month], getSeason(month)),
  };
}
export function getSeasonalAnomaly(locationName, actualRainfall, actualTemp, monthIndex) {
  const ctx = getSeasonalContext(locationName, monthIndex);
  if (!ctx.found) return '';
  const parts = [];
  const expectedDaily = ctx.avgRainfall / 30;
  if (actualRainfall > expectedDaily * 3) parts.push(`Rainfall is unusually heavy for ${ctx.month} in ${ctx.city} (typical: ~${Math.round(expectedDaily)}mm/day)`);
  else if (actualRainfall < expectedDaily * 0.2 && ctx.avgRainfall > 50) parts.push(`Much drier than usual for ${ctx.month} in ${ctx.city} (typical: ~${Math.round(expectedDaily)}mm/day)`);
  const avgMid = (ctx.avgMaxTemp + ctx.avgMinTemp) / 2;
  if (actualTemp > avgMid + 5) parts.push(`Temperature is ~${Math.round(actualTemp - avgMid)}°C above ${ctx.month} average`);
  else if (actualTemp < avgMid - 5) parts.push(`Temperature is ~${Math.round(avgMid - actualTemp)}°C below ${ctx.month} average`);
  return parts.join('. ');
}
export { MONTHS, getSeason };
