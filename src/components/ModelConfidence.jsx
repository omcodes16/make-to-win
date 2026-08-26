import React, { useState } from 'react';

export default function ModelConfidence({ modelData, selectedDay, language = 'en' }) {
  const [expanded, setExpanded] = useState(false);

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

  // Calculate divergence
  const temps = models.map(m => m.temp);
  const precips = models.map(m => m.precip).filter(p => p !== null && p !== undefined);

  const maxTemp = Math.max(...temps);
  const minTemp = Math.min(...temps);
  const tempDiff = maxTemp - minTemp;

  let precipDiff = 0;
  if (precips.length > 0) {
    const maxPrecip = Math.max(...precips);
    const minPrecip = Math.min(...precips);
    precipDiff = maxPrecip - minPrecip;
  }

  // Thresholds for divergence
  const isDivergent = tempDiff > 2 || precipDiff > 20;

  return (
    <div className={`mt-4 mb-4 bg-white/5 backdrop-blur-2xl border ${isDivergent ? 'border-amber-500/30' : 'border-emerald-500/30'} rounded-3xl p-4 sm:p-5 shadow-xl transition-all`}>
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDivergent ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            {isDivergent ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            )}
          </div>
          <div>
            <div className="text-sm sm:text-base font-semibold text-white">
              {isDivergent ? 'Models diverge — check back closer to the date' : 'Models agree — high confidence'}
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
              <div key={m.name} className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center text-center">
                <span className="text-xs sm:text-sm font-semibold text-white/80 mb-2">{m.name}</span>
                <div className="text-lg sm:text-xl font-bold text-white mb-1">{Math.round(m.temp)}°</div>
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
            <div className="mt-3 text-[11px] sm:text-xs text-amber-300/80 bg-amber-500/10 rounded-lg p-2.5">
              Models disagree by up to {tempDiff.toFixed(1)}°C in temperature{precipDiff > 0 ? ` and ${precipDiff}% in precipitation probability` : ''}. The default blended forecast is shown above.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
