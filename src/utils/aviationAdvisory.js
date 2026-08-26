import { FEATURE_I18N } from './featureTranslations';

export function getAviationAdvisory(weather, selectedDay = 0, lang = 'en') {
  const t = FEATURE_I18N[lang] || FEATURE_I18N.en;
  if (!weather) return null;
  
  const code = selectedDay === 0 ? weather.weatherCode : weather.daily?.weatherCode?.[selectedDay];
  const wind = selectedDay === 0 ? weather.windSpeed : 0; 
  
  if (code >= 95 || code === 65 || code === 67 || code === 75 || code === 82 || code === 86) {
    return { icon: 'storm', title: t.aviationTitleStorm, advice: t.aviationAdvStorm, type: 'danger' };
  }
  
  if (code === 45 || code === 48) {
    return { icon: 'fog', title: t.aviationTitleFog, advice: t.aviationAdvFog, type: 'danger' };
  }

  if (wind > 30) {
    return { icon: 'wind', title: t.aviationTitleWind, advice: t.aviationAdvWind(wind), type: 'caution' };
  }
  
  return { icon: 'good', title: t.aviationTitleGood, advice: t.aviationAdvGood(wind), type: 'good' };
}
