import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import SkyBand from './SkyBand';
import Header from './Header';
import WeatherScene from './WeatherScene';
import WeatherCharts from './WeatherCharts';
import RadarMap from './RadarMap';
import { geocodeLocation, searchLocationSuggestions, getWeather } from '../services/weatherApi';
import { getWeatherInfo } from '../utils/weatherConditions';
import { UI_TRANSLATIONS } from '../utils/translations';

export default function WeatherStage() {
  const { state, dispatch } = useApp();
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const t = UI_TRANSLATIONS[state.language] || UI_TRANSLATIONS['en'];
  const stageData = state.weatherStageData;

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
    setErrorMsg('');
    try {
      const weather = await getWeather(loc.lat, loc.lng);
      dispatch({ 
        type: 'SET_WEATHER_STAGE_DATA', 
        payload: { locationName: loc.name, lat: loc.lat, lng: loc.lng, weather } 
      });
      // Fetch manager alerts for this location (radius + state + district matching)
      const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
      fetch(`${baseUrl}/api/alerts?state=${encodeURIComponent(loc.state || loc.name)}&district=${encodeURIComponent(loc.district || '')}&lat=${loc.lat}&lng=${loc.lng}`)
        .then(r => r.ok ? r.json() : [])
        .then(a => dispatch({ type: 'SET_GOVERNMENT_ALERTS', payload: Array.isArray(a) ? a : [] }))
        .catch(() => {});
    } catch (err) {
      setErrorMsg(t.fetchFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchInput.trim()) return;
    
    setIsLoading(true);
    setShowSuggestions(false);
    setErrorMsg('');
    try {
      let loc = suggestions.length > 0 ? suggestions[0] : null;
      if (!loc) {
        loc = await geocodeLocation(searchInput, state.language);
      }
      if (!loc) {
        setErrorMsg(t.unknownLocation);
        setIsLoading(false);
        return;
      }
      
      const weather = await getWeather(loc.lat, loc.lng);
      dispatch({ 
        type: 'SET_WEATHER_STAGE_DATA', 
        payload: { locationName: loc.name, lat: loc.lat, lng: loc.lng, weather } 
      });
      setSearchInput('');
    } catch (err) {
      setErrorMsg(t.fetchFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg(t.fallbackLocation);
      return;
    }
    
    setIsLoading(true);
    setErrorMsg('');
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          let locName = t.fallbackName;
          
          try {
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            const data = await res.json();
            if (data.city || data.locality || data.principalSubdivision) {
              locName = data.city || data.locality || data.principalSubdivision;
            }
          } catch (e) {
            console.error('Reverse geocoding failed', e);
          }
          
          const weather = await getWeather(latitude, longitude);
          dispatch({ 
            type: 'SET_WEATHER_STAGE_DATA', 
            payload: { locationName: locName, lat: latitude, lng: longitude, weather } 
          });
        } catch (err) {
          setErrorMsg(t.fetchFailed);
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        setErrorMsg(t.fallbackLocation);
        setIsLoading(false);
      }
    );
  };

  const weatherInfo = stageData?.weather ? getWeatherInfo(stageData.weather.weatherCode, state.language) : null;

  return (
    <div className="min-h-[100dvh] bg-base flex flex-col">
      <SkyBand overrideCondition={weatherInfo?.condition || 'clear'} overrideLoading={isLoading} />
      <Header />
      
      <main className="flex-1 pt-[96px] pb-[72px] flex flex-col relative z-10">
        
        {/* Search Bar */}
        <div className="px-4 mb-4 relative z-50">
          <form onSubmit={handleSearch} className="flex gap-2 relative">
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchInput}
              onChange={handleSearchChange}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              className="flex-1 bg-white border border-cloud rounded-full px-4 py-2 text-sm text-dusk focus:outline-none focus:border-teal shadow-sm"
            />
            <button
              type="button"
              onClick={handleGeolocation}
              className="w-10 h-10 bg-white border border-cloud rounded-full flex items-center justify-center text-teal hover:bg-cloud/50 transition-colors shadow-sm"
              aria-label="Use current location"
              title="Use current location"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11"/>
              </svg>
            </button>
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-50 w-full left-0 top-full mt-2 bg-white border border-cloud rounded-2xl shadow-xl overflow-hidden max-h-64 overflow-y-auto">
                {suggestions.map((loc, idx) => (
                  <li 
                    key={idx} 
                    onMouseDown={() => handleSelectLocation(loc)}
                    className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-cloud/50 last:border-0 transition-colors text-left flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                  >
                    <div className="text-dusk font-medium text-sm">{loc.name}</div>
                    <div className="text-clay text-[10px] sm:text-xs">
                      {[loc.district, loc.state, loc.country].filter(Boolean).join(', ')}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </form>
          {errorMsg && (
            <div className="mt-2 text-xs text-clay bg-clay/10 px-3 py-2 rounded-lg">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Animated Scene Area & Main Info */}
        <div className="flex-1 flex flex-col relative min-h-[45vh]">
          {/* Background Scene */}
          <div className="absolute inset-0 -mx-4 -top-4 rounded-b-3xl overflow-hidden shadow-sm border-b border-cloud">
            <WeatherScene 
              condition={weatherInfo?.condition || 'clear'} 
              weatherCode={stageData?.weather?.weatherCode} 
            />
          </div>

          {/* Overlay Info */}
          <div className="relative z-20 px-6 pt-8 pb-12 text-white flex-1 flex flex-col justify-end">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-16 w-32 bg-white/20 rounded mb-2"></div>
                <div className="h-6 w-48 bg-white/20 rounded"></div>
              </div>
            ) : stageData ? (
              <>
                <div className="flex items-center gap-4 mb-2">
                  <div className="text-7xl font-heading font-medium tracking-tighter drop-shadow-md">
                    {stageData.weather.temperature}°
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-medium drop-shadow-md">
                      {weatherInfo?.icon} {weatherInfo?.label}
                    </span>
                    <span className="text-white/90 drop-shadow-md font-medium text-lg">
                      {stageData.locationName}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-white/90 text-lg drop-shadow-md">
                {t.searchPrompt}
              </div>
            )}
          </div>
        </div>

        {/* Charts Section */}
        {stageData && !isLoading && (
          <WeatherCharts weather={stageData.weather} lat={stageData.lat} lng={stageData.lng} />
        )}
        
      </main>
    </div>
  );
}
