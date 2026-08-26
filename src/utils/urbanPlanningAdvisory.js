import { FEATURE_I18N } from './featureTranslations';

export function getUrbanPlanningAdvisory(weather, selectedDay = 0, lang = 'en') {
  const t = FEATURE_I18N[lang] || FEATURE_I18N.en;
  if (!weather) return null;
  
  const code = selectedDay === 0 ? weather.weatherCode : weather.daily?.weatherCode?.[selectedDay];
  const rain = selectedDay === 0 ? (weather.rain || weather.precipitation || 0) : 0;
  const temp = selectedDay === 0 ? weather.temperature : Math.round(((weather.daily?.maxTemp?.[selectedDay] || 0) + (weather.daily?.minTemp?.[selectedDay] || 0)) / 2);
  
  // High rain -> Flood Risk
  if (rain > 20 || code >= 61 && code !== 71 && code !== 73 && code !== 75) {
    return { icon: 'rain', title: t.urbanTitleRain, advice: t.urbanAdvRain(rain > 0 ? rain : 'forecast'), type: 'danger' };
  }
  
  // High temp -> Heatwave Risk
  if (temp > 38) {
    return { icon: 'heat', title: t.urbanTitleHeat, advice: t.urbanAdvHeat(temp), type: 'caution' };
  }
  
  return { icon: 'good', title: t.urbanTitleGood, advice: t.urbanAdvGood, type: 'good' };
}
