import { FEATURE_I18N } from './featureTranslations';

export function getFarmerAdvisory(weather, selectedDay = 0, lang = 'en') {
  const t = FEATURE_I18N[lang] || FEATURE_I18N.en;
  if (!weather) return null;
  const code = selectedDay === 0 ? weather.weatherCode : weather.daily?.weatherCode?.[selectedDay];
  const rain = selectedDay === 0 ? (weather.rain || weather.precipitation || 0) : 0;
  const uv = selectedDay === 0 ? weather.uvIndex : (weather.daily?.uvIndexMax?.[selectedDay] || 0);
  const wind = selectedDay === 0 ? weather.windSpeed : 0;
  const humidity = weather.humidity || 0;
  const temp = selectedDay === 0 ? weather.temperature : Math.round(((weather.daily?.maxTemp?.[selectedDay] || 0) + (weather.daily?.minTemp?.[selectedDay] || 0)) / 2);
  const precipProb = weather.daily?.precipProbMax?.[selectedDay] || weather.daily?.precipProbMax?.[0] || 0;

  const currentMonth = new Date().getMonth(); // 0 = Jan, 11 = Dec
  let seasonInfo = '';
  if (currentMonth >= 5 && currentMonth <= 9) {
    seasonInfo = lang === 'hi' ? 'खरीफ सीजन (धान, मक्का, कपास)।' : 'Kharif Season (Paddy, Maize, Cotton).';
  } else if (currentMonth >= 10 || currentMonth <= 3) {
    seasonInfo = lang === 'hi' ? 'रबी सीजन (गेहूं, चना, सरसों)।' : 'Rabi Season (Wheat, Gram, Mustard).';
  } else {
    seasonInfo = lang === 'hi' ? 'जायद सीजन (तरबूज, सब्जियां)।' : 'Zaid Season (Vegetables, Melons).';
  }

  const buildAdvice = (base) => `${base} ${seasonInfo}`;

  if (code >= 95) return { icon: 'storm', title: t.farmTitleStorm, advice: buildAdvice(t.farmAdvStorm), type: 'danger' };
  if (code >= 65 || rain > 10) return { icon: 'rain', title: t.farmTitleRain, advice: buildAdvice(t.farmAdvRain(rain)), type: 'danger' };
  if (selectedDay > 0 && precipProb > 75) return { icon: 'rain', title: t.farmTitleRain, advice: buildAdvice(t.farmAdvRainProb(precipProb)), type: 'danger' };
  if ((code >= 51 && code <= 67) || precipProb > 40) return { icon: 'drizzle', title: t.farmTitleSpray, advice: buildAdvice(t.farmAdvSpray(precipProb)), type: 'caution' };
  if (uv >= 9) return { icon: 'uv', title: t.farmTitleUV, advice: buildAdvice(t.farmAdvUV(uv)), type: 'danger' };
  if (wind > 25) return { icon: 'wind', title: t.farmTitleWind, advice: buildAdvice(t.farmAdvWind(wind)), type: 'caution' };
  if (humidity > 85 && temp > 25) return { icon: 'fungal', title: t.farmTitleFungal, advice: buildAdvice(t.farmAdvFungal(humidity)), type: 'caution' };
  if (code === 45 || code === 48) return { icon: 'fog', title: t.farmTitleFog, advice: buildAdvice(t.farmAdvFog), type: 'caution' };
  if (temp <= 5) return { icon: 'frost', title: t.farmTitleFrost, advice: buildAdvice(t.farmAdvFrost(temp)), type: 'danger' };
  if (precipProb < 20 && wind < 15 && uv < 9) return { icon: 'good', title: t.farmTitleIdeal, advice: buildAdvice(t.farmAdvIdeal(wind)), type: 'good' };
  return { icon: 'ok', title: t.farmTitleGood, advice: buildAdvice(t.farmAdvGood(uv)), type: 'good' };
}
