import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { getTheme } from '../utils/themes';
import Header from './Header';

export default function AlertsScreen() {
  const { state } = useApp();
  
  // Try to use the searched location's weather, otherwise default to severe theme
  const weather = state.weatherStageData?.weather;
  const weatherInfo = weather ? { condition: 'severe', key: 'severe' } : null; // Force severe theme or match location
  const theme = weather ? getTheme(weather, weatherInfo) : getTheme({ temperature: 20 }, { key: 'severeStorm' });
  
  const [news, setNews] = useState([]);
  const [isLoadingNews, setIsLoadingNews] = useState(true);

  // Fetch real-time news
  useEffect(() => {
    fetch('/api/news')
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
    if (!state.weatherStageData || !state.weatherStageData.weather) {
      return [{ id: 'no-data', type: 'info', title: 'No Location Selected', desc: 'Please search for a city in the Weather View to see local alerts.', level: 'Info' }];
    }
    
    const weather = state.weatherStageData.weather;
    const locName = state.weatherStageData.locationName;
    const alerts = [];

    // 1. Heavy Rain / Flood Warning
    // Safely check precipitation sum if it exists, otherwise use precip probability
    const precipArr = weather.daily.precipitationSum || weather.daily.precipProbMax || [0];
    const maxRain = Math.max(...precipArr.slice(0, 3));
    
    // If we're using probability (0-100), adjust threshold
    const isProb = !weather.daily.precipitationSum;
    const severeThreshold = isProb ? 80 : 40;
    const cautionThreshold = isProb ? 50 : 15;

    if (maxRain > severeThreshold) {
      alerts.push({
        id: 'rain',
        title: `Heavy Rain & Flood Risk in ${locName}`,
        desc: isProb ? `High probability (${maxRain}%) of severe rain.` : `High precipitation (${maxRain}mm) expected. Low-lying areas may face waterlogging.`,
        precaution: `Avoid unnecessary travel. Move livestock to higher ground and secure outdoor equipment.`,
        level: 'Severe'
      });
    } else if (maxRain > cautionThreshold) {
      alerts.push({
        id: 'rain-mod',
        title: `Moderate Rain in ${locName}`,
        desc: isProb ? `Moderate chance (${maxRain}%) of rain.` : `Steady rainfall expected (${maxRain}mm).`,
        precaution: `Roads may be slippery. If spraying crops, consider delaying until the rain clears.`,
        level: 'Caution'
      });
    }

    // 2. High Wind
    if (weather.windSpeed > 45) {
      alerts.push({
        id: 'wind',
        title: `High Wind Warning for ${locName}`,
        desc: `Dangerous wind gusts up to ${weather.windSpeed} km/h detected.`,
        precaution: `Secure loose objects, close all windows, and avoid parking or walking under large trees.`,
        level: 'Severe'
      });
    }

    // 3. Poor Visibility (Fog/Smog)
    if (weather.visibility < 2000) {
      alerts.push({
        id: 'vis',
        title: `Poor Visibility in ${locName}`,
        desc: `Visibility is severely reduced to ${(weather.visibility/1000).toFixed(1)}km.`,
        precaution: `If driving, maintain a safe distance and use your fog lights or low beams.`,
        level: 'Caution'
      });
    }

    // 4. UV / Heat
    if (weather.uvIndex > 8) {
      alerts.push({
        id: 'uv',
        title: `Extreme UV Index in ${locName}`,
        desc: `UV Index is dangerously high at level ${weather.uvIndex}.`,
        precaution: `Avoid direct sun exposure between 10 AM and 4 PM. Wear protective clothing and stay hydrated.`,
        level: 'Caution'
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        id: 'all-clear',
        title: `All Clear for ${locName}`,
        desc: `No severe weather alerts are currently active for this region.`,
        precaution: `Conditions are safe for normal agricultural and travel activities.`,
        level: 'Good'
      });
    }

    return alerts;
  };

  const liveAlerts = computeAlerts();

  return (
    <div className="min-h-screen bg-[#0a0c1a] text-white overflow-y-auto pb-20 relative font-body bg-cover bg-fixed bg-center transition-all duration-1000" style={{ backgroundImage: `url(${theme.bgImage})` }}>
      {/* Overlay Gradients - extra dark for alerts */}
      <div className={`fixed inset-0 bg-gradient-to-b ${theme.overlay} pointer-events-none transition-colors duration-1000 opacity-90`}></div>
      <div className={`fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] ${theme.accent} via-transparent to-transparent pointer-events-none transition-colors duration-1000`}></div>
      
      <Header />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 pt-32 flex flex-col md:flex-row gap-8">
        
        {/* Left Column: High Alerts */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-6">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
            </span>
            <h2 className="text-2xl font-bold tracking-wide">Live High Alerts</h2>
          </div>

          <div className="flex flex-col gap-4">
            {liveAlerts.map(alert => (
              <div key={alert.id} className={`bg-white/5 backdrop-blur-xl border rounded-2xl p-6 shadow-xl 
                ${alert.level === 'Severe' ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)]' : 
                  alert.level === 'Caution' ? 'border-amber-500/50' : 
                  alert.level === 'Info' ? 'border-blue-500/30' : 'border-green-500/30'}`}>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold">{alert.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 ml-4
                    ${alert.level === 'Severe' ? 'bg-red-500/20 text-red-400' : 
                      alert.level === 'Caution' ? 'bg-amber-500/20 text-amber-400' : 
                      alert.level === 'Info' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                    {alert.level}
                  </span>
                </div>
                <p className="text-white/80 leading-relaxed text-[15px] mb-4">{alert.desc}</p>
                
                <div className={`mt-4 pt-4 border-t flex items-start gap-3
                  ${alert.level === 'Severe' ? 'border-red-500/20' : 
                    alert.level === 'Caution' ? 'border-amber-500/20' : 
                    alert.level === 'Info' ? 'border-blue-500/20' : 'border-green-500/20'}`}>
                  <svg className={`shrink-0 w-5 h-5 mt-0.5 ${alert.level === 'Severe' ? 'text-red-400' : alert.level === 'Caution' ? 'text-amber-400' : alert.level === 'Info' ? 'text-blue-400' : 'text-green-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-1">Precaution / Action</h4>
                    <p className={`font-medium text-sm ${alert.level === 'Severe' ? 'text-red-200' : alert.level === 'Caution' ? 'text-amber-200' : 'text-white/90'}`}>{alert.precaution}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Local News */}
        <div className="w-full md:w-1/3">
          <h2 className="text-xl font-bold tracking-wide mb-6">Real-Time India Weather News</h2>
          
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
            {isLoadingNews ? (
              <div className="text-white/50 text-sm animate-pulse text-center py-4">Fetching live news...</div>
            ) : (
              news.map(item => (
                <a key={item.id} href={item.link} target="_blank" rel="noreferrer" className="block border-b border-white/10 pb-4 last:border-0 last:pb-0 hover:bg-white/5 rounded-lg -mx-2 px-2 transition-colors">
                  <h4 className="font-medium text-[15px] mb-2 text-white/90">{item.title}</h4>
                  <div className="flex justify-between text-xs text-white/50">
                    <span>{item.source}</span>
                    <span>{new Date(item.time).toLocaleDateString()}</span>
                  </div>
                </a>
              ))
            )}
            
            <a href="https://news.google.com/search?q=weather+india" target="_blank" rel="noreferrer" className="w-full block text-center mt-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-colors">
              View All on Google News
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
