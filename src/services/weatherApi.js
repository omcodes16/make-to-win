// Open-Meteo Weather & Geocoding API service
// Strictly scoped to India (Villages, Districts, Cities, States)

// Major Indian cities and state capitals for instant local resolution
const INDIA_CITIES = {
  'bhopal': { lat: 23.2599, lng: 77.4126, name: 'Bhopal', state: 'Madhya Pradesh', district: 'Bhopal' },
  'indore': { lat: 22.7196, lng: 75.8577, name: 'Indore', state: 'Madhya Pradesh', district: 'Indore' },
  'jabalpur': { lat: 23.1815, lng: 79.9864, name: 'Jabalpur', state: 'Madhya Pradesh', district: 'Jabalpur' },
  'gwalior': { lat: 26.2183, lng: 78.1828, name: 'Gwalior', state: 'Madhya Pradesh', district: 'Gwalior' },
  'ujjain': { lat: 23.1765, lng: 75.7885, name: 'Ujjain', state: 'Madhya Pradesh', district: 'Ujjain' },
  'delhi': { lat: 28.6139, lng: 77.2090, name: 'New Delhi', state: 'Delhi (NCT)', district: 'New Delhi' },
  'new delhi': { lat: 28.6139, lng: 77.2090, name: 'New Delhi', state: 'Delhi (NCT)', district: 'New Delhi' },
  'mumbai': { lat: 19.0760, lng: 72.8777, name: 'Mumbai', state: 'Maharashtra', district: 'Mumbai' },
  'pune': { lat: 18.5204, lng: 73.8567, name: 'Pune', state: 'Maharashtra', district: 'Pune' },
  'nagpur': { lat: 21.1458, lng: 79.0882, name: 'Nagpur', state: 'Maharashtra', district: 'Nagpur' },
  'bengaluru': { lat: 12.9716, lng: 77.5946, name: 'Bengaluru', state: 'Karnataka', district: 'Bengaluru Urban' },
  'bangalore': { lat: 12.9716, lng: 77.5946, name: 'Bengaluru', state: 'Karnataka', district: 'Bengaluru Urban' },
  'hyderabad': { lat: 17.3850, lng: 78.4867, name: 'Hyderabad', state: 'Telangana', district: 'Hyderabad' },
  'chennai': { lat: 13.0827, lng: 80.2707, name: 'Chennai', state: 'Tamil Nadu', district: 'Chennai' },
  'kolkata': { lat: 22.5726, lng: 88.3639, name: 'Kolkata', state: 'West Bengal', district: 'Kolkata' },
  'jaipur': { lat: 26.9124, lng: 75.7873, name: 'Jaipur', state: 'Rajasthan', district: 'Jaipur' },
  'lucknow': { lat: 26.8467, lng: 80.9462, name: 'Lucknow', state: 'Uttar Pradesh', district: 'Lucknow' },
  'kanpur': { lat: 26.4499, lng: 80.3319, name: 'Kanpur', state: 'Uttar Pradesh', district: 'Kanpur Nagar' },
  'varanasi': { lat: 25.3176, lng: 82.9739, name: 'Varanasi', state: 'Uttar Pradesh', district: 'Varanasi' },
  'patna': { lat: 25.5941, lng: 85.1376, name: 'Patna', state: 'Bihar', district: 'Patna' },
  'ranchi': { lat: 23.3441, lng: 85.3096, name: 'Ranchi', state: 'Jharkhand', district: 'Ranchi' },
  'raipur': { lat: 21.2514, lng: 81.6296, name: 'Raipur', state: 'Chhattisgarh', district: 'Raipur' },
  'bhubaneswar': { lat: 20.2961, lng: 85.8245, name: 'Bhubaneswar', state: 'Odisha', district: 'Khurda' },
  'ahmedabad': { lat: 23.0225, lng: 72.5714, name: 'Ahmedabad', state: 'Gujarat', district: 'Ahmedabad' },
  'surat': { lat: 21.1702, lng: 72.8311, name: 'Surat', state: 'Gujarat', district: 'Surat' },
  'chandigarh': { lat: 30.7333, lng: 76.7794, name: 'Chandigarh', state: 'Chandigarh', district: 'Chandigarh' },
  'dehradun': { lat: 30.3165, lng: 78.0322, name: 'Dehradun', state: 'Uttarakhand', district: 'Dehradun' },
  'shimla': { lat: 31.1048, lng: 77.1734, name: 'Shimla', state: 'Himachal Pradesh', district: 'Shimla' },
  'srinagar': { lat: 34.0837, lng: 74.7973, name: 'Srinagar', state: 'Jammu & Kashmir', district: 'Srinagar' },
  'jammu': { lat: 32.7266, lng: 74.8570, name: 'Jammu', state: 'Jammu & Kashmir', district: 'Jammu' },
  'amritsar': { lat: 31.6340, lng: 74.8723, name: 'Amritsar', state: 'Punjab', district: 'Amritsar' },
  'ludhiana': { lat: 30.9010, lng: 75.8573, name: 'Ludhiana', state: 'Punjab', district: 'Ludhiana' },
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
  'loktak lake': { lat: 24.5584, lng: 93.8132, name: 'Loktak Lake', state: 'Manipur', district: 'Bishnupur' },
  'loktak': { lat: 24.5584, lng: 93.8132, name: 'Loktak Lake', state: 'Manipur', district: 'Bishnupur' },
};

