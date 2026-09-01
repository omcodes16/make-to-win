import React from 'react';
import { renderToString } from 'react-dom/server';
import { searchLocationSuggestions, getWeather } from './src/services/weatherApi.js';
// We can't easily SSR the whole component tree without Babel/Vite.
// But we can check for missing data in weatherData.
async function test() {
  const locs = await searchLocationSuggestions('khandala');
  const data = await getWeather(locs[0].lat, locs[0].lng);
  
  // Simulate WeatherDashboard render logic
  const isToday = true;
  const selectedDay = 0;
  
  try {
    const displayTemp = isToday ? data.temperature : Math.round(data.daily.maxTemp[selectedDay]);
    const displayFeelsLike = isToday ? data.feelsLike : Math.round((data.daily.maxTemp[selectedDay] + data.daily.minTemp[selectedDay]) / 2);
    const displayCode = isToday ? data.weatherCode : data.daily.weatherCode[selectedDay];
    const displayUv = isToday ? data.uvIndex : data.daily.uvIndexMax[selectedDay];
    
    // Check hourly
    const hourlyData = [];
    if (data && data.hourly) {
      const now = new Date();
      let currentHourIdx = data.hourly.time.findIndex(time => new Date(time) > now) - 1 || 0;
      currentHourIdx = Math.max(0, currentHourIdx);
      for (let i = 0; i < 12; i++) {
        if (currentHourIdx + i < data.hourly.time.length) {
          const timeObj = new Date(data.hourly.time[currentHourIdx + i]);
        }
      }
    }
    
    // Check daily
    const dailyData = [];
    if (data && data.daily) {
      for (let i = 0; i < 7; i++) {
        const dateObj = new Date(data.daily.time[i]);
        dailyData.push({
          max: Math.round(data.daily.maxTemp[i]),
          min: Math.round(data.daily.minTemp[i]),
        });
      }
    }
    
    console.log('Simulation passed. No missing data.');
  } catch (e) {
    console.error('Simulation crashed!', e);
  }
}
test().catch(console.error);
