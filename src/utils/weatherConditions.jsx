import { WEATHER_CONDITIONS_I18N } from './translations';

/**
 * Maps WMO weather codes (used by Open-Meteo) to human-readable conditions,
 * icons (animated SVGs from bmcdn), and Sky Band states.
 *
 * WMO codes: https://open-meteo.com/en/docs#weathervariables
 */

const CONDITIONS = {
  clear: { 
    icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/clear-day.svg" alt="Clear" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, 
    color: '#E8A33D', 
    labelKey: 'clear' 
  },
  cloudy: { 
    icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/cloudy.svg" alt="Cloudy" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, 
    color: '#6B7280', 
    labelKey: 'cloudy' 
  },
  partlyCloudy: { 
    icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/partly-cloudy-day.svg" alt="Partly Cloudy" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, 
    color: '#9CA3AF', 
    labelKey: 'partlyCloudy' 
  },
  rain: { 
    icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/rain.svg" alt="Rain" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, 
    color: '#3B82F6', 
    labelKey: 'rain' 
  },
  heavyRain: { 
    icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/rain.svg" alt="Heavy Rain" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, 
    color: '#1D4ED8', 
    labelKey: 'heavyRain' 
  },
  thunderstorm: { 
    icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/thunderstorms-rain.svg" alt="Thunderstorm" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, 
    color: '#8B5CF6', 
    labelKey: 'thunderstorm' 
  },
  snow: { 
    icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/snow.svg" alt="Snow" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, 
    color: '#E5E7EB', 
    labelKey: 'snow' 
  },
  fog: { 
    icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/fog.svg" alt="Fog" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, 
    color: '#9CA3AF', 
    labelKey: 'fog' 
  }
};

