import React, { useState } from 'react';
import Tooltip from './Tooltip';
import { UI_TRANSLATIONS } from '../utils/translations';
import NwpDivergenceVisualizer from './NwpDivergenceVisualizer';

export default function ModelConfidence({ modelData, selectedDay = 0, language = 'en', confidence = 'high' }) {
  const [expanded, setExpanded] = useState(false);
  const [showRadarModal, setShowRadarModal] = useState(false);
  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS['en'];

  if (!modelData || !modelData.daily) return null;

  // Extract values for the selected day
  const { gfs, icon, ecmwf, consensus, divergence } = modelData.daily;
  
  const models = [
    { name: 'ECMWF IFS', flag: '🇪🇺', temp: ecmwf?.maxTemp?.[selectedDay], precip: ecmwf?.precipProbMax?.[selectedDay] },
    { name: 'NOAA GFS', flag: '🇺🇸', temp: gfs?.maxTemp?.[selectedDay], precip: gfs?.precipProbMax?.[selectedDay] },
    { name: 'DWD ICON', flag: '🇩🇪', temp: icon?.maxTemp?.[selectedDay], precip: icon?.precipProbMax?.[selectedDay] }
  ].filter(m => m.temp !== null && m.temp !== undefined);

  if (models.length < 2) {
    return null;
  }

  const currentDivergence = divergence?.[selectedDay] || {};
  const isLow = confidence === 'low' || currentDivergence.agreementLevel === 'low';
  const isDivergent = isLow || confidence === 'medium' || currentDivergence.agreementLevel === 'medium';

  return (
    <>
      <div className={`mt-4 mb-4 glass-panel border ${isLow ? 'border-red-500/30' : isDivergent ? 'border-amber-500/30' : 'border-emerald-500/30'} rounded-3xl p-4 sm:p-5 shadow-xl transition-all`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Left Title & Status */}
          <div 
            className="flex items-center gap-3 cursor-pointer flex-1"
            onClick={() => setExpanded(!expanded)}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isLow ? 'bg-red-500/20 text-red-400' : isDivergent ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {isDivergent ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              )}
            </div>
            <div>
              <div className="text-sm sm:text-base font-semibold text-white flex items-center gap-1.5 flex-wrap">
                <span>{isDivergent ? (t.modelsDiverge || 'Models diverge — check back closer to the date') : (t.modelsAgree || 'Models agree — high confidence')}</span>
                <Tooltip text={t.tooltipNwp} />
              </div>
              <div className="text-xs sm:text-sm text-white/60 mt-0.5">
                {(t.poweredBy || 'Consensus engine powered by')} GFS (USA) • ECMWF (EU) • ICON (Germany)
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Direct 1-Click Radar Visualizer Trigger */}
            <button
              onClick={() => setShowRadarModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/25 to-sky-500/25 hover:from-indigo-500/40 hover:to-sky-500/40 border border-indigo-400/40 hover:border-indigo-400/80 text-white text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer select-none"
              title="Open NWP Multi-Model Spider/Radar Chart"
            >
              <span>🕸️</span>
              <span className="hidden sm:inline">Radar Chart</span>
              <span className="sm:hidden">Radar</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            {/* Expand / Collapse Chevron */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer"
              title={expanded ? 'Collapse' : 'Expand'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transform transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
        </div>

        {/* Inline Expanded View */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-4 animate-fade-in">
            <NwpDivergenceVisualizer
              modelData={modelData}
              selectedDay={selectedDay}
              language={language}
              isModal={false}
            />
          </div>
        )}
      </div>

      {/* Standalone Full-Screen Modal Radar Visualizer */}
      {showRadarModal && (
        <NwpDivergenceVisualizer
          modelData={modelData}
          selectedDay={selectedDay}
          language={language}
          isModal={true}
          onClose={() => setShowRadarModal(false)}
        />
      )}
    </>
  );
}
