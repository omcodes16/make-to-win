import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import RadarMap from './RadarMap';
import HistoricalAnalytics from './HistoricalAnalytics';

import { geocodeLocation, getWeather } from '../services/weatherApi';
import { getWeatherInfo } from '../utils/weatherConditions';
import { UI_TRANSLATIONS } from '../utils/translations';
import { SPEECH_LANG_CODES } from '../utils/constants';
import { getTheme } from '../utils/themes';
import Header from './Header';
import { computeHeatIndex, getHeatRisk } from '../utils/heatIndex';
import { getFarmerAdvisory } from '../utils/farmerAdvisory';
import { getFishermanAdvisory } from '../utils/fishermanAdvisory';
import { getAviationAdvisory } from '../utils/aviationAdvisory';
import { getUrbanPlanningAdvisory } from '../utils/urbanPlanningAdvisory';
import { getSeasonalContext } from '../utils/climateSeasonal';
import { FEATURE_I18N } from '../utils/featureTranslations';
import ModelConfidence from './ModelConfidence';


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
        
        const severityCheck = checkSeverity(data, loc.name);
        if (severityCheck && severityCheck.isSevere) {
          dispatch({ type: 'SET_SEVERE_ALERT', payload: severityCheck });
        } else {
          dispatch({ type: 'DISMISS_ALERT' });
        }
      }
      setSearchInput('');
    } catch (err) {} finally {
      setIsLoading(false);
    }
  };

  if (!stageData) {
    const defaultTheme = getTheme(null, null);
    return (
      <div className="min-h-[100dvh] bg-[#0a0c1a] flex flex-col transition-colors duration-1000">
        {/* Fixed Background Image (Hardware Accelerated, Smooth) */}
        <div className="fixed inset-0 z-0 bg-cover bg-center transition-opacity duration-1000" style={{ backgroundImage: `url(${defaultTheme.bgImage})` }}></div>
        <div className={`fixed inset-0 z-0 bg-gradient-to-b ${defaultTheme.overlay} pointer-events-none transition-colors duration-1000`}></div>
        
        <Header />
        
        <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 pb-24 md:pb-6 pt-20">
          <div className="w-full max-w-md bg-white/5 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl">
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-6 text-center">{t.searchPrompt}</h2>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="flex-1 bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm sm:text-base"
              />
              <button type="submit" className="px-4 sm:px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors text-sm sm:text-base">Go</button>
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

  // ── PS 26068 Feature Computations ─────────────────────────────────────────
  const lang = state.language;
  const ft = FEATURE_I18N[lang] || FEATURE_I18N.en;

  // Feature 3: Heat Index Risk (NWS Rothfusz formula)
  const heatIndex = isToday ? computeHeatIndex(weather.temperature, weather.humidity) : null;
  const heatRisk = heatIndex !== null ? getHeatRisk(heatIndex, lang) : null;

  // Feature 1: Role-based Action Advisory
  let activeAdvisory = null;
  let advisoryProfile = state.userProfile;
  if (advisoryProfile === 'farmer') {
    activeAdvisory = getFarmerAdvisory(weather, selectedDay, lang);
  } else if (advisoryProfile === 'fisherman') {
    activeAdvisory = getFishermanAdvisory(weather, selectedDay, lang);
  } else if (advisoryProfile === 'aviation') {
    activeAdvisory = getAviationAdvisory(weather, selectedDay, lang);
  } else if (advisoryProfile === 'urbanPlanning') {
    activeAdvisory = getUrbanPlanningAdvisory(weather, selectedDay, lang);
  }

  // Feature 7: Seasonal Climate Context
  const currentMonthIndex = new Date().getMonth();
  const seasonalCtx = getSeasonalContext(stageData.locationName, currentMonthIndex, lang);

  // Feature 2: Health Impact (AQI + UV + Humidity)
  const healthImpacts = (() => {
    const impacts = [];
    if (isToday) {
      if (weather.aqi > 150) impacts.push({ icon: '🫁', text: ft.healthAqiUnhealthy(weather.aqi), color: 'text-red-300' });
      else if (weather.aqi > 100) impacts.push({ icon: '😷', text: ft.healthAqiMod(weather.aqi), color: 'text-amber-300' });
      if (weather.uvIndex >= 9) impacts.push({ icon: '🔆', text: ft.healthUvVeryHigh(weather.uvIndex), color: 'text-orange-300' });
      else if (weather.uvIndex >= 6) impacts.push({ icon: '☀️', text: ft.healthUvHigh(weather.uvIndex), color: 'text-amber-300' });
      if (heatRisk && heatRisk.level !== 'comfortable') impacts.push({ icon: '🌡️', text: heatRisk.advice, color: heatRisk.color });
      if (weather.humidity > 85) impacts.push({ icon: '💦', text: ft.healthHumidity(weather.humidity), color: 'text-blue-300' });
    }
    if (impacts.length === 0) impacts.push({ icon: '✅', text: ft.healthGood, color: 'text-green-300' });
    return impacts;
  })();

  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[100dvh] bg-[#0a0c1a] text-white overflow-y-auto pb-24 md:pb-20 relative font-body transition-colors duration-1000">
      {/* Fixed Background Image (Hardware Accelerated, Smooth) */}
      <div className="fixed inset-0 z-0 bg-cover bg-center transition-opacity duration-1000" style={{ backgroundImage: `url(${theme.bgImage})` }}></div>
      
      {/* Overlay Gradients */}
      <div className={`fixed inset-0 z-0 bg-gradient-to-b ${theme.overlay} pointer-events-none transition-colors duration-1000`}></div>
      <div className={`fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] ${theme.accent} via-transparent to-transparent pointer-events-none transition-colors duration-1000`}></div>
      
      <Header />

      <div className="relative z-10 max-w-[1400px] mx-auto px-3 sm:px-6 pt-20 sm:pt-28 md:pt-32">
        
        {/* Search Bar */}
        <div className="flex justify-center mb-6 sm:mb-12">
          <form onSubmit={handleSearch} className="w-full max-w-2xl relative">
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-white/5 backdrop-blur-md border border-white/20 rounded-full px-5 sm:px-6 py-3 sm:py-3.5 text-sm text-white focus:outline-none focus:border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all placeholder:text-white/40 text-center"
            />
            <button type="submit" className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </form>
        </div>

        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-6 sm:mb-12 gap-6">
          {/* Left: Temp and Info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-white/90 mb-2 font-medium text-base sm:text-lg flex-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8A33D" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span className="truncate max-w-[200px] sm:max-w-none">{stageData.locationName}</span>
              {selectedDay > 0 && <span className="text-white/50 text-sm">({dailyData[selectedDay].day})</span>}
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
                    ? 'text-amber-400 bg-amber-500/20 border border-amber-500/30'
                    : 'text-white/40 bg-white/5 border border-white/10 hover:text-amber-400'
                }`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill={state.savedLocations.some(l => l.name === stageData.locationName) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
              </button>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 mb-2">
              <div className="text-7xl sm:text-[100px] lg:text-[120px] font-medium leading-none tracking-tighter drop-shadow-2xl">{displayTemp}°</div>
              <div className="text-4xl sm:text-5xl lg:text-6xl drop-shadow-xl">{weatherInfo?.icon}</div>
            </div>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <div className="text-lg sm:text-2xl font-medium tracking-wide drop-shadow-md">{weatherInfo?.label}</div>
              <div className="bg-white/10 backdrop-blur-md px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium border border-white/10 shadow-sm">
                {t.feelsLike} {displayFeelsLike}°
              </div>
              {/* Feature 3: Heat Index Risk Badge */}
              {heatRisk && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold border backdrop-blur-md shadow-sm ${heatRisk.bg} ${heatRisk.border} ${heatRisk.color}`}>
                  <span className={`w-2 h-2 rounded-full ${heatRisk.dot} shrink-0`}></span>
                  {heatRisk.icon} Heat: {heatRisk.label}
                </div>
              )}
            </div>
          </div>

          {/* Right: Stat Cards */}
          <div className="flex gap-2 sm:gap-4 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-hide">
            {[
              { icon: '🌡️', val: `${weather.daily.maxTemp[selectedDay]}°`, lbl: 'Max' },
              { icon: '❄️', val: `${weather.daily.minTemp[selectedDay]}°`, lbl: 'Min' },
              { icon: '💧', val: isToday ? `${weather.humidity}%` : `${weather.daily.precipProbMax[selectedDay]}%`, lbl: isToday ? t.hum : 'Precip' },
              { icon: '💨', val: isToday ? `${weather.windSpeed} ${t.kmh}` : '--', lbl: t.windTab },
              { icon: '☀️', val: `${displayUv}`, lbl: 'UV Max' }
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[1.5rem] sm:rounded-[2rem] p-3 sm:p-5 flex flex-col items-center justify-center min-w-[72px] sm:min-w-[100px] shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                <div className="text-xl sm:text-2xl mb-2 sm:mb-3 opacity-90">{stat.icon}</div>
                <div className="font-semibold text-base sm:text-xl mb-0.5 sm:mb-1 whitespace-nowrap">{stat.val}</div>
                <div className="text-white/50 text-[9px] sm:text-[11px] font-medium uppercase tracking-wider">{stat.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Model Confidence Panel */}
        <ModelConfidence modelData={weather?.modelData} selectedDay={selectedDay} language={state.language} />

        {/* Hourly Forecast */}
        {isToday && (
          <div className="bg-white/5 backdrop-blur-2xl border border-indigo-400/30 rounded-3xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-[0_0_25px_rgba(99,102,241,0.15)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent"></div>
            <div className="text-white/80 font-medium mb-4 sm:mb-6 text-xs sm:text-sm tracking-wide">Hourly Forecast</div>
            <div className="flex justify-between items-center overflow-x-auto scrollbar-hide gap-3 sm:gap-6 pb-2">
              {hourlyData.map((d, i) => (
                <div key={i} className={`flex flex-col items-center min-w-[52px] sm:min-w-[64px] transition-transform hover:scale-105 ${i === 0 ? 'bg-indigo-600/40 rounded-[16px] sm:rounded-[20px] py-3 sm:py-4 px-1.5 sm:px-2 border border-indigo-400/40 shadow-inner' : 'py-3 sm:py-4'}`}>
                  <div className="text-[10px] sm:text-xs font-semibold text-white/70 mb-2 sm:mb-4 tracking-wide">{d.timeLabel}</div>
                  <div className="text-2xl sm:text-3xl mb-2 sm:mb-4 drop-shadow-md">{d.icon}</div>
                  <div className="text-sm sm:text-lg font-bold">{d.temp}°</div>
                </div>
              ))}
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent"></div>
          </div>
        )}

        {/* Feature 1: Role-based Action Advisory & Profile Selector */}
        <div className="mb-4 sm:mb-6">
          <div className="flex justify-between items-center mb-2 px-1">
            <div className="text-white/80 font-medium text-xs sm:text-sm tracking-wide">
              {state.userProfile === 'farmer' ? '🌾' : state.userProfile === 'fisherman' ? '🎣' : state.userProfile === 'aviation' ? '✈️' : state.userProfile === 'urbanPlanning' ? '🏙️' : '🌍'} Action Advisory
            </div>
                          <div className="flex gap-2 items-center">
                              <select 
                value={state.userProfile}
                onChange={(e) => dispatch({ type: 'SET_PROFILE', payload: e.target.value })}
                className="bg-white/10 border border-white/20 text-white text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-400"
              >
                <option value="general" className="bg-[#1a1c29]">General</option>
                <option value="farmer" className="bg-[#1a1c29]">Farmer (किसान)</option>
                <option value="fisherman" className="bg-[#1a1c29]">Fisherman (मछुआरा)</option>
                <option value="aviation" className="bg-[#1a1c29]">Aviation (उड़ान)</option>
                <option value="urbanPlanning" className="bg-[#1a1c29]">Urban Planner (शहर योजना)</option>
              </select>
                
              </div>
          </div>
          
          {activeAdvisory ? (
            <div className={`backdrop-blur-2xl border rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex items-start sm:items-center gap-4
              ${activeAdvisory.type === 'danger' ? 'bg-red-950/40 border-red-500/50' : 
                activeAdvisory.type === 'caution' ? 'bg-amber-950/40 border-amber-500/40' : 
                'bg-emerald-950/40 border-emerald-500/40'}`}>
              <div className={`text-3xl sm:text-4xl p-3 rounded-2xl shrink-0
                ${activeAdvisory.type === 'danger' ? 'bg-red-500/20' : 
                  activeAdvisory.type === 'caution' ? 'bg-amber-500/20' : 
                  'bg-emerald-500/20'}`}>
                {activeAdvisory.icon === 'storm' ? '⛈️' :
                 activeAdvisory.icon === 'rain' ? '🌧️' :
                 activeAdvisory.icon === 'drizzle' ? '🌦️' :
                 activeAdvisory.icon === 'uv' ? '☀️' :
                 activeAdvisory.icon === 'wind' ? '💨' :
                 activeAdvisory.icon === 'fungal' ? '🍄' :
                 activeAdvisory.icon === 'fog' ? '🌫️' :
                 activeAdvisory.icon === 'frost' ? '❄️' :
                 activeAdvisory.icon === 'good' ? '✅' : '🌤️'}
              </div>
              <div className="flex-1">
                <div className="text-xs sm:text-sm font-semibold uppercase tracking-wider mb-1 opacity-80">
                  {state.userProfile === 'fisherman' 
                    ? (lang === 'hi' ? 'मछुआरों के लिए सलाह' : lang === 'bn' ? 'মৎস্যজীবীদের পরামর্শ' : lang === 'as' ? 'মাছমৰীয়া পৰামৰ্শ' : 'Marine Advisory')
                    : (lang === 'hi' ? 'किसान सलाह' : lang === 'bn' ? 'কৃষক পরামর্শ' : lang === 'as' ? 'কৃষক পৰামৰ্শ' : 'Farmer Advisory')}
                </div>
                <h3 className="text-base sm:text-lg font-bold mb-1 sm:mb-2">{activeAdvisory.title}</h3>
                <p className="text-sm sm:text-base opacity-90 leading-relaxed">{activeAdvisory.advice}</p>
              </div>
            </div>
          ) : (
            <div className="backdrop-blur-2xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl flex items-center justify-center min-h-[100px] bg-white/5">
              <p className="text-white/50 text-sm text-center">No specific advisory for general profile today. Enjoy the weather!</p>
            </div>
          )}
        </div>

        {/* 7-Day Forecast */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-xl">
          <div className="text-white/80 font-medium mb-4 sm:mb-6 text-xs sm:text-sm tracking-wide">7-Day Forecast</div>
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-4">
            {dailyData.map((day, i) => (
              <button
                key={i}
                onClick={() => setSelectedDay(i)}
                className={`bg-white/5 border rounded-xl sm:rounded-2xl p-2.5 sm:p-5 flex flex-col items-center transition-all duration-300 ${selectedDay === i ? 'border-indigo-400/80 bg-indigo-900/40 shadow-[0_0_20px_rgba(99,102,241,0.3)] scale-[1.02]' : 'border-white/10 hover:bg-white/10'}`}
              >
                <div className="text-[10px] sm:text-sm font-semibold text-white/80 mb-2 sm:mb-4">{day.day}</div>
                <div className="text-2xl sm:text-4xl mb-2 sm:mb-5 drop-shadow-lg">{day.icon}</div>
                <div className="flex gap-1 sm:gap-2 text-[10px] sm:text-sm font-bold">
                  <span className="text-white">{day.max}°</span>
                  <span className="text-white/40">/{day.min}°</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Detailed Info */}
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col gap-4 sm:gap-6">
            <div className="text-white/80 font-medium text-xs sm:text-sm tracking-wide">Detailed Conditions</div>
            <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3 sm:pb-4">
              <span className="text-white/60 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Rain Probability</span>
              <span className="font-semibold text-sm sm:text-base">{weather.daily.precipProbMax[selectedDay]}%</span>
            </div>
            {isToday && (
              <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3 sm:pb-4">
                <span className="text-white/60 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg> {t.hum}</span>
                <span className="font-semibold text-sm sm:text-base">{weather.humidity}%</span>
              </div>
            )}
            {isToday && (
              <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3 sm:pb-4">
                <span className="text-white/60 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">🍃 Air Quality</span>
                <span className="font-semibold text-xs sm:text-base">{weather.aqi <= 50 ? 'Good' : weather.aqi <= 100 ? 'Moderate' : weather.aqi <= 150 ? 'Unhealthy (SG)' : 'Unhealthy'} ({weather.aqi})</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm pb-2">
              <span className="text-white/60 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">☀️ Max UV Index</span>
              <span className="font-semibold text-sm sm:text-base">{displayUv}</span>
            </div>

            {/* Feature 2: Climate & Health Impact */}
            {isToday && healthImpacts.length > 0 && (
              <div className="mt-2 pt-4 sm:pt-5 border-t border-white/10">
                <div className="text-white/80 font-medium text-[10px] sm:text-xs tracking-wide uppercase mb-3">{ft.healthTitle}</div>
                <div className="flex flex-col gap-3">
                  {healthImpacts.map((impact, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="text-lg shrink-0 mt-0.5">{impact.icon}</div>
                      <div className={`text-xs sm:text-sm leading-relaxed ${impact.color}`}>{impact.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Radar */}
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col min-h-[280px] sm:min-h-[320px]">
            <div className="flex justify-between items-center mb-4 sm:mb-5">
              <span className="text-white/80 font-medium text-xs sm:text-sm tracking-wide">Live Weather Radar</span>
              <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-red-500/30 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> Live</span>
            </div>
            <div className="flex-1 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 mt-2 rounded-b-3xl overflow-hidden relative">
              <div className="absolute inset-0">
                <RadarMap lat={stageData.lat} lng={stageData.lng} />
              </div>
            </div>
          </div>

          {/* AQI & Sun/Moon */}
          <div className="flex flex-col gap-4 sm:gap-6">
            {isToday ? (
              <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 sm:p-6 shadow-xl">
                <div className="text-white/80 font-medium text-xs sm:text-sm flex items-center gap-2 mb-3 sm:mb-4 tracking-wide">🍃 Air Quality</div>
                <div className="flex items-baseline gap-2 sm:gap-3 mb-3 sm:mb-5">
                  <span className="text-4xl sm:text-5xl font-bold text-white tracking-tighter">{weather.aqi}</span>
                  <span className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold border ${weather.aqi <= 50 ? 'bg-green-500/20 text-green-400 border-green-500/30' : weather.aqi <= 100 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
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
              <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 sm:p-6 shadow-xl flex items-center justify-center min-h-[140px] sm:min-h-[160px]">
                <p className="text-white/50 text-sm text-center">AQI forecasting is not available for future dates.</p>
              </div>
            )}

            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 sm:p-6 shadow-xl flex-1 flex flex-col justify-between">
              <div className="text-white/80 font-medium text-xs sm:text-sm mb-4 sm:mb-6 flex items-center gap-2 tracking-wide">🌅 {t.sunrise} & {t.sunset}</div>
              <div className="relative h-24 sm:h-28 w-full flex items-end justify-between px-2 pb-2 border-b border-dashed border-white/20">
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 50">
                  <path d="M 5 50 Q 50 -10 95 50" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="3 3" />
                  {(() => {
                    if (!isToday) return null; // Don't show live sun for future days
                    
                    const now = new Date().getTime();
                    const sunrise = new Date(weather.daily.sunrise[selectedDay]).getTime();
                    const sunset = new Date(weather.daily.sunset[selectedDay]).getTime();
                    
                    // If before sunrise, sit at start. If after sunset, sit at end.
                    let t_val = 0;
                    if (now > sunset) t_val = 1;
                    else if (now > sunrise) t_val = (now - sunrise) / (sunset - sunrise);
                    
                    // Quadratic bezier: M 5 50 Q 50 -10 95 50
                    // x(t) = 5(1-t)^2 + 2*50(1-t)t + 95t^2 = 5 + 90t
                    // y(t) = 50(1-t)^2 + 2(-10)(1-t)t + 50t^2 = 120t^2 - 120t + 50
                    const cx = 5 + 90 * t_val;
                    const cy = 120 * t_val * t_val - 120 * t_val + 50;
                    
                    return (
                      <circle cx={cx} cy={cy} r="5" fill="#E8A33D" filter="drop-shadow(0px 0px 4px rgba(232, 163, 61, 0.8))" className="transition-all duration-1000 ease-in-out" />
                    );
                  })()}
                </svg>
                <div className="flex flex-col items-center z-10 -mb-5">
                  <span className="text-[9px] sm:text-[10px] text-white/50 mb-1 uppercase font-semibold tracking-wider">{t.sunrise}</span>
                  <span className="text-xs sm:text-sm font-bold">{new Date(weather.daily.sunrise[selectedDay]).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}</span>
                </div>
                <div className="flex flex-col items-center z-10 -mb-5">
                  <span className="text-[9px] sm:text-[10px] text-white/50 mb-1 uppercase font-semibold tracking-wider">{t.sunset}</span>
                  <span className="text-xs sm:text-sm font-bold">{new Date(weather.daily.sunset[selectedDay]).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Historical Data Section */}
        <HistoricalAnalytics lat={stageData.lat} lon={stageData.lng} />

      </div>
    </div>
  );
}

