// Open-Meteo Weather & Geocoding API service
// No API key needed — free for non-commercial use

// Hardcoded NER cities for instant fallback geocoding
const NER_CITIES = {
  'guwahati': { lat: 26.1445, lng: 91.7362, name: 'Guwahati', state: 'Assam' },
  'shillong': { lat: 25.5788, lng: 91.8933, name: 'Shillong', state: 'Meghalaya' },
  'imphal': { lat: 24.8170, lng: 93.9368, name: 'Imphal', state: 'Manipur' },
  'agartala': { lat: 23.8315, lng: 91.2868, name: 'Agartala', state: 'Tripura' },
  'kohima': { lat: 25.6751, lng: 94.1086, name: 'Kohima', state: 'Nagaland' },
  'aizawl': { lat: 23.7271, lng: 92.7176, name: 'Aizawl', state: 'Mizoram' },
  'itanagar': { lat: 27.0844, lng: 93.6053, name: 'Itanagar', state: 'Arunachal Pradesh' },
  'gangtok': { lat: 27.3389, lng: 88.6065, name: 'Gangtok', state: 'Sikkim' },
  'dibrugarh': { lat: 27.4728, lng: 94.9120, name: 'Dibrugarh', state: 'Assam' },
  'jorhat': { lat: 26.7509, lng: 94.2037, name: 'Jorhat', state: 'Assam' },
  'silchar': { lat: 24.8333, lng: 92.7789, name: 'Silchar', state: 'Assam' },
  'tezpur': { lat: 26.6338, lng: 92.8000, name: 'Tezpur', state: 'Assam' },
  'nagaon': { lat: 26.3500, lng: 92.6833, name: 'Nagaon', state: 'Assam' },
  'dimapur': { lat: 25.9042, lng: 93.7270, name: 'Dimapur', state: 'Nagaland' },
  'tura': { lat: 25.5144, lng: 90.2178, name: 'Tura', state: 'Meghalaya' },
  'tinsukia': { lat: 27.4889, lng: 95.3553, name: 'Tinsukia', state: 'Assam' },
  'nalbari': { lat: 26.4500, lng: 91.4333, name: 'Nalbari', state: 'Assam' },
  'bongaigaon': { lat: 26.4789, lng: 90.5583, name: 'Bongaigaon', state: 'Assam' },
  'cherrapunji': { lat: 25.2800, lng: 91.7300, name: 'Cherrapunji', state: 'Meghalaya' },
  'dawki': { lat: 25.1861, lng: 92.0211, name: 'Dawki', state: 'Meghalaya' },
  'mawsynram': { lat: 25.2970, lng: 91.5826, name: 'Mawsynram', state: 'Meghalaya' },
  'pasighat': { lat: 28.0669, lng: 95.3269, name: 'Pasighat', state: 'Arunachal Pradesh' },
  'tawang': { lat: 27.5860, lng: 91.8596, name: 'Tawang', state: 'Arunachal Pradesh' },
  'lunglei': { lat: 22.8800, lng: 92.7300, name: 'Lunglei', state: 'Mizoram' },
  'namchi': { lat: 27.1667, lng: 88.3500, name: 'Namchi', state: 'Sikkim' },
};

/**
 * Geocode a location name to coordinates.
 * First checks local NER city map, then falls back to Open-Meteo geocoding API.
 */
