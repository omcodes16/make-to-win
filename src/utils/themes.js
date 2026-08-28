const APP_SEED = Math.floor(Math.random() * 100000);
const getBgUrl = (prompt) => `https://image.pollinations.ai/prompt/beautiful%20aesthetic%20dark%20amoled%20${encodeURIComponent(prompt)}%20weather%20landscape%20minimalist%20wallpaper?width=1920&height=1080&nologo=true&seed=${APP_SEED}`;

export const WEATHER_THEMES = {
  clear: { bgImage: getBgUrl('clear night sky with stars'), overlay: 'from-transparent via-amber-950/40 to-surface-0/95', accent: 'from-amber-400/20' },
  partlyCloudy: { bgImage: getBgUrl('partly cloudy moonlit night'), overlay: 'from-transparent via-surface-1/60 to-surface-0/95', accent: 'from-sky-400/20' },
  cloudy: { bgImage: getBgUrl('dark cloudy overcast night'), overlay: 'from-transparent via-slate-900/70 to-surface-0/95', accent: 'from-indigo-500/20' },
  drizzle: { bgImage: getBgUrl('light rain drizzle night'), overlay: 'from-transparent via-teal-950/50 to-surface-0/95', accent: 'from-teal-400/25' },
  rain: { bgImage: getBgUrl('heavy rain dark night'), overlay: 'from-transparent via-blue-950/60 to-surface-0/95', accent: 'from-blue-500/25' },
  showers: { bgImage: getBgUrl('rain showers night sky'), overlay: 'from-transparent via-cyan-950/50 to-surface-0/95', accent: 'from-cyan-400/20' },
  freezingRain: { bgImage: getBgUrl('freezing cold ice rain night'), overlay: 'from-transparent via-cyan-950/60 to-surface-0/95', accent: 'from-cyan-300/25' },
  snow: { bgImage: getBgUrl('snowing winter night'), overlay: 'from-transparent via-blue-950/40 to-surface-0/95', accent: 'from-blue-200/25' },
  snowShowers: { bgImage: getBgUrl('heavy snow storm night'), overlay: 'from-transparent via-slate-900/60 to-surface-0/95', accent: 'from-slate-300/25' },
  thunderstorm: { bgImage: getBgUrl('lightning thunderstorm dark night'), overlay: 'from-transparent via-indigo-950/70 to-surface-0/95', accent: 'from-purple-600/30' },
  severeStorm: { bgImage: getBgUrl('severe hurricane storm lightning night'), overlay: 'from-transparent via-red-950/70 to-surface-0/95', accent: 'from-red-600/35' },
  fog: { bgImage: getBgUrl('spooky foggy misty night'), overlay: 'from-transparent via-slate-900/70 to-surface-0/95', accent: 'from-gray-400/20' },
  windy: { bgImage: getBgUrl('windy dark storm clouds night'), overlay: 'from-transparent via-emerald-950/50 to-surface-0/95', accent: 'from-emerald-400/20' },
  heatWave: { bgImage: getBgUrl('red hot glowing heatwave night'), overlay: 'from-transparent via-orange-950/60 to-surface-0/95', accent: 'from-orange-500/35' },
  coldWave: { bgImage: getBgUrl('freezing freezing ice cold night'), overlay: 'from-transparent via-cyan-950/60 to-surface-0/95', accent: 'from-cyan-500/30' }
};

export function getTheme(weather, weatherInfo) {
  if (!weather || !weatherInfo) return WEATHER_THEMES.clear;

  // 1. Temperature Extremes (Overrides conditions)
  if (weather.temperature >= 40) return WEATHER_THEMES.heatWave;
  if (weather.temperature <= 0) return WEATHER_THEMES.coldWave;

  // 2. Wind Extremes (Overrides if clear/cloudy)
  if (weather.windSpeed > 40 && (weatherInfo.condition === 'clear' || weatherInfo.condition === 'cloudy')) {
    return WEATHER_THEMES.windy;
  }

  // 3. Exact Key Matching based on weatherInfo.key
  const key = weatherInfo.key;
  if (key === 'clear') return WEATHER_THEMES.clear;
  if (key === 'mostlyClear' || key === 'partlyCloudy') return WEATHER_THEMES.partlyCloudy;
  if (key === 'overcast') return WEATHER_THEMES.cloudy;
  
  if (key.includes('Drizzle')) return WEATHER_THEMES.drizzle;
  if (key === 'freezingRain' || key === 'freezingDrizzle') return WEATHER_THEMES.freezingRain;
  if (key.includes('Showers') && !key.includes('Snow')) return WEATHER_THEMES.showers;
  if (key.includes('Rain')) return WEATHER_THEMES.rain;
  
  if (key === 'snowShowers') return WEATHER_THEMES.snowShowers;
  if (key.includes('Snow')) return WEATHER_THEMES.snow;

  if (key === 'thunderstormHail' || key === 'violentShowers') return WEATHER_THEMES.severeStorm;
  if (key === 'thunderstorm') return WEATHER_THEMES.thunderstorm;

  if (key === 'fog' || key === 'rimeFog') return WEATHER_THEMES.fog;

  // Fallback to the broad condition string (clear, cloudy, rain, storm, severe)
  const broad = weatherInfo.condition;
  if (broad === 'severe') return WEATHER_THEMES.severeStorm;
  if (broad === 'storm') return WEATHER_THEMES.thunderstorm;
  
  return WEATHER_THEMES[broad] || WEATHER_THEMES.clear;
}
