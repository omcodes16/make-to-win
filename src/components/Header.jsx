import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { LANGUAGES } from '../utils/constants';
import AccessibilityPanel from './AccessibilityPanel';
import { UI_TRANSLATIONS } from '../utils/translations';
import { reverseGeocode, getWeather } from '../services/weatherApi';
import { getWeatherInfo, checkSeverity } from '../utils/weatherConditions';
import { sendMessage as sendChatMessage } from '../services/chatApi';

export default function Header() {
  const { state, dispatch } = useApp();
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showA11y, setShowA11y] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [savedWeather, setSavedWeather] = useState({}); // { [name]: { temp, icon } }
  const [loadingSaved, setLoadingSaved] = useState(false);
  const savedRef = useRef(null);

  const currentLang = LANGUAGES.find(l => l.code === state.language) || LANGUAGES[0];
  const t = UI_TRANSLATIONS[state.language] || UI_TRANSLATIONS['en'];

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (savedRef.current && !savedRef.current.contains(e.target)) {
        setShowSaved(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch mini weather for saved locations when dropdown opens
  useEffect(() => {
    if (!showSaved || state.savedLocations.length === 0) return;
    setLoadingSaved(true);
    Promise.all(
      state.savedLocations.map(async (loc) => {
        try {
          const data = await getWeather(loc.lat, loc.lng);
          const info = getWeatherInfo(data.weatherCode);
          return { name: loc.name, temp: data.temperature, icon: info.icon };
        } catch {
          return { name: loc.name, temp: '--', icon: '❓' };
        }
      })
    ).then((results) => {
      const map = {};
      results.forEach(r => { map[r.name] = { temp: r.temp, icon: r.icon }; });
      setSavedWeather(map);
      setLoadingSaved(false);
    });
  }, [showSaved, state.savedLocations]);

  // Handle tapping a saved location — switch to Weather View
  const handleSelectSaved = async (loc) => {
    setShowSaved(false);
    dispatch({ type: 'SET_ACTIVE_TAB', payload: 'stage' });
    try {
      const data = await getWeather(loc.lat, loc.lng);
      dispatch({
        type: 'SET_WEATHER_STAGE_DATA',
        payload: { locationName: loc.name, lat: loc.lat, lng: loc.lng, weather: data }
      });
    } catch (err) {
      console.error('Failed to load saved location weather:', err);
    }
  };

  const handleLiveLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          dispatch({ type: 'SET_LOADING', payload: true });
          
          // Reverse geocode
          const location = await reverseGeocode(lat, lng);
          
          // Get weather
          const weatherData = await getWeather(lat, lng);
          const weatherInfo = getWeatherInfo(weatherData.weatherCode);
          
          dispatch({ type: 'SET_WEATHER_CONDITION', payload: weatherInfo.condition });
          dispatch({
            type: 'SET_CURRENT_WEATHER',
            payload: { ...weatherData, locationName: location.name, lat, lng },
          });
          // Also update the Weather Stage and Alerts screen
          dispatch({
            type: 'SET_WEATHER_STAGE_DATA',
            payload: { locationName: location.name, lat, lng, weather: weatherData }
          });

          const severityCheck = checkSeverity(weatherData, location.name);
          if (severityCheck && severityCheck.isSevere) {
            dispatch({ type: 'SET_SEVERE_ALERT', payload: severityCheck });
          }

          // Let AI introduce the location
          const text = `Give me a quick weather summary for my current live location: ${location.name}`;
          dispatch({ type: 'ADD_USER_MESSAGE', payload: `📍 Current Location: ${location.name}` });
          
          const aiResponse = await sendChatMessage(text, state.language, {
            location: location.name,
            state: location.state,
            ...weatherData,
            conditionLabel: weatherInfo.label,
          });

          dispatch({
            type: 'ADD_ASSISTANT_MESSAGE',
            payload: {
              answer: aiResponse.answer,
              followUp: aiResponse.followUp,
              relevantStat: aiResponse.relevantStat || '',
              advisory: aiResponse.advisory || (severityCheck ? severityCheck.summary : ''),
              severity: aiResponse.severity || (severityCheck?.isSevere ? 'severe' : 'none'),
              weatherData: {
                temperature: weatherData.temperature,
                feelsLike: weatherData.feelsLike,
                humidity: weatherData.humidity,
                windSpeed: weatherData.windSpeed,
                precipitation: weatherData.precipitation,
                weatherCode: weatherData.weatherCode,
                uvIndex: weatherData.uvIndex,
                visibility: weatherData.visibility,
                locationName: location.name,
              },
            },
          });
          
        } catch (err) {
          console.error("Live location error:", err);
          dispatch({ type: 'ADD_ERROR_MESSAGE', payload: "Failed to get weather for your live location." });
        } finally {
          setIsLocating(false);
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      },
      (err) => {
        console.error(err);
        alert("Unable to retrieve your location. Please check browser permissions.");
        setIsLocating(false);
      }
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0c1a]/80 backdrop-blur-md border-b border-white/10 pt-3 pb-3">
      <div className="mx-auto px-6 flex items-center justify-between max-w-[1400px]">
        
        {/* Left: App name */}
        <div className="flex items-center gap-3 w-1/3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <span className="text-white text-xs font-bold">W</span>
          </div>
          <h1 className="font-heading font-semibold text-lg tracking-tight text-white drop-shadow-md hidden sm:block">
            WeatherGPT
          </h1>
          
          <button 
            onClick={handleLiveLocation}
            disabled={isLocating}
            className="ml-2 flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-500/20 hover:bg-blue-500/40 border border-blue-400/30 transition-colors text-blue-100 text-xs sm:text-sm whitespace-nowrap"
          >
            {isLocating ? (
              <span className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            )}
            {state.currentWeather?.locationName ? state.currentWeather.locationName : 'Live Location'}
          </button>
        </div>

        {/* Center: Dual Mode Tabs */}
        <div className="flex justify-center flex-1 max-w-md mx-4">
          <div className="flex w-full rounded-full p-1 bg-white/5 border border-white/10 shadow-inner overflow-x-auto scrollbar-hide">
            <button
              onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'chat' })}
              className={`flex-1 px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all duration-300 whitespace-nowrap ${
                state.activeTab === 'chat'
                  ? 'bg-white/15 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)] border border-white/20'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {t.tabChat}
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'stage' })}
              className={`flex-1 px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all duration-300 whitespace-nowrap ${
                state.activeTab === 'stage'
                  ? 'bg-white/15 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)] border border-white/20'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {t.tabStage}
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'alerts' })}
              className={`flex-1 px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all duration-300 whitespace-nowrap ${
                state.activeTab === 'alerts'
                  ? 'bg-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)] border border-red-500/30'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <span className="flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                {t.tabAlerts}
              </span>
            </button>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center justify-end gap-3 w-1/3">
          {/* Accessibility toggle */}
          <button
            onClick={() => setShowA11y(!showA11y)}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-colors text-white/70 hover:bg-white/10 bg-white/5 border border-white/10"
            aria-label="Accessibility settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8a1 1 0 100-2 1 1 0 000 2zm-3 4h6m-5 4h4"/>
            </svg>
          </button>

          {/* Saved Locations bookmark */}
          <div className="relative" ref={savedRef}>
            <button
              onClick={() => { setShowSaved(!showSaved); setShowLangPicker(false); }}
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors border ${
                showSaved || state.savedLocations.length > 0
                  ? 'text-amber-400 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20'
                  : 'text-white/70 bg-white/5 border-white/10 hover:bg-white/10'
              }`}
              aria-label="Saved locations"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={state.savedLocations.length > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>

            {showSaved && (
              <div className="absolute right-0 top-full mt-2 rounded-2xl shadow-[0_0_25px_rgba(0,0,0,0.6)] py-3 w-[280px] z-50 border bg-[#1a1c29] border-white/10 text-white">
                <div className="px-4 pb-2 mb-2 border-b border-white/10 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" className="text-amber-400"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                  <span className="text-sm font-semibold text-white/90">Saved Locations</span>
                  {state.savedLocations.length > 0 && (
                    <span className="ml-auto text-xs text-white/40">{state.savedLocations.length}/5</span>
                  )}
                </div>

                {state.savedLocations.length === 0 ? (
                  <div className="px-4 py-4 text-center">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20 mx-auto mb-3"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                    <p className="text-white/40 text-xs leading-relaxed">No saved locations yet — search a city in Weather View and tap the bookmark icon to save it here.</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {state.savedLocations.map((loc) => {
                      const w = savedWeather[loc.name];
                      return (
                        <div key={loc.name} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors group">
                          <button
                            onClick={() => handleSelectSaved(loc)}
                            className="flex-1 flex items-center gap-3 text-left min-w-0"
                          >
                            <span className="text-xl shrink-0">{loadingSaved ? '⏳' : (w?.icon || '🌤️')}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-white/90 truncate">{loc.name}</div>
                            </div>
                            <span className="text-sm font-semibold text-white/70 shrink-0">{loadingSaved ? '...' : (w ? `${w.temp}°` : '--')}</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REMOVE_LOCATION', payload: loc.name }); }}
                            className="w-6 h-6 flex items-center justify-center rounded-full text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                            aria-label={`Remove ${loc.name}`}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Language pill */}
          <div className="relative">
            <button
              onClick={() => { setShowLangPicker(!showLangPicker); setShowSaved(false); }}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 bg-white/5 hover:bg-white/10 text-white border border-white/10"
              aria-label={`Language: ${currentLang.label}`}
            >
              {currentLang.nativeLabel}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            {showLangPicker && (
              <div className="absolute right-0 top-full mt-2 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.5)] py-1 min-w-[140px] z-50 border bg-[#1a1c29] border-white/10 text-white">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      dispatch({ type: 'SET_LANGUAGE', payload: lang.code });
                      setShowLangPicker(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-white/10 ${
                      state.language === lang.code 
                        ? 'text-blue-400 font-medium' 
                        : ''
                    }`}
                  >
                    {lang.nativeLabel}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Profile Icon Placeholder */}
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 text-white border border-white/10">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
        </div>
      </div>

      {/* Accessibility panel slides down */}
      {showA11y && <AccessibilityPanel onClose={() => setShowA11y(false)} />}
    </header>
  );
}