export async function geocodeLocation(name, lang = 'en') {
  const normalized = name.toLowerCase().trim();

  // Check local NER cities first
  if (NER_CITIES[normalized]) {
    const city = NER_CITIES[normalized];
    return { lat: city.lat, lng: city.lng, name: city.name, state: city.state };
  }

  // Partial match against NER cities
  for (const [key, city] of Object.entries(NER_CITIES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return { lat: city.lat, lng: city.lng, name: city.name, state: city.state };
    }
  }

  // Fall back to Open-Meteo geocoding
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=${lang}`
    );
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const r = data.results[0];
      return {
        lat: r.latitude,
        lng: r.longitude,
        name: r.name,
        state: r.admin1 || '',
      };
    }
  } catch (err) {
    console.error('Open-Meteo geocoding error:', err);
  }

  // If Open-Meteo fails, try Nominatim (OpenStreetMap) which has much better village/district coverage
  try {
    const nominatimRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=json&limit=1&accept-language=${lang}`
    );
    const nominatimData = await nominatimRes.json();
    if (nominatimData && nominatimData.length > 0) {
      const r = nominatimData[0];
      return {
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
        name: r.name || r.display_name.split(',')[0],
        state: '', // Nominatim search results don't neatly split state at this level without extra params, but name is enough
      };
    }
  } catch (err) {
    console.error('Nominatim geocoding error:', err);
  }

  return null; // Location not found
}

/**
 * Fetch current weather + 7-day forecast from Open-Meteo.
 * URL matches the exact spec:
 * current: temperature_2m, relative_humidity_2m, apparent_temperature, precipitation,
 *          rain, weather_code, wind_speed_10m, wind_direction_10m, uv_index, visibility
 * daily:   temperature_2m_max, temperature_2m_min, precipitation_sum, precipitation_probability_max,
 *          uv_index_max, sunrise, sunset
 * timezone: Asia/Kolkata, forecast_days: 7
 */
export async function getWeather(lat, lng) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m,uv_index,visibility&hourly=temperature_2m,precipitation_probability,wind_speed_10m,wind_direction_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,uv_index_max,sunrise,sunset,weather_code&timezone=Asia%2FKolkata&forecast_days=7`;
  const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi&timezone=Asia%2FKolkata`;

  const [res, aqiRes] = await Promise.all([fetch(url), fetch(aqiUrl)]);
  
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
  
  const data = await res.json();
  let aqiValue = 42; // default
  
  if (aqiRes.ok) {
    const aqiData = await aqiRes.json();
    if (aqiData.current && aqiData.current.us_aqi) {
      aqiValue = aqiData.current.us_aqi;
    }
  }

  const current = data.current;

  return {
    // Current conditions
    temperature: Math.round(current.temperature_2m),
    feelsLike: Math.round(current.apparent_temperature),
    humidity: current.relative_humidity_2m,
    windSpeed: Math.round(current.wind_speed_10m),
    windDirection: current.wind_direction_10m,
    precipitation: current.precipitation,
    rain: current.rain,
    weatherCode: current.weather_code,
    uvIndex: current.uv_index,
    visibility: current.visibility,
    aqi: Math.round(aqiValue),

    // Hourly forecast (next 24 hours)
    hourly: {
      time: data.hourly.time,
      temperature: data.hourly.temperature_2m,
      precipProb: data.hourly.precipitation_probability,
      windSpeed: data.hourly.wind_speed_10m,
      windDirection: data.hourly.wind_direction_10m,
      weatherCode: data.hourly.weather_code,
    },

    // 7-day forecast
    daily: {
      time: data.daily.time,
      maxTemp: data.daily.temperature_2m_max,
      minTemp: data.daily.temperature_2m_min,
      precipProbMax: data.daily.precipitation_probability_max,
      precipitationSum: data.daily.precipitation_sum,
      uvIndexMax: data.daily.uv_index_max,
      sunrise: data.daily.sunrise,
      sunset: data.daily.sunset,
      weatherCode: data.daily.weather_code,
    },

    // Metadata for caching
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Reverse geocode coordinates to a city/town name.
 */
export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`);
    if (res.ok) {
      const data = await res.json();
      const name = data.address?.city || data.address?.town || data.address?.village || data.address?.county || data.address?.state || "Unknown Location";
      return {
        name: name,
        state: data.address?.state || '',
        lat: lat,
        lng: lng
      };
    }
  } catch (err) {
    console.error('Reverse geocoding error:', err);
  }
  return { name: "Current Location", state: "", lat, lng };
}

export { NER_CITIES };
