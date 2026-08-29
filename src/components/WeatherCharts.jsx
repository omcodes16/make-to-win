import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getWeatherInfo } from '../utils/weatherConditions';
import { UI_TRANSLATIONS } from '../utils/translations';
import { SPEECH_LANG_CODES as CONST_LANG_CODES } from '../utils/constants';
import RadarMap from './RadarMap';

const SunMoonTracker = ({ weather, t, locale }) => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000); // update every minute
    return () => clearInterval(timer);
  }, []);

  if (!weather || !weather.daily || !Array.isArray(weather.daily.sunrise) || !weather.daily.sunrise[0] || !Array.isArray(weather.daily.sunset) || !weather.daily.sunset[0]) return null;

  const sr0 = new Date(weather.daily.sunrise[0]);
  const ss0 = new Date(weather.daily.sunset[0]);
  
  let isDaytime = true;
  let start = sr0;
  let end = ss0;
  let leftLabel = t.sunrise;
  let rightLabel = t.sunset;
  let leftTime = sr0;
  let rightTime = ss0;
  let icon = '☀️';
  let iconColor = 'text-yellow-400';
  let glowColor = 'rgba(250, 204, 21, 0.4)';

  if (now > ss0) {
    // Night (after today's sunset)
    isDaytime = false;
    start = ss0;
    end = new Date(weather.daily.sunrise[1] || sr0.getTime() + 86400000);
    leftLabel = t.sunset;
    rightLabel = t.sunrise;
    leftTime = ss0;
    rightTime = end;
    icon = '🌙';
    iconColor = 'text-blue-200';
    glowColor = 'rgba(191, 219, 254, 0.4)';
  } else if (now < sr0) {
    // Night (before today's sunrise)
    isDaytime = false;
    start = new Date(sr0.getTime() - Math.abs(ss0.getTime() - sr0.getTime())); // approximation of yesterday's sunset
    end = sr0;
    leftLabel = t.sunset;
    rightLabel = t.sunrise;
    leftTime = start;
    rightTime = end;
    icon = '🌙';
    iconColor = 'text-blue-200';
    glowColor = 'rgba(191, 219, 254, 0.4)';
  }

  let progress = (now - start) / (end - start);
  progress = Math.max(0, Math.min(1, progress));

  // Bezier curve points
  const p0 = { x: 20, y: 70 };
  const p1 = { x: 100, y: 10 };
  const p2 = { x: 180, y: 70 };
  
  const px = Math.pow(1 - progress, 2) * p0.x + 2 * (1 - progress) * progress * p1.x + Math.pow(progress, 2) * p2.x;
  const py = Math.pow(1 - progress, 2) * p0.y + 2 * (1 - progress) * progress * p1.y + Math.pow(progress, 2) * p2.y;

  return (
    <div className="glass-panel transition-all duration-300 rounded-2xl p-5 border border-white/10 col-span-2 shadow-sm hover:shadow-md relative overflow-hidden flex flex-col justify-between">
      <div className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2 flex items-center gap-1.5 z-10">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v6"/><path d="M12 22v-6"/><path d="M4.93 4.93l4.24 4.24"/><path d="M19.07 19.07l-4.24-4.24"/><path d="M2 12h6"/><path d="M22 12h-6"/><path d="M4.93 19.07l4.24-4.24"/><path d="M19.07 4.93l-4.24 4.24"/></svg>
        {isDaytime ? 'Sun Path' : 'Moon Path'}
      </div>
      
      <div className="relative w-full h-[80px] mt-2 mb-2 z-10">
        <svg viewBox="0 0 200 80" className="w-full h-full overflow-visible">
          {/* Dashed track */}
          <path 
            d={`M ${p0.x} ${p0.y} Q ${p1.x} ${p1.y} ${p2.x} ${p2.y}`} 
            fill="none" 
            stroke={isDaytime ? "rgba(250, 204, 21, 0.5)" : "rgba(96, 165, 250, 0.5)"}
            strokeWidth="2.5" 
            strokeDasharray="6 4" 
            strokeLinecap="round"
          />
          {/* Active track (progress) - optional, maybe just the icon is enough */}
          
          {/* Sun/Moon Icon */}
          <g transform={`translate(${px}, ${py})`}>
            <circle cx="0" cy="0" r="8" fill="currentColor" className={iconColor} style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }} />
            <text x="0" y="1" textAnchor="middle" dominantBaseline="middle" fontSize="10">{icon}</text>
          </g>
        </svg>
      </div>
      
      <div className="flex justify-between items-end z-10 relative">
        <div className="flex flex-col">
          <div className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-0.5">{leftLabel}</div>
          <div className="text-sm font-semibold text-white drop-shadow-sm">
            {leftTime.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', hour12: true })}
          </div>
        </div>
        <div className="flex flex-col text-right items-end">
          <div className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-0.5">{rightLabel}</div>
          <div className="text-sm font-semibold text-white drop-shadow-sm">
            {rightTime.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', hour12: true })}
          </div>
        </div>
      </div>
      
      {/* Background soft glow based on progress */}
      <div 
        className="absolute bottom-0 w-32 h-32 blur-3xl rounded-full opacity-20 pointer-events-none transition-all duration-1000"
        style={{ 
          left: `calc(${progress * 100}% - 4rem)`,
          background: isDaytime ? '#FACC15' : '#93C5FD'
        }}
      />
    </div>
  );
};



