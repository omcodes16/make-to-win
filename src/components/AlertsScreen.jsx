import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { getTheme } from '../utils/themes';
import { getWeatherInfo } from '../utils/weatherConditions';
import { getSeasonalContext } from '../utils/climateSeasonal';
import { EXTRA_I18N } from '../utils/translationsExtra';
import { FEATURE_I18N } from '../utils/featureTranslations';
import Header from './Header';

export default function AlertsScreen() {
  const { state } = useApp();
  
  // Derive active location and weather data
  const stageData = state.weatherStageData || {};
  const locationName = stageData.locationName || '';
  const weather = stageData.weather || state.currentWeather;

  const lang = state.language;
  const ft = FEATURE_I18N[lang] || FEATURE_I18N.en;
  const ex = EXTRA_I18N[lang] || EXTRA_I18N.en;

  // Compute seasonal context
  const currentMonthIndex = new Date().getMonth();
  const seasonalCtx = getSeasonalContext(locationName, currentMonthIndex, lang);
  const weatherInfo = weather ? getWeatherInfo(weather) : null;
  const theme = weather ? getTheme(weather, weatherInfo) : getTheme({ temperature: 20 }, { key: 'severeStorm' });
  
  const [news, setNews] = useState([]);
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [newsFilter, setNewsFilter] = useState('All');

  // Fetch real-time news
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/news`)
      .then(res => res.json())
      .then(data => {
        if (data && data.news) {
          setNews(data.news);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingNews(false));
  }, []);

  // Compute live alerts based on actual location data
  const computeAlerts = () => {
    if (!weather || !weather.daily) {
      return [{ id: 'no-data', type: 'info', title: 'No Location Selected', desc: 'Please search for a city in the Weather View to see local alerts.', level: 'Info', prob: '0%', rain: '0', window: 'N/A', impact: 'Low' }];
    }
    
    const locName = locationName;
    const alerts = [];

    // 1. Heavy Rain / Flood Warning
    const precipArr = weather.daily.precipitationSum || weather.daily.precipProbMax || [0];
    const maxRain = Math.max(...precipArr.slice(0, 3));
    const isProb = !weather.daily.precipitationSum;
    const severeThreshold = isProb ? 80 : 40;
    const cautionThreshold = isProb ? 50 : 15;
    
    const probValue = weather.daily.precipitationProbabilityMax?.[0] || (isProb ? maxRain : (maxRain > 10 ? 90 : Math.round((maxRain/40)*100)));
    const rainRange = isProb ? 'Unknown' : `${Math.floor(maxRain * 0.8)}-${Math.ceil(maxRain * 1.2)}`;

    if (maxRain > severeThreshold) {
      alerts.push({
        id: 'rain',
        title: `Heavy Rain & Flood Risk in ${locName}`,
        desc: isProb ? `High probability (${maxRain}%) of severe rain.` : `High precipitation (${maxRain}mm) expected. Low-lying areas may face waterlogging.`,
        precaution: `Avoid unnecessary travel. Move livestock to higher ground and secure outdoor equipment.`,
        level: 'Severe', prob: `${probValue}%`, rain: rainRange, window: 'Next 12 hrs', impact: 'High'
      });
    } else if (maxRain > cautionThreshold) {
      alerts.push({
        id: 'rain-mod',
        title: `Moderate Rain in ${locName}`,
        desc: isProb ? `Moderate chance (${maxRain}%) of rain.` : `Steady rainfall expected (${maxRain}mm).`,
        precaution: `Roads may be slippery. If spraying crops, consider delaying until the rain clears.`,
        level: 'Caution', prob: `${probValue}%`, rain: rainRange, window: 'Next 24 hrs', impact: 'Moderate'
      });
    }

    // 2. High Wind
    if (weather.windSpeed > 45) {
      alerts.push({
        id: 'wind',
        title: `High Wind Warning for ${locName}`,
        desc: `Dangerous wind gusts up to ${weather.windSpeed} km/h detected.`,
        precaution: `Secure loose objects, close all windows, and avoid parking or walking under large trees.`,
        level: 'Severe', prob: '85%', rain: '0', window: 'Next 6 hrs', impact: 'High'
      });
    }

    // 3. Poor Visibility (Fog/Smog)
    if (weather.visibility < 2000) {
      alerts.push({
        id: 'vis',
        title: `Poor Visibility in ${locName}`,
        desc: `Visibility is severely reduced to ${(weather.visibility/1000).toFixed(1)}km.`,
        precaution: `If driving, maintain a safe distance and use your fog lights or low beams.`,
        level: 'Caution', prob: '95%', rain: '0', window: 'Next 3 hrs', impact: 'Moderate'
      });
    }

    // 4. UV / Heat
    if (weather.uvIndex > 8) {
      alerts.push({
        id: 'uv',
        title: `Extreme UV Index in ${locName}`,
        desc: `UV Index is dangerously high at level ${weather.uvIndex}.`,
        precaution: `Avoid direct sun exposure between 10 AM and 4 PM. Wear protective clothing and stay hydrated.`,
        level: 'Caution', prob: '100%', rain: '0', window: '10 AM - 4 PM', impact: 'Moderate'
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        id: 'all-clear',
        title: `All Clear for ${locName}`,
        desc: `No severe weather alerts are currently active for this region.`,
        precaution: `Conditions are safe for normal agricultural and travel activities.`,
        level: 'Good', prob: '0%', rain: '0', window: 'N/A', impact: 'Low'
      });
    }

    return alerts;
  };

  const getDynamicImpacts = () => {
    if (!weather) return { flood: 'Low', road: 'Low', crop: 'Low', power: 'Low' };
    const precipArr = weather.daily?.precipitationSum || [0];
    const maxRain = Math.max(...precipArr.slice(0, 3));
    const wind = weather.windSpeed || 0;
    
    return {
      flood: maxRain > 50 ? 'Severe' : maxRain > 20 ? 'High' : maxRain > 5 ? 'Moderate' : 'Low',
      road: maxRain > 40 || weather.visibility < 1000 ? 'High' : maxRain > 15 ? 'Moderate' : 'Low',
      crop: maxRain > 60 || wind > 50 ? 'Severe' : maxRain > 30 ? 'High' : 'Low',
      power: wind > 60 ? 'Severe' : wind > 40 ? 'High' : wind > 20 ? 'Moderate' : 'Low'
    };
  };

  const liveAlerts = computeAlerts();
  const impactStats = getDynamicImpacts();

  const filteredNews = news.filter(item => {
    if (newsFilter === 'all') return true;
    const title = item.title.toLowerCase();
    if (newsFilter === 'alerts') return title.includes('alert') || title.includes('warn') || title.includes('severe');
    if (newsFilter === 'news') return !title.includes('alert') && !title.includes('warn');
    if (newsFilter === 'updates') return title.includes('update') || title.includes('live') || title.includes('today');
    if (newsFilter === 'research') return title.includes('study') || title.includes('climate') || title.includes('report') || title.includes('data');
    return true;
  });

  return (
    <div className="min-h-[100dvh] bg-[#0a0c1a] text-white overflow-y-auto pb-24 md:pb-20 relative font-body transition-colors duration-1000">
      {/* Fixed Background Image (Hardware Accelerated) */}
      <div className="fixed inset-0 z-0 bg-cover bg-center transition-opacity duration-1000" style={{ backgroundImage: `url(${theme.bgImage})` }}></div>

      {/* Overlays */}
      <div className={`fixed inset-0 z-0 bg-gradient-to-b ${theme.overlay} pointer-events-none transition-colors duration-1000 opacity-90`}></div>
      <div className={`fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] ${theme.accent} via-transparent to-transparent pointer-events-none transition-colors duration-1000`}></div>

      
      <Header />

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 pt-20 sm:pt-28 md:pt-32 flex flex-col lg:flex-row gap-6 pb-32">
        
        {/* Left Column: Alerts & Risk */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <h2 className="text-2xl font-bold tracking-wide">{ex.liveHighAlerts}</h2>
          </div>

          <div className="flex flex-col gap-4">
            {liveAlerts.map(alert => (
              <div key={alert.id} className={`relative bg-[#0f111a] border rounded-xl p-5 shadow-2xl overflow-hidden
                ${alert.level === 'Severe' ? 'border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : 
                  alert.level === 'Caution' ? 'border-amber-500/40' : 
                  alert.level === 'Info' ? 'border-blue-500/30' : 'border-green-500/30'}`}>
                
                {alert.level === 'Severe' && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-red-400 to-transparent"></div>
                )}

                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-4 items-center">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center border
                      ${alert.level === 'Severe' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 
                      alert.level === 'Caution' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-blue-500/10 border-blue-500/30 text-blue-500'}`}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{alert.title}</h3>
                      <p className="text-white/60 text-sm">{alert.desc}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold uppercase tracking-widest shrink-0`}>
                    {alert.level}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5 border-t border-white/5 pt-5">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-white/50 text-xs uppercase tracking-wide">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                      Probability
                    </div>
                    <div className="text-lg font-bold">{alert.prob}</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-white/50 text-xs uppercase tracking-wide">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      Expected
                    </div>
                    <div className="text-lg font-bold">{alert.rain} <span className="text-xs font-normal text-white/50">{alert.rain !== 'Unknown' ? 'mm' : ''}</span></div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-white/50 text-xs uppercase tracking-wide">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      Risk Window
                    </div>
                    <div className="text-lg font-bold">{alert.window}</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-white/50 text-xs uppercase tracking-wide">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      Impact Level
                    </div>
                    <div className={`text-lg font-bold ${alert.impact === 'Severe' ? 'text-red-500' : alert.impact === 'High' ? 'text-red-400' : alert.impact === 'Moderate' ? 'text-amber-400' : 'text-green-400'}`}>{alert.impact}</div>
                  </div>
                </div>
                
                <div className={`bg-red-500/5 border border-red-500/20 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    <div>
                      <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-0.5">Precaution / Action</div>
                      <div className="text-sm text-red-200/80">{alert.precaution}</div>
                    </div>
                  </div>
                    <button 
                      onClick={() => setActiveModal('warnings')}
                      className="text-xs border border-red-500/30 hover:bg-red-500/10 text-red-300 px-3 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1 shrink-0"
                    >
                      View Details <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#11131c] border border-white/5 rounded-xl p-5 shadow-lg flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white/90 tracking-wide">India Weather Risk Map</h3>
                <div className="flex gap-2 text-[10px] uppercase font-bold tracking-widest">
                  <span className="flex items-center gap-1 text-red-400"><span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> Severe</span>
                  <span className="flex items-center gap-1 text-amber-400"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> High</span>
                </div>
              </div>
              <div className="flex-1 flex gap-4 items-center">
                <div className="w-1/2 flex items-center justify-center opacity-80 p-2">
                  <img src="/india.svg" alt="India Map" className="w-full h-full drop-shadow-lg" style={{ filter: 'drop-shadow(0 0 10px rgba(239,68,68,0.2))' }} />
                </div>
                <div className="w-1/2 flex flex-col justify-center gap-3">
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest border-b border-white/5 pb-1 mb-1">{ex.topRiskStates}</div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/90 font-bold truncate pr-2" title={locationName}>{locationName || 'Unknown Location'}</span>
                    <span className={`flex items-center gap-1 shrink-0 ${impactStats.flood === 'Severe' ? 'text-red-500' : impactStats.flood === 'High' ? 'text-red-400' : impactStats.flood === 'Moderate' ? 'text-amber-400' : 'text-green-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${impactStats.flood === 'Severe' ? 'bg-red-500' : impactStats.flood === 'High' ? 'bg-red-400' : impactStats.flood === 'Moderate' ? 'bg-amber-400' : 'bg-green-400'}`}></span> {impactStats.flood}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/80">Assam</span>
                    <span className="flex items-center gap-1 text-amber-400"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> High</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/80">West Bengal</span>
                    <span className="flex items-center gap-1 text-amber-400"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> High</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/80">Bihar</span>
                    <span className="flex items-center gap-1 text-yellow-400"><span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span> Moderate</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#11131c] border border-white/5 rounded-xl p-5 shadow-lg flex flex-col">
              <h3 className="text-sm font-bold text-white/90 tracking-wide mb-5">Alert Impact Areas</h3>
              <div className="flex flex-col gap-3 flex-1">
                <div className="flex items-center justify-between p-2.5 rounded bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    <span className="text-xs font-medium text-white/80">Flooding</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase ${impactStats.flood === 'Severe' ? 'text-red-500' : impactStats.flood === 'High' ? 'text-red-400' : impactStats.flood === 'Moderate' ? 'text-yellow-400 border border-yellow-500/30 px-1.5 rounded' : 'text-green-400'}`}>{impactStats.flood}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                    <span className="text-xs font-medium text-white/80">Road Disruption</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase ${impactStats.road === 'Severe' ? 'text-red-500' : impactStats.road === 'High' ? 'text-red-400' : impactStats.road === 'Moderate' ? 'text-yellow-400 border border-yellow-500/30 px-1.5 rounded' : 'text-green-400'}`}>{impactStats.road}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <span className="text-xs font-medium text-white/80">Crop Damage Risk</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase ${impactStats.crop === 'Severe' ? 'text-red-500' : impactStats.crop === 'High' ? 'text-red-400' : impactStats.crop === 'Moderate' ? 'text-yellow-400 border border-yellow-500/30 px-1.5 rounded' : 'text-green-400'}`}>{impactStats.crop}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    <span className="text-xs font-medium text-white/80">Power Outage</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase ${impactStats.power === 'Severe' ? 'text-red-500' : impactStats.power === 'High' ? 'text-red-400' : impactStats.power === 'Moderate' ? 'text-yellow-400 border border-yellow-500/30 px-1.5 rounded' : 'text-green-400'}`}>{impactStats.power}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-0 bg-[#0f111a] border border-white/5 rounded-xl md:divide-x divide-white/5">
            <button onClick={() => setActiveModal('radar')} className="flex flex-col items-center justify-center gap-2 p-4 hover:bg-white/5 transition-colors rounded-l-xl">
              <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
              <div className="text-center">
                <div className="text-xs font-bold text-white/90">{ex.liveRadar}</div>
                <div className="text-[9px] text-white/40 mt-0.5 hidden sm:block">{ex.realTimeRain}</div>
              </div>
            </button>
            <button onClick={() => setActiveModal('satellite')} className="flex flex-col items-center justify-center gap-2 p-4 hover:bg-white/5 transition-colors">
              <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9m-9 9a9 9 0 0 1 9-9"/></svg>
              <div className="text-center">
                <div className="text-xs font-bold text-white/90">{ex.satelliteView}</div>
                <div className="text-[9px] text-white/40 mt-0.5 hidden sm:block">{ex.cloudCover}</div>
              </div>
            </button>
            <button onClick={() => setActiveModal('river')} className="flex flex-col items-center justify-center gap-2 p-4 hover:bg-white/5 transition-colors">
              <svg className="w-6 h-6 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              <div className="text-center">
                <div className="text-xs font-bold text-white/90">{ex.riverLevels}</div>
                <div className="text-[9px] text-white/40 mt-0.5 hidden sm:block">{ex.floodMonitoring}</div>
              </div>
            </button>
            <button onClick={() => setActiveModal('warnings')} className="flex flex-col items-center justify-center gap-2 p-4 hover:bg-white/5 transition-colors">
              <svg className="w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-14a2 2 0 0 1-2-2v-1h18v1z"/><path d="M12 2v2"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <div className="text-center">
                <div className="text-xs font-bold text-white/90">{ex.earlyWarnings}</div>
                <div className="text-[9px] text-white/40 mt-0.5 hidden sm:block">{ex.districtAlerts}</div>
              </div>
            </button>
            <button onClick={() => setActiveModal('safety')} className="col-span-2 md:col-span-1 flex flex-col items-center justify-center gap-2 p-4 hover:bg-white/5 transition-colors rounded-r-xl">
              <svg className="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
              <div className="text-center">
                <div className="text-xs font-bold text-white/90">{ex.safetyGuide}</div>
                <div className="text-[9px] text-white/40 mt-0.5 hidden sm:block">Do's & Don'ts</div>
              </div>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-4">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[10px] text-white/40 font-medium">
              <span>Data Sources</span>
              <span className="flex items-center gap-1"><span className="w-1 h-1 bg-green-500 rounded-full"></span> IMD</span>
              <span className="flex items-center gap-1"><span className="w-1 h-1 bg-white/20 rounded-full"></span> GFS</span>
              <span className="flex items-center gap-1"><span className="w-1 h-1 bg-blue-500 rounded-full"></span> SAT</span>
              <span className="flex items-center gap-1"><span className="w-1 h-1 bg-white/20 rounded-full"></span> Radar</span>
              <span className="flex items-center gap-1"><span className="w-1 h-1 bg-white/20 rounded-full"></span> WIS 2.0</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-white/30 shrink-0">
              Last Updated <svg className="w-3 h-3 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg> 2 min ago
            </div>
          </div>
        </div>

        {/* Right Column: News */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          
          {/* Feature 7: Seasonal Context Card */}
          {seasonalCtx.found && (
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-wide mb-4">{ft.seasonTitle}</h2>
              <div className="bg-indigo-950/40 backdrop-blur-xl border border-indigo-400/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">📅</div>
                <div className="text-xs font-bold uppercase text-indigo-300 tracking-wider mb-3">{ft.seasonNormalFor(seasonalCtx.month, seasonalCtx.city)}</div>
                <p className="text-sm text-white/90 leading-relaxed relative z-10">{seasonalCtx.summary}</p>
                <div className="grid grid-cols-2 gap-3 mt-4 border-t border-indigo-400/20 pt-4">
                  <div>
                    <div className="text-[10px] text-white/50 uppercase tracking-widest mb-1">{ft.seasonAvgRain}</div>
                    <div className="text-lg font-bold">{seasonalCtx.avgRainfall} mm</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/50 uppercase tracking-widest mb-1">{ft.seasonAvgTemp}</div>
                    <div className="text-lg font-bold">{seasonalCtx.avgMinTemp}° – {seasonalCtx.avgMaxTemp}°</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-wide text-white">{ex.realTimeNews}</h2>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px] font-bold tracking-widest uppercase border border-red-500/20"><span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span> Live</span>
          </div>

          <div className="bg-[#11131c] border border-white/5 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col h-full">
            
            <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar pb-1">
              {['all', 'alerts', 'news', 'updates', 'research'].map(filter => (
                <button 
                  key={filter}
                  onClick={() => setNewsFilter(filter)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shrink-0 border transition-colors ${
                    newsFilter === filter 
                      ? 'bg-white/10 text-white border-white/10' 
                      : 'text-white/50 hover:bg-white/5 border-transparent'
                  }`}
                >
                  {filter === 'all' && <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>}
                  {filter}
                </button>
              ))}
            </div>

            <div className="flex flex-col flex-1 divide-y divide-white/5">
              {isLoadingNews ? (
                <div className="text-white/50 text-sm animate-pulse text-center py-10">{ex.fetchingNews}</div>
              ) : filteredNews.length > 0 ? (
                filteredNews.map(item => (
                  <a key={item.id} href={item.link} target="_blank" rel="noreferrer" className="flex gap-4 py-4 group transition-colors">
                    {item.image && (
                      <img src={item.image} alt="" className="w-20 h-16 sm:w-24 sm:h-20 rounded-lg object-cover bg-white/10 shrink-0 border border-white/5 group-hover:border-white/20 transition-colors" />
                    )}
                    <div className="flex flex-col justify-between flex-1 min-w-0">
                      <h4 className="font-medium text-[13px] sm:text-[14px] text-white/90 leading-snug line-clamp-3 group-hover:text-blue-400 transition-colors">{item.title}</h4>
                      <div className="flex items-center justify-between text-[10px] text-white/40 mt-2">
                        <span className="truncate pr-2">{item.source}</span>
                        <span className="shrink-0">{new Date(item.time).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </a>
                ))
              ) : (
                <div className="text-white/40 text-xs py-10 text-center">{ex.noNews}</div>
              )}
            </div>
            
            <a href="https://news.google.com/search?q=weather+india" target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 mt-2 py-2.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs font-bold tracking-wide transition-colors">
              View All on Google News <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
        </div>

      </div>


      {/* Quick Links Modal Overlay */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setActiveModal(null)}>
          <div className="bg-[#11131c] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {activeModal === 'radar' && <><span className="text-purple-400">●</span> {ex.liveRadar}</>}
                {activeModal === 'satellite' && <><span className="text-blue-400">●</span> {ex.satelliteView}</>}
                {activeModal === 'river' && <><span className="text-cyan-400">●</span> {ex.riverLevels}</>}
                {activeModal === 'warnings' && <><span className="text-amber-400">●</span> {ex.earlyWarnings}</>}
                {activeModal === 'safety' && <><span className="text-green-400">●</span> {ex.safetyGuide}</>}
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-white/50 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-0 bg-black/20">
              {(activeModal === 'radar' || activeModal === 'satellite') && (
                <iframe 
                  width="100%" 
                  height="500" 
                  src={`https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=%C2%B0C&metricWind=km%2Fh&zoom=5&overlay=${activeModal === 'radar' ? 'rain' : 'clouds'}&product=ecmwf&level=surface&lat=${weather?.latitude || 20.5937}&lon=${weather?.longitude || 78.9629}`}
                  frameBorder="0"
                  title="Weather Map"
                ></iframe>
              )}
              
              {activeModal === 'river' && (
                <div className="p-6 text-center">
                  <svg className="w-16 h-16 text-cyan-500 mx-auto mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  <h4 className="text-xl font-bold text-white mb-2">Central Water Commission (CWC) Integration</h4>
                  <p className="text-white/60 mb-6 max-w-lg mx-auto">Real-time river basin monitoring and flood forecasting data will be displayed here when connected to the official CWC telemetry API.</p>
                  <div className="inline-block bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4 max-w-sm text-left">
                    <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">Simulated Data - Brahmaputra Basin</div>
                    <div className="flex justify-between items-center text-sm mb-1"><span className="text-white/70">Current Level:</span> <span className="font-bold text-red-400">86.5m (Above Danger)</span></div>
                    <div className="flex justify-between items-center text-sm"><span className="text-white/70">Trend:</span> <span className="font-bold text-yellow-400">Rising</span></div>
                  </div>
                </div>
              )}

              {activeModal === 'warnings' && (
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span></span>
                    <span className="font-medium text-amber-200">Active Bulletins from IMD for {locationName || 'your region'}</span>
                  </div>
                  <div className="space-y-4">
                    {liveAlerts.filter(a => a.id !== 'all-clear').length > 0 ? (
                      liveAlerts.filter(a => a.id !== 'all-clear').map(alert => (
                        <div key={alert.id} className="bg-white/5 border border-white/10 p-4 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-bold text-white/90">{alert.title}</h5>
                            <span className="text-[10px] text-white/40">Issued: Just now</span>
                          </div>
                          <p className="text-sm text-white/60">{alert.desc}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 text-white/40">No active warnings for this location.</div>
                    )}
                  </div>
                </div>
              )}

              {activeModal === 'safety' && (
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-xl">
                    <h4 className="font-bold text-blue-400 mb-4 flex items-center gap-2"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> Flood Safety</h4>
                    <ul className="space-y-2 text-sm text-white/70 list-disc list-inside">
                      <li>Move to higher ground immediately.</li>
                      <li>Do not walk or drive through flood waters.</li>
                      <li>Turn off utilities at the main switches.</li>
                      <li>Disconnect electrical appliances.</li>
                    </ul>
                  </div>
                  <div className="bg-orange-500/10 border border-orange-500/20 p-5 rounded-xl">
                    <h4 className="font-bold text-orange-400 mb-4 flex items-center gap-2"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Cyclone Safety</h4>
                    <ul className="space-y-2 text-sm text-white/70 list-disc list-inside">
                      <li>Stay indoors and away from windows.</li>
                      <li>Keep an emergency kit ready (radio, torch).</li>
                      <li>Store drinking water in clean containers.</li>
                      <li>Do not venture out until official clear signal.</li>
                    </ul>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 p-5 rounded-xl">
                    <h4 className="font-bold text-yellow-400 mb-4 flex items-center gap-2"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Lightning Safety</h4>
                    <ul className="space-y-2 text-sm text-white/70 list-disc list-inside">
                      <li>Seek shelter in a substantial building.</li>
                      <li>Avoid isolated trees and tall objects.</li>
                      <li>Stay away from water and metal objects.</li>
                      <li>If outdoors, crouch down with feet together.</li>
                    </ul>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-xl">
                    <h4 className="font-bold text-red-400 mb-4 flex items-center gap-2"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Heatwave Safety</h4>
                    <ul className="space-y-2 text-sm text-white/70 list-disc list-inside">
                      <li>Drink plenty of water even if not thirsty.</li>
                      <li>Wear lightweight, light-colored clothing.</li>
                      <li>Avoid strenuous activities during peak hours.</li>
                      <li>Never leave children or pets in parked vehicles.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
