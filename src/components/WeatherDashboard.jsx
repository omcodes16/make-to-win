import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import RadarMap from './RadarMap';
import HistoricalAnalytics from './HistoricalAnalytics';
import CommunityReports from './CommunityReports';
import AccuracyTracker from './AccuracyTracker';
import LiveCompass from './LiveCompass';

import { geocodeLocation, searchLocationSuggestions, getWeather } from '../services/weatherApi';
import { getWeatherInfo, checkSeverity } from '../utils/weatherConditions';
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
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize WebSocket and Service Worker for Live Alerts
  useEffect(() => {
    // Request Notification permission
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
    
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW registration failed:', err));
    }

    // Connect to WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.port === '5173' ? `${window.location.hostname}:3001` : window.location.host;
    const wsUrl = `${protocol}//${host}`;
    const ws = new WebSocket(wsUrl);
    ws.onerror = () => {};

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'extreme_weather_alert') {
          // Trigger Push Notification if permission granted
          if ('Notification' in window && Notification.permission === 'granted') {
            if (navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({
                type: 'SHOW_NOTIFICATION',
                title: `⚠️ ${data.alert.title}`,
                message: data.alert.message
              });
            } else {
              new Notification(`⚠️ ${data.alert.title}`, { body: data.alert.message, icon: '/logo_new.jpg' });
            }
          }
          // Also dispatch to app state so it shows in the UI ticker
          dispatch({ 
            type: 'SET_SEVERE_ALERT', 
            payload: {
              isSevere: true,
              level: data.alert.severity,
              label: data.alert.title,
              message: data.alert.message
            } 
          });
        }
      } catch (e) {
        console.error('WebSocket parsing error', e);
      }
    };

    return () => {
      if (ws.readyState === 1) ws.close();
    };
  }, [dispatch]);

  const [selectedDay, setSelectedDay] = useState(0); // 0 = today
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time live clock updating every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const t = UI_TRANSLATIONS[state.language] || UI_TRANSLATIONS['en'];
  const locale = SPEECH_LANG_CODES[state.language] || 'en-IN';
  const stageData = state.weatherStageData;
  const weather = stageData?.weather;

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (!val.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    debounceRef.current = setTimeout(async () => {
      const results = await searchLocationSuggestions(val, state.language);
      setSuggestions(results);
      setShowSuggestions(true);
    }, 400);
  };

  const handleSelectLocation = async (loc) => {
    setSearchInput(loc.name);
    setShowSuggestions(false);
    setIsLoading(true);
    try {
      const data = await getWeather(loc.lat, loc.lng);
      dispatch({ type: 'SET_WEATHER_STAGE_DATA', payload: { locationName: loc.name, lat: loc.lat, lng: loc.lng, weather: data } });
      setSelectedDay(0);
      
      const severityCheck = checkSeverity(data, loc.name);
      if (severityCheck && severityCheck.isSevere) {
        dispatch({ type: 'SET_SEVERE_ALERT', payload: severityCheck });
      } else {
        dispatch({ type: 'DISMISS_ALERT' });
      }
    } catch (err) {} finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchInput.trim()) return;
    
    // If they press enter, just pick the top suggestion or fallback to geocodeLocation
    setIsLoading(true);
    setShowSuggestions(false);
    try {
      let loc = suggestions.length > 0 ? suggestions[0] : null;
      if (!loc) {
        loc = await geocodeLocation(searchInput, state.language);
      }
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

  if (!stageData || !weather || !weather.daily) {
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 pb-24 md:pb-6 pt-20">
          <div className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-3xl shadow-2xl relative">
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-6 text-center text-gradient-hero">{t.searchPrompt}</h2>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchInput}
                onChange={handleSearchChange}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                className="flex-1 glass-input rounded-xl px-4 py-3 text-white focus:outline-none transition-colors text-sm sm:text-base glow-focus"
              />
              <button type="submit" disabled={isLoading} className="px-4 sm:px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] text-sm sm:text-base disabled:opacity-50">
                {isLoading ? '...' : 'Go'}
              </button>
            </form>
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-50 w-full left-0 mt-2 theme-modal rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                {suggestions.map((loc, idx) => (
                  <li 
                    key={idx} 
                    onMouseDown={() => handleSelectLocation(loc)}
                    className="px-4 py-3 hover:bg-[var(--theme-border)] cursor-pointer border-b border-[var(--theme-border)] last:border-0 transition-colors text-left"
                  >
                    <div className="font-medium text-sm">{typeof loc.name === 'string' ? loc.name : 'Unknown Location'}</div>
                    <div className="text-xs opacity-60">
                      {[loc.district, loc.state, loc.country].filter(Boolean).join(', ')}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Derive Display Values (Today vs Future Day) with 100% null safety
  const isToday = selectedDay === 0;
  const maxTempDaily = weather?.daily?.maxTemp?.[selectedDay] ?? weather?.temperature ?? 25;
  const minTempDaily = weather?.daily?.minTemp?.[selectedDay] ?? (maxTempDaily - 8);
  const displayTemp = isToday ? (weather?.temperature ?? Math.round(maxTempDaily)) : Math.round(maxTempDaily);
  const displayFeelsLike = isToday ? (weather?.feelsLike ?? displayTemp) : Math.round((maxTempDaily + minTempDaily) / 2);
  const displayCode = isToday ? (weather?.weatherCode ?? 0) : (weather?.daily?.weatherCode?.[selectedDay] ?? 0);
  const displayUv = isToday ? (weather?.uvIndex ?? 5) : (weather?.daily?.uvIndexMax?.[selectedDay] ?? 5);
  
  const isDayCurrent = isToday ? (weather?.isDay ?? true) : true;
  const weatherInfo = getWeatherInfo(displayCode, state.language, isDayCurrent);
  const theme = getTheme({ ...weather, weatherCode: displayCode }, weatherInfo);

  // Generate hourly data safely
  const hourlyData = [];
  if (weather && weather.hourly && Array.isArray(weather.hourly.time)) {
    const now = new Date();
    let currentHourIdx = weather.hourly.time.findIndex(time => new Date(time) > now) - 1 || 0;
    currentHourIdx = Math.max(0, currentHourIdx);
    for (let i = 0; i < 12; i++) {
      if (currentHourIdx + i < weather.hourly.time.length) {
        const timeObj = new Date(weather.hourly.time[currentHourIdx + i]);
        const wInfo = getWeatherInfo(weather.hourly.weatherCode?.[currentHourIdx + i] ?? 0, state.language, weather.hourly.isDay?.[currentHourIdx + i] ?? true);
        hourlyData.push({
          timeLabel: i === 0 ? (state.language === 'hi' ? 'अब' : 'Now') : timeObj.toLocaleTimeString(locale, { hour: 'numeric', hour12: true }),
          temp: Math.round(weather.hourly.temperature?.[currentHourIdx + i] ?? 20),
          icon: wInfo?.icon || '🌤️',
        });
      }
    }
  }

  // Generate daily data safely
  const dailyData = [];
  if (weather && weather.daily && Array.isArray(weather.daily.time)) {
    for (let i = 0; i < Math.min(7, weather.daily.time.length); i++) {
      const dateObj = new Date(weather.daily.time[i]);
      const wInfo = getWeatherInfo(weather.daily.weatherCode?.[i] ?? 0, state.language, true);
      dailyData.push({
        index: i,
        day: i === 0 ? t.today : dateObj.toLocaleDateString(locale, { weekday: 'short' }),
        max: Math.round(weather.daily.maxTemp?.[i] ?? 25),
        min: Math.round(weather.daily.minTemp?.[i] ?? 18),
        icon: wInfo?.icon || '🌤️',
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
    <div className="min-h-[100dvh] text-white overflow-y-auto pb-24 md:pb-20 relative font-body transition-colors duration-1000">
      
      <div className="relative z-10 max-w-[1400px] mx-auto px-3 sm:px-6 pt-20 sm:pt-28 md:pt-32">
        
        {/* Search Bar */}
        <div className="flex justify-center mb-6 sm:mb-12 relative z-50">
          <form onSubmit={handleSearch} className="w-full max-w-2xl relative">
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchInput}
              onChange={handleSearchChange}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              className="w-full glass-input rounded-full px-5 sm:px-6 py-3 sm:py-3.5 text-sm text-white focus:outline-none shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all placeholder:text-white/40 text-center glow-focus"
            />
            <button type="submit" className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-50 w-full left-0 mt-2 theme-modal rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                {suggestions.map((loc, idx) => (
                  <li 
                    key={idx} 
                    onMouseDown={() => handleSelectLocation(loc)}
                    className="px-5 py-3.5 hover:bg-[var(--theme-border)] cursor-pointer border-b border-[var(--theme-border)] last:border-0 transition-colors text-left flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                  >
                    <div className="font-medium text-sm sm:text-base">{typeof loc.name === 'string' ? loc.name : 'Unknown Location'}</div>
                    <div className="text-[10px] sm:text-xs opacity-60">
                      {[loc.district, loc.state, loc.country].filter(Boolean).join(', ')}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </form>
        </div>

        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-6 sm:mb-12 gap-6">
          {/* Left: Temp and Info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-white/90 mb-2 font-medium text-base sm:text-lg flex-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8A33D" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span className="truncate max-w-[200px] sm:max-w-none">{typeof stageData.locationName === 'string' ? stageData.locationName : 'Unknown Location'}</span>
              {selectedDay > 0 && <span className="text-white/50 text-sm">({dailyData[selectedDay]?.day || 'Day ' + (selectedDay + 1)})</span>}
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
                    : 'text-white/40 glass-panel border border-white/10 hover:text-amber-400'
                }`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill={state.savedLocations.some(l => l.name === stageData.locationName) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
              </button>
            </div>
            <div className="flex items-center gap-2.5 sm:gap-4 mb-2 flex-wrap">
              <div className="text-6xl sm:text-[90px] lg:text-[110px] font-medium leading-none tracking-tighter drop-shadow-2xl">{displayTemp}°</div>
              <div className="text-3xl sm:text-5xl lg:text-6xl drop-shadow-xl">{weatherInfo?.icon}</div>
              
              {/* Live Real-Time Digital Clock in hr:min:sec format */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl glass-panel border border-[var(--theme-border)] shadow-sm backdrop-blur-md self-center ml-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-mono text-xs sm:text-sm font-black tracking-wider text-[var(--text-primary)] tabular-nums">
                  {currentTime.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-2 flex-wrap">
              <div className="text-base sm:text-2xl font-medium tracking-wide drop-shadow-md">{weatherInfo?.label}</div>
              <div className="bg-white/10  px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-sm font-medium border border-white/10 shadow-sm">
                {t.feelsLike} {displayFeelsLike}°
              </div>
              {/* Feature 3: Heat Index Risk Badge */}
              {heatRisk && (
                <div className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-sm font-semibold border  shadow-sm ${heatRisk.bg} ${heatRisk.border} ${heatRisk.color}`}>
                  <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${heatRisk.dot} shrink-0`}></span>
                  {heatRisk.icon} Heat: {heatRisk.label}
                </div>
              )}
            </div>
          </div>

          {/* Right: Stat Cards with Live Compass directly beside UV Max */}
          <div className="flex gap-2 sm:gap-4 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-hide">
            {[
              { icon: '🌡️', val: `${weather?.daily?.maxTemp?.[selectedDay] ?? '--'}°`, lbl: 'Max' },
              { icon: '❄️', val: `${weather?.daily?.minTemp?.[selectedDay] ?? '--'}°`, lbl: 'Min' },
              { icon: '💧', val: isToday ? `${weather?.humidity ?? '--'}%` : `${weather?.daily?.precipProbMax?.[selectedDay] ?? '--'}%`, lbl: isToday ? t.hum : 'Precip' },
              { icon: '☀️', val: `${displayUv}`, lbl: 'UV Max' }
            ].map((stat, i) => (
              <div key={i} className="glass-panel border border-[var(--theme-border)] rounded-2xl sm:rounded-[2rem] p-2.5 sm:p-5 flex flex-col items-center justify-center min-w-[64px] sm:min-w-[90px] shadow-sm shimmer-hover stat-card-hover">
                <div className="text-lg sm:text-2xl mb-1 sm:mb-3 opacity-90">{stat.icon}</div>
                <div className="font-semibold text-sm sm:text-xl mb-0.5 sm:mb-1 whitespace-nowrap text-[var(--text-primary)]">{stat.val}</div>
                <div className="text-[var(--text-secondary)] text-[8px] sm:text-[11px] font-medium uppercase tracking-wider">{stat.lbl}</div>
              </div>
            ))}

            {/* Live Meteorological & Device Sensor Compass (In-line beside UV MAX) */}
            <LiveCompass 
              windDeg={weather?.windDirection} 
              windSpeed={weather?.windSpeed} 
              isCurrentLocation={Boolean(stageData?.lat && state.currentWeather?.lat && Math.abs(stageData.lat - state.currentWeather.lat) < 0.05)}
              label={t.windTab || "Wind"}
            />
          </div>
        </div>

        {/* Model Confidence Panel */}
        <ModelConfidence modelData={weather?.modelData} selectedDay={selectedDay} language={state.language} />

        {/* Hourly Forecast */}
        {isToday && (
          <div className="glass-panel border border-indigo-400/30 rounded-3xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-[0_0_25px_rgba(99,102,241,0.15)] relative overflow-hidden">
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


        {/* 7-Day Forecast */}
        <div className="glass-panel border border-white/10 rounded-3xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-xl">
          <div className="text-white/80 font-medium mb-4 sm:mb-6 text-xs sm:text-sm tracking-wide">{t.forecast7Day || '7-Day Forecast'}</div>
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-4">
            {dailyData.map((day, i) => (
              <button
                key={i}
                onClick={() => setSelectedDay(i)}
                className={`glass-panel border rounded-xl sm:rounded-2xl p-2.5 sm:p-5 flex flex-col items-center transition-all duration-300 shimmer-hover ${selectedDay === i ? 'border-indigo-400/80 bg-indigo-900/40 shadow-[0_0_20px_rgba(99,102,241,0.3)] scale-[1.02]' : 'border-white/10 hover:bg-white/10 stat-card-hover'}`}
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
          <div className="glass-panel border border-white/10 rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col gap-4 sm:gap-6">
            <div className="text-white/80 font-medium text-xs sm:text-sm tracking-wide">{t.detailedConditions || 'Detailed Conditions'}</div>
            <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3 sm:pb-4">
              <span className="text-white/60 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> {t.rainProb || 'Rain Probability'}</span>
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
                <span className="text-white/60 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">🍃 {t.airQuality || 'Air Quality'}</span>
                <span className="font-semibold text-xs sm:text-base">{weather.aqi <= 50 ? (t.aqiGood || 'Good') : weather.aqi <= 100 ? (t.aqiMod || 'Moderate') : weather.aqi <= 150 ? (t.aqiUnhSG || 'Unhealthy (SG)') : (t.aqiUnh || 'Unhealthy')} ({weather.aqi})</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm pb-2">
              <span className="text-white/60 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">☀️ {t.maxUv || 'Max UV Index'}</span>
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
          <div className="glass-panel border border-white/10 rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col min-h-[280px] sm:min-h-[320px]">
            <div className="flex justify-between items-center mb-4 sm:mb-5">
              <span className="text-white/80 font-medium text-xs sm:text-sm tracking-wide">{t.radarLive || 'Live Weather Radar'}</span>
              <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-red-500/30 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> {t.liveBadge || 'Live'}</span>
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
              <div className="glass-panel border border-white/10 rounded-3xl p-4 sm:p-6 shadow-xl">
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
              <div className="glass-panel border border-white/10 rounded-3xl p-4 sm:p-6 shadow-xl flex items-center justify-center min-h-[140px] sm:min-h-[160px]">
                <p className="text-white/50 text-sm text-center">AQI forecasting is not available for future dates.</p>
              </div>
            )}

            <div className="glass-panel border border-[var(--theme-border)] rounded-3xl p-4 sm:p-6 shadow-xl flex-1 flex flex-col justify-between">
              {(() => {
                const sunriseRaw = weather?.daily?.sunrise?.[selectedDay];
                const sunsetRaw = weather?.daily?.sunset?.[selectedDay];
                if (!sunriseRaw || !sunsetRaw) {
                  return (
                    <div className="text-[var(--text-secondary)] text-xs text-center py-8 font-medium">
                      Sunrise and sunset data unavailable for this date.
                    </div>
                  );
                }

                const sunrise = new Date(sunriseRaw).getTime();
                const sunset = new Date(sunsetRaw).getTime();
                const now = currentTime.getTime();
                const isDaytime = now >= sunrise && now <= sunset;

                const srStr = new Date(sunrise).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
                const ssStr = new Date(sunset).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });

                // Daylight duration calculation
                const totalDaylightMs = Math.max(0, sunset - sunrise);
                const daylightHours = Math.floor(totalDaylightMs / (1000 * 60 * 60));
                const daylightMins = Math.floor((totalDaylightMs % (1000 * 60 * 60)) / (1000 * 60));

                let statusBadge = `${daylightHours}h ${daylightMins}m Daylight`;
                if (isToday) {
                  if (isDaytime) {
                    const leftMs = sunset - now;
                    const leftH = Math.floor(leftMs / (1000 * 60 * 60));
                    const leftM = Math.floor((leftMs % (1000 * 60 * 60)) / (1000 * 60));
                    statusBadge = leftH > 0 ? `☀️ ${leftH}h ${leftM}m until sunset` : `☀️ ${leftM}m until sunset`;
                  } else if (now < sunrise) {
                    const untilDawnMs = sunrise - now;
                    const dawnH = Math.floor(untilDawnMs / (1000 * 60 * 60));
                    const dawnM = Math.floor((untilDawnMs % (1000 * 60 * 60)) / (1000 * 60));
                    statusBadge = `🌙 Sunrise in ${dawnH}h ${dawnM}m`;
                  } else {
                    statusBadge = `🌙 Night · ${daylightHours}h ${daylightMins}m Day`;
                  }
                }

                // Celestial orb coordinates on spacious, balanced curve
                // ViewBox: 0 0 300 100, Horizon at y=65, rx=120, ry=46
                let cx = 150, cy = 19, isNightIcon = false;
                if (isDaytime) {
                  const t_val = Math.max(0, Math.min(1, (now - sunrise) / (sunset - sunrise)));
                  const angle = Math.PI * (1 - t_val); // PI at sunrise, 0 at sunset
                  cx = 150 + 120 * Math.cos(angle);
                  cy = 65 - 46 * Math.sin(angle);
                } else {
                  isNightIcon = true;
                  let t_night = 0;
                  if (now > sunset) {
                    const nextSunrise = sunrise + 86400000;
                    t_night = (now - sunset) / (nextSunrise - sunset);
                  } else {
                    const prevSunset = sunset - 86400000;
                    t_night = (now - prevSunset) / (sunrise - prevSunset);
                  }
                  t_night = Math.max(0, Math.min(1, t_night));
                  const angle = t_night * Math.PI;
                  cx = 150 + 120 * Math.cos(angle);
                  cy = 65 + 24 * Math.sin(angle);
                }

                return (
                  <>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-[var(--text-primary)] font-black text-xs sm:text-sm flex items-center gap-2 tracking-wide">
                        <span>🌅</span> {t.sunrise} & {t.sunset}
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                        {statusBadge}
                      </span>
                    </div>

                    {/* Celestial Arc Graphic */}
                    <div className="relative h-32 sm:h-36 w-full flex items-center justify-center my-1">
                      <svg className="w-full h-full" preserveAspectRatio="xMidYMid meet" viewBox="0 0 300 100">
                        <defs>
                          <linearGradient id="dayArcGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#F59E0B" />
                            <stop offset="50%" stopColor="#FBBF24" />
                            <stop offset="100%" stopColor="#EA580C" />
                          </linearGradient>
                          <linearGradient id="dayFillGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.22" />
                            <stop offset="80%" stopColor="#F59E0B" stopOpacity="0.03" />
                            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                          </linearGradient>
                          <linearGradient id="nightArcGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#6366F1" />
                            <stop offset="100%" stopColor="#A855F7" />
                          </linearGradient>
                          <filter id="sunGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                        </defs>

                        {/* Soft Daylight Dome Fill */}
                        <path d="M 30 65 A 120 46 0 0 1 270 65 Z" fill="url(#dayFillGlow)" />

                        {/* Horizon Line */}
                        <line x1="15" y1="65" x2="285" y2="65" stroke="var(--theme-border)" strokeWidth="1" strokeDasharray="3 4" opacity="0.8" />

                        {/* Top Arc (Day Sky Path) */}
                        <path 
                          d="M 30 65 A 120 46 0 0 1 270 65" 
                          fill="none" 
                          stroke="url(#dayArcGlow)" 
                          strokeWidth="2.5" 
                          strokeDasharray="4 4" 
                        />
                        
                        {/* Bottom Arc (Night Path) */}
                        <path 
                          d="M 270 65 A 120 24 0 0 1 30 65" 
                          fill="none" 
                          stroke="url(#nightArcGlow)" 
                          strokeWidth="1.5" 
                          strokeDasharray="3 4" 
                          opacity="0.4"
                        />

                        {/* Horizon Anchor Nodes */}
                        <circle cx="30" cy="65" r="3.5" fill="#F59E0B" stroke="var(--glass-bg)" strokeWidth="1.5" />
                        <circle cx="270" cy="65" r="3.5" fill="#EA580C" stroke="var(--glass-bg)" strokeWidth="1.5" />

                        {/* Active Sun or Moon Orb with Pulsing Halos */}
                        {isToday && (
                          <g transform={`translate(${cx}, ${cy})`}>
                            {isNightIcon ? (
                              <g filter="drop-shadow(0px 0px 8px rgba(147,197,253,0.8))">
                                <circle r="8" fill="rgba(147,197,253,0.2)" />
                                <path d="M-3,-6 A 6 6 0 1 0 6 6 A 8 8 0 1 1 -3,-6 Z" fill="#BFDBFE">
                                  <animate attributeName="opacity" values="0.8; 1; 0.8" dur="3s" repeatCount="indefinite" />
                                </path>
                              </g>
                            ) : (
                              <g filter="url(#sunGlow)">
                                <circle r="11" fill="rgba(245,158,11,0.25)">
                                  <animate attributeName="r" values="9; 13; 9" dur="2.5s" repeatCount="indefinite" />
                                  <animate attributeName="opacity" values="0.4; 0.8; 0.4" dur="2.5s" repeatCount="indefinite" />
                                </circle>
                                <circle r="6.5" fill="#FBBF24" />
                                <circle r="4" fill="#FFFBEB" />
                              </g>
                            )}
                          </g>
                        )}
                      </svg>
                    </div>

                    {/* Dedicated Clean Stats Bar (Zero Text Collision!) */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--theme-border)]">
                      <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-[var(--glass-bg)] border border-[var(--theme-border)] shadow-sm">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-base shrink-0">🌅</div>
                        <div>
                          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">{t.sunrise}</div>
                          <div className="text-xs sm:text-sm font-black text-[var(--text-primary)]">{srStr}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-[var(--glass-bg)] border border-[var(--theme-border)] shadow-sm">
                        <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center text-base shrink-0">🌇</div>
                        <div>
                          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">{t.sunset}</div>
                          <div className="text-xs sm:text-sm font-black text-[var(--text-primary)]">{ssStr}</div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Historical Data Section */}
        <HistoricalAnalytics lat={stageData.lat} lon={stageData.lng} />

        {/* Forecast Accuracy Tracker */}
        <AccuracyTracker locationName={stageData.locationName} language={state.language} />

        {/* Crowdsourced Community Weather Reports */}
        <CommunityReports locationName={stageData.locationName} />

      </div>
    </div>
  );
}

