import React, { useState } from 'react';
import { getWeatherInfo } from '../utils/weatherConditions';

export default function AssistantCard({ message, isLatest }) {
  const { text, data, advisory, severity, followUp, relevantStat, suggestedQuestions } = message;
  const [clickedChip, setClickedChip] = useState(null);

  const handleChipClick = (question) => {
    setClickedChip(question);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('weathergpt-send', { detail: question }));
    }, 150);
  };

  // Get weather info for the icon if we have weather data
  const weatherInfo = data ? getWeatherInfo(data.weatherCode) : null;

  // Compute NWP Model Divergence for the badge
  let isDivergent = false;
  let tempDiff = 0;
  let precipDiff = 0;
  
  if (data?.modelData?.daily) {
    const { gfs, icon, ecmwf } = data.modelData.daily;
    if (gfs && icon && ecmwf) {
      const temps = [gfs.maxTemp?.[0], icon.maxTemp?.[0], ecmwf.maxTemp?.[0]].filter(t => t != null);
      const precips = [gfs.precipProbMax?.[0], icon.precipProbMax?.[0], ecmwf.precipProbMax?.[0]].filter(p => p != null);
      
      if (temps.length > 1) {
        tempDiff = Math.max(...temps) - Math.min(...temps);
        precipDiff = precips.length > 1 ? Math.max(...precips) - Math.min(...precips) : 0;
        
        if (tempDiff > 2 || precipDiff > 20) {
          isDivergent = true;
        }
      }
    }
  }

  return (
    <div className="flex justify-start mb-6 animate-slide-up">
      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center shadow-lg border border-white/10 mr-3 flex-shrink-0">
        <span className="text-white text-xs font-bold">W</span>
      </div>
      <div className="max-w-[85%] space-y-2">
        {/* Main response card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl rounded-tl-sm shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden">
          {/* Conversational answer */}
          <div className="px-5 pt-4 pb-3">
            <p className="text-[15px] text-white leading-relaxed">{text}</p>
          </div>

          {/* Compact data row */}
          {data && (
            <div className="px-5 py-3 border-t border-white/10 flex items-center gap-4 text-sm bg-white/5">
              {weatherInfo && (
                <span className="text-2xl drop-shadow-md" role="img" aria-label={weatherInfo.label}>
                  {weatherInfo.icon}
                </span>
              )}
              <span className="font-semibold text-lg text-white">
                {data.temperature}°C
              </span>
              {/* Show AI-picked relevant stat if available, otherwise fall back */}
              {relevantStat ? (
                <span className="text-white/70 text-xs font-medium uppercase tracking-wide">
                  {relevantStat}
                </span>
              ) : (
                <>
                  {data.humidity !== undefined && (
                    <span className="text-white/70 font-medium">
                      💧 {data.humidity}%
                    </span>
                  )}
                  {data.windSpeed !== undefined && data.windSpeed > 0 && (
                    <span className="text-white/70 font-medium">
                      💨 {data.windSpeed} km/h
                    </span>
                  )}
                </>
              )}
            </div>
          )}

          {/* Advisory line */}
          {advisory && (
            <div
              className={`px-5 py-3 text-sm font-medium ${
                severity === 'severe'
                  ? 'bg-red-500/20 text-red-400 border-t border-red-500/20'
                  : 'bg-yellow-500/20 text-yellow-400 border-t border-yellow-500/20'
              }`}
            >
              {severity === 'severe' ? '⚠️' : '🔔'} {advisory}
            </div>
          )}

          {/* NWP Model Consensus Badge */}
          {data?.modelData && (
            <div className={`px-5 py-2.5 border-t border-white/10 text-[11px] sm:text-xs font-semibold flex items-center gap-2 bg-black/20`}>
              <span className={`w-2 h-2 rounded-full ${isDivergent ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
              <span className={isDivergent ? 'text-amber-400' : 'text-emerald-400'}>
                {isDivergent 
                  ? `NWP Divergence (Δ ${tempDiff.toFixed(1)}°C, ${precipDiff}%)` 
                  : 'NWP Models Agree (High Confidence)'}
              </span>
              <span className="text-white/40 ml-auto hidden sm:inline-block tracking-wider">GFS • ICON • ECMWF</span>
            </div>
          )}
        </div>

        {/* Follow-up text outside the card */}
        {followUp && (
          <p className="text-sm text-white/60 px-2 leading-relaxed">{followUp}</p>
        )}

        {/* Suggested Follow-up Questions (Chips) */}
        {isLatest && suggestedQuestions?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 px-1 animate-slide-up" style={{ animationDelay: '300ms' }}>
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleChipClick(q)}
                disabled={clickedChip !== null}
                className={`text-xs px-3.5 py-2 rounded-full border transition-all text-left max-w-full truncate ${
                  clickedChip === q
                    ? 'bg-blue-600/50 border-blue-400 text-white scale-95 shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                    : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20 hover:text-white shadow-sm hover:scale-105'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
