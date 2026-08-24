import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import SkyBand from './SkyBand';
import Header from './Header';
import OfflineBanner from './OfflineBanner';
import WeatherScene from './WeatherScene';
import WeatherCharts from './WeatherCharts';
import RadarMap from './RadarMap';
import { geocodeLocation, getWeather } from '../services/weatherApi';
import { getWeatherInfo } from '../utils/weatherConditions';
import { UI_TRANSLATIONS } from '../utils/translations';

export default function WeatherStage() {
  const { state, dispatch } = useApp();
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const t = UI_TRANSLATIONS[state.language] || UI_TRANSLATIONS['en'];
  const stageData = state.weatherStageData;

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchInput.trim()) return;
    
    setIsLoading(true);
    setErrorMsg('');
    try {
      const loc = await geocodeLocation(searchInput, state.language);
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
    <div className="min-h-screen bg-base flex flex-col">
      <SkyBand overrideCondition={weatherInfo?.condition || 'clear'} overrideLoading={isLoading} />
      <Header />
      <OfflineBanner />

      <main className="flex-1 pt-[96px] pb-[72px] flex flex-col relative z-10">
        
        {/* Search Bar */}
        <div className="px-4 mb-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
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
