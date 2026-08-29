import React, { useState } from 'react';
import Tooltip from './Tooltip';
import { UI_TRANSLATIONS } from '../utils/translations';

export default function ModelConfidence({ modelData, selectedDay, language = 'en', confidence = 'high' }) {
  const [expanded, setExpanded] = useState(false);
  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS['en'];

  if (!modelData || !modelData.daily) return null;

  // Extract values for the selected day
  const { gfs, icon, ecmwf } = modelData.daily;
  
  const models = [
    { name: 'GFS', temp: gfs.maxTemp?.[selectedDay], precip: gfs.precipProbMax?.[selectedDay] },
    { name: 'ICON', temp: icon.maxTemp?.[selectedDay], precip: icon.precipProbMax?.[selectedDay] },
    { name: 'ECMWF', temp: ecmwf.maxTemp?.[selectedDay], precip: ecmwf.precipProbMax?.[selectedDay] }
  ].filter(m => m.temp !== null && m.temp !== undefined); // filter out models that return null

  if (models.length < 2) {
    return null; // Not enough models to compare
  }

  const isLow = confidence === 'low';
  const isDivergent = confidence === 'low' || confidence === 'medium';

  return (
    <div className={`mt-4 mb-4 glass-panel border ${isLow ? 'border-red-500/30' : isDivergent ? 'border-amber-500/30' : 'border-emerald-500/30'} rounded-3xl p-4 sm:p-5 shadow-xl transition-all`}>
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isLow ? 'bg-red-500/20 text-red-400' : isDivergent ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            {isDivergent ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            )}
          </div>
          <div>
            <div className="text-sm sm:text-base font-semibold text-white">
              {isDivergent ? 'Models diverge — check back closer to the date' : 'Models agree — high confidence'}
              <Tooltip text={t.tooltipNwp} />
            </div>
            <div className="text-xs sm:text-sm text-white/60 mt-0.5">
              Powered by Open-Meteo Best Match ({models.map(m => m.name).join(', ')})
            </div>
          </div>
        </div>
        <div className="text-white/40 hover:text-white/80 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transform transition-transform ${expanded ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">Model Breakdown</div>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {models.map(m => (
              <div key={m.name} className="glass-panel border border-white/10 rounded-xl p-3 flex flex-col items-center text-center">
                <span className="text-xs sm:text-sm font-semibold text-white/80 mb-2">{m.name}</span>
                <div className="text-lg sm:text-xl font-bold text-white mb-1">{Math.round(m.temp)}°C</div>
                {m.precip !== undefined && m.precip !== null && (
                  <div className="text-[10px] sm:text-xs text-white/60 flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                    {m.precip}%
                  </div>
                )}
              </div>
            ))}
          </div>
          {isDivergent && (
            <div className={`mt-3 text-[11px] sm:text-xs rounded-lg p-2.5 ${isLow ? 'text-red-300/80 bg-red-500/10' : 'text-amber-300/80 bg-amber-500/10'}`}>
              Models disagree on the forecast (Confidence: {confidence.toUpperCase()}). The default blended forecast is shown above.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