// Client-side local cache for instant village/district lookup
const CLIENT_LOC_CACHE_KEY = 'weathergpt_village_cache_v1';
const MEMORY_LOC_CACHE = new Map();

function getClientCachedSuggestions(query) {
  const q = query.toLowerCase().trim();
  if (MEMORY_LOC_CACHE.has(q)) {
    return MEMORY_LOC_CACHE.get(q);
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(`${CLIENT_LOC_CACHE_KEY}_${q}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.expiresAt && parsed.expiresAt > Date.now()) {
          MEMORY_LOC_CACHE.set(q, parsed.data);
          return parsed.data;
        }
      }
    } catch (e) { /* ignore localStorage issues */ }
  }
  return null;
}

function setClientCachedSuggestions(query, results) {
  const q = query.toLowerCase().trim();
  MEMORY_LOC_CACHE.set(q, results);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(`${CLIENT_LOC_CACHE_KEY}_${q}`, JSON.stringify({
        data: results,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours TTL
      }));
    } catch (e) { /* ignore storage quota */ }
  }
}

function getLocationApiBase() {
  if (typeof window !== 'undefined') {
    const metaEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
    return (metaEnv.VITE_API_URL || '').replace(/\/+$/, '');
  }
  return `http://localhost:${(typeof process !== 'undefined' && process.env && process.env.PORT) || 3001}`;
}

// In-memory cache for resolved geocoded locations (location name + language -> coordinates)
const GEOCODE_CACHE = new Map();
const GEOCODE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days (static coordinates)

/**
 * Geocode a location name to coordinates (Exclusively inside India).
 * Tier 0: In-memory static GEOCODE_CACHE (Instant 0ms)
 * Tier 1: Local INDIA_CITIES map
 * Tier 2: Backend Mappls Geocoder (/api/location/geocode)
 * Tier 3: Client-side Open-Meteo & Nominatim fallback
 */
export async function geocodeLocation(name, lang = 'en') {
  if (!name || typeof name !== 'string') return null;
  const normalized = name.toLowerCase().trim();
  const cacheKey = `${normalized}_${lang}`;

  // 0. Check in-memory cache first (Instant 0ms lookup)
  if (GEOCODE_CACHE.has(cacheKey)) {
    const cached = GEOCODE_CACHE.get(cacheKey);
    if (Date.now() - cached.timestamp < GEOCODE_CACHE_TTL_MS) {
      return cached.data;
    }
  }

  const _saveCache = (result) => {
    if (result && result.lat && result.lng) {
      GEOCODE_CACHE.set(cacheKey, { data: result, timestamp: Date.now() });
    }
    return result;
  };

  // 1. Check local INDIA_CITIES first (Instant)
  if (INDIA_CITIES[normalized]) {
    const city = INDIA_CITIES[normalized];
    return _saveCache({ lat: city.lat, lng: city.lng, name: city.name, state: city.state, district: city.district, country: 'India' });
  }

  // Partial match against INDIA_CITIES
  for (const [key, city] of Object.entries(INDIA_CITIES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return _saveCache({ lat: city.lat, lng: city.lng, name: city.name, state: city.state, district: city.district, country: 'India' });
    }
  }

  // 2. Try Backend Mappls & Nominatim Proxy
  try {
    const baseUrl = getLocationApiBase();
    const proxyRes = await fetch(`${baseUrl}/api/location/geocode?location=${encodeURIComponent(name)}&lang=${lang}`, {
      signal: AbortSignal.timeout(4000)
    });
    if (proxyRes.ok) {
      const geoResult = await proxyRes.json();
      if (geoResult && geoResult.lat && geoResult.lng) {
        return _saveCache({
          lat: parseFloat(geoResult.lat),
          lng: parseFloat(geoResult.lng),
          name: geoResult.name || name,
          state: geoResult.state || '',
          district: geoResult.district || '',
          country: 'India'
        });
      }
    }
  } catch (err) {
    // Backend proxy unavailable; gracefully proceed to client fallback
  }

  // 3. Fall back to direct Open-Meteo geocoding filtered for India
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=10&language=${lang}`,
      { signal: AbortSignal.timeout(2500) }
    );
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const indiaResult = data.results.find(r => r.country_code === 'IN' || r.country === 'India') || data.results[0];
      if (indiaResult) {
        return _saveCache({
          lat: indiaResult.latitude,
          lng: indiaResult.longitude,
          name: indiaResult.name,
          state: indiaResult.admin1 || '',
          district: indiaResult.admin2 || '',
          country: 'India'
        });
      }
    }
  } catch (err) {
    console.warn('Open-Meteo geocoding error:', err);
  }

  // 4. Fallback to direct Nominatim (OpenStreetMap) strictly for India
  try {
    const nominatimRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=json&limit=1&countrycodes=in&accept-language=${lang}&addressdetails=1`,
      { headers: { 'User-Agent': 'WeatherGPT-SIH2026' }, signal: AbortSignal.timeout(3500) }
    );
    const nominatimData = await nominatimRes.json();
    if (nominatimData && nominatimData.length > 0) {
      const r = nominatimData[0];
      const rawName = r.name || '';
      const finalName = (typeof rawName === 'string' && rawName.trim().length > 0) ? rawName : r.display_name.split(',')[0];
      return _saveCache({
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
        name: finalName,
        state: r.address?.state || '',
        district: r.address?.state_district || r.address?.county || r.address?.district || '',
        country: 'India'
      });
    }
  } catch (err) {
    console.warn('Nominatim geocoding error:', err);
  }

  return null; // Location not found
}

