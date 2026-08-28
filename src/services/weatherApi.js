// Open-Meteo Weather & Geocoding API service
// No API key needed — free for non-commercial use

// Hardcoded NER cities for instant fallback geocoding
const NER_CITIES = {
  'guwahati': { lat: 26.1445, lng: 91.7362, name: 'Guwahati', state: 'Assam', district: 'Kamrup Metropolitan' },
  'shillong': { lat: 25.5788, lng: 91.8933, name: 'Shillong', state: 'Meghalaya', district: 'East Khasi Hills' },
  'imphal': { lat: 24.8170, lng: 93.9368, name: 'Imphal', state: 'Manipur', district: 'Imphal West' },
  'agartala': { lat: 23.8315, lng: 91.2868, name: 'Agartala', state: 'Tripura', district: 'West Tripura' },
  'kohima': { lat: 25.6751, lng: 94.1086, name: 'Kohima', state: 'Nagaland', district: 'Kohima' },
  'aizawl': { lat: 23.7271, lng: 92.7176, name: 'Aizawl', state: 'Mizoram', district: 'Aizawl' },
  'itanagar': { lat: 27.0844, lng: 93.6053, name: 'Itanagar', state: 'Arunachal Pradesh', district: 'Papum Pare' },
  'gangtok': { lat: 27.3389, lng: 88.6065, name: 'Gangtok', state: 'Sikkim', district: 'East Sikkim' },
  'dibrugarh': { lat: 27.4728, lng: 94.9120, name: 'Dibrugarh', state: 'Assam', district: 'Dibrugarh' },
  'jorhat': { lat: 26.7509, lng: 94.2037, name: 'Jorhat', state: 'Assam', district: 'Jorhat' },
  'silchar': { lat: 24.8333, lng: 92.7789, name: 'Silchar', state: 'Assam', district: 'Cachar' },
  'tezpur': { lat: 26.6338, lng: 92.8000, name: 'Tezpur', state: 'Assam', district: 'Sonitpur' },
  'nagaon': { lat: 26.3500, lng: 92.6833, name: 'Nagaon', state: 'Assam', district: 'Nagaon' },
  'dimapur': { lat: 25.9042, lng: 93.7270, name: 'Dimapur', state: 'Nagaland', district: 'Dimapur' },
  'tura': { lat: 25.5144, lng: 90.2178, name: 'Tura', state: 'Meghalaya', district: 'West Garo Hills' },
  'tinsukia': { lat: 27.4889, lng: 95.3553, name: 'Tinsukia', state: 'Assam', district: 'Tinsukia' },
  'nalbari': { lat: 26.4500, lng: 91.4333, name: 'Nalbari', state: 'Assam', district: 'Nalbari' },
  'bongaigaon': { lat: 26.4789, lng: 90.5583, name: 'Bongaigaon', state: 'Assam', district: 'Bongaigaon' },
  'cherrapunji': { lat: 25.2800, lng: 91.7300, name: 'Cherrapunji', state: 'Meghalaya', district: 'East Khasi Hills' },
  'dawki': { lat: 25.1861, lng: 92.0211, name: 'Dawki', state: 'Meghalaya', district: 'West Jaintia Hills' },
  'mawsynram': { lat: 25.2970, lng: 91.5826, name: 'Mawsynram', state: 'Meghalaya', district: 'East Khasi Hills' },
  'pasighat': { lat: 28.0669, lng: 95.3269, name: 'Pasighat', state: 'Arunachal Pradesh', district: 'East Siang' },
  'tawang': { lat: 27.5860, lng: 91.8596, name: 'Tawang', state: 'Arunachal Pradesh', district: 'Tawang' },
  'lunglei': { lat: 22.8800, lng: 92.7300, name: 'Lunglei', state: 'Mizoram', district: 'Lunglei' },
  'namchi': { lat: 27.1667, lng: 88.3500, name: 'Namchi', state: 'Sikkim', district: 'South Sikkim' },
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
    return { lat: city.lat, lng: city.lng, name: city.name, state: city.state, district: city.district };
  }

  // Partial match against NER cities
  for (const [key, city] of Object.entries(NER_CITIES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return { lat: city.lat, lng: city.lng, name: city.name, state: city.state, district: city.district };
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
        district: r.admin2 || ''
      };
    }
  } catch (err) {
    console.error('Open-Meteo geocoding error:', err);
  }

  // If Open-Meteo fails, try Nominatim (OpenStreetMap) which has much better village/district coverage
  try {
    const nominatimRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=json&limit=1&accept-language=${lang}&addressdetails=1`,
      { headers: { 'User-Agent': 'WeatherGPT' } }
    );
    const nominatimData = await nominatimRes.json();
    if (nominatimData && nominatimData.length > 0) {
      const r = nominatimData[0];
      return {
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
        name: r.name || r.display_name.split(',')[0],
        state: r.address?.state || '',
        district: r.address?.state_district || r.address?.county || ''
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
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m,uv_index,visibility,is_day&hourly=temperature_2m,precipitation_probability,wind_speed_10m,wind_direction_10m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,uv_index_max,sunrise,sunset,weather_code&timezone=auto&forecast_days=7`;
  const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi&timezone=auto`;

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

  const weatherData = {
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
    isDay: current.is_day === 1,

    // Hourly forecast (next 24 hours)
    hourly: {
      time: data.hourly.time,
      temperature: data.hourly.temperature_2m,
      precipProb: data.hourly.precipitation_probability,
      windSpeed: data.hourly.wind_speed_10m,
      windDirection: data.hourly.wind_direction_10m,
      weatherCode: data.hourly.weather_code,
      isDay: (data.hourly.is_day || []).map(d => d === 1),
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

    // NWP Model Transparency Data (not available without multi-model, set to null)
    modelData: {
      daily: {
        gfs: { maxTemp: null, precipProbMax: null },
        icon: { maxTemp: null, precipProbMax: null },
        ecmwf: { maxTemp: null, precipProbMax: null },
      }
    },

    // Metadata for caching
    fetchedAt: new Date().toISOString(),

  };

  // Fetch the server-computed confidence value
  try {
    // import.meta.env is only available in Vite/browser context, not in Node.js server
    const metaEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
    const baseUrl = (metaEnv.VITE_API_URL || '').replace(/\/+$/, '');
    const confRes = await fetch(`${baseUrl}/api/confidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contextData: { modelData: weatherData.modelData } })
    });
    if (confRes.ok) {
      const { confidence } = await confRes.json();
      weatherData.confidence = confidence;
    } else {
      weatherData.confidence = 'high';
    }
  } catch (err) {
    weatherData.confidence = 'high';
  }

  return weatherData;
}

