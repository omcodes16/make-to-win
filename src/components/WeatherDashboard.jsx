import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import RadarMap from './RadarMap';
import { geocodeLocation, getWeather } from '../services/weatherApi';
import { getWeatherInfo } from '../utils/weatherConditions';
import { UI_TRANSLATIONS } from '../utils/translations';
import { SPEECH_LANG_CODES } from '../utils/constants';
import { getTheme } from '../utils/themes';
import Header from './Header';

export default function WeatherDashboard() {
  const { state, dispatch } = useApp();
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0); // 0 = today

  const t = UI_TRANSLATIONS[state.language] || UI_TRANSLATIONS['en'];
  const locale = SPEECH_LANG_CODES[state.language] || 'en-IN';
  const stageData = state.weatherStageData;
  const weather = stageData?.weather;

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchInput.trim()) return;
    setIsLoading(true);
    try {
      const loc = await geocodeLocation(searchInput, state.language);
      if (loc) {
        const data = await getWeather(loc.lat, loc.lng);
        dispatch({ type: 'SET_WEATHER_STAGE_DATA', payload: { locationName: loc.name, lat: loc.lat, lng: loc.lng, weather: data } });
        setSelectedDay(0); // Reset to today on new search
      }
      setSearchInput('');
    } catch (err) {} finally {
      setIsLoading(false);
    }
  };

  if (!stageData) {
    const defaultTheme = getTheme(null, null);
    return (
      <div className="min-h-screen bg-[#0a0c1a] flex flex-col bg-cover bg-center transition-all duration-1000" style={{ backgroundImage: `url(${defaultTheme.bgImage})` }}>
        <Header />
        <div className={`absolute inset-0 bg-gradient-to-b ${defaultTheme.overlay} pointer-events-none transition-colors duration-1000`}></div>
        <div className="relative z-10 flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-semibold text-white mb-6 text-center">{t.searchPrompt}</h2>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="flex-1 bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button type="submit" className="px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors">Go</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Derive Display Values (Today vs Future Day)
  const isToday = selectedDay === 0;
  const displayTemp = isToday ? weather.temperature : Math.round(weather.daily.maxTemp[selectedDay]);
  const displayFeelsLike = isToday ? weather.feelsLike : Math.round((weather.daily.maxTemp[selectedDay] + weather.daily.minTemp[selectedDay]) / 2);
  const displayCode = isToday ? weather.weatherCode : weather.daily.weatherCode[selectedDay];
  const displayUv = isToday ? weather.uvIndex : weather.daily.uvIndexMax[selectedDay];
  
  const weatherInfo = getWeatherInfo(displayCode, state.language);
  const theme = getTheme({ ...weather, weatherCode: displayCode }, weatherInfo); // Pass mock weather with selected code

  // Generate hourly data (every 1 hour for next 12 hours instead of 3 hours)
  const hourlyData = [];
  if (weather && weather.hourly) {
    const now = new Date();
    let currentHourIdx = weather.hourly.time.findIndex(time => new Date(time) > now) - 1 || 0;
    currentHourIdx = Math.max(0, currentHourIdx);
    for (let i = 0; i < 12; i++) {
      if (currentHourIdx + i < weather.hourly.time.length) {
        const timeObj = new Date(weather.hourly.time[currentHourIdx + i]);
        const wInfo = getWeatherInfo(weather.hourly.weatherCode[currentHourIdx + i], state.language);
        hourlyData.push({
          timeLabel: i === 0 ? (state.language === 'hi' ? 'अब' : 'Now') : timeObj.toLocaleTimeString(locale, { hour: 'numeric', hour12: true }),
          temp: Math.round(weather.hourly.temperature[currentHourIdx + i]),
          icon: wInfo.icon,
        });
      }
    }
  }

  // Generate daily data
  const dailyData = [];
  if (weather && weather.daily) {
    for (let i = 0; i < 7; i++) {
      const dateObj = new Date(weather.daily.time[i]);
      const wInfo = getWeatherInfo(weather.daily.weatherCode[i], state.language);
      dailyData.push({
        index: i,
        day: i === 0 ? t.today : dateObj.toLocaleDateString(locale, { weekday: 'short' }),
        max: Math.round(weather.daily.maxTemp[i]),
        min: Math.round(weather.daily.minTemp[i]),
        icon: wInfo.icon,
      });
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0c1a] text-white overflow-y-auto pb-20 relative font-body bg-cover bg-fixed bg-center transition-all duration-1000" style={{ backgroundImage: `url(${theme.bgImage})` }}>
      {/* Overlay Gradients */}
      <div className={`fixed inset-0 bg-gradient-to-b ${theme.overlay} pointer-events-none transition-colors duration-1000`}></div>
      <div className={`fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] ${theme.accent} via-transparent to-transparent pointer-events-none transition-colors duration-1000`}></div>
      
      <Header />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 pt-32">
        
        {/* Search Bar matching screenshot */}
        <div className="flex justify-center mb-12">
          <form onSubmit={handleSearch} className="w-full max-w-2xl relative">
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-white/5 backdrop-blur-md border border-white/20 rounded-full px-6 py-3.5 text-sm text-white focus:outline-none focus:border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all placeholder:text-white/40 text-center"
            />
            <button type="submit" className="absolute right-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </form>
        </div>

        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row justify-between items-end mb-12 gap-8">
          {/* Left: Temp and Info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-white/90 mb-2 font-medium text-lg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8A33D" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {stageData.locationName} {selectedDay > 0 && <span className="text-white/50 ml-2">({dailyData[selectedDay].day})</span>}
              <button
                onClick={() => {
                  const isSaved = state.savedLocations.some(l => l.name === stageData.locationName);
                  if (isSaved) {
                    dispatch({ type: 'REMOVE_LOCATION', payload: stageData.locationName });
                  } else {
                    dispatch({ type: 'SAVE_LOCATION', payload: { name: stageData.locationName, lat: stageData.lat, lng: stageData.lng } });
                  }
                }}
                className={`ml-1 w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                  state.savedLocations.some(l => l.name === stageData.locationName)
                    ? 'text-amber-400 bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30'
                    : 'text-white/40 bg-white/5 border border-white/10 hover:text-amber-400 hover:bg-amber-500/10'
                }`}
                aria-label={state.savedLocations.some(l => l.name === stageData.locationName) ? 'Remove from saved' : 'Save location'}
                title={state.savedLocations.some(l => l.name === stageData.locationName) ? 'Remove from saved locations' : 'Save this location'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={state.savedLocations.some(l => l.name === stageData.locationName) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-4 mb-2">
              <div className="text-[120px] font-medium leading-none tracking-tighter drop-shadow-2xl">{displayTemp}°</div>
              <div className="text-6xl drop-shadow-xl">{weatherInfo?.icon}</div>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="text-2xl font-medium tracking-wide drop-shadow-md">{weatherInfo?.label}</div>
              <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-medium border border-white/10 shadow-sm">
                {t.feelsLike} {displayFeelsLike}°
              </div>
            </div>
          </div>

          {/* Right: 5 Stat Cards */}
          <div className="flex gap-4 overflow-x-auto w-full lg:w-auto pb-4 lg:pb-0 scrollbar-hide">
            {[
              { icon: '🌡️', val: `${weather.daily.maxTemp[selectedDay]}°`, lbl: 'Max' },
              { icon: '❄️', val: `${weather.daily.minTemp[selectedDay]}°`, lbl: 'Min' },
              { icon: '💧', val: isToday ? `${weather.humidity}%` : `${weather.daily.precipProbMax[selectedDay]}%`, lbl: isToday ? t.hum : 'Precip' },
              { icon: '💨', val: isToday ? `${weather.windSpeed} ${t.kmh}` : '--', lbl: t.windTab },
              { icon: '☀️', val: `${displayUv}`, lbl: 'UV Max' }
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-5 flex flex-col items-center justify-center min-w-[100px] shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                <div className="text-2xl mb-3 opacity-90 drop-shadow-sm">{stat.icon}</div>
                <div className="font-semibold text-xl mb-1">{stat.val}</div>
                <div className="text-white/50 text-[11px] font-medium uppercase tracking-wider">{stat.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Forecast (Only show if Today is selected) */}
        {isToday && (
          <div className="bg-white/5 backdrop-blur-2xl border border-indigo-400/30 rounded-3xl p-6 mb-6 shadow-[0_0_25px_rgba(99,102,241,0.15)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent"></div>
            <div className="text-white/80 font-medium mb-6 text-sm tracking-wide">Hourly Forecast</div>
            <div className="flex justify-between items-center overflow-x-auto scrollbar-hide gap-6 pb-2">
              {hourlyData.map((d, i) => (
                <div key={i} className={`flex flex-col items-center min-w-[64px] transition-transform hover:scale-105 ${i === 0 ? 'bg-indigo-600/40 rounded-[20px] py-4 px-2 border border-indigo-400/40 shadow-inner' : 'py-4'}`}>
                  <div className="text-xs font-semibold text-white/70 mb-4 tracking-wide">{d.timeLabel}</div>
                  <div className="text-3xl mb-4 drop-shadow-md">{d.icon}</div>
                  <div className="text-lg font-bold">{d.temp}°</div>
                </div>
              ))}
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent"></div>
          </div>
        )}

        {/* 7-Day Forecast */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 mb-8 shadow-xl">
          <div className="text-white/80 font-medium mb-6 text-sm tracking-wide">7-Day Forecast</div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {dailyData.map((day, i) => (
              <button 
                key={i} 
                onClick={() => setSelectedDay(i)}
                className={`bg-white/5 border rounded-2xl p-5 flex flex-col items-center transition-all duration-300 ${selectedDay === i ? 'border-indigo-400/80 bg-indigo-900/40 shadow-[0_0_20px_rgba(99,102,241,0.3)] scale-[1.02]' : 'border-white/10 hover:bg-white/10 hover:border-white/20'}`}
              >
                <div className="text-sm font-semibold text-white/80 mb-4">{day.day}</div>
                <div className="text-4xl mb-5 drop-shadow-lg">{day.icon}</div>
                <div className="flex gap-2 text-sm font-bold">
                  <span className="text-white">{day.max}°</span>
                  <span className="text-white/40">/ {day.min}°</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Detailed Info Column */}
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
            <div className="text-white/80 font-medium text-sm tracking-wide mb-2">Detailed Conditions</div>
            <div className="flex justify-between items-center text-sm border-b border-white/10 pb-4">
              <span className="text-white/60 flex items-center gap-3"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Rain Probability</span>
              <span className="font-semibold text-base">{weather.daily.precipProbMax[selectedDay]}%</span>
            </div>
            {isToday && (
              <div className="flex justify-between items-center text-sm border-b border-white/10 pb-4">
                <span className="text-white/60 flex items-center gap-3"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg> {t.hum}</span>
                <span className="font-semibold text-base">{weather.humidity}%</span>
              </div>
            )}
            {isToday && (
              <div className="flex justify-between items-center text-sm border-b border-white/10 pb-4">
                <span className="text-white/60 flex items-center gap-3">🍃 Air Quality</span>
                <span className="font-semibold text-base">{weather.aqi <= 50 ? 'Good' : weather.aqi <= 100 ? 'Moderate' : weather.aqi <= 150 ? 'Unhealthy (SG)' : 'Unhealthy'} ({weather.aqi})</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm pb-2">
              <span className="text-white/60 flex items-center gap-3">☀️ Max UV Index</span>
              <span className="font-semibold text-base">{displayUv}</span>
            </div>
          </div>

          {/* Radar Column */}
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col">
            <div className="flex justify-between items-center mb-5">
              <span className="text-white/80 font-medium text-sm tracking-wide">Live Weather Radar</span>
              <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-red-500/30 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> Live</span>
            </div>
            <div className="flex-1 -mx-6 -mb-6 mt-2 rounded-b-3xl overflow-hidden relative">
               {/* Make radar take full height */}
               <div className="absolute inset-0">
                  <RadarMap lat={stageData.lat} lng={stageData.lng} />
               </div>
            </div>
          </div>

          {/* AQI & Sun/Moon Column */}
          <div className="flex flex-col gap-6">
            {isToday ? (
              <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-xl">
                <div className="text-white/80 font-medium text-sm flex items-center gap-2 mb-4 tracking-wide">🍃 Air Quality</div>
                <div className="flex items-baseline gap-3 mb-5">
                  <span className="text-5xl font-bold text-white tracking-tighter">{weather.aqi}</span>
                  <span className={`px-3 py-1 rounded-lg text-sm font-semibold border ${weather.aqi <= 50 ? 'bg-green-500/20 text-green-400 border-green-500/30' : weather.aqi <= 100 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                    {weather.aqi <= 50 ? 'Good' : weather.aqi <= 100 ? 'Moderate' : 'Poor'}
                  </span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full" style={{ width: `${Math.min((weather.aqi / 300) * 100, 100)}%`, background: weather.aqi <= 50 ? 'linear-gradient(to right, #86efac, #22c55e)' : weather.aqi <= 100 ? 'linear-gradient(to right, #fde047, #eab308)' : 'linear-gradient(to right, #fca5a5, #ef4444)' }}></div>
                </div>
                <p className="text-xs text-white/60 font-medium">
                  {weather.aqi <= 50 ? 'AQI is good. Perfect for outdoor activities.' : weather.aqi <= 100 ? 'Moderate air quality. Acceptable for most people.' : 'Poor air quality. Sensitive groups should reduce outdoor exercise.'}
                </p>
              </div>
            ) : (
               <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-xl flex items-center justify-center min-h-[160px]">
                 <p className="text-white/50 text-sm text-center">AQI forecasting is not available for future dates.</p>
               </div>
            )}

            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-xl flex-1 flex flex-col justify-between">
              <div className="text-white/80 font-medium text-sm mb-6 flex items-center gap-2 tracking-wide">🌅 {t.sunrise} & {t.sunset}</div>
              <div className="relative h-28 w-full flex items-end justify-between px-2 pb-2 border-b border-dashed border-white/20">
                {/* Arc */}
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 50">
                  <path d="M 5 50 Q 50 -10 95 50" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="3 3" />
                  <circle cx="50" cy="20" r="5" fill="#E8A33D" filter="drop-shadow(0px 0px 4px rgba(232, 163, 61, 0.8))" />
                </svg>
                <div className="flex flex-col items-center z-10 -mb-5">
                  <span className="text-[10px] text-white/50 mb-1 uppercase font-semibold tracking-wider">{t.sunrise}</span>
                  <span className="text-sm font-bold">{new Date(weather.daily.sunrise[selectedDay]).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}</span>
                </div>
                <div className="flex flex-col items-center z-10 -mb-5">
                  <span className="text-[10px] text-white/50 mb-1 uppercase font-semibold tracking-wider">{t.sunset}</span>
                  <span className="text-sm font-bold">{new Date(weather.daily.sunset[selectedDay]).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
}
