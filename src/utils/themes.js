export const WEATHER_THEMES = {
  clear: { bgImage: '/backgrounds/amoled_clear.jpg', overlay: 'from-transparent via-[#070b19]/60 to-[#070b19]/95', accent: 'from-[#ff7b00]/20' },
  partlyCloudy: { bgImage: '/backgrounds/amoled_partly_cloudy.jpg', overlay: 'from-transparent via-[#0f172a]/60 to-[#0f172a]/95', accent: 'from-blue-400/20' },
  cloudy: { bgImage: '/backgrounds/amoled_cloudy.jpg', overlay: 'from-transparent via-[#0f172a]/70 to-[#0f172a]/95', accent: 'from-blue-500/20' },
  drizzle: { bgImage: '/backgrounds/amoled_rain.jpg', overlay: 'from-transparent via-[#0f172a]/80 to-[#0f172a]/95', accent: 'from-teal-600/20' },
  rain: { bgImage: '/backgrounds/amoled_rain.jpg', overlay: 'from-transparent via-[#0f172a]/80 to-[#0f172a]/95', accent: 'from-blue-600/20' },
  showers: { bgImage: '/backgrounds/amoled_rain.jpg', overlay: 'from-transparent via-[#0f172a]/70 to-[#0f172a]/95', accent: 'from-blue-500/20' },
  freezingRain: { bgImage: '/backgrounds/amoled_snow.jpg', overlay: 'from-transparent via-[#1e293b]/70 to-[#0f172a]/95', accent: 'from-cyan-400/20' },
  snow: { bgImage: '/backgrounds/amoled_snow.jpg', overlay: 'from-transparent via-[#1e293b]/50 to-[#0f172a]/95', accent: 'from-blue-200/20' },
  snowShowers: { bgImage: '/backgrounds/amoled_snow.jpg', overlay: 'from-transparent via-[#1e293b]/60 to-[#0f172a]/95', accent: 'from-slate-300/20' },
  thunderstorm: { bgImage: '/backgrounds/amoled_storm.jpg', overlay: 'from-transparent via-[#1e1b4b]/80 to-[#000000]/95', accent: 'from-indigo-600/30' },
  severeStorm: { bgImage: '/backgrounds/amoled_storm.jpg', overlay: 'from-transparent via-[#450a0a]/80 to-[#2e0404]/95', accent: 'from-red-600/30' },
  fog: { bgImage: '/backgrounds/amoled_fog.jpg', overlay: 'from-transparent via-[#334155]/70 to-[#0f172a]/95', accent: 'from-gray-400/20' },
  windy: { bgImage: '/backgrounds/amoled_windy.jpg', overlay: 'from-transparent via-[#0f172a]/60 to-[#0f172a]/95', accent: 'from-teal-400/20' },
  heatWave: { bgImage: '/backgrounds/amoled_heat.jpg', overlay: 'from-transparent via-[#7f1d1d]/60 to-[#450a0a]/95', accent: 'from-orange-500/30' },
  coldWave: { bgImage: '/backgrounds/amoled_cold.jpg', overlay: 'from-transparent via-[#0f172a]/70 to-[#020617]/95', accent: 'from-cyan-500/30' }
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
