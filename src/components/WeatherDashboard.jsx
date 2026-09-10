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
import OfficialBulletinModal from './OfficialBulletinModal';
import AawazEMausam from './AawazEMausam';
import MausamDrishtiModal from './MausamDrishtiModal';


export default function WeatherDashboard() {
  const { state, dispatch } = useApp();
  const [showBulletinModal, setShowBulletinModal] = useState(false);
  const [showDrishtiModal, setShowDrishtiModal] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshingWeather, setIsRefreshingWeather] = useState(false);

  // Listen for global open Mausam-Drishti events from Header or Quick Hub
  useEffect(() => {
    const handleOpenDrishti = () => setShowDrishtiModal(true);
    window.addEventListener('weathergpt-open-mausam-drishti', handleOpenDrishti);
    return () => window.removeEventListener('weathergpt-open-mausam-drishti', handleOpenDrishti);
  }, []);

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
      dispatch({ 
        type: 'SET_WEATHER_STAGE_DATA', 
        payload: { 
          locationName: loc.name, 
          district: loc.district || '',
          state: loc.state || '',
          lat: loc.lat, 
          lng: loc.lng, 
          weather: data 
        } 
      });
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
        dispatch({ 
          type: 'SET_WEATHER_STAGE_DATA', 
          payload: { 
            locationName: loc.name, 
            district: loc.district || '',
            state: loc.state || '',
            lat: loc.lat, 
            lng: loc.lng, 
            weather: data 
          } 
        });
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

  const handleRefreshCurrentWeather = async () => {
    if (!stageData?.lat || !stageData?.lng) return;
    setIsRefreshingWeather(true);
    try {
      const freshData = await getWeather(stageData.lat, stageData.lng, true);
      dispatch({ 
        type: 'SET_WEATHER_STAGE_DATA', 
        payload: { 
          locationName: stageData.locationName, 
          district: stageData.district || '',
          state: stageData.state || '',
          lat: stageData.lat, 
          lng: stageData.lng, 
          weather: freshData 
        } 
      });
      const severityCheck = checkSeverity(freshData, stageData.locationName);
      if (severityCheck && severityCheck.isSevere) {
        dispatch({ type: 'SET_SEVERE_ALERT', payload: severityCheck });
      } else {
        dispatch({ type: 'DISMISS_ALERT' });
      }
    } catch (err) {
      console.error('Failed to refresh live weather:', err);
    } finally {
      setTimeout(() => setIsRefreshingWeather(false), 500);
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

  // Generate hourly data safely with precipitation probabilities
  const hourlyData = [];
  if (weather && weather.hourly && Array.isArray(weather.hourly.time)) {
    const now = new Date();
    let currentHourIdx = weather.hourly.time.findIndex(time => new Date(time) > now) - 1 || 0;
    currentHourIdx = Math.max(0, currentHourIdx);
    for (let i = 0; i < 16; i++) {
      if (currentHourIdx + i < weather.hourly.time.length) {
        const timeObj = new Date(weather.hourly.time[currentHourIdx + i]);
        const wInfo = getWeatherInfo(weather.hourly.weatherCode?.[currentHourIdx + i] ?? 0, state.language, weather.hourly.isDay?.[currentHourIdx + i] ?? true);
        const precipProb = Math.round(weather.hourly.precipProb?.[currentHourIdx + i] ?? weather.hourly.precipitation_probability?.[currentHourIdx + i] ?? 0);
        hourlyData.push({
          timeLabel: i === 0 ? (state.language === 'hi' ? 'अब' : 'Now') : timeObj.toLocaleTimeString(locale, { hour: 'numeric', hour12: true }),
          temp: Math.round(weather.hourly.temperature?.[currentHourIdx + i] ?? 20),
          icon: wInfo?.icon || '🌤️',
          precipProb,
          isNow: i === 0
        });
      }
    }
  }

  const WEEKDAYS_MAP = {
    sa: ['रविः', 'सोमः', 'मङ्गलम्', 'बुधः', 'गुरुः', 'शुक्रः', 'शनिः'],
    hi: ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'],
    mr: ['रवि', 'सोम', 'मंगळ', 'बुध', 'गुरु', 'शुक्र', 'शनी'],
    bn: ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'],
    as: ['দেও', 'সোম', 'মঙ্গল', 'बुध', 'বৃহ', 'শুক্ৰ', 'শনি'],
    ta: ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'],
    te: ['ఆది', 'సోమ', 'మంగళ', 'బుధ', 'గురు', 'శుక్ర', 'శని'],
    gu: ['રવિ', 'સોમ', 'મંગળ', 'બુધ', 'ગુરુ', 'શુક્ર', 'શનિ'],
  };

  // Generate daily data safely with precipitation and min/max bounds
  const dailyData = [];
  if (weather && weather.daily && Array.isArray(weather.daily.time)) {
    for (let i = 0; i < Math.min(7, weather.daily.time.length); i++) {
      const dateObj = new Date(weather.daily.time[i]);
      const wInfo = getWeatherInfo(weather.daily.weatherCode?.[i] ?? 0, state.language, true);
      const localizedDay = WEEKDAYS_MAP[state.language]?.[dateObj.getDay()] || dateObj.toLocaleDateString(locale, { weekday: 'short' });
      const precipProb = Math.round(weather.daily.precipProbMax?.[i] ?? weather.daily.precipitation_probability_max?.[i] ?? 0);
      const rainSum = Number(weather.daily.precipitationSum?.[i] ?? weather.daily.rainSum?.[i] ?? 0);
      dailyData.push({
        index: i,
        day: i === 0 ? t.today : localizedDay,
        max: Math.round(weather.daily.maxTemp?.[i] ?? 25),
        min: Math.round(weather.daily.minTemp?.[i] ?? 18),
        icon: wInfo?.icon || '🌤️',
        label: wInfo?.label || '',
        precipProb,
        rainSum,
      });
    }
  }

  // 7-day temperature range extrema for Apple-Weather style gradient bars
  const weekMin = dailyData.length > 0 ? Math.min(...dailyData.map(d => d.min)) : 15;
  const weekMax = dailyData.length > 0 ? Math.max(...dailyData.map(d => d.max)) : 35;
  const weekRange = Math.max(1, weekMax - weekMin);

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
      
      <div className="relative z-10 max-w-[1400px] mx-auto px-2.5 sm:px-6 pt-16 sm:pt-28 md:pt-32">
        
        {/* Search Bar */}
        <div className="flex justify-center mb-4 sm:mb-12 relative z-50">
          <form onSubmit={handleSearch} className="w-full max-w-2xl relative">
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchInput}
              onChange={handleSearchChange}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              className="w-full glass-input rounded-full px-4 sm:px-6 py-2.5 sm:py-3.5 text-xs sm:text-sm text-white focus:outline-none shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all placeholder:text-white/40 text-center glow-focus"
            />
            <button type="submit" className="absolute right-3.5 sm:right-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-50 w-full left-0 mt-2 theme-modal rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                {suggestions.map((loc, idx) => (
                  <li 
                    key={idx} 
                    onMouseDown={() => handleSelectLocation(loc)}
                    className="px-4 py-2.5 sm:px-5 sm:py-3.5 hover:bg-[var(--theme-border)] cursor-pointer border-b border-[var(--theme-border)] last:border-0 transition-colors text-left flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                  >
                    <div className="font-medium text-xs sm:text-base">{typeof loc.name === 'string' ? loc.name : 'Unknown Location'}</div>
                    <div className="text-[9px] sm:text-xs opacity-60">
                      {[loc.district, loc.state, loc.country].filter(Boolean).join(', ')}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </form>
        </div>

        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-4 sm:mb-12 gap-3 sm:gap-6">
          {/* Left: Temp and Info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 sm:gap-2 text-white/90 mb-1.5 sm:mb-2 font-medium text-sm sm:text-lg flex-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E8A33D" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span className="truncate max-w-[160px] sm:max-w-none font-bold">{typeof stageData.locationName === 'string' ? stageData.locationName : 'Unknown Location'}</span>
              {(stageData.district || stageData.state) && (
                <span className="text-white/70 text-[10px] sm:text-sm font-normal bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/15 truncate max-w-[140px] sm:max-w-none">
                  {[stageData.district, stageData.state].filter(Boolean).join(', ')}
                </span>
              )}

              {/* Live IST Observation Badge */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 backdrop-blur-md shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                <span>Live IST</span>
              </span>

              {selectedDay > 0 && <span className="text-white/50 text-xs sm:text-sm">({dailyData[selectedDay]?.day || 'Day ' + (selectedDay + 1)})</span>}
              <button
                onClick={() => {
                  const isSaved = state.savedLocations.some(l => l.name === stageData.locationName);
                  if (isSaved) {
                    dispatch({ type: 'REMOVE_LOCATION', payload: stageData.locationName });
                  } else {
                    dispatch({ type: 'SAVE_LOCATION', payload: { name: stageData.locationName, lat: stageData.lat, lng: stageData.lng } });
                  }
                }}
                title={state.savedLocations.some(l => l.name === stageData.locationName) ? "Saved location" : "Save location"}
                className={`ml-1 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full transition-all ${
                  state.savedLocations.some(l => l.name === stageData.locationName)
                    ? 'text-amber-400 bg-amber-500/20 border border-amber-500/30'
                    : 'text-white/40 glass-panel border border-white/10 hover:text-amber-400'
                }`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill={state.savedLocations.some(l => l.name === stageData.locationName) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
              </button>

              {/* Refresh Live Weather Button */}
              <button
                onClick={handleRefreshCurrentWeather}
                disabled={isRefreshingWeather}
                title="Refresh Live Weather"
                className="ml-1 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-white/50 glass-panel border border-white/10 hover:text-indigo-400 hover:border-indigo-400/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={isRefreshingWeather ? 'animate-spin text-indigo-400' : ''}>
                  <polyline points="23 4 23 10 17 10"/>
                  <polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 mb-1.5 sm:mb-2 flex-wrap">
              <div className="text-5xl sm:text-[80px] lg:text-[100px] font-medium leading-none tracking-tighter drop-shadow-2xl">{displayTemp}°</div>
              <div className="text-3xl sm:text-5xl lg:text-6xl drop-shadow-xl">{weatherInfo?.icon}</div>
              
              {/* Live Real-Time IST Date & Digital Clock */}
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl glass-panel border border-[var(--theme-border)] shadow-sm backdrop-blur-md self-center ml-0.5 sm:ml-1">
                <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
                </span>
                <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-sm font-bold tracking-tight text-[var(--text-primary)]">
                  <span className="font-sans opacity-90">
                    {currentTime.toLocaleDateString(locale, { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  <span className="opacity-40">•</span>
                  <span className="font-mono font-black tracking-wider tabular-nums">
                    {currentTime.toLocaleTimeString(locale, { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })}
                  </span>
                  <span className="text-[9px] sm:text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold shrink-0">
                    IST
                  </span>
                </div>
              </div>

              {/* Aawaz-e-Mausam Voice-First Rural Audio Radio Bulletin */}
              <div className="self-center ml-1">
                <AawazEMausam 
                  stageData={stageData} 
                  weatherInfo={weatherInfo} 
                  language={state.language} 
                />
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
                  {heatRisk.icon} {t.heat || 'Heat'}: {heatRisk.label}
                </div>
              )}
            </div>
          </div>

          {/* Right: Stat Cards with Live Compass directly beside UV Max */}
          <div className="flex gap-2 sm:gap-4 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-hide">
            {[
              { icon: '🌡️', val: `${weather?.daily?.maxTemp?.[selectedDay] ?? '--'}°`, lbl: t.statMax || 'Max' },
              { icon: '❄️', val: `${weather?.daily?.minTemp?.[selectedDay] ?? '--'}°`, lbl: t.statMin || 'Min' },
              { icon: '💧', val: isToday ? `${weather?.humidity ?? '--'}%` : `${weather?.daily?.precipProbMax?.[selectedDay] ?? '--'}%`, lbl: isToday ? t.hum : (t.precipTab || 'Precip') },
              { icon: '☀️', val: `${displayUv}`, lbl: t.statUvMax || 'UV Max' }
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

        {/* Model Confidence Panel with NWP Multi-Model Consensus Engine */}
        <ModelConfidence 
          modelData={weather?.modelData} 
          selectedDay={selectedDay} 
          language={state.language} 
          confidence={weather?.confidence} 
        />

        {/* ── 1. Hourly Forecast (Silk-Smooth Horizontal Scroll with Rain Badges) ── */}
        {isToday && hourlyData.length > 0 && (
          <div className="glass-panel border border-indigo-400/25 rounded-3xl p-4 sm:p-6 mb-6 shadow-[0_4px_30px_rgba(99,102,241,0.12)] relative overflow-hidden backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2 text-[var(--text-primary)] font-bold text-xs sm:text-sm tracking-wide">
                <span>🕒</span>
                <span>{t.hourlyForecast || 'Hourly Forecast'}</span>
              </div>
              <span className="text-[10px] text-[var(--text-secondary)] font-medium">
                Next 16 Hours
              </span>
            </div>

            <div className="flex items-center overflow-x-auto scrollbar-hide gap-2.5 sm:gap-4 pb-2 pt-1">
              {hourlyData.map((d, i) => (
                <div 
                  key={i} 
                  className={`flex flex-col items-center justify-between min-w-[58px] sm:min-w-[70px] py-3 px-2 rounded-2xl transition-all duration-300 select-none ${
                    d.isNow 
                      ? 'bg-gradient-to-b from-indigo-600/50 to-indigo-900/60 border border-indigo-400/60 shadow-[0_0_15px_rgba(99,102,241,0.3)] scale-[1.03]' 
                      : 'glass-panel border border-[var(--theme-border)] hover:bg-white/10'
                  }`}
                >
                  <span className="text-[10px] sm:text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    {d.timeLabel}
                  </span>
                  
                  <span className="text-2xl sm:text-3xl my-1.5 drop-shadow-md">
                    {d.icon}
                  </span>

                  {d.precipProb > 10 ? (
                    <span className="text-[9px] font-black text-cyan-400 bg-cyan-500/20 px-1.5 py-0.5 rounded-full mb-1">
                      {d.precipProb}%
                    </span>
                  ) : (
                    <span className="text-[9px] text-transparent mb-1">•</span>
                  )}

                  <span className="text-sm sm:text-base font-extrabold text-[var(--text-primary)]">
                    {d.temp}°
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 2. Apple Weather-Style 7-Day Forecast with Dynamic Temperature Range Bars ── */}
        <div className="glass-panel border border-[var(--theme-border)] rounded-3xl p-4 sm:p-6 mb-6 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div className="flex items-center gap-2 text-[var(--text-primary)] font-bold text-xs sm:text-sm tracking-wide">
              <span>📅</span>
              <span>{t.forecast7Day || '7-Day Forecast'}</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-[var(--text-secondary)] font-medium">
              Weekly Range: {weekMin}° – {weekMax}°
            </span>
          </div>

          <div className="flex flex-col divide-y divide-[var(--theme-border)]">
            {dailyData.map((day, i) => {
              const minOffset = Math.max(0, Math.min(100, Math.round(((day.min - weekMin) / weekRange) * 100)));
              const maxOffset = Math.max(0, Math.min(100, Math.round(((weekMax - day.max) / weekRange) * 100)));
              const barWidth = Math.max(8, 100 - minOffset - maxOffset);
              const isSelected = selectedDay === i;

              // Position for today's current temperature dot
              const currentDotPos = day.index === 0
                ? Math.min(100, Math.max(0, Math.round(((displayTemp - weekMin) / weekRange) * 100)))
                : null;

              return (
                <div
                  key={i}
                  onClick={() => setSelectedDay(i)}
                  className={`py-3 sm:py-3.5 px-2 sm:px-3 rounded-2xl flex items-center justify-between gap-2 sm:gap-4 transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/20 border border-indigo-400/40 shadow-inner'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {/* Day Name */}
                  <div className="w-16 sm:w-24 shrink-0">
                    <span className={`text-xs sm:text-sm font-bold ${day.index === 0 ? 'text-indigo-400 font-black' : 'text-[var(--text-primary)]'}`}>
                      {day.day}
                    </span>
                  </div>

                  {/* Weather Icon & Rain % */}
                  <div className="flex items-center gap-1.5 w-14 sm:w-20 shrink-0">
                    <span className="text-xl sm:text-2xl drop-shadow">{day.icon}</span>
                    {day.precipProb > 15 && (
                      <span className="text-[10px] font-black text-cyan-400 flex items-center gap-0.5">
                        <span className="text-[8px]">💧</span>{day.precipProb}%
                      </span>
                    )}
                  </div>

                  {/* Min Temp */}
                  <div className="w-8 text-right font-mono text-xs sm:text-sm font-semibold text-[var(--text-secondary)] shrink-0">
                    {day.min}°
                  </div>

                  {/* Dynamic Gradient Range Bar (The Apple Weather Gold Standard) */}
                  <div className="flex-1 h-2 sm:h-2.5 rounded-full bg-slate-800/70 border border-white/5 relative overflow-hidden mx-1 sm:mx-3">
                    <div
                      className="absolute top-0 bottom-0 rounded-full shadow-sm"
                      style={{
                        left: `${minOffset}%`,
                        width: `${barWidth}%`,
                        background: 'linear-gradient(to right, #06b6d4, #10b981, #f59e0b, #ef4444)',
                      }}
                    />
                    {currentDotPos !== null && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white border border-slate-900 shadow-md z-10"
                        style={{ left: `calc(${currentDotPos}% - 5px)` }}
                        title={`Live Now: ${displayTemp}°`}
                      />
                    )}
                  </div>

                  {/* Max Temp */}
                  <div className="w-8 text-left font-mono text-xs sm:text-sm font-bold text-[var(--text-primary)] shrink-0">
                    {day.max}°
                  </div>
                </div>
              );
            })}
          </div>

          {/* Visual Color Scale & Live Dot Legend */}
          <div className="mt-3 pt-3 border-t border-[var(--theme-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] sm:text-[11px] text-[var(--text-secondary)]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-[var(--text-primary)]">
                {['hi', 'mr', 'pa', 'gu'].includes(state.language) ? 'रंग पैमाना (Color Scale):' : 'Color Range Scale:'}
              </span>
              <span className="inline-flex items-center gap-1 text-cyan-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span>
                {['hi', 'mr', 'pa', 'gu'].includes(state.language) ? 'न्यूनतम (Cool)' : 'Min (Cool)'}
              </span>
              <span>➔</span>
              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                {['hi', 'mr', 'pa', 'gu'].includes(state.language) ? 'सुखद' : 'Mild'}
              </span>
              <span>➔</span>
              <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                {['hi', 'mr', 'pa', 'gu'].includes(state.language) ? 'गर्म' : 'Warm'}
              </span>
              <span>➔</span>
              <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-400 inline-block"></span>
                {['hi', 'mr', 'pa', 'gu'].includes(state.language) ? 'अधिकतम (Hot)' : 'Max (Hot)'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-900 inline-block shadow-xs"></span>
              <span>
                {['hi', 'mr', 'pa', 'gu'].includes(state.language) ? 'सफेद बिंदु = वर्तमान लाइव तापमान' : 'White dot = Live temperature right now'}
              </span>
            </div>
          </div>
        </div>

        {/* ── 3. Meteorological Deep-Dive Bento Grid (Apple/Windy Caliber) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6 mb-4 sm:mb-6">
          
          {/* Bento Card 1: Air Quality Index (AQI) */}
          <div className="glass-panel border border-[var(--theme-border)] rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-lg sm:shadow-xl backdrop-blur-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm font-bold text-[var(--text-primary)] truncate">
                  <span>🍃</span>
                  <span className="truncate">{t.airQuality || 'Air Quality'}</span>
                </div>
                <span className={`px-1.5 sm:px-2.5 py-0.5 rounded-full text-[8px] sm:text-[11px] font-bold border shrink-0 ${
                  (weather?.aqi ?? 42) <= 50 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                    : (weather?.aqi ?? 42) <= 100 
                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' 
                    : (weather?.aqi ?? 42) <= 150 
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' 
                    : 'bg-red-500/20 text-red-300 border-red-500/30'
                }`}>
                  {(weather?.aqi ?? 42) <= 50 ? (t.aqiGood || 'Good') : (weather?.aqi ?? 42) <= 100 ? (t.aqiMod || 'Moderate') : (weather?.aqi ?? 42) <= 150 ? (t.aqiUnhSG || 'Poor') : (t.aqiUnh || 'Unhealthy')}
                </span>
              </div>

              <div className="flex items-baseline gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <span className="text-2xl sm:text-5xl font-black tracking-tight text-[var(--text-primary)]">{weather?.aqi ?? '--'}</span>
                <span className="text-[10px] sm:text-xs font-semibold text-[var(--text-secondary)]">US-AQI</span>
              </div>

              {/* Progress Meter */}
              <div className="w-full h-1.5 sm:h-2 rounded-full bg-slate-800/80 border border-white/5 overflow-hidden mb-1.5 sm:mb-2">
                <div 
                  className="h-full rounded-full transition-all duration-500" 
                  style={{ 
                    width: `${Math.min(100, Math.max(5, ((weather?.aqi ?? 42) / 300) * 100))}%`,
                    background: (weather?.aqi ?? 42) <= 50 
                      ? 'linear-gradient(to right, #10b981, #34d399)' 
                      : (weather?.aqi ?? 42) <= 100 
                      ? 'linear-gradient(to right, #facc15, #eab308)' 
                      : (weather?.aqi ?? 42) <= 150 
                      ? 'linear-gradient(to right, #fb923c, #f97316)' 
                      : 'linear-gradient(to right, #f87171, #ef4444)'
                  }}
                />
              </div>

              <div className="flex justify-between text-[8px] sm:text-[9px] font-mono text-[var(--text-secondary)] opacity-70 mb-1.5 sm:mb-2">
                <span>0 Good</span>
                <span>100 Mod</span>
                <span>300+</span>
              </div>
            </div>

            <p className="text-[10px] sm:text-xs text-[var(--text-secondary)] font-medium leading-relaxed pt-1.5 sm:pt-2 border-t border-[var(--theme-border)] line-clamp-2 sm:line-clamp-none">
              {isToday ? (
                (weather?.aqi ?? 42) <= 50 
                  ? 'Air quality is satisfactory with minimal environmental risk.' 
                  : (weather?.aqi ?? 42) <= 100 
                  ? 'Moderate air quality; sensitive groups should limit exertion.' 
                  : 'Elevated pollution. Sensitive groups should wear masks outdoors.'
              ) : (
                'AQI forecasting is restricted to real-time observations.'
              )}
            </p>
          </div>

          {/* Bento Card 2: Barometer & Atmospheric Surface Pressure */}
          {(() => {
            const pressure = weather?.surfacePressure ?? 1013;
            let statusText = "Standard Baseline";
            let statusColor = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
            let desc = "Atmospheric equilibrium is steady with no severe barometric gradient.";
            if (pressure < 1005) {
              statusText = "Low Pressure Trough";
              statusColor = "bg-rose-500/20 text-rose-300 border-rose-500/30";
              desc = "Depression detected. Active convective cloudiness & rainfall potential.";
            } else if (pressure > 1018) {
              statusText = "High Pressure Ridge";
              statusColor = "bg-indigo-500/20 text-indigo-300 border-indigo-400/30";
              desc = "Anticyclonic subsidence dominating. Stable, dry, and settled skies.";
            }

            const pct = Math.min(100, Math.max(0, ((pressure - 980) / (1040 - 980)) * 100));

            return (
              <div className="glass-panel border border-[var(--theme-border)] rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-lg sm:shadow-xl backdrop-blur-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm font-bold text-[var(--text-primary)] truncate">
                      <span>⏱️</span>
                      <span className="truncate">Pressure</span>
                    </div>
                    <span className={`px-1.5 sm:px-2.5 py-0.5 rounded-full text-[8px] sm:text-[11px] font-bold border shrink-0 ${statusColor}`}>
                      {statusText}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                    <span className="text-2xl sm:text-5xl font-black tracking-tight text-[var(--text-primary)]">{pressure}</span>
                    <span className="text-[10px] sm:text-xs font-semibold text-[var(--text-secondary)]">hPa</span>
                  </div>

                  {/* Barometric Scale Meter */}
                  <div className="relative w-full h-1.5 sm:h-2 rounded-full bg-slate-800/80 border border-white/5 overflow-hidden mb-1.5 sm:mb-2">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 via-emerald-400 to-indigo-500 transition-all duration-500" 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[8px] sm:text-[9px] font-mono text-[var(--text-secondary)] opacity-70 mb-1.5 sm:mb-2">
                    <span>980 Low</span>
                    <span>1013 Std</span>
                    <span>1040</span>
                  </div>
                </div>

                <p className="text-[10px] sm:text-xs text-[var(--text-secondary)] font-medium leading-relaxed pt-1.5 sm:pt-2 border-t border-[var(--theme-border)] line-clamp-2 sm:line-clamp-none">
                  {desc}
                </p>
              </div>
            );
          })()}

          {/* Bento Card 3: Wind Currents & Live Cardinal Heading */}
          {(() => {
            const speed = Math.round(weather?.windSpeed ?? 0);
            const dir = Math.round(weather?.windDirection ?? 0);
            const compassSectors = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
            const cardinal = compassSectors[Math.round((dir % 360) / 22.5) % 16];

            let beaufort = "Calm";
            if (speed >= 5 && speed < 20) beaufort = "Gentle Breeze";
            else if (speed >= 20 && speed < 39) beaufort = "Moderate Breeze";
            else if (speed >= 39 && speed < 62) beaufort = "Strong Wind";
            else if (speed >= 62) beaufort = "Gale Warning";

            return (
              <div className="glass-panel border border-[var(--theme-border)] rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-lg sm:shadow-xl backdrop-blur-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm font-bold text-[var(--text-primary)] truncate">
                      <span>💨</span>
                      <span className="truncate">{t.windTab || 'Wind'}</span>
                    </div>
                    <span className="px-1.5 sm:px-2.5 py-0.5 rounded-full text-[8px] sm:text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                      {cardinal} ({dir}°)
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mb-2 sm:mb-3">
                    <div className="flex items-baseline gap-1.5 sm:gap-2">
                      <span className="text-2xl sm:text-5xl font-black tracking-tight text-[var(--text-primary)]">{speed}</span>
                      <span className="text-[10px] sm:text-xs font-semibold text-[var(--text-secondary)]">km/h</span>
                    </div>

                    {/* Mini Dynamic Compass Rose */}
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-cyan-400/40 bg-slate-900/60 flex items-center justify-center relative shadow-inner shrink-0">
                      <span className="absolute text-[7px] sm:text-[8px] font-black text-cyan-300 top-0.5">N</span>
                      <div 
                        className="w-full h-full flex items-center justify-center transition-transform duration-700 ease-out"
                        style={{ transform: `rotate(${dir}deg)` }}
                      >
                        <div className="w-0.5 sm:w-1 h-3.5 sm:h-5 bg-gradient-to-t from-transparent via-cyan-400 to-rose-500 rounded-full shadow-sm" />
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] sm:text-xs font-bold text-cyan-300/90 mb-1 sm:mb-2">
                    {beaufort}
                  </div>
                </div>

                <p className="text-[10px] sm:text-xs text-[var(--text-secondary)] font-medium leading-relaxed pt-1.5 sm:pt-2 border-t border-[var(--theme-border)] line-clamp-2 sm:line-clamp-none">
                  Wind from {cardinal} heading {dir}° with regular laminar circulation.
                </p>
              </div>
            );
          })()}

          {/* Bento Card 4: Humidity & Dew Point Comfort Index */}
          {(() => {
            const hum = weather?.humidity ?? 65;
            const dewPoint = Math.round(displayTemp - ((100 - hum) / 5));
            let comfort = "Pleasant";
            let comfortColor = "text-emerald-300 bg-emerald-500/20 border-emerald-500/30";
            if (dewPoint < 10) {
              comfort = "Dry & Crisp";
              comfortColor = "text-cyan-300 bg-cyan-500/20 border-cyan-500/30";
            } else if (dewPoint <= 15) {
              comfort = "Comfortable";
              comfortColor = "text-emerald-300 bg-emerald-500/20 border-emerald-500/30";
            } else if (dewPoint <= 20) {
              comfort = "Humid";
              comfortColor = "text-yellow-300 bg-yellow-500/20 border-yellow-500/30";
            } else if (dewPoint <= 24) {
              comfort = "Muggy";
              comfortColor = "text-orange-300 bg-orange-500/20 border-orange-500/30";
            } else {
              comfort = "Moisture Stress";
              comfortColor = "text-rose-300 bg-rose-500/20 border-rose-500/30";
            }

            return (
              <div className="glass-panel border border-[var(--theme-border)] rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-lg sm:shadow-xl backdrop-blur-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm font-bold text-[var(--text-primary)] truncate">
                      <span>💧</span>
                      <span className="truncate">{t.hum || 'Humidity'}</span>
                    </div>
                    <span className={`px-1.5 sm:px-2.5 py-0.5 rounded-full text-[8px] sm:text-[11px] font-bold border shrink-0 ${comfortColor}`}>
                      {comfort}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                    <span className="text-2xl sm:text-5xl font-black tracking-tight text-[var(--text-primary)]">{hum}</span>
                    <span className="text-[10px] sm:text-xs font-semibold text-[var(--text-secondary)]">%</span>
                  </div>

                  {/* Humidity Progress Bar */}
                  <div className="w-full h-1.5 sm:h-2 rounded-full bg-slate-800/80 border border-white/5 overflow-hidden mb-1.5 sm:mb-2">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 transition-all duration-500" 
                      style={{ width: `${Math.min(100, Math.max(0, hum))}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] sm:text-xs font-medium text-[var(--text-secondary)]">
                    <span>Dew Point {dewPoint}°.</span>
                  </div>
                </div>

                <p className="text-[10px] sm:text-xs text-[var(--text-secondary)] font-medium leading-relaxed pt-1.5 sm:pt-2 border-t border-[var(--theme-border)] line-clamp-2 sm:line-clamp-none">
                  {dewPoint <= 15 ? 'Moisture facilitates quick natural evaporative cooling.' : 'High moisture retards evaporative sweat rate; feels warmer.'}
                </p>
              </div>
            );
          })()}

          {/* Bento Card 5: Precipitation & 24h Rain Gauge */}
          {(() => {
            const currentRainSum = dailyData[selectedDay]?.rainSum ?? 0;
            const currentPrecipProb = dailyData[selectedDay]?.precipProb ?? 0;
            
            let rainNote = "Dry skies expected over the next 24h.";
            if (currentPrecipProb >= 20 && currentRainSum === 0) {
              rainNote = "Low chance of passing sprinkles; largely dry.";
            } else if (currentRainSum > 0 && currentRainSum < 5) {
              rainNote = "Light scattered showers anticipated.";
            } else if (currentRainSum >= 5 && currentRainSum < 25) {
              rainNote = "Moderate accumulation expected; carry umbrella.";
            } else if (currentRainSum >= 25) {
              rainNote = "Substantial rainfall alert; localized waterlogging.";
            }

            return (
              <div className="glass-panel border border-[var(--theme-border)] rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-lg sm:shadow-xl backdrop-blur-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm font-bold text-[var(--text-primary)] truncate">
                      <span>🌧️</span>
                      <span className="truncate">Rain</span>
                    </div>
                    <span className="px-1.5 sm:px-2.5 py-0.5 rounded-full text-[8px] sm:text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                      {currentPrecipProb}%
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                    <span className="text-2xl sm:text-5xl font-black tracking-tight text-[var(--text-primary)]">{currentRainSum}</span>
                    <span className="text-[10px] sm:text-xs font-semibold text-[var(--text-secondary)]">mm</span>
                  </div>

                  {/* Rain Gauge Bar */}
                  <div className="w-full h-1.5 sm:h-2 rounded-full bg-slate-800/80 border border-white/5 overflow-hidden mb-1.5 sm:mb-2">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 transition-all duration-500" 
                      style={{ width: `${Math.min(100, Math.max(currentRainSum > 0 ? 8 : 0, (currentRainSum / 40) * 100))}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[8px] sm:text-[9px] font-mono text-[var(--text-secondary)] opacity-70 mb-1.5 sm:mb-2">
                    <span>0mm</span>
                    <span>15mm</span>
                    <span>40mm+</span>
                  </div>
                </div>

                <p className="text-[10px] sm:text-xs text-[var(--text-secondary)] font-medium leading-relaxed pt-1.5 sm:pt-2 border-t border-[var(--theme-border)] line-clamp-2 sm:line-clamp-none">
                  {rainNote}
                </p>
              </div>
            );
          })()}

          {/* Bento Card 6: UV Index & Solar Protection */}
          {(() => {
            let uvLabel = "Low";
            let uvColor = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
            let uvAdvice = "No sun protection required for general activities.";
            if (displayUv >= 3 && displayUv <= 5) {
              uvLabel = "Moderate";
              uvColor = "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
              uvAdvice = "Wear sunglasses and a hat during peak midday hours.";
            } else if (displayUv >= 6 && displayUv <= 7) {
              uvLabel = "High";
              uvColor = "bg-orange-500/20 text-orange-300 border-orange-500/30";
              uvAdvice = "Protection essential: SPF 30+ sunscreen & shade.";
            } else if (displayUv >= 8 && displayUv <= 10) {
              uvLabel = "Very High";
              uvColor = "bg-rose-500/20 text-rose-300 border-rose-500/30";
              uvAdvice = "Extra protection required; minimize direct sun.";
            } else if (displayUv >= 11) {
              uvLabel = "Extreme";
              uvColor = "bg-purple-500/20 text-purple-300 border-purple-500/30";
              uvAdvice = "Extreme hazard. Unprotected skin can burn rapidly.";
            }

            const uvPct = Math.min(100, Math.max(5, (displayUv / 12) * 100));

            return (
              <div className="glass-panel border border-[var(--theme-border)] rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-lg sm:shadow-xl backdrop-blur-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm font-bold text-[var(--text-primary)] truncate">
                      <span>☀️</span>
                      <span className="truncate">{t.statUvMax || 'UV Index'}</span>
                    </div>
                    <span className={`px-1.5 sm:px-2.5 py-0.5 rounded-full text-[8px] sm:text-[11px] font-bold border shrink-0 ${uvColor}`}>
                      {uvLabel}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                    <span className="text-2xl sm:text-5xl font-black tracking-tight text-[var(--text-primary)]">{displayUv}</span>
                    <span className="text-[10px] sm:text-xs font-semibold text-[var(--text-secondary)]">Max</span>
                  </div>

                  {/* UV meter bar */}
                  <div className="w-full h-1.5 sm:h-2 rounded-full bg-slate-800/80 border border-white/5 overflow-hidden mb-1.5 sm:mb-2">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-600 transition-all duration-500" 
                      style={{ width: `${uvPct}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[8px] sm:text-[9px] font-mono text-[var(--text-secondary)] opacity-70 mb-1.5 sm:mb-2">
                    <span>0 Low</span>
                    <span>6 High</span>
                    <span>11+</span>
                  </div>
                </div>

                <p className="text-[10px] sm:text-xs text-[var(--text-secondary)] font-medium leading-relaxed pt-1.5 sm:pt-2 border-t border-[var(--theme-border)] line-clamp-2 sm:line-clamp-none">
                  {uvAdvice}
                </p>
              </div>
            );
          })()}

          {/* Bento Card 7: Celestial Solar Arc Dome (Sunrise / Sunset) — Spans 2 Columns */}
          <div className="col-span-2 md:col-span-2 lg:col-span-2 glass-panel border border-[var(--theme-border)] rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-lg sm:shadow-xl backdrop-blur-xl flex flex-col justify-between">
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
              let cx = 150, cy = 19, isNightIcon = false;
              if (isDaytime) {
                const t_val = Math.max(0, Math.min(1, (now - sunrise) / (sunset - sunrise)));
                const angle = Math.PI * (1 - t_val);
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
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[var(--text-primary)] font-black text-xs sm:text-sm flex items-center gap-2 tracking-wide">
                      <span>🌅</span> {t.sunrise} & {t.sunset}
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                      {statusBadge}
                    </span>
                  </div>

                  {/* Celestial Arc Graphic */}
                  <div className="relative h-28 sm:h-32 w-full flex items-center justify-center my-1">
                    <svg className="w-full h-full" preserveAspectRatio="xMidYMid meet" viewBox="0 0 300 100">
                      <defs>
                        <linearGradient id="dayArcGlowBento" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#F59E0B" />
                          <stop offset="50%" stopColor="#FBBF24" />
                          <stop offset="100%" stopColor="#EA580C" />
                        </linearGradient>
                        <linearGradient id="dayFillGlowBento" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.22" />
                          <stop offset="80%" stopColor="#F59E0B" stopOpacity="0.03" />
                          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="nightArcGlowBento" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#6366F1" />
                          <stop offset="100%" stopColor="#A855F7" />
                        </linearGradient>
                        <filter id="sunGlowBento" x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur stdDeviation="4" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>

                      {/* Daylight Dome Fill */}
                      <path d="M 30 65 A 120 46 0 0 1 270 65 Z" fill="url(#dayFillGlowBento)" />

                      {/* Horizon Line */}
                      <line x1="15" y1="65" x2="285" y2="65" stroke="var(--theme-border)" strokeWidth="1" strokeDasharray="3 4" opacity="0.8" />

                      {/* Top Arc (Day Sky Path) */}
                      <path 
                        d="M 30 65 A 120 46 0 0 1 270 65" 
                        fill="none" 
                        stroke="url(#dayArcGlowBento)" 
                        strokeWidth="2.5" 
                        strokeDasharray="4 4" 
                      />
                      
                      {/* Bottom Arc (Night Path) */}
                      <path 
                        d="M 270 65 A 120 24 0 0 1 30 65" 
                        fill="none" 
                        stroke="url(#nightArcGlowBento)" 
                        strokeWidth="1.5" 
                        strokeDasharray="3 4" 
                        opacity="0.4" 
                      />

                      {/* Horizon Nodes */}
                      <circle cx="30" cy="65" r="3.5" fill="#F59E0B" stroke="var(--glass-bg)" strokeWidth="1.5" />
                      <circle cx="270" cy="65" r="3.5" fill="#EA580C" stroke="var(--glass-bg)" strokeWidth="1.5" />

                      {/* Active Sun or Moon Orb */}
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
                            <g filter="url(#sunGlowBento)">
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

                  {/* Sunrise / Sunset Stats */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--theme-border)]">
                    <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-[var(--glass-bg)] border border-[var(--theme-border)] shadow-sm">
                      <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-sm shrink-0">🌅</div>
                      <div>
                        <div className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">{t.sunrise}</div>
                        <div className="text-xs sm:text-sm font-black text-[var(--text-primary)]">{srStr}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-[var(--glass-bg)] border border-[var(--theme-border)] shadow-sm">
                      <div className="w-7 h-7 rounded-xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center text-sm shrink-0">🌇</div>
                      <div>
                        <div className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">{t.sunset}</div>
                        <div className="text-xs sm:text-sm font-black text-[var(--text-primary)]">{ssStr}</div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Bento Card 8: Interactive Live Weather Radar — Spans all columns */}
          <div className="col-span-2 md:col-span-2 lg:col-span-4 glass-panel border border-[var(--theme-border)] rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-lg sm:shadow-xl backdrop-blur-xl flex flex-col min-h-[280px] sm:min-h-[420px]">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                <span>🛰️</span>
                <span>{t.radarLive || 'Live Weather Radar'}</span>
              </div>
              <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border border-red-500/30 flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span>{t.liveBadge || 'Live Doppler'}</span>
              </span>
            </div>
            
            <div className="flex-1 rounded-2xl overflow-hidden relative border border-[var(--theme-border)] shadow-inner">
              <div className="absolute inset-0">
                <RadarMap lat={stageData.lat} lng={stageData.lng} />
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. Specialist Meteorological Intelligence Quick-Action Dock ── */}
        <div className="glass-panel border border-[var(--theme-border)] rounded-3xl p-4 sm:p-5 mb-6 shadow-xl backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center md:text-left">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xl shrink-0 shadow-sm">
              ⚡
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black text-[var(--text-primary)]">
                Specialist Weather Intelligence Tools
              </div>
              <div className="text-[11px] text-[var(--text-secondary)] font-medium">
                On-demand diagnostic suites for agriculture, marine navigation, and civic alerts.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
            <button
              onClick={() => setShowDrishtiModal(true)}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              <span>🌿</span>
              <span>Crop Diagnostic</span>
            </button>

            <button
              onClick={() => window.dispatchEvent(new CustomEvent('weathergpt-open-sagar-rakshak'))}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-2xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              <span>🌊</span>
              <span>Marine Radar</span>
            </button>

            <button
              onClick={() => setShowBulletinModal(true)}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-2xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              <span>📜</span>
              <span>Civic Bulletin</span>
            </button>
          </div>
        </div>

        {/* Historical Data Section */}
        <HistoricalAnalytics lat={stageData.lat} lon={stageData.lng} />

        {/* Forecast Accuracy Tracker */}
        <AccuracyTracker locationName={stageData.locationName} language={state.language} />

        {/* Crowdsourced Community Weather Reports */}
        <CommunityReports locationName={stageData.locationName} />

      </div>

      {/* Official Bulletin Modal */}
      {showBulletinModal && (
        <OfficialBulletinModal
          isOpen={showBulletinModal}
          onClose={() => setShowBulletinModal(false)}
          initialLocation={{
            name: stageData.locationName || 'New Delhi',
            district: stageData.district || '',
            state: stageData.state || '',
            lat: stageData.lat || 28.6139,
            lng: stageData.lng || 77.2090,
          }}
          initialCategory={state.userProfile === 'general' ? 'master' : state.userProfile}
          defaultLang={state.language}
        />
      )}

      {/* Mausam-Drishti Crop Diagnostic Modal */}
      {showDrishtiModal && (
        <MausamDrishtiModal
          isOpen={showDrishtiModal}
          onClose={() => setShowDrishtiModal(false)}
          locationData={{
            name: stageData.locationName || 'Bhopal',
            district: stageData.district || '',
            state: stageData.state || '',
            lat: stageData.lat || 23.2599,
            lng: stageData.lng || 77.4126
          }}
          language={state.language}
        />
      )}
    </div>
  );
}


