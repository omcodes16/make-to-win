import { geocodeLocation, getWeather } from '../src/services/weatherApi.js';

// ------------------------------------------------------------------
// 1. TOOL DEFINITIONS (OpenAI / Groq Function Calling Schema)
// ------------------------------------------------------------------
export const WEATHER_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_current_weather',
      description: 'Use this tool to get the current weather conditions (temperature, humidity, wind, rain, AQI, weather code) for a specific location. Use this when the user asks for the weather right now, today, or at a specific city.',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city or village name to get the weather for (e.g. "Guwahati", "Mumbai").'
          }
        },
        required: ['location']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_forecast',
      description: 'Use this tool to get the weather forecast for a specific future day. Use this when the user asks about the weather tomorrow, or on a specific day of the week coming up (up to 6 days ahead).',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city or village name.'
          },
          daysAhead: {
            type: 'integer',
            description: 'Number of days ahead to forecast. 0 = today, 1 = tomorrow, 2 = day after tomorrow, etc. Maximum is 6.'
          }
        },
        required: ['location', 'daysAhead']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_historical_trend',
      description: 'Use this tool when the user asks about past weather, trends over time, or comparisons to previous days/weeks. Returns temperature and rainfall data for the past N days.',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city or village name.'
          },
          days: {
            type: 'integer',
            description: 'The number of past days to retrieve data for (e.g. 7 for past week, 30 for past month).'
          }
        },
        required: ['location', 'days']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_seasonal_comparison',
      description: 'Use this tool to get how current conditions compare to the monthly seasonal average for a location. Helpful for answering if it is unusually hot, cold, or rainy for this time of year.',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city or village name.'
          }
        },
        required: ['location']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_active_alerts',
      description: 'Use this tool to check for any severe weather alerts (heavy rain, thunderstorms, high winds, low visibility) currently active for a location.',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city or village name.'
          }
        },
        required: ['location']
      }
    }
  }
];


// ------------------------------------------------------------------
// 2. TOOL EXECUTOR FUNCTIONS
// ------------------------------------------------------------------

/**
 * Helper: Geocode and fetch weather data. 
 * Reused by multiple tools.
 */
async function _getLocAndWeather(location) {
  const loc = await geocodeLocation(location, 'en');
  if (!loc) throw new Error(`Location not found: ${location}`);
  const data = await getWeather(loc.lat, loc.lng);
  return { loc, data };
}

export async function get_current_weather({ location }) {
  try {
    const { loc, data } = await _getLocAndWeather(location);
    return {
      location: loc.name,
      state: loc.state,
      temperature: data.temperature,
      feelsLike: data.feelsLike,
      humidity: data.humidity,
      windSpeed: data.windSpeed,
      precipitation: data.precipitation,
      rain: data.rain,
      uvIndex: data.uvIndex,
      aqi: data.aqi,
      weatherCode: data.weatherCode // raw WMO code
    };
  } catch (err) {
    return { error: err.message };
  }
}

export async function get_forecast({ location, daysAhead }) {
  try {
    if (daysAhead < 0 || daysAhead > 6) {
      return { error: 'daysAhead must be between 0 and 6.' };
    }
    const { loc, data } = await _getLocAndWeather(location);
    const daily = data.daily;
    
    // Ensure data exists for that day
    if (!daily.time[daysAhead]) {
      return { error: 'Forecast data not available for that many days ahead.' };
    }

    return {
      location: loc.name,
      date: daily.time[daysAhead],
      maxTemp: daily.maxTemp[daysAhead],
      minTemp: daily.minTemp[daysAhead],
      precipProbMax: daily.precipProbMax[daysAhead],
      precipitationSum: daily.precipitationSum[daysAhead],
      weatherCode: daily.weatherCode[daysAhead],
      uvIndexMax: daily.uvIndexMax[daysAhead]
    };
  } catch (err) {
    return { error: err.message };
  }
}

