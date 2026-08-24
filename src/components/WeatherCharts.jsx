import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getWeatherInfo } from '../utils/weatherConditions';
import { UI_TRANSLATIONS } from '../utils/translations';
import { SPEECH_LANG_CODES as CONST_LANG_CODES } from '../utils/constants';
import RadarMap from './RadarMap';

export default function WeatherCharts({ weather, lat, lng }) {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState('temperature'); // 'temperature', 'precipitation', 'wind'
  
  const lang = state.language || 'en';
  const t = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS['en'];
  const locale = CONST_LANG_CODES[lang] || 'en-IN';

  if (!weather || !weather.hourly) return null;

  // Extract next 8 hours for the chart
  const now = new Date();
  const currentHourIdx = weather.hourly.time.findIndex(time => new Date(time) > now) - 1 || 0;
  const safeIdx = Math.max(0, currentHourIdx);
  
  const chartData = [];
  for (let i = 0; i < 8; i++) {
    const idx = safeIdx + (i * 3);
    if (idx < weather.hourly.time.length) {
      const timeObj = new Date(weather.hourly.time[idx]);
      // Use localized time string (e.g. '3 pm' in English, '3 अपराह्न' in Hindi)
      const timeLabel = timeObj.toLocaleTimeString(locale, { hour: 'numeric', hour12: true });
      
      chartData.push({
        timeLabel,
        temp: Math.round(weather.hourly.temperature[idx]),
        precip: weather.hourly.precipProb[idx],
        wind: Math.round(weather.hourly.windSpeed[idx]),
        windDir: weather.hourly.windDirection[idx],
      });
    }
  }

  // 7-day forecast data
  const dailyData = [];
  for (let i = 0; i < 7; i++) {
    const dateObj = new Date(weather.daily.time[i]);
    const dayStr = dateObj.toLocaleDateString(locale, { weekday: 'short' });
    const info = getWeatherInfo(weather.daily.weatherCode[i], lang);
    
    dailyData.push({
      day: dayStr,
      max: Math.round(weather.daily.maxTemp[i]),
      min: Math.round(weather.daily.minTemp[i]),
      icon: info.icon,
    });
  }

  // SVG Chart Dimensions
  const width = 600;
  const height = 120;
  
  // Temp Chart Path
  const minTemp = Math.min(...chartData.map(d => d.temp)) - 2;
  const maxTemp = Math.max(...chartData.map(d => d.temp)) + 2;
  const tempRange = maxTemp - minTemp || 1;
  
  const getTempY = (temp) => height - ((temp - minTemp) / tempRange) * (height - 40) - 20;
  const getX = (index) => (width / (chartData.length * 2)) * (index * 2 + 1);

  const tempPoints = chartData.map((d, i) => `${getX(i)},${getTempY(d.temp)}`).join(' ');
  const tempFillPath = `M0,${height} L0,${getTempY(chartData[0].temp)} L${tempPoints} L${width},${getTempY(chartData[chartData.length-1].temp)} L${width},${height} Z`;

  const getPrecipHeight = (precip) => (precip / 100) * (height - 30);

  return (
    <div className="bg-dusk/90 rounded-t-3xl text-white pt-6 pb-8 shadow-2xl relative z-30 mt-[-20px] backdrop-blur-md">
      
      {/* Tabs */}
      <div className="flex gap-6 px-6 border-b border-white/10 mb-6 font-medium text-sm">
        <button 
          onClick={() => setActiveTab('temperature')}
          className={`pb-3 border-b-2 transition-colors ${activeTab === 'temperature' ? 'border-amber text-white' : 'border-transparent text-white/50 hover:text-white/80'}`}
        >
          {t.tempTab}
        </button>
        <button 
          onClick={() => setActiveTab('precipitation')}
          className={`pb-3 border-b-2 transition-colors ${activeTab === 'precipitation' ? 'border-amber text-white' : 'border-transparent text-white/50 hover:text-white/80'}`}
        >
          {t.precipTab}
        </button>
        <button 
          onClick={() => setActiveTab('wind')}
          className={`pb-3 border-b-2 transition-colors ${activeTab === 'wind' ? 'border-amber text-white' : 'border-transparent text-white/50 hover:text-white/80'}`}
        >
          {t.windTab}
        </button>
      </div>

      {/* Chart Area */}
      <div className="px-6 mb-8 relative">
        <div className="w-full overflow-x-auto scrollbar-hide pb-2">
          <div className="min-w-[500px] relative">
            
            {/* Top Labels */}
            <div className="flex justify-between px-[3%] mb-2 text-sm font-medium">
              {chartData.map((d, i) => (
                <div key={i} className="text-center w-10">
                  {activeTab === 'temperature' && `${d.temp}°`}
                  {activeTab === 'precipitation' && `${d.precip}%`}
                  {activeTab === 'wind' && `${d.wind} ${t.kmh}`}
                </div>
              ))}
            </div>

            {/* SVG Graph */}
            <div className="h-[120px] w-full relative">
              {activeTab === 'temperature' && (
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  {/* Fill */}
                  <path d={tempFillPath} fill="rgba(232, 163, 61, 0.2)" />
                  {/* Line */}
                  <polyline points={tempPoints} fill="none" stroke="#E8A33D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Points */}
                  {chartData.map((d, i) => (
                    <circle key={i} cx={getX(i)} cy={getTempY(d.temp)} r="4" fill="#E8A33D" />
                  ))}
                </svg>
              )}

              {activeTab === 'precipitation' && (
                <div className="w-full h-full flex justify-between items-end px-[3%] border-b border-white/20">
                  {chartData.map((d, i) => (
                    <div key={i} className="w-8 bg-blue-500/60 rounded-t-sm" style={{ height: `${Math.max(2, getPrecipHeight(d.precip))}px` }}></div>
                  ))}
                </div>
              )}

              {activeTab === 'wind' && (
                <div className="w-full h-full flex justify-between items-center px-[3%] pt-4">
                  {chartData.map((d, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                           style={{ transform: `rotate(${d.windDir}deg)`, color: '#9CA3AF' }}>
                        <line x1="12" y1="19" x2="12" y2="5"></line>
                        <polyline points="5 12 12 5 19 12"></polyline>
                      </svg>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Time Labels */}
            <div className="flex justify-between px-[3%] mt-3 text-xs text-white/50 font-medium">
              {chartData.map((d, i) => (
                <div key={i} className="text-center w-10">
                  {d.timeLabel}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Forecast */}
      <div className="px-6 mb-6">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
          {dailyData.map((day, i) => (
            <div key={i} className={`flex flex-col items-center min-w-[70px] p-3 rounded-2xl ${i === 0 ? 'bg-white/10 shadow-inner' : 'hover:bg-white/5'} transition-colors`}>
              <div className="text-sm font-medium mb-2">{i === 0 ? t.today : day.day}</div>
              <div className="text-2xl mb-2 drop-shadow-md">{day.icon}</div>
              <div className="flex gap-2 text-sm">
                <span className="font-semibold">{day.max}°</span>
                <span className="text-white/50">{day.min}°</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Weather Details Grid */}
      <div className="px-6 pb-4">
        <h3 className="text-white/70 font-medium mb-3 pl-1 text-sm tracking-wide">Detailed Conditions</h3>
        <div className="grid grid-cols-2 gap-3">
          
          {/* Feels Like & Humidity */}
          <div className="bg-white/5 hover:bg-white/10 transition-all duration-300 rounded-2xl p-4 border border-white/10 flex flex-col justify-between shadow-sm hover:shadow-md cursor-default">
            <div className="text-white/50 text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              {t.feelsLike}
            </div>
            <div className="text-2xl font-semibold text-white drop-shadow-sm">{weather.feelsLike}°</div>
          </div>
          
          <div className="bg-white/5 hover:bg-white/10 transition-all duration-300 rounded-2xl p-4 border border-white/10 flex flex-col justify-between shadow-sm hover:shadow-md cursor-default">
            <div className="text-white/50 text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
              {t.hum}
            </div>
            <div className="text-2xl font-semibold text-white drop-shadow-sm">{weather.humidity}%</div>
          </div>

          {/* Visibility & UV Index */}
          <div className="bg-white/5 hover:bg-white/10 transition-all duration-300 rounded-2xl p-4 border border-white/10 flex flex-col justify-between shadow-sm hover:shadow-md cursor-default">
            <div className="text-white/50 text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              {t.vis}
            </div>
            <div className="text-2xl font-semibold text-white drop-shadow-sm">{(weather.visibility / 1000).toFixed(1)} km</div>
          </div>
          
          <div className="bg-white/5 hover:bg-white/10 transition-all duration-300 rounded-2xl p-4 border border-white/10 flex flex-col justify-between shadow-sm hover:shadow-md cursor-default">
            <div className="text-white/50 text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              {t.uv}
            </div>
            <div className="text-2xl font-semibold text-white drop-shadow-sm">{weather.uvIndex}</div>
          </div>

          {/* Sunrise & Sunset (Full width row) */}
          <div className="bg-white/5 hover:bg-white/10 transition-all duration-300 rounded-2xl p-5 border border-white/10 col-span-2 flex items-center justify-between shadow-sm hover:shadow-md cursor-default">
            <div className="flex flex-col">
              <div className="text-white/50 text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v6"/><path d="M12 22v-6"/><path d="M4.93 4.93l4.24 4.24"/><path d="M19.07 19.07l-4.24-4.24"/><path d="M2 12h6"/><path d="M22 12h-6"/><path d="M4.93 19.07l4.24-4.24"/><path d="M19.07 4.93l-4.24 4.24"/></svg>
                {t.sunrise}
              </div>
              <div className="text-xl font-semibold text-white drop-shadow-sm">
                {new Date(weather.daily.sunrise[0]).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', hour12: true })}
              </div>
            </div>
            
            <div className="h-10 w-px bg-white/20 mx-4"></div>
            
            <div className="flex flex-col text-right items-end">
              <div className="text-white/50 text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
                {t.sunset}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22v-6"/><path d="M4.93 19.07l4.24-4.24"/><path d="M2 12h6"/><path d="M22 12h-6"/><path d="M19.07 19.07l-4.24-4.24"/><path d="M12 10a4 4 0 1 0-8 0"/></svg>
              </div>
              <div className="text-xl font-semibold text-white drop-shadow-sm">
                {new Date(weather.daily.sunset[0]).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', hour12: true })}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Live Radar Map */}
      <div className="px-6 pb-4">
        <RadarMap lat={lat} lng={lng} />
      </div>
      
    </div>
  );
}