const WMO_CODE_MAP = {
  0:  { condition: 'clear',  icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/clear-day.svg" alt="Clear" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, key: 'clear' },
  1:  { condition: 'clear',  icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/partly-cloudy-day.svg" alt="Mostly Clear" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, key: 'mostlyClear' },
  2:  { condition: 'cloudy', icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/partly-cloudy-day.svg" alt="Partly Cloudy" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, key: 'partlyCloudy' },
  3:  { condition: 'cloudy', icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/cloudy.svg" alt="Overcast" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, key: 'overcast' },
  45: { condition: 'cloudy', icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/fog.svg" alt="Fog" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, key: 'fog' },
  48: { condition: 'cloudy', icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/fog.svg" alt="Rime Fog" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, key: 'rimeFog' },
  51: { condition: 'rain',   icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/drizzle.svg" alt="Drizzle" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, key: 'lightDrizzle' },
  53: { condition: 'rain',   icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/drizzle.svg" alt="Drizzle" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, key: 'modDrizzle' },
  55: { condition: 'rain',   icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/rain.svg" alt="Rain" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, key: 'denseDrizzle' },
  56: { condition: 'rain',   icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/sleet.svg" alt="Freezing Drizzle" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, key: 'freezingDrizzle' },
  57: { condition: 'rain',   icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/sleet.svg" alt="Freezing Drizzle" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, key: 'freezingDrizzle' },
  61: { condition: 'rain',   icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/rain.svg" alt="Rain" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, key: 'slightRain' },
  63: { condition: 'rain',   icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/rain.svg" alt="Rain" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, key: 'modRain' },
  65: { condition: 'storm',  icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/rain.svg" alt="Heavy Rain" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, key: 'heavyRain' },
  66: { condition: 'rain',   icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/sleet.svg" alt="Freezing Rain" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, key: 'freezingRain' },
  67: { condition: 'storm',  icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/sleet.svg" alt="Freezing Rain" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, key: 'freezingRain' },
  71: { condition: 'cloudy', icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/snow.svg" alt="Snow" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, key: 'slightSnow' },
  73: { condition: 'cloudy', icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/snow.svg" alt="Snow" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, key: 'modSnow' },
  75: { condition: 'storm',  icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/snow.svg" alt="Heavy Snow" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, key: 'heavySnow' },
  77: { condition: 'cloudy', icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/snow.svg" alt="Snow Grains" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, key: 'snowGrains' },
  80: { condition: 'rain',   icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/drizzle.svg" alt="Showers" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, key: 'slightShowers' },
  81: { condition: 'rain',   icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/rain.svg" alt="Showers" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, key: 'modShowers' },
  82: { condition: 'storm',  icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/rain.svg" alt="Violent Showers" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, key: 'violentShowers' },
  85: { condition: 'cloudy', icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/snow.svg" alt="Snow" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, key: 'slightSnow' },
  86: { condition: 'storm',  icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/snow.svg" alt="Heavy Snow" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, key: 'heavySnow' },
  95: { condition: 'storm',  icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/thunderstorms-rain.svg" alt="Thunderstorm" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, key: 'thunderstorm' },
  96: { condition: 'severe', icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/thunderstorms-rain.svg" alt="Thunderstorm" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, key: 'thunderstormHail' },
  99: { condition: 'severe', icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/thunderstorms-rain.svg" alt="Thunderstorm" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, key: 'thunderstormHail' },
};

/**
 * Get weather condition info from WMO code.
 */
export function getWeatherInfo(code, lang = 'en') {
  const info = WMO_CODE_MAP[code] || { condition: 'clear', icon: <img src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@latest/production/fill/all/clear-day.svg" alt="Clear" className="w-[1.2em] h-[1.2em] drop-shadow-md inline-block align-middle" />, key: 'unknown' };
  
  // Get translation dictionary for language, fallback to English
  const dict = WEATHER_CONDITIONS_I18N[lang] || WEATHER_CONDITIONS_I18N['en'];
  
  return {
    ...info,
    label: dict[info.key] || WEATHER_CONDITIONS_I18N['en'][info.key] || 'Unknown'
  };
}

/**
 * Determine if weather conditions are severe enough to trigger an alert.
 * Returns { isSevere, summary, detail, action } or null.
 */
export function checkSeverity(weatherData, locationName) {
  const { weatherCode, windSpeed, precipitation, rain, visibility } = weatherData;
  const info = getWeatherInfo(weatherCode);

  // Severe thunderstorms
  if (weatherCode >= 95) {
    return {
      isSevere: true,
      summary: `⛈️ Thunderstorm warning for ${locationName}`,
      detail: `Severe thunderstorm activity detected with ${info.label.toLowerCase()}. Wind speeds at ${windSpeed} km/h.`,
      action: 'Avoid outdoor activities and travel. Stay indoors and away from windows.',
    };
  }

  // Heavy rain (> 10mm current)
  if (rain > 10 || precipitation > 15) {
    return {
      isSevere: true,
      summary: `🌧️ Heavy rainfall warning for ${locationName}`,
      detail: `Heavy rain: ${rain || precipitation}mm recorded. Risk of waterlogging and landslides in hilly areas.`,
      action: 'Avoid low-lying areas and hill roads. Plan travel for drier hours.',
    };
  }

  // Very high winds (> 50 km/h)
  if (windSpeed > 50) {
    return {
      isSevere: true,
      summary: `💨 High wind warning for ${locationName}`,
      detail: `Wind speeds at ${windSpeed} km/h. Risk of fallen trees and disrupted travel.`,
      action: 'Secure loose objects. Avoid highways and exposed areas.',
    };
  }

  // Very low visibility (< 1km = 1000m)
  if (visibility !== undefined && visibility < 1000) {
    return {
      isSevere: true,
      summary: `🌫️ Low visibility warning for ${locationName}`,
      detail: `Visibility down to ${visibility}m. Dense fog or heavy rain reducing visibility.`,
      action: 'Avoid driving if possible. Use fog lights and reduce speed.',
    };
  }

  // Caution-level rain
  if (info.condition === 'storm' || rain > 5) {
    return {
      isSevere: false,
      summary: `🌧️ Rain advisory for ${locationName}`,
      detail: `${info.label} with ${rain || precipitation}mm. Roads may be slippery.`,
      action: 'Carry an umbrella. Drive carefully on wet roads.',
    };
  }

  return null;
}

/**
 * Map weather condition string to Sky Band gradient.
 */
export function getSkyBandGradient(condition) {
  switch (condition) {
    case 'clear':
      return 'linear-gradient(135deg, #87CEEB, #E8A33D, #FDB99B)';
    case 'cloudy':
      return 'linear-gradient(135deg, #94A3B8, #CBD5E1, #94A3B8)';
    case 'rain':
      return 'linear-gradient(135deg, #2F6F6D, #475569, #1B2A4A)';
    case 'storm':
      return 'linear-gradient(135deg, #1B2A4A, #374151, #1B2A4A)';
    case 'severe':
      return 'linear-gradient(135deg, #C1443C, #1B2A4A, #C1443C)';
    default:
      return 'linear-gradient(135deg, #87CEEB, #E8A33D, #FDB99B)';
  }
}

export { WMO_CODE_MAP };