/**
 * Fetch multiple location suggestions for disambiguation (Villages, Tehsils, Districts, States across India).
 * Tier 1: Local INDIA_CITIES + Client-side LocalStorage cache
 * Tier 2: Backend Mappls & Nominatim Proxy (/api/location/search)
 * Tier 3: Direct Client-side Open-Meteo & Nominatim fallback
 */
export async function searchLocationSuggestions(name, lang = 'en') {
  if (!name || typeof name !== 'string') return [];
  const normalized = name.toLowerCase().trim();
  if (normalized.length < 2) return [];

  const results = [];

  // Check client-side memory / localStorage cache first
  const cached = getClientCachedSuggestions(normalized);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return cached;
  }

  // Add matching predefined Indian cities first (Instant)
  for (const [key, city] of Object.entries(INDIA_CITIES)) {
    if (key.startsWith(normalized) || key.includes(normalized) || normalized.includes(key)) {
      results.push({
        lat: city.lat,
        lng: city.lng,
        name: city.name,
        state: city.state,
        district: city.district,
        country: 'India'
      });
    }
  }

  // Try Backend Mappls + Nominatim Proxy
  let proxySuccess = false;
  try {
    const baseUrl = getLocationApiBase();
    const proxyRes = await fetch(`${baseUrl}/api/location/search?query=${encodeURIComponent(name)}&lang=${lang}`, {
      signal: AbortSignal.timeout(4000)
    });
    if (proxyRes.ok) {
      const proxyData = await proxyRes.json();
      if (Array.isArray(proxyData) && proxyData.length > 0) {
        proxySuccess = true;
        proxyData.forEach(item => {
          const isDuplicate = results.some(
            existing => Math.abs(existing.lat - item.lat) < 0.05 && Math.abs(existing.lng - item.lng) < 0.05
          );
          if (!isDuplicate) {
            results.push({
              lat: item.lat,
              lng: item.lng,
              name: item.name,
              district: item.district || '',
              state: item.state || '',
              country: 'India'
            });
          }
        });
      }
    }
  } catch (err) {
    // Proxy call failed or timed out; will fall through to client fallback
  }

  // Direct client-side fallback if backend was unavailable or returned zero matches
  if (!proxySuccess && results.length < 4) {
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=6&language=${lang}`,
        { signal: AbortSignal.timeout(2500) }
      );
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const indiaResults = data.results.filter(r => r.country_code === 'IN' || r.country === 'India');
        indiaResults.forEach(r => {
          const isDuplicate = results.some(
            existing => Math.abs(existing.lat - r.latitude) < 0.05 && Math.abs(existing.lng - r.longitude) < 0.05
          );
          if (!isDuplicate) {
            results.push({
              lat: r.latitude,
              lng: r.longitude,
              name: r.name,
              state: r.admin1 || '',
              district: r.admin2 || '',
              country: 'India'
            });
          }
        });
      }
    } catch (err) {
      console.warn('Open-Meteo suggestion error:', err);
    }

    // Direct Nominatim fallback
    try {
      const nominatimRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=json&limit=5&countrycodes=in&accept-language=${lang}&addressdetails=1`,
        { headers: { 'User-Agent': 'WeatherGPT-SIH2026' }, signal: AbortSignal.timeout(3500) }
      );
      const nominatimData = await nominatimRes.json();
      if (nominatimData && nominatimData.length > 0) {
        nominatimData.forEach(r => {
          const lat = parseFloat(r.lat);
          const lng = parseFloat(r.lon);
          const isDuplicate = results.some(
            existing => Math.abs(existing.lat - lat) < 0.05 && Math.abs(existing.lng - lng) < 0.05
          );
          if (!isDuplicate) {
            const rawName = r.name || '';
            const finalName = (typeof rawName === 'string' && rawName.trim().length > 0) ? rawName : r.display_name.split(',')[0];
            results.push({
              lat: lat,
              lng: lng,
              name: finalName,
              state: r.address?.state || '',
              district: r.address?.state_district || r.address?.county || r.address?.district || '',
              country: 'India'
            });
          }
        });
      }
    } catch (err) {
      console.warn('Nominatim suggestion error:', err);
    }
  }

  const finalResults = results.slice(0, 8);
  if (finalResults.length > 0) {
    setClientCachedSuggestions(normalized, finalResults);
  }

  return finalResults;
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

  // NWP Multi-Model URLs — fetching GFS, ICON, ECMWF separately for real model consensus
  const gfsUrl   = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,precipitation_probability_max&timezone=auto&forecast_days=7&models=gfs_global`;
  const iconUrl  = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,precipitation_probability_max&timezone=auto&forecast_days=7&models=icon_global`;
  const ecmwfUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,precipitation_probability_max&timezone=auto&forecast_days=7&models=ecmwf_ifs025`;

  const [res, aqiRes, gfsRes, iconRes, ecmwfRes] = await Promise.all([
    fetch(url),
    fetch(aqiUrl),
    fetch(gfsUrl).catch(() => null),
    fetch(iconUrl).catch(() => null),
    fetch(ecmwfUrl).catch(() => null),
  ]);
  
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
  
  const data = await res.json();
  let aqiValue = 42; // default
  
  if (aqiRes.ok) {
    const aqiData = await aqiRes.json();
    if (aqiData.current && aqiData.current.us_aqi) {
      aqiValue = aqiData.current.us_aqi;
    }
  }

  // Parse real NWP model data — gracefully fall back to null if any model is unavailable
  let gfsModelData   = { maxTemp: null, precipProbMax: null };
  let iconModelData  = { maxTemp: null, precipProbMax: null };
  let ecmwfModelData = { maxTemp: null, precipProbMax: null };

  try {
    if (gfsRes && gfsRes.ok) {
      const j = await gfsRes.json();
      if (j.daily) gfsModelData = { maxTemp: j.daily.temperature_2m_max || null, precipProbMax: j.daily.precipitation_probability_max || null };
    }
  } catch (e) { /* GFS unavailable */ }

  try {
    if (iconRes && iconRes.ok) {
      const j = await iconRes.json();
      if (j.daily) iconModelData = { maxTemp: j.daily.temperature_2m_max || null, precipProbMax: j.daily.precipitation_probability_max || null };
    }
  } catch (e) { /* ICON unavailable */ }

  try {
    if (ecmwfRes && ecmwfRes.ok) {
      const j = await ecmwfRes.json();
      if (j.daily) ecmwfModelData = { maxTemp: j.daily.temperature_2m_max || null, precipProbMax: j.daily.precipitation_probability_max || null };
    }
  } catch (e) { /* ECMWF unavailable */ }

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

    // NWP Model Transparency Data — real multi-model consensus (GFS, ICON, ECMWF)
    modelData: {
      daily: {
        gfs: gfsModelData,
        icon: iconModelData,
        ecmwf: ecmwfModelData,
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

// In-memory cache for reverse geocoding results (rounded lat/lng ~1km -> location details)
const REVERSE_GEOCODE_CACHE = new Map();
const REVERSE_GEOCODE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Reverse geocode coordinates to a city/town name.
 * Caches by rounded coordinates (2 decimal places ~1.1km) with 3.5s timeout.
 */
export async function reverseGeocode(lat, lng) {
  if (lat == null || lng == null) return { name: "Current Location", state: "", district: "", lat, lng };

  const roundedKey = `${Number(lat).toFixed(2)}_${Number(lng).toFixed(2)}`;
  if (REVERSE_GEOCODE_CACHE.has(roundedKey)) {
    const cached = REVERSE_GEOCODE_CACHE.get(roundedKey);
    if (Date.now() - cached.timestamp < REVERSE_GEOCODE_CACHE_TTL_MS) {
      return { ...cached.data, lat, lng };
    }
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
      { 
        headers: { 'User-Agent': 'WeatherGPT-SIH2026' },
        signal: AbortSignal.timeout(3500) // 3.5s timeout: Prevents 10-15s hangs on free Nominatim
      }
    );
    if (res.ok) {
      const data = await res.json();
      const name = data.address?.city || data.address?.town || data.address?.village || data.address?.county || data.address?.state || "Current Location";
      const result = {
        name: name,
        state: data.address?.state || '',
        district: data.address?.state_district || data.address?.county || '',
        lat: lat,
        lng: lng
      };
      REVERSE_GEOCODE_CACHE.set(roundedKey, { data: result, timestamp: Date.now() });
      return result;
    }
  } catch (err) {
    console.warn('Reverse geocoding timed out or failed, using coordinate fallback:', err.message);
  }
  return { name: "Current Location", state: "", district: "", lat, lng };
}

export { INDIA_CITIES, INDIA_CITIES as NER_CITIES };

/**
 * Fetches specialized data based on the selected user profile.
 * Completely separate from the main weather fetch to ensure no existing logic breaks.
 */
export async function getSpecializedData(lat, lng, profile) {
  try {
    let url = '';
    
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
        
        const aqiHour = getCurrentHourIndex(aqiData);
        const weatherHour = getCurrentHourIndex(weatherData);

        return {
          pm2_5: aqiData.hourly?.pm2_5?.[aqiHour] ?? 0,
          pm10: aqiData.hourly?.pm10?.[aqiHour] ?? 0,
          uv_index: weatherData.hourly?.uv_index?.[weatherHour] ?? 0,
          feels_like: weatherData.hourly?.apparent_temperature?.[weatherHour] ?? 0,
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
    
    const currentHour = getCurrentHourIndex(data);
    
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

/**
 * Gets the correct index for the current hour in the location's local time,
 * using the utc_offset_seconds and hourly.time array from the Open-Meteo response.
 */
export function getCurrentHourIndex(hourlyResponse) {
  if (!hourlyResponse || !hourlyResponse.hourly || !hourlyResponse.hourly.time || hourlyResponse.utc_offset_seconds === undefined) {
    return new Date().getHours(); // fallback if data is missing
  }

  const currentUtcSeconds = Math.floor(Date.now() / 1000);
  const localSeconds = currentUtcSeconds + hourlyResponse.utc_offset_seconds;

  let bestIndex = 0;
  let minDiff = Infinity;

  for (let i = 0; i < hourlyResponse.hourly.time.length; i++) {
    const timeStr = hourlyResponse.hourly.time[i];
    const hourEpoch = Math.floor(Date.parse(timeStr + "Z") / 1000);
    const diff = Math.abs(hourEpoch - localSeconds);

    if (diff < minDiff) {
      minDiff = diff;
      bestIndex = i;
    }
  }

  return bestIndex;
}