/**
 * Reverse geocode coordinates to a city/town name.
 */
export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`, { headers: { 'User-Agent': 'WeatherGPT' } });
    if (res.ok) {
      const data = await res.json();
      const name = data.address?.city || data.address?.town || data.address?.village || data.address?.county || data.address?.state || "Unknown Location";
      return {
        name: name,
        state: data.address?.state || '',
        district: data.address?.state_district || data.address?.county || '',
        lat: lat,
        lng: lng
      };
    }
  } catch (err) {
    console.error('Reverse geocoding error:', err);
  }
  return { name: "Current Location", state: "", district: "", lat, lng };
}

export { NER_CITIES };

/**
 * Fetches specialized data based on the selected user profile.
 * Completely separate from the main weather fetch to ensure no existing logic breaks.
 */
export async function getSpecializedData(lat, lng, profile) {
  try {
    let url = '';
    const currentHour = new Date().getHours();
    
    if (profile === 'farmer') {
      url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=soil_temperature_6cm,soil_moisture_1_to_3cm,et0_fao_evapotranspiration&timezone=auto`;
    } 
    else if (profile === 'fisherman') {
      url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&hourly=wave_height,wave_period,wave_direction&timezone=auto`;
    } 
    else if (profile === 'aviation') {
      url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=visibility,cloudcover_low,windgusts_10m,cape&timezone=auto`;
    } 
    else if (profile === 'urbanPlanning') {
      const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&hourly=pm10,pm2_5&timezone=auto`;
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=uv_index,apparent_temperature&timezone=auto`;
      
      const [aqiRes, weatherRes] = await Promise.all([fetch(aqiUrl), fetch(weatherUrl)]);
      if (aqiRes.ok && weatherRes.ok) {
        const aqiData = await aqiRes.json();
        const weatherData = await weatherRes.json();
        return {
          pm2_5: aqiData.hourly?.pm2_5?.[currentHour] ?? 0,
          pm10: aqiData.hourly?.pm10?.[currentHour] ?? 0,
          uv_index: weatherData.hourly?.uv_index?.[currentHour] ?? 0,
          feels_like: weatherData.hourly?.apparent_temperature?.[currentHour] ?? 0,
        };
      }
      return { pm2_5: 0, pm10: 0, uv_index: 0, feels_like: 0 };
    }
    else {
      return null;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Specialized API error: ${res.status}`);
    const data = await res.json();
    
    if (profile === 'farmer') {
      return {
        soil_temp: data.hourly?.soil_temperature_6cm?.[currentHour] ?? 0,
        soil_moisture: data.hourly?.soil_moisture_1_to_3cm?.[currentHour] ?? 0,
        evapotranspiration: data.hourly?.et0_fao_evapotranspiration?.[currentHour] ?? 0
      };
    } else if (profile === 'fisherman') {
      return {
        wave_height: data.hourly?.wave_height?.[currentHour] ?? null,
        wave_period: data.hourly?.wave_period?.[currentHour] ?? null,
        wave_direction: data.hourly?.wave_direction?.[currentHour] ?? null
      };
    } else if (profile === 'aviation') {
      return {
        visibility: data.hourly?.visibility?.[currentHour] ?? 10000,
        cloudcover_low: data.hourly?.cloudcover_low?.[currentHour] ?? 0,
        windgusts: data.hourly?.windgusts_10m?.[currentHour] ?? 0,
        cape: data.hourly?.cape?.[currentHour] ?? 0
      };
    }
  } catch (err) {
    console.error('Error fetching specialized data:', err);
    if (profile === 'farmer') return { soil_temp: 0, soil_moisture: 0, evapotranspiration: 0 };
    if (profile === 'fisherman') return { wave_height: null, wave_period: null, wave_direction: null };
    if (profile === 'aviation') return { visibility: 10000, cloudcover_low: 0, windgusts: 0, cape: 0 };
    if (profile === 'urbanPlanning') return { pm2_5: 0, pm10: 0, uv_index: 0, feels_like: 0 };
    return null;
  }
}
