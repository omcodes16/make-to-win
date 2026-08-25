/**
 * Seasonal Climate Baseline - PS 26068
 * IMD-based monthly norms for major Indian cities / NE India.
 * Rainfall mm/month, temp °C.
 */
const SEASONAL_DATA = {
  guwahati:     { name: 'Guwahati',     region: 'Assam',             rainfall: [10,18,57,134,253,330,324,274,175,83,15,5],  maxTemp: [21,24,29,32,32,32,32,32,31,29,25,21], minTemp: [10,12,17,21,23,25,26,26,24,21,14,10] },
  shillong:     { name: 'Shillong',     region: 'Meghalaya',         rainfall: [17,31,93,268,425,600,620,480,290,160,30,12], maxTemp: [14,15,19,22,22,23,23,23,22,20,16,14], minTemp: [4,5,9,13,15,17,17,17,15,12,7,4] },
  cherrapunji:  { name: 'Cherrapunji', region: 'Meghalaya',          rainfall: [20,40,160,600,1200,2000,2300,1700,900,350,50,20], maxTemp: [16,17,21,24,24,23,23,23,23,21,18,16], minTemp: [7,8,12,15,17,19,19,19,17,15,10,7] },
  imphal:       { name: 'Imphal',       region: 'Manipur',           rainfall: [20,30,60,110,170,200,230,220,140,80,20,10],  maxTemp: [20,23,28,30,30,28,28,29,28,27,23,20], minTemp: [5,7,11,15,18,21,22,22,20,15,9,5] },
  agartala:     { name: 'Agartala',     region: 'Tripura',           rainfall: [14,26,60,140,230,340,380,290,200,120,30,10], maxTemp: [24,27,32,35,35,34,33,33,33,31,27,24], minTemp: [12,14,18,22,25,26,27,27,26,23,17,12] },
  itanagar:     { name: 'Itanagar',     region: 'Arunachal Pradesh', rainfall: [30,50,120,280,380,500,480,420,290,150,40,20], maxTemp: [18,20,25,28,28,28,28,28,27,25,21,18], minTemp: [8,10,13,17,19,21,22,22,20,16,11,8] },
  dibrugarh:    { name: 'Dibrugarh',   region: 'Assam',             rainfall: [15,22,67,150,280,360,340,290,190,90,18,8],   maxTemp: [20,23,28,31,31,31,31,31,30,28,24,20], minTemp: [9,11,16,20,23,25,26,26,24,20,13,9] },
  kohima:       { name: 'Kohima',       region: 'Nagaland',          rainfall: [25,40,90,180,280,330,350,310,200,100,30,15], maxTemp: [17,19,24,26,26,25,25,25,24,22,19,17], minTemp: [5,7,11,14,17,19,20,20,18,14,9,5] },
  aizawl:       { name: 'Aizawl',       region: 'Mizoram',           rainfall: [20,30,80,200,310,380,360,310,200,110,30,15], maxTemp: [19,21,26,28,28,27,27,27,26,24,21,19], minTemp: [8,10,14,18,20,22,23,23,21,17,12,8] },
  gangtok:      { name: 'Gangtok',      region: 'Sikkim',            rainfall: [25,50,100,220,380,570,620,520,330,120,20,10], maxTemp: [13,14,18,21,22,23,23,23,22,20,17,14], minTemp: [4,5,8,12,15,17,18,18,16,12,7,4] },
  mumbai:       { name: 'Mumbai',       region: 'Maharashtra',       rainfall: [1,1,1,1,9,500,704,531,296,66,12,2],           maxTemp: [31,32,33,34,34,32,30,30,31,33,33,31], minTemp: [17,18,20,24,27,27,26,26,25,24,21,18] },
  delhi:        { name: 'Delhi',        region: 'Delhi',             rainfall: [21,19,17,7,8,65,211,233,150,14,4,10],          maxTemp: [20,23,29,36,40,40,36,35,34,33,28,22], minTemp: [7,9,14,20,25,28,27,26,24,18,12,8] },
  kolkata:      { name: 'Kolkata',      region: 'West Bengal',       rainfall: [10,25,36,57,140,279,330,321,255,128,27,7],    maxTemp: [26,29,34,36,36,34,32,32,32,32,29,26], minTemp: [13,16,20,25,28,28,28,28,27,25,20,14] },
  chennai:      { name: 'Chennai',      region: 'Tamil Nadu',        rainfall: [25,10,6,15,40,53,93,122,119,307,309,139],      maxTemp: [29,31,33,35,38,38,36,35,34,31,29,28], minTemp: [20,21,23,26,28,28,27,27,26,25,23,20] },
  hyderabad:    { name: 'Hyderabad',    region: 'Telangana',         rainfall: [9,11,13,18,30,89,156,168,163,90,24,8],         maxTemp: [28,31,35,38,39,34,30,29,29,29,28,27], minTemp: [15,17,21,25,28,25,24,24,23,22,18,15] },
  bangalore:    { name: 'Bangalore',    region: 'Karnataka',         rainfall: [3,8,14,44,112,81,111,137,191,178,55,14],       maxTemp: [27,30,33,34,33,28,27,27,27,27,26,26], minTemp: [15,17,19,22,22,21,20,20,20,19,17,15] },
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
export { SEASONAL_DATA, MONTHS, getSeason };
