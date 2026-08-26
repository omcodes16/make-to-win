import { FEATURE_I18N } from './featureTranslations';

export function getFishermanAdvisory(weather, selectedDay = 0, lang = 'en') {
  const t = FEATURE_I18N[lang] || FEATURE_I18N.en;
  if (!weather) return null;
  
  const code = selectedDay === 0 ? weather.weatherCode : weather.daily?.weatherCode?.[selectedDay];
  const wind = selectedDay === 0 ? weather.windSpeed : 0; 
  const rain = selectedDay === 0 ? (weather.rain || weather.precipitation || 0) : 0;
  
  if (code >= 95 || code === 65 || code === 67 || code === 75 || code === 82 || code === 86) {
    return { icon: 'storm', title: t.marineTitleStorm, advice: t.marineAdvStorm, type: 'danger' };
  }
  
  if (wind > 25) {
    return { icon: 'wind', title: t.marineTitleWind, advice: t.marineAdvWind(wind), type: 'danger' };
  }
  
  if (code === 45 || code === 48) {
    return { icon: 'fog', title: t.marineTitleFog, advice: t.marineAdvFog, type: 'caution' };
  }
  
  if (rain > 10 || (code >= 51 && code <= 63) || code === 80 || code === 81) {
    return { icon: 'rain', title: t.marineTitleRain, advice: t.marineAdvRain(rain > 0 ? rain : 'forecast'), type: 'caution' };
  }
  
  return { icon: 'good', title: t.marineTitleGood, advice: t.marineAdvGood(wind), type: 'good' };
}