export async function get_historical_trend({ location, days }) {
  try {
    const loc = await geocodeLocation(location, 'en');
    if (!loc) return { error: `Location not found: ${location}` };

    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days > 0 ? days : 30));
    
    const endStr = endDate.toISOString().split('T')[0];
    const startStr = startDate.toISOString().split('T')[0];

    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${loc.lat}&longitude=${loc.lng}&start_date=${startStr}&end_date=${endStr}&daily=temperature_2m_max,precipitation_sum&timezone=auto`;
    const response = await fetch(url);
    const json = await response.json();

    if (!json.daily) return { error: 'No historical data returned from archive API.' };

    const formatted = json.daily.time.map((time, idx) => ({
      date: time,
      maxTemp: json.daily.temperature_2m_max[idx],
      rainMm: json.daily.precipitation_sum[idx]
    }));

    // Summarize so we don't blow up the context window for 30 days
    const totalRain = formatted.reduce((sum, d) => sum + (d.rainMm || 0), 0);
    const maxTempOverPeriod = Math.max(...formatted.map(d => d.maxTemp).filter(t => t != null));
    const avgMaxTemp = formatted.reduce((sum, d) => sum + (d.maxTemp || 0), 0) / formatted.length;
    const rainDays = formatted.filter(d => (d.rainMm || 0) > 1).length;

    return {
      location: loc.name,
      period: `${startStr} to ${endStr} (${days} days)`,
      summary: {
        totalRainMm: Number(totalRain.toFixed(1)),
        rainDays: rainDays,
        highestTemp: Number(maxTempOverPeriod.toFixed(1)),
        averageMaxTemp: Number(avgMaxTemp.toFixed(1))
      },
      // Give them just the raw data for the extremes or sample it? Just return it all, 30 days is small enough in JSON.
      dailyData: formatted
    };
  } catch (err) {
    return { error: err.message };
  }
}

export async function get_seasonal_comparison({ location }) {
  try {
    const SEASONAL_SERVER = {
      guwahati: { rainfall: [10,18,57,134,253,330,324,274,175,83,15,5], maxTemp: [21,24,29,32,32,32,32,32,31,29,25,21] },
      shillong: { rainfall: [17,31,93,268,425,600,620,480,290,160,30,12], maxTemp: [14,15,19,22,22,23,23,23,22,20,16,14] },
      mumbai:   { rainfall: [1,1,1,1,9,500,704,531,296,66,12,2], maxTemp: [31,32,33,34,34,32,30,30,31,33,33,31] },
      delhi:    { rainfall: [21,19,17,7,8,65,211,233,150,14,4,10], maxTemp: [20,23,29,36,40,40,36,35,34,33,28,22] },
      kolkata:  { rainfall: [10,25,36,57,140,279,330,321,255,128,27,7], maxTemp: [26,29,34,36,36,34,32,32,32,32,29,26] },
      chennai:  { rainfall: [25,10,6,15,40,53,93,122,119,307,309,139], maxTemp: [29,31,33,35,38,38,36,35,34,31,29,28] },
    };

    const locName = location.toLowerCase();
    const locKey = Object.keys(SEASONAL_SERVER).find(k => locName.includes(k));
    
    if (!locKey) {
      return { error: 'No seasonal baseline data available for this specific city.' };
    }

    const norm = SEASONAL_SERVER[locKey];
    const now = new Date();
    const monthIndex = now.getMonth();
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    // Get current weather to compare
    const current = await get_current_weather({ location });
    if (current.error) throw new Error(current.error);

    return {
      location: location,
      month: monthNames[monthIndex],
      seasonalAverage: {
        rainfallMmPerMonth: norm.rainfall[monthIndex],
        maxTemp: norm.maxTemp[monthIndex]
      },
      currentObservation: {
        temp: current.temperature,
        rainToday: current.rain
      }
    };
  } catch (err) {
    return { error: err.message };
  }
}

export async function get_active_alerts({ location }) {
  try {
    const { loc, data } = await _getLocAndWeather(location);
    
    const weatherCode = data.weatherCode;
    const windSpeed = data.windSpeed;
    const rain = data.rain;
    const precipitation = data.precipitation;
    const visibility = data.visibility;

    let isSevere = false;
    let summary = 'No severe alerts active.';
    let detail = '';

    if (weatherCode >= 95) {
      isSevere = true;
      summary = `Thunderstorm warning`;
      detail = `Severe thunderstorm activity detected. Wind speeds at ${windSpeed} km/h.`;
    } else if (rain > 10 || precipitation > 15) {
      isSevere = true;
      summary = `Heavy rainfall warning`;
      detail = `Heavy rain: ${rain || precipitation}mm recorded. Risk of waterlogging.`;
    } else if (windSpeed > 50) {
      isSevere = true;
      summary = `High wind warning`;
      detail = `Wind speeds at ${windSpeed} km/h. Risk of fallen trees.`;
    } else if (visibility !== undefined && visibility < 1000) {
      isSevere = true;
      summary = `Low visibility warning`;
      detail = `Visibility down to ${visibility}m.`;
    }

    return {
      location: loc.name,
      hasActiveAlert: isSevere,
      alertSummary: summary,
      alertDetail: detail
    };
  } catch (err) {
    return { error: err.message };
  }
}
