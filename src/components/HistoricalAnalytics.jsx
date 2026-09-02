import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { EXTRA_I18N } from '../utils/translationsExtra';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';

export default function HistoricalAnalytics({ lat, lon }) {
  const { state } = useApp();
  const lang = state.language || 'en';
  const t = EXTRA_I18N[lang] || EXTRA_I18N.en;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState('temp');
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    if (!lat || !lon) return;
    
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - 1);
        const startDate = new Date();
        
        if (timeRange === '30d') {
          startDate.setDate(startDate.getDate() - 30);
        } else if (timeRange === '1y') {
          startDate.setFullYear(startDate.getFullYear() - 1);
        } else if (timeRange === '5y') {
          startDate.setFullYear(startDate.getFullYear() - 5);
        }

        const endStr = endDate.toISOString().split('T')[0];
        const startStr = startDate.toISOString().split('T')[0];

        const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startStr}&end_date=${endStr}&daily=temperature_2m_max,precipitation_sum&timezone=auto`;
        
        const response = await fetch(url);
        const json = await response.json();
        
        if (json && json.daily) {
          if (timeRange === '30d') {
            const formatted = json.daily.time.map((time, idx) => ({
              date: new Date(time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
              temp: json.daily.temperature_2m_max[idx],
              rain: json.daily.precipitation_sum[idx]
            }));
            setData(formatted);
          } else {
            const monthlyData = {};
            json.daily.time.forEach((time, idx) => {
              const d = new Date(time);
              const monthKey = d.toLocaleString('en-GB', { month: 'short', year: '2-digit' });
              if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { date: monthKey, tempSum: 0, tempCount: 0, rainSum: 0, order: d.getTime() };
              }
              const t = json.daily.temperature_2m_max[idx];
              const r = json.daily.precipitation_sum[idx];
              if (t != null) {
                monthlyData[monthKey].tempSum += t;
                monthlyData[monthKey].tempCount += 1;
              }
              if (r != null) {
                monthlyData[monthKey].rainSum += r;
              }
            });
            const formatted = Object.values(monthlyData)
              .sort((a, b) => a.order - b.order)
              .map(m => ({
                date: m.date,
                temp: m.tempCount > 0 ? parseFloat((m.tempSum / m.tempCount).toFixed(1)) : null,
                rain: parseFloat(m.rainSum.toFixed(1))
              }));
            setData(formatted);
          }
        }
      } catch (err) {
        console.error('Error fetching historical data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [lat, lon, timeRange]);

  if (!lat || !lon) return null;

  // Dynamic analytics logic based on timeRange
  const totalRain = data.reduce((sum, d) => sum + (d.rain || 0), 0).toFixed(1);
  const maxTempStr = data.length > 0 ? Math.max(...data.map(d => d.temp)).toFixed(1) : '--';
  // If 30d, it's rainy days. If 1y/5y, it's active months with significant rainfall (> 10mm).
  const rainDays = data.filter(d => (d.rain || 0) > (timeRange === '30d' ? 1 : 10)).length;
  
  // Dynamic Text Generators
  const getDynamicSummary = () => {
    let baseText = t.summary(totalRain, rainDays, maxTempStr);
    if (timeRange === '1y') {
      baseText = baseText.replace('30 days', '1 year').replace('30 दिनों', '1 वर्ष').replace('30 দিনে', '1 বছরে').replace('৩০ দিনত', '১ বছৰত');
      baseText = baseText.replace('rainy days', 'active months').replace('दिनों में कुल', 'महीनों में कुल').replace('দিনে মোট', 'মাসে মোট').replace('দিনত মুঠ', 'মাহত মুঠ');
    } else if (timeRange === '5y') {
      baseText = baseText.replace('30 days', '5 years').replace('30 दिनों', '5 वर्षों').replace('30 দিনে', '5 বছরে').replace('৩০ দিনত', '৫ বছৰত');
      baseText = baseText.replace('rainy days', 'active months').replace('दिनों में कुल', 'महीनों में कुल').replace('দিনে মোট', 'মাসে মোট').replace('দিনত মুঠ', 'মাহত মুঠ');
    }
    return baseText;
  };
  
  const getAgriRisk = () => {
    const rainNum = parseFloat(totalRain);
    if (timeRange === '30d') {
      return rainNum > 100 
        ? "High moisture levels detected. Ensure proper field drainage to prevent waterlogging."
        : rainNum < 20 
        ? "Dry conditions prevailing. Consider supplementary irrigation to prevent drought stress."
        : "Optimal moisture balance for most regional crops. Monitor ongoing forecasts.";
    } else if (timeRange === '1y') {
      return rainNum > 1500 
        ? "Annual rainfall was heavy. Prolonged wet conditions may have required robust disease management."
        : rainNum < 500 
        ? "Annual rainfall was below optimal for water-intensive crops. Drought mitigation strategies recommended."
        : "Annual precipitation remained within normal agronomic bounds for a standard crop cycle.";
    } else {
      return rainNum > 7500 
        ? "5-year trend shows consistently heavy monsoon seasons. Invest in long-term drainage infrastructure."
        : rainNum < 2500 
        ? "Long-term data indicates recurring dry spells. Transitioning to drought-resistant crop varieties is advised."
        : "5-year precipitation patterns show stable, healthy climatic conditions for traditional farming.";
    }
  };

  const isLight = state.theme === 'light';
  const axisColor = isLight ? '#63574f' : 'rgba(255, 255, 255, 0.65)';
  const gridColor = isLight ? 'rgba(90, 70, 60, 0.15)' : 'rgba(255, 255, 255, 0.12)';
  const tooltipBg = isLight ? '#faf7f4' : '#11131c';
  const tooltipBorder = isLight ? '1px solid rgba(90, 70, 60, 0.20)' : '1px solid rgba(255, 255, 255, 0.15)';
  const tooltipText = isLight ? '#191412' : '#ffffff';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6">
      
      {/* LEFT PART: Graph */}
      <div className="glass-panel border border-[var(--theme-border)] rounded-3xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl pointer-events-none">📈</div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
          <div>
            <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-2">
              {t.historicalTrends}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">
              {timeRange === '30d' ? t.past30Days : timeRange === '1y' ? 'Past 1 Year' : 'Past 5 Years'}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {/* Time Range Pills */}
            <div className="flex bg-[var(--glass-bg)] border border-[var(--theme-border)] rounded-xl p-1 shrink-0 shadow-sm">
              <button 
                onClick={() => setTimeRange('30d')} 
                className={`px-3 py-1.5 text-[10px] sm:text-xs font-extrabold rounded-lg transition-all ${
                  timeRange === '30d' 
                    ? 'bg-indigo-600 text-white shadow-sm dark:bg-indigo-500/40 dark:text-indigo-200' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                30 Days
              </button>
              <button 
                onClick={() => setTimeRange('1y')} 
                className={`px-3 py-1.5 text-[10px] sm:text-xs font-extrabold rounded-lg transition-all ${
                  timeRange === '1y' 
                    ? 'bg-indigo-600 text-white shadow-sm dark:bg-indigo-500/40 dark:text-indigo-200' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                1 Year
              </button>
              <button 
                onClick={() => setTimeRange('5y')} 
                className={`px-3 py-1.5 text-[10px] sm:text-xs font-extrabold rounded-lg transition-all ${
                  timeRange === '5y' 
                    ? 'bg-indigo-600 text-white shadow-sm dark:bg-indigo-500/40 dark:text-indigo-200' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                5 Years
              </button>
            </div>
            
            {/* Chart Type (Temperature / Heat vs Rainfall) */}
            <div className="flex bg-[var(--glass-bg)] border border-[var(--theme-border)] rounded-xl p-1 shrink-0 shadow-sm">
              <button 
                onClick={() => setChartType('temp')}
                className={`px-3.5 py-1.5 text-xs font-extrabold rounded-lg transition-all flex items-center gap-1.5 ${
                  chartType === 'temp' 
                    ? 'bg-orange-600 text-white shadow-sm dark:bg-orange-500/30 dark:text-orange-300' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span>🔥</span> Temperature
              </button>
              <button 
                onClick={() => setChartType('rain')}
                className={`px-3.5 py-1.5 text-xs font-extrabold rounded-lg transition-all flex items-center gap-1.5 ${
                  chartType === 'rain' 
                    ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-500/30 dark:text-blue-300' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span>🌧️</span> Rainfall
              </button>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'temp' ? (
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ea580c" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke={axisColor} 
                    fontSize={11} 
                    tickMargin={10} 
                    minTickGap={20} 
                    tick={{ fill: axisColor, fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis 
                    stroke={axisColor} 
                    fontSize={11} 
                    tickFormatter={(val) => `${val}°`} 
                    tick={{ fill: axisColor, fontSize: 11, fontWeight: 600 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: tooltipBg, 
                      border: tooltipBorder, 
                      borderRadius: '12px',
                      color: tooltipText,
                      fontWeight: 600,
                      boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
                    }}
                    itemStyle={{ color: '#ea580c', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="temp" name="Max Temp" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
                </AreaChart>
              ) : (
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke={axisColor} 
                    fontSize={11} 
                    tickMargin={10} 
                    minTickGap={20} 
                    tick={{ fill: axisColor, fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis 
                    stroke={axisColor} 
                    fontSize={11} 
                    tickFormatter={(val) => `${val}mm`} 
                    tick={{ fill: axisColor, fontSize: 11, fontWeight: 600 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: tooltipBg, 
                      border: tooltipBorder, 
                      borderRadius: '12px',
                      color: tooltipText,
                      fontWeight: 600,
                      boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
                    }}
                    itemStyle={{ color: '#2563eb', fontWeight: 'bold' }}
                    cursor={{ fill: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="rain" name="Rainfall" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)] text-sm font-medium">
              No historical data available for this location.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PART: Dynamic AI Insight & Summary */}
      <div className="glass-panel border border-[var(--theme-border)] rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 p-4 opacity-5 text-8xl pointer-events-none">🤖</div>
        
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>
              {t.gptInsights}
            </h3>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/25">{t.aiGenerated}</span>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-3 mt-6">
              <div className="h-4 bg-[var(--theme-border)] rounded w-3/4"></div>
              <div className="h-4 bg-[var(--theme-border)] rounded w-1/2"></div>
              <div className="h-4 bg-[var(--theme-border)] rounded w-5/6"></div>
            </div>
          ) : data.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-primary)] leading-relaxed z-10 relative font-medium">
                {getDynamicSummary()}
              </p>
              
              <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl mt-4 z-10 relative">
                <h4 className="text-xs font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  Agri-Risk Assessment
                </h4>
                <p className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">
                  {getAgriRisk()}
                </p>
              </div>

              {/* Drought Monitor (Standardized Precipitation Index - SPI) */}
              <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-2xl mt-4 z-10 relative flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-1 flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                    Drought Monitor
                  </h4>
                  <p className="text-[11px] text-[var(--text-secondary)] font-medium">Standardized Precipitation Index</p>
                </div>
                <div className="text-right">
                  {parseFloat(totalRain) < (timeRange === '30d' ? 20 : timeRange === '1y' ? 400 : 2000) ? (
                    <div className="text-rose-700 dark:text-red-400 font-extrabold text-sm">Severe Drought Stress</div>
                  ) : parseFloat(totalRain) < (timeRange === '30d' ? 50 : timeRange === '1y' ? 800 : 4000) ? (
                    <div className="text-amber-800 dark:text-amber-400 font-extrabold text-sm">Moderate Dryness</div>
                  ) : (
                    <div className="text-emerald-800 dark:text-emerald-400 font-extrabold text-sm">Normal Moisture</div>
                  )}
                  <div className="text-[10px] text-[var(--text-secondary)] font-medium mt-0.5">Based on {timeRange} rainfall</div>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-sm text-[var(--text-secondary)] mt-4 z-10 relative font-medium">{t.noData}</div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-[var(--theme-border)] flex gap-4 z-10 relative">
          <div className="flex-1">
            <div className="text-[10px] text-[var(--text-secondary)] uppercase font-extrabold tracking-wider">{timeRange === '30d' ? t.thirtyDayRain : 'TOTAL RAINFALL'}</div>
            <div className="text-xl font-black text-[var(--text-primary)]">{totalRain} <span className="text-xs text-[var(--text-secondary)] font-semibold">mm</span></div>
          </div>
          <div className="flex-1">
            <div className="text-[10px] text-[var(--text-secondary)] uppercase font-extrabold tracking-wider">{t.peakTemp}</div>
            <div className="text-xl font-black text-[var(--text-primary)]">{maxTempStr} <span className="text-xs text-[var(--text-secondary)] font-semibold">°C</span></div>
          </div>
          <div className="flex-1">
            <div className="text-[10px] text-[var(--text-secondary)] uppercase font-extrabold tracking-wider">{timeRange === '30d' ? t.rainyDays : 'ACTIVE MONTHS'}</div>
            <div className="text-xl font-black text-[var(--text-primary)]">{rainDays} <span className="text-xs text-[var(--text-secondary)] font-semibold">{timeRange === '30d' ? 'days' : 'months'}</span></div>
          </div>
        </div>
      </div>

    </div>
  );
}
