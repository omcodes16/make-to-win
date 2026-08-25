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

  if (code >= 95) return { icon: 'storm', title: t.farmTitleStorm, advice: t.farmAdvStorm, type: 'danger' };
  if (code >= 65 || rain > 10) return { icon: 'rain', title: t.farmTitleRain, advice: t.farmAdvRain(rain), type: 'danger' };
  if (selectedDay > 0 && precipProb > 75) return { icon: 'rain', title: t.farmTitleRain, advice: t.farmAdvRainProb(precipProb), type: 'danger' };
  if ((code >= 51 && code <= 67) || precipProb > 40) return { icon: 'drizzle', title: t.farmTitleSpray, advice: t.farmAdvSpray(precipProb), type: 'caution' };
  if (uv >= 9) return { icon: 'uv', title: t.farmTitleUV, advice: t.farmAdvUV(uv), type: 'danger' };
  if (wind > 25) return { icon: 'wind', title: t.farmTitleWind, advice: t.farmAdvWind(wind), type: 'caution' };
  if (humidity > 85 && temp > 25) return { icon: 'fungal', title: t.farmTitleFungal, advice: t.farmAdvFungal(humidity), type: 'caution' };
  if (code === 45 || code === 48) return { icon: 'fog', title: t.farmTitleFog, advice: t.farmAdvFog, type: 'caution' };
  if (temp <= 5) return { icon: 'frost', title: t.farmTitleFrost, advice: t.farmAdvFrost(temp), type: 'danger' };
  if (precipProb < 20 && wind < 15 && uv < 9) return { icon: 'good', title: t.farmTitleIdeal, advice: t.farmAdvIdeal(wind), type: 'good' };
  return { icon: 'ok', title: t.farmTitleGood, advice: t.farmAdvGood(uv), type: 'good' };
}
