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

export default function Header() {
  const { state, dispatch } = useApp();
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [showAccuracyModal, setShowAccuracyModal] = useState(false);
  const [showA11y, setShowA11y] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [savedWeather, setSavedWeather] = useState({}); // { [name]: { temp, icon } }
  const [loadingSaved, setLoadingSaved] = useState(false);
  const savedRef = useRef(null);
  const moreMenuRef = useRef(null);

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
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/60 backdrop-blur-xl border-b border-white/10 pt-3 pb-3">
        <div className="mx-auto px-3 sm:px-6 flex items-center justify-between max-w-[1400px]">
          
          {/* Left: App name & Logo */}
          <div className="flex items-center gap-2">
            <img src="/logo_new.jpg" alt="SIH Code Matrix Logo" className="w-10 h-10 object-cover rounded-md flex-shrink-0 shadow-[0_0_15px_rgba(255,255,255,0.3)] bg-white" />
            <h1 className="font-heading font-semibold text-base tracking-tight text-white drop-shadow-md hidden sm:block">
              WeatherGPT
            </h1>
            
            <button 
              onClick={handleLiveLocation}
              disabled={isLocating}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-full bg-blue-500/20 hover:bg-blue-500/40 border border-blue-400/30 transition-colors text-blue-100 text-xs whitespace-nowrap max-w-[120px] sm:max-w-[180px] overflow-hidden"
            >
              {isLocating ? (
                <span className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin flex-shrink-0"></span>
              ) : (
                <svg className="flex-shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              )}
              <span className="truncate">
                {state.currentWeather?.locationName ? state.currentWeather.locationName : 'Live'}
              </span>
            </button>
          </div>

          {/* Center: Tabs — desktop only */}
          <div className="hidden md:flex justify-center flex-1 max-w-md mx-4">
            <div className="flex w-full rounded-full p-1 glass-panel border border-white/10 shadow-inner">
              <button
                onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'chat' })}
                className={`flex-1 px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-300 whitespace-nowrap ${
                  state.activeTab === 'chat'
                    ? 'bg-white/15 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)] border border-white/10'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {t.tabChat}
              </button>
              <button
                onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'stage' })}
                className={`flex-1 px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-300 whitespace-nowrap ${
                  state.activeTab === 'stage'
                    ? 'bg-white/15 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)] border border-white/10'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {t.tabStage}
              </button>
              <button
                onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'alerts' })}
                className={`flex-1 px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-300 whitespace-nowrap ${
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
          <div className="flex items-center justify-end gap-1.5 sm:gap-3">
            {/* Accessibility toggle */}
              {(() => {
                return (
                  <div 
                    onClick={() => setIsHubOpen(true)}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-400/30 rounded-full cursor-pointer hover:bg-white/10 hover:border-blue-400/50 transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-400 animate-pulse sm:w-4 sm:h-4">
                      <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                      <polyline points="2 17 12 22 22 17"></polyline>
                      <polyline points="2 12 12 17 22 12"></polyline>
                    </svg>
                    <span className="text-white text-[10px] sm:text-xs font-bold tracking-wide uppercase whitespace-nowrap">
                      {currentLang.code === 'hi' ? 'हब खोलें' : currentLang.code === 'bn' ? 'হাব খুলুন' : currentLang.code === 'as' ? 'হাব খোলক' : 'Open Hub'}
                    </span>
                  </div>
                );
              })()}

              {/* AI Trust / Accuracy Modal Button */}
              <button
                onClick={() => setShowAccuracyModal(true)}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-colors border text-white/70 glass-panel border-white/10 hover:bg-white/10 hover:text-green-400"
                title="AI Trust & Accuracy"
                aria-label="AI Trust & Accuracy"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </button>
  
              {/* Saved Locations bookmark */}
            <div className="relative" ref={savedRef}>
              <button
                onClick={() => { setShowSaved(!showSaved); setShowLangPicker(false); setShowMoreMenu(false); }}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-colors border ${
                  showSaved || state.savedLocations.length > 0
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20'
                    : 'text-white/70 glass-panel border-white/10 hover:bg-white/10'
                }`}
                aria-label="Saved locations"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill={state.savedLocations.length > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
              </button>

              {showSaved && (
                <div className="absolute right-0 top-full mt-2 rounded-2xl py-3 w-[260px] sm:w-[280px] z-[100] glass-panel !bg-[#1a103c]/95  border border-white/10 text-white shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
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
                      <p className="text-white/40 text-xs leading-relaxed">No saved locations yet. Search a city and tap the bookmark icon.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {state.savedLocations.map((loc) => {
                        const w = savedWeather[loc.name];
                        return (
                          <div key={loc.name} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 transition-colors group">
                            <button onClick={() => handleSelectSaved(loc)} className="flex-1 flex items-center gap-3 text-left min-w-0">
                              <span className="text-xl shrink-0">{loadingSaved ? '⏳' : (w?.icon || '🌤️')}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-white/90 truncate">{loc.name}</div>
                              </div>
                              <span className="text-sm font-semibold text-white/70 shrink-0">{loadingSaved ? '...' : (w ? `${w.temp}°` : '--')}</span>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REMOVE_LOCATION', payload: loc.name }); }}
                              className="w-6 h-6 flex items-center justify-center rounded-full text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
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

            {/* More Menu Dropdown */}
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => { setShowMoreMenu(!showMoreMenu); setShowSaved(false); setShowLangPicker(false); }}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-colors border ${
                  showMoreMenu
                    ? 'text-white glass-panel border-white/10'
                    : 'text-white/70 glass-panel border-white/10 hover:bg-white/10'
                }`}
                aria-label="More options"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="5" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>

              {showMoreMenu && (
                <div className="absolute right-0 top-full mt-2 rounded-2xl py-2 w-[220px] z-[100] glass-panel !bg-[#1a103c]/95  border border-white/10 text-white shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                  
                  <button
                    onClick={() => { dispatch({ type: 'SET_ACTIVE_TAB', payload: 'reviews' }); setShowMoreMenu(false); }}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:glass-panel"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    <span>User Reviews</span>
                  </button>

                  <button
                    onClick={() => { dispatch({ type: 'SET_ACTIVE_TAB', payload: 'manager' }); setShowMoreMenu(false); }}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:glass-panel"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <span>Authority Portal</span>
                  </button>
                  
                  <div className="h-px bg-white/10 my-1 mx-3" />

                  <button
                    onClick={(e) => { e.stopPropagation(); setShowA11y(!showA11y); }}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:glass-panel"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-300">
                      <circle cx="12" cy="12" r="10"/><path d="M12 8a1 1 0 100-2 1 1 0 000 2zm-3 4h6m-5 4h4"/>
                    </svg>
                    <span>Accessibility</span>
                  </button>

                  {/* Inline Accessibility Toggles */}
                  {showA11y && (
                    <div className="mx-4 mb-3 p-3 bg-white/10 rounded-lg border border-white/10 space-y-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/80 font-medium">Large text</span>
                        <button
                          onClick={() => dispatch({ type: 'TOGGLE_LARGE_TEXT' })}
                          className={`w-10 h-5 rounded-full transition-all relative ${
                            state.isLargeText ? 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]' : 'bg-white/15'
                          }`}
                        >
                          <span
                            className={`absolute top-[2px] left-[2px] w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              state.isLargeText ? 'translate-x-5' : ''
                            }`}
                          />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/80 font-medium">High contrast</span>
                        <button
                          onClick={() => dispatch({ type: 'TOGGLE_HIGH_CONTRAST' })}
                          className={`w-10 h-5 rounded-full transition-all relative ${
                            state.isHighContrast ? 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]' : 'bg-white/15'
                          }`}
                        >
                          <span
                            className={`absolute top-[2px] left-[2px] w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              state.isHighContrast ? 'translate-x-5' : ''
                            }`}
                          />
                        </button>
                    </div>
                  </div>
                  )}



                  <div className="h-px bg-white/10 my-1 mx-3" />

                  <button
                    onClick={() => { setShowGuide(true); setShowMoreMenu(false); }}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:glass-panel"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-300">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    <span>{currentLang.code === 'hi' ? 'गाइड' : currentLang.code === 'bn' ? 'গাইড' : currentLang.code === 'as' ? 'গাইড' : 'User Guide'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Language pill */}
            <div className="relative">
              <button
                onClick={() => { setShowLangPicker(!showLangPicker); setShowSaved(false); setShowMoreMenu(false); }}
                className="px-2.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 bg-white/10 hover:bg-white/10 text-white border border-white/10"
              >
                <span className="hidden sm:inline">{currentLang.nativeLabel}</span>
                <span className="sm:hidden uppercase">{currentLang.code}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {showLangPicker && (
                <div className="absolute right-0 top-full mt-2 rounded-xl py-1 min-w-[140px] z-[100] glass-panel !bg-[#1a103c]/95  border border-white/10 text-white shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { dispatch({ type: 'SET_LANGUAGE', payload: lang.code }); setShowLangPicker(false); }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-white/10 ${state.language === lang.code ? 'text-blue-400 font-medium' : ''}`}
                    >
                      {lang.nativeLabel}
                    </button>
                  ))}
                </div>
              )}
            </div>
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

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/60 backdrop-blur-xl border-t border-white/10 flex safe-pb">
        <button
          onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'chat' })}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${state.activeTab === 'chat' ? 'text-blue-400' : 'text-white/40'}`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          <span className="text-[10px] font-semibold">{t.tabChat}</span>
        </button>
        <button
          onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'stage' })}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${state.activeTab === 'stage' ? 'text-blue-400' : 'text-white/40'}`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          <span className="text-[10px] font-semibold">{t.tabStage}</span>
        </button>
        <button
          onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'alerts' })}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors relative ${state.activeTab === 'alerts' ? 'text-red-400' : 'text-white/40'}`}
        >
          <span className="absolute top-2 right-[calc(50%-14px)] w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <span className="text-[10px] font-semibold">{t.tabAlerts}</span>
        </button>
      </nav>

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