export default function WeatherCharts({ weather, lat, lng }) {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState('temperature'); // 'temperature', 'precipitation', 'wind'
  
  const lang = state.language || 'en';
  const t = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS['en'];
  const locale = CONST_LANG_CODES[lang] || 'en-IN';

  if (!weather || !weather.hourly) return null;

  let chartData = [];
  let dailyData = [];
  
  try {
    const now = new Date();
    const currentHourIdx = weather.hourly.time.findIndex(time => new Date(time) > now) - 1 || 0;
    const safeIdx = Math.max(0, currentHourIdx);
    
    for (let i = 0; i < 8; i++) {
      const idx = safeIdx + (i * 3);
      if (idx < weather.hourly.time.length) {
        const timeObj = new Date(weather.hourly.time[idx]);
        const timeLabel = timeObj.toLocaleTimeString(locale, { hour: 'numeric', hour12: true });
        
        chartData.push({
          timeLabel,
          temp: weather.hourly.temperature && weather.hourly.temperature[idx] !== undefined ? Math.round(weather.hourly.temperature[idx]) : 0,
          precip: weather.hourly.precipProb ? weather.hourly.precipProb[idx] : 0,
          wind: weather.hourly.windSpeed && weather.hourly.windSpeed[idx] !== undefined ? Math.round(weather.hourly.windSpeed[idx]) : 0,
          windDir: weather.hourly.windDirection ? weather.hourly.windDirection[idx] : 0,
        });
      }
    }

    for (let i = 0; i < 7; i++) {
      if (!weather.daily.time || !weather.daily.time[i]) continue;
      const dateObj = new Date(weather.daily.time[i]);
      const dayStr = dateObj.toLocaleDateString(locale, { weekday: 'short' });
      const code = weather.daily.weatherCode ? weather.daily.weatherCode[i] : 0;
      const info = getWeatherInfo(code, lang);
      
      dailyData.push({
        day: dayStr,
        max: weather.daily.maxTemp && weather.daily.maxTemp[i] !== undefined ? Math.round(weather.daily.maxTemp[i]) : 0,
        min: weather.daily.minTemp && weather.daily.minTemp[i] !== undefined ? Math.round(weather.daily.minTemp[i]) : 0,
        icon: info.icon,
      });
    }
  } catch (err) {
    console.error("WeatherCharts data parsing error:", err);
  }

  const height = 120;
  
  // Temp Chart Path
  const minTemp = chartData.length > 0 ? Math.min(...chartData.map(d => d.temp || 0)) - 2 : 0;
  const maxTemp = chartData.length > 0 ? Math.max(...chartData.map(d => d.temp || 0)) + 2 : 30;
  const tempRange = maxTemp - minTemp || 1;
  
  const getTempY = (temp) => height - (((temp || 0) - minTemp) / tempRange) * (height - 40) - 20;
  const getX = (index) => chartData.length > 0 ? (width / (chartData.length * 2)) * (index * 2 + 1) : 0;

  const tempPoints = chartData.map((d, i) => `${getX(i)},${getTempY(d.temp)}`).join(' ');
  const tempFillPath = chartData.length > 0 
    ? `M0,${height} L0,${getTempY(chartData[0].temp)} L${tempPoints} L${width},${getTempY(chartData[chartData.length-1].temp)} L${width},${height} Z`
    : `M0,${height} Z`;

  const getPrecipHeight = (precip) => ((precip || 0) / 100) * (height - 30);

  return (
    <div className="bg-dusk/90 rounded-t-3xl text-white pt-6 pb-8 shadow-2xl relative z-30 mt-[-20px] ">
      
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
                <div className="w-full h-full flex justify-between items-end px-[3%] border-b border-white/10">
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
            <div key={i} className={`flex flex-col items-center min-w-[70px] p-3 rounded-2xl ${i === 0 ? 'bg-white/10 shadow-inner' : 'hover:bg-white/10'} transition-colors`}>
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
        <h3 className="text-white/70 font-medium mb-3 pl-1 text-sm tracking-wide">{t.detailedConditions || 'Detailed Conditions'}</h3>
        <div className="grid grid-cols-2 gap-3">
          
          {/* Feels Like & Humidity */}
          <div className="glass-panel transition-all duration-300 rounded-2xl p-4 border border-white/10 flex flex-col justify-between shadow-sm hover:shadow-md cursor-default">
            <div className="text-white/50 text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>
              {t.feelsLike}
            </div>
            <div className="text-2xl font-semibold text-white drop-shadow-sm">{weather.feelsLike}°</div>
          </div>
          
          <div className="glass-panel transition-all duration-300 rounded-2xl p-4 border border-white/10 flex flex-col justify-between shadow-sm hover:shadow-md cursor-default">
            <div className="text-white/50 text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
              {t.hum}
            </div>
            <div className="text-2xl font-semibold text-white drop-shadow-sm">{weather.humidity}%</div>
          </div>

          {/* Visibility & UV Index */}
          <div className="glass-panel transition-all duration-300 rounded-2xl p-4 border border-white/10 flex flex-col justify-between shadow-sm hover:shadow-md cursor-default">
            <div className="text-white/50 text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              {t.vis}
            </div>
            <div className="text-2xl font-semibold text-white drop-shadow-sm">{(weather.visibility / 1000).toFixed(1)} km</div>
          </div>
          
          <div className="glass-panel transition-all duration-300 rounded-2xl p-4 border border-white/10 flex flex-col justify-between shadow-sm hover:shadow-md cursor-default">
            <div className="text-white/50 text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              {t.uv}
            </div>
            <div className="text-2xl font-semibold text-white drop-shadow-sm">{weather.uvIndex}</div>
          </div>

          {/* Sunrise & Sunset 24h Tracker (Full width row) */}
          <SunMoonTracker weather={weather} t={t} locale={locale} />

        </div>
      </div>

      {/* Live Radar Map */}
      <div className="px-6 pb-4">
        <RadarMap lat={lat} lng={lng} />
      </div>
      
    </div>
  );
}
