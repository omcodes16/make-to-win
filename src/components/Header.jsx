import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { LANGUAGES } from '../utils/constants';
import ProfessionModal from './ProfessionModal';
import { FarmerIcon, FishermanIcon, AviationIcon, UrbanIcon } from './HubIcons';
import { UI_TRANSLATIONS } from '../utils/translations';
import { reverseGeocode, getWeather } from '../services/weatherApi';
import { getWeatherInfo, checkSeverity } from '../utils/weatherConditions';
import { sendMessage as sendChatMessage } from '../services/chatApi';
import UserGuideModal from './UserGuideModal';
import AccuracyFeedModal from './AccuracyFeedModal';
import MobileMenuSheet from './MobileMenuSheet';

export default function Header() {
  const { state, dispatch } = useApp();
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [headerLangSearch, setHeaderLangSearch] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [showAccuracyModal, setShowAccuracyModal] = useState(false);
  const [showA11y, setShowA11y] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [savedWeather, setSavedWeather] = useState({}); // { [name]: { temp, icon } }
  const [loadingSaved, setLoadingSaved] = useState(false);
  const savedRef = useRef(null);
  const moreMenuRef = useRef(null);
  const langPickerRef = useRef(null);

  const currentLang = LANGUAGES.find(l => l.code === state.language) || LANGUAGES[0];
  const t = UI_TRANSLATIONS[state.language] || UI_TRANSLATIONS['en'];

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (savedRef.current && !savedRef.current.contains(e.target)) {
        setShowSaved(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
      if (langPickerRef.current && !langPickerRef.current.contains(e.target)) {
        setShowLangPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch mini weather for saved locations when dropdown or mobile sheet opens
  useEffect(() => {
    if ((!showMoreMenu && !isMobileSheetOpen) || state.savedLocations.length === 0) return;
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
  }, [showMoreMenu, isMobileSheetOpen, state.savedLocations]);

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
      const severityCheck = checkSeverity(data, loc.name);
      if (severityCheck && severityCheck.isSevere) {
        dispatch({ type: 'SET_SEVERE_ALERT', payload: severityCheck });
      } else {
        dispatch({ type: 'DISMISS_ALERT' });
      }
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

          const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
          fetch(`${baseUrl}/api/alerts?state=${encodeURIComponent(location.state || location.name)}&district=${encodeURIComponent(location.district || '')}&lat=${lat}&lng=${lng}`).then(r => r.ok ? r.json() : []).then(a => dispatch({ type: 'SET_GOVERNMENT_ALERTS', payload: a })).catch(() => dispatch({ type: 'SET_GOVERNMENT_ALERTS', payload: [] }));
          
          const severityCheck = checkSeverity(weatherData, location.name);
          if (severityCheck && severityCheck.isSevere) {
            dispatch({ type: 'SET_SEVERE_ALERT', payload: severityCheck });
          } else {
            dispatch({ type: 'DISMISS_ALERT' });
          }

          // Let AI introduce the location
          const text = `Give me a quick weather summary for my current live location: ${location.name}`;
          dispatch({ type: 'ADD_USER_MESSAGE', payload: `📍 Current Location: ${location.name}` });
          
          const aiResponse = await sendChatMessage(text, state.language, {
            location: location.name,
            state: location.state,
            ...weatherData,
            conditionLabel: weatherInfo.label,
          }, [], state.userProfile);

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
    <>
      <header className="fixed top-0 left-0 right-0 z-50 header-bar border-b border-[var(--header-border)] pt-2.5 pb-2.5 sm:pt-3 sm:pb-3">
        <div className="mx-auto px-3 sm:px-6 flex items-center justify-between max-w-[1400px] gap-2 sm:gap-4">
          
          {/* Left Corner: Clean App Name (No logo icon) */}
          <div className="flex items-center shrink-0">
            <button 
              className="cursor-pointer flex items-center gap-1.5 group select-none text-left focus:outline-none" 
              onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'chat' })}
              title="WeatherGPT - SIH 2026"
            >
              <span className="font-heading font-black text-lg sm:text-xl tracking-tight text-[var(--text-primary)]">
                Weather<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-blue-500 to-sky-400">GPT</span>
              </span>
              <span className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25">
                SIH '26
              </span>
            </button>
          </div>

          {/* Center (In-Between): Desktop Tabs & Hub Button */}
          <div className="hidden md:flex items-center justify-center gap-2 lg:gap-3 flex-1 max-w-2xl mx-auto min-w-0">
            {/* Desktop Navigation Tabs */}
            <div className="flex items-center rounded-full p-1 glass-panel border border-[var(--glass-border)] shadow-inner shrink-0">
              <button
                onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'chat' })}
                className={`px-3 py-1.5 text-xs lg:text-sm font-bold rounded-full transition-all duration-300 whitespace-nowrap ${
                  state.activeTab === 'chat'
                    ? 'bg-blue-500/20 text-blue-500 shadow-sm border border-blue-400/30'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {t.tabChat}
              </button>
              <button
                onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'stage' })}
                className={`px-3 py-1.5 text-xs lg:text-sm font-bold rounded-full transition-all duration-300 whitespace-nowrap ${
                  state.activeTab === 'stage'
                    ? 'bg-blue-500/20 text-blue-500 shadow-sm border border-blue-400/30'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {t.tabStage}
              </button>
              <button
                onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'alerts' })}
                className={`px-3 py-1.5 text-xs lg:text-sm font-bold rounded-full transition-all duration-300 whitespace-nowrap ${
                  state.activeTab === 'alerts'
                    ? 'bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] border border-red-500/30'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  {t.tabAlerts}
                </span>
              </button>
            </div>

            {/* Hub Button (Cleanly spaced beside tabs without overlapping) */}
            <div 
              onClick={() => setIsHubOpen(true)}
              className="header-hub-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer transition-all shadow-md shrink-0"
              title="Open Profession Advisory Hub"
            >
              {/* Multi-Layer Stack Icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse text-white">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <span className="text-[11px] lg:text-xs font-black tracking-wider uppercase whitespace-nowrap text-white">
                {currentLang.code === 'hi' ? 'हब खोलें' : currentLang.code === 'bn' ? 'হাব খুলুন' : currentLang.code === 'as' ? 'হাব খোলক' : 'Open Hub'}
              </span>
            </div>
          </div>

          {/* Mobile Center: Clean Location Pill */}
          <div className="flex md:hidden items-center justify-center flex-1 min-w-0 mx-1">
            <button 
              onClick={handleLiveLocation}
              disabled={isLocating}
              className="header-live-btn flex items-center gap-1.5 px-2.5 py-1.5 rounded-full font-bold text-xs whitespace-nowrap max-w-[155px] overflow-hidden shadow-sm active:scale-95 transition-all"
              title="Tap to update live GPS location"
            >
              {isLocating ? (
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0"></span>
              ) : (
                <svg className="flex-shrink-0 text-amber-500" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" fill="currentColor" opacity="0.3" />
                </svg>
              )}
              <span className="truncate font-semibold text-[11px] text-[var(--text-primary)]">
                {state.weatherStageData?.locationName || state.currentWeather?.locationName || 'Live Location'}
              </span>
            </button>
          </div>

          {/* Right Corner: Desktop Live Location Pill + Shield + Three Dots + Language */}
          <div className="hidden md:flex items-center justify-end gap-1.5 sm:gap-2.5 shrink-0">
            {/* Live Location Pill */}
            <button 
              onClick={handleLiveLocation}
              disabled={isLocating}
              className="header-live-btn flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full font-bold text-xs whitespace-nowrap max-w-[110px] sm:max-w-[170px] overflow-hidden shadow-sm"
              title="Get Live Location Weather"
            >
              {isLocating ? (
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0"></span>
              ) : (
                <svg className="flex-shrink-0 text-amber-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" fill="currentColor" opacity="0.3" />
                </svg>
              )}
              <span className="truncate font-bold">
                {state.currentWeather?.locationName ? state.currentWeather.locationName : 'Live'}
              </span>
            </button>

            {/* AI Trust / Accuracy Shield Button */}
            <button
              onClick={() => setShowAccuracyModal(true)}
              className="header-icon-btn w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full hover:!text-emerald-500 transition-colors"
              title="AI Trust & Verification"
              aria-label="AI Trust & Verification"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <polyline points="9 12 11 14 15 10" strokeWidth="2" />
              </svg>
            </button>

            {/* Three Dots Menu (Contains Saved Locations, Theme, Reviews, Portal, Accessibility, Guide) */}
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => { setShowMoreMenu(!showMoreMenu); setShowLangPicker(false); }}
                className={`header-icon-btn w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-colors ${
                  showMoreMenu ? '!border-[var(--theme-accent)] !text-[var(--text-primary)] bg-[var(--glass-bg-hover)]' : ''
                }`}
                aria-label="More options"
                title="Menu & Saved Locations"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="1.8" />
                  <circle cx="12" cy="12" r="1.8" />
                  <circle cx="12" cy="19" r="1.8" />
                </svg>
              </button>

              {showMoreMenu && (
                <div className="absolute right-0 top-full mt-2 rounded-2xl py-2 w-[270px] sm:w-[290px] z-[100] glass-panel theme-modal border border-[var(--modal-border)] text-[var(--text-primary)] shadow-[var(--modal-shadow)] overflow-hidden">
                  
                  {/* Saved Locations Section inside 3 Dots */}
                  <div className="px-3 pt-2 pb-2.5 border-b border-[var(--modal-border)]">
                    <div className="flex items-center justify-between mb-1.5 px-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-amber-500"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                        <span>Saved Locations</span>
                      </div>
                      <span className="text-[10px] font-bold text-[var(--text-secondary)]">{state.savedLocations.length}/5</span>
                    </div>

                    {state.savedLocations.length === 0 ? (
                      <p className="text-[11px] text-[var(--text-muted)] py-1.5 px-1 leading-relaxed">
                        No saved locations. Tap the bookmark icon in Weather View to save a city.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                        {state.savedLocations.map((loc) => {
                          const w = savedWeather[loc.name];
                          return (
                            <div key={loc.name} className="flex items-center justify-between p-1.5 rounded-xl hover:bg-[var(--glass-bg-hover)] transition-colors group">
                              <button 
                                onClick={() => { handleSelectSaved(loc); setShowMoreMenu(false); }} 
                                className="flex items-center gap-2 text-left truncate flex-1 min-w-0"
                              >
                                <span className="text-sm shrink-0">{loadingSaved ? '⏳' : (w?.icon || '🌤️')}</span>
                                <span className="text-xs font-semibold text-[var(--text-primary)] truncate">{loc.name}</span>
                                <span className="text-xs font-bold text-[var(--text-secondary)] ml-auto mr-1.5">{loadingSaved ? '...' : (w ? `${w.temp}°` : '--')}</span>
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REMOVE_LOCATION', payload: loc.name }); }}
                                className="text-red-400 hover:text-red-500 p-1 opacity-60 group-hover:opacity-100 transition-opacity"
                                title="Remove"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Theme Switcher */}
                  <div className="px-3 pt-2.5 pb-2.5 border-b border-[var(--modal-border)]">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2 px-1 text-[var(--text-secondary)]">Theme</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { key: 'dark',  label: 'Dark',  icon: '🌙' },
                        { key: 'light', label: 'Light', icon: '☀️' },
                        { key: 'glass', label: 'Glass', icon: '🔮' },
                      ].map(({ key, label, icon }) => (
                        <button
                          key={key}
                          onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SET_UI_THEME', payload: key }); }}
                          className={`flex flex-col items-center gap-1 py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all duration-200 border ${
                            state.uiTheme === key
                              ? 'border-[var(--theme-accent)] shadow-[0_0_12px_var(--focus-glow)] bg-[var(--glass-bg-hover)] text-[var(--theme-accent)]'
                              : 'border-[var(--modal-border)] hover:border-[var(--glass-border-top)] text-[var(--text-muted)]'
                          }`}
                          title={`Switch to ${label} theme`}
                        >
                          <span className="text-sm">{icon}</span>
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* User Reviews */}
                  <button
                    onClick={() => { dispatch({ type: 'SET_ACTIVE_TAB', payload: 'reviews' }); setShowMoreMenu(false); }}
                    className="w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold transition-colors hover:bg-[var(--glass-bg-hover)]"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    <span>User Reviews</span>
                  </button>

                  {/* Authority Portal */}
                  <button
                    onClick={() => { dispatch({ type: 'SET_ACTIVE_TAB', payload: 'manager' }); setShowMoreMenu(false); }}
                    className="w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold transition-colors hover:bg-[var(--glass-bg-hover)]"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <span>Authority Portal</span>
                  </button>

                  {/* Accessibility */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowA11y(!showA11y); }}
                    className="w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold transition-colors hover:bg-[var(--glass-bg-hover)]"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
                      <circle cx="12" cy="12" r="10"/><path d="M12 8a1 1 0 100-2 1 1 0 000 2zm-3 4h6m-5 4h4"/>
                    </svg>
                    <span>Accessibility</span>
                  </button>

                  {/* Inline Accessibility Toggles */}
                  {showA11y && (
                    <div className="mx-3 mb-2 p-2.5 rounded-xl border border-[var(--modal-border)] space-y-2 bg-[var(--glass-bg)]" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-[var(--text-muted)]">Large text</span>
                        <button
                          onClick={() => dispatch({ type: 'TOGGLE_LARGE_TEXT' })}
                          className={`w-9 h-5 rounded-full transition-all relative ${
                            state.isLargeText ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white/15'
                          }`}
                        >
                          <span
                            className={`absolute top-[2px] left-[2px] w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              state.isLargeText ? 'translate-x-4' : ''
                            }`}
                          />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-[var(--text-muted)]">High contrast</span>
                        <button
                          onClick={() => dispatch({ type: 'TOGGLE_HIGH_CONTRAST' })}
                          className={`w-9 h-5 rounded-full transition-all relative ${
                            state.isHighContrast ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white/15'
                          }`}
                        >
                          <span
                            className={`absolute top-[2px] left-[2px] w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              state.isHighContrast ? 'translate-x-4' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="h-px bg-[var(--modal-border)] my-1 mx-2.5" />

                  {/* User Guide */}
                  <button
                    onClick={() => { setShowGuide(true); setShowMoreMenu(false); }}
                    className="w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold transition-colors hover:bg-[var(--glass-bg-hover)]"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-400">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    <span>{currentLang.code === 'hi' ? 'गाइड' : currentLang.code === 'bn' ? 'গাইড' : currentLang.code === 'as' ? 'গাইড' : 'User Guide'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Language Selector Pill */}
            <div className="relative">
              <button
                onClick={() => { setShowLangPicker(!showLangPicker); setShowMoreMenu(false); }}
                className="header-lang-btn px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm"
                title="Change Language"
              >
                {/* Globe Icon */}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                <span className="hidden sm:inline">{currentLang.nativeLabel}</span>
                <span className="sm:hidden uppercase">{currentLang.code}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {showLangPicker && (
                <div 
                  ref={langPickerRef}
                  className="absolute right-0 top-full mt-2 rounded-2xl p-2 w-60 z-[100] glass-panel theme-modal border border-[var(--modal-border)] text-[var(--text-primary)] shadow-[var(--modal-shadow)] backdrop-blur-xl"
                >
                  <div className="p-1 pb-2 border-b border-white/10">
                    <input
                      type="text"
                      value={headerLangSearch}
                      onChange={(e) => setHeaderLangSearch(e.target.value)}
                      placeholder="🔍 Search / भाषा खोजें..."
                      className="w-full bg-white/10 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto py-1 space-y-0.5 custom-scrollbar">
                    {LANGUAGES.filter(l => 
                      l.label.toLowerCase().includes(headerLangSearch.toLowerCase()) ||
                      l.nativeLabel.toLowerCase().includes(headerLangSearch.toLowerCase()) ||
                      l.code.toLowerCase().includes(headerLangSearch.toLowerCase())
                    ).map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          dispatch({ type: 'SET_LANGUAGE', payload: lang.code });
                          setShowLangPicker(false);
                          setHeaderLangSearch('');
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-white/10 flex items-center justify-between ${state.language === lang.code ? 'text-blue-400 bg-blue-500/15 font-bold' : ''}`}
                      >
                        <span>{lang.nativeLabel}</span>
                        <span className="text-[10px] text-white/50 font-normal">({lang.label})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Right: Persona Badge + Hamburger Menu Trigger */}
          <div className="flex md:hidden items-center justify-end gap-2 shrink-0">
            {/* Persona / Profession Avatar Badge */}
            <button
              onClick={() => setIsHubOpen(true)}
              className="persona-badge w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm shrink-0 active:scale-95 transition-transform"
              title={`Profile: ${state.userProfile || 'General'}. Tap to open Advisory Hub.`}
              aria-label="Open Advisory Hub"
            >
              {state.userProfile === 'farmer' ? '🌾' :
               state.userProfile === 'fisherman' ? '🎣' :
               state.userProfile === 'aviation' ? '✈️' :
               state.userProfile === 'urbanPlanning' ? '🏙️' : '🌍'}
            </button>

            {/* Mobile Menu Sheet Trigger Button */}
            <button
              onClick={() => setIsMobileSheetOpen(true)}
              className="header-icon-btn w-8 h-8 flex items-center justify-center rounded-full shrink-0 active:scale-95 transition-all"
              aria-label="Open menu and settings"
              title="Menu & Settings"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Profession selection modal is rendered at the bottom */}

      {/* User Guide Modal */}
      <UserGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />

      {/* Accuracy Feed Modal */}
      {showAccuracyModal && (
        <AccuracyFeedModal 
          locationName={state.currentWeather?.locationName} 
          onClose={() => setShowAccuracyModal(false)} 
        />
      )}

      {/* Mobile Menu Bottom Sheet */}
      <MobileMenuSheet
        isOpen={isMobileSheetOpen}
        onClose={() => setIsMobileSheetOpen(false)}
        currentLang={currentLang}
        languages={LANGUAGES}
        onSelectLanguage={(code) => dispatch({ type: 'SET_LANGUAGE', payload: code })}
        currentTheme={state.uiTheme}
        onSelectTheme={(themeKey) => dispatch({ type: 'SET_UI_THEME', payload: themeKey })}
        userProfile={state.userProfile}
        onOpenHub={() => setIsHubOpen(true)}
        savedLocations={state.savedLocations}
        savedWeather={savedWeather}
        loadingSaved={loadingSaved}
        onSelectSaved={handleSelectSaved}
        onRemoveSaved={(name) => dispatch({ type: 'REMOVE_LOCATION', payload: name })}
        onOpenAccuracy={() => setShowAccuracyModal(true)}
        isLargeText={state.isLargeText}
        onToggleLargeText={() => dispatch({ type: 'TOGGLE_LARGE_TEXT' })}
        isHighContrast={state.isHighContrast}
        onToggleHighContrast={() => dispatch({ type: 'TOGGLE_HIGH_CONTRAST' })}
        onOpenGuide={() => setShowGuide(true)}
        onOpenReviews={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'reviews' })}
        onOpenManager={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'manager' })}
      />

      {/* Mobile Expanded Full-Width Bottom Navigation Bar (5 Balanced Tabs) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 mobile-bottom-bar safe-pb shadow-[0_-4px_24px_rgba(0,0,0,0.20)]">
        <nav className="w-full grid grid-cols-5 px-1 py-1.5 gap-0.5 items-center">
          {/* Tab 1: Chat */}
          <button
            onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'chat' })}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all duration-200 gap-0.5 ${
              state.activeTab === 'chat'
                ? 'bottom-tab-active font-bold text-blue-400'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] opacity-75 hover:opacity-100'
            }`}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
              <path d="M8 12h.01M12 12h.01M16 12h.01" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="text-[10px] tracking-tight font-semibold">Chat</span>
          </button>

          {/* Tab 2: Forecast / Weather Stage */}
          <button
            onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'stage' })}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all duration-200 gap-0.5 ${
              state.activeTab === 'stage'
                ? 'bottom-tab-active font-bold text-blue-400'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] opacity-75 hover:opacity-100'
            }`}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
              <circle cx="12" cy="12" r="4"/>
            </svg>
            <span className="text-[10px] tracking-tight font-semibold">Forecast</span>
          </button>

          {/* Tab 3: Advisory Hub (Center featured pill) */}
          <button
            onClick={() => setIsHubOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-0.5 rounded-xl gap-0.5 active:scale-95 transition-all text-indigo-400 font-bold"
            title="Open Profession Advisory Hub"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/30">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="text-[9px] tracking-tight font-black uppercase text-indigo-400">Hub</span>
          </button>

          {/* Tab 4: Alerts */}
          <button
            onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'alerts' })}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all duration-200 gap-0.5 relative ${
              state.activeTab === 'alerts'
                ? 'bottom-tab-active font-bold text-red-400'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] opacity-75 hover:opacity-100'
            }`}
          >
            <div className="relative">
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 border border-[var(--header-bg)]"></span>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </div>
            <span className="text-[10px] tracking-tight font-semibold">Alerts</span>
          </button>

          {/* Tab 5: SOS Emergency */}
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('weathergpt-open-sos'));
            }}
            className="flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl bottom-tab-sos gap-0.5 active:scale-95 transition-all duration-200"
            title="Emergency SOS"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span className="text-[10px] tracking-tight font-bold">SOS</span>
          </button>
        </nav>
      </div>

      {isHubOpen && (
        <ProfessionModal
          profile={state.userProfile}
          lat={state.weatherStageData?.lat || state.currentWeather?.lat || 28.6139}
          lng={state.weatherStageData?.lng || state.currentWeather?.lng || 77.2090}
          locationName={state.weatherStageData?.locationName || state.currentWeather?.locationName || 'New Delhi (Default)'}
          weather={state.weatherStageData?.weather || state.currentWeather || {}}
          onClose={() => setIsHubOpen(false)}
        />
      )}
    </>
  );
}
