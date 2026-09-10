import React, { useState, useEffect } from 'react';
import { getWeatherInfo } from '../utils/weatherConditions';
import { useApp } from '../context/AppContext';
import { speakText, stopSpeech, subscribeToTts } from '../utils/tts';
import Tooltip from './Tooltip';
import { UI_TRANSLATIONS } from '../utils/translations';

export default function AssistantCard({ message, isLatest }) {
  const { id, text, data, advisory, severity, relevantStat, confidence = "high" } = message;
  
  const { state } = useApp();
  const t = UI_TRANSLATIONS[state.language] || UI_TRANSLATIONS['en'];
  const [isSpeakingThis, setIsSpeakingThis] = useState(false);
  
  useEffect(() => {
    const unsubscribe = subscribeToTts((speakingId) => {
      setIsSpeakingThis(speakingId === id);
    });
    return unsubscribe;
  }, [id]);

  const handlePlayToggle = () => {
    if (isSpeakingThis) {
      stopSpeech();
    } else {
      speakText(id, text, state.language, (fallbackMsg) => {
        console.warn(fallbackMsg);
      });
    }
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
    <div className="flex justify-start mb-2.5 sm:mb-5 animate-slide-up">
      <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-sky-500/10 dark:bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 mr-2 sm:mr-3 flex-shrink-0 shadow-xs mt-0.5">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5">
          <path d="M12 2a10 10 0 1 0 10 10" />
          <path d="M12 6a6 6 0 1 0 6 6" />
          <path d="M12 10a2 2 0 1 0 2 2" />
          <path d="M12 12 21.5 2.5" />
        </svg>
      </div>
      <div className="max-w-[96%] sm:max-w-[90%] lg:max-w-[92%] space-y-1.5 sm:space-y-2">
        {/* Main response card */}
        <div className="glass-ai-card rounded-xl sm:rounded-3xl rounded-tl-sm">
          {/* Conversational answer */}
          <div className="px-3 py-2.5 sm:px-5 sm:pt-4 sm:pb-3 flex justify-between items-start gap-2 sm:gap-4">
            <div className="flex-1 flex items-start gap-2">
              <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mt-1 sm:mt-2 shrink-0 ${confidence === "low" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" : confidence === "medium" ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"}`} title={`Forecast Confidence: ${confidence.toUpperCase()}`}></span>
              <p className="text-xs sm:text-[15px] text-theme-primary leading-relaxed">{text}</p>
            </div>
            <button 
              onClick={handlePlayToggle}
              className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full transition-all flex-shrink-0 mt-0.5 ${
                isSpeakingThis 
                  ? 'bg-amber-500/20 text-amber-400 animate-pulse border border-amber-500/30' 
                  : 'bg-white/10 text-theme-muted hover:bg-white/10 hover:text-theme-primary border border-theme-border'
              }`}
              aria-label={isSpeakingThis ? "Stop speaking" : "Play response"}
            >
              {isSpeakingThis ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>
          </div>

          {/* Compact data row */}
          {data && (
            <div className="px-3 sm:px-5 py-2 sm:py-3 border-t border-theme-border flex items-center gap-2 sm:gap-4 text-xs sm:text-sm bg-black/5 dark:bg-white/10 flex-wrap">
              {weatherInfo && (
                <span className="text-lg sm:text-2xl drop-shadow-md" role="img" aria-label={weatherInfo.label}>
                  {weatherInfo.icon}
                </span>
              )}
              <span className="font-semibold text-xs sm:text-lg text-theme-primary truncate max-w-[170px] sm:max-w-none">
                {[
                  data.locationName,
                  data.temperature != null && !isNaN(Number(data.temperature))
                    ? `${Math.round(Number(data.temperature))}°C`
                    : null
                ].filter(Boolean).join(' · ')}
              </span>
              {/* Show AI-picked relevant stat if available, otherwise fall back */}
              {relevantStat ? (
                <span className="text-theme-muted text-[11px] sm:text-xs font-medium uppercase tracking-wide">
                  {relevantStat}
                  {relevantStat.includes('HEAT') && <Tooltip text={t.tooltipHeatIndex} />}
                </span>
              ) : (
                <>
                  {data.humidity !== undefined && (
                    <span className="text-theme-muted text-[11px] sm:text-xs font-medium">
                      💧 {data.humidity}%
                    </span>
                  )}
                  {data.windSpeed !== undefined && data.windSpeed > 0 && (
                    <span className="text-theme-muted text-[11px] sm:text-xs font-medium">
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
              className={`px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-medium ${
                severity === 'severe'
                  ? 'bg-red-500/20 text-red-500 dark:text-red-400 border-t border-red-500/20'
                  : 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-t border-yellow-500/20'
              }`}
            >
              {severity === 'severe' ? '⚠️' : '🔔'} {advisory}
                <Tooltip text={t.tooltipSeverity} />
            </div>
          )}

          {/* NWP Model Consensus Badge */}
          {data?.modelData && (
            <div className={`px-3 sm:px-5 py-1.5 sm:py-2.5 border-t border-theme-border text-[10px] sm:text-xs font-semibold flex items-center gap-1.5 sm:gap-2 bg-black/5 dark:bg-black/20`}>
              <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isDivergent ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
              <span className={isDivergent ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                {isDivergent 
                  ? `NWP Divergence (Δ ${tempDiff.toFixed(1)}°C, ${precipDiff}%)` 
                  : 'NWP Models Agree (High Confidence)'}
                <Tooltip text={t.tooltipNwp} />
              </span>
              <span className="text-theme-muted opacity-60 ml-auto hidden sm:inline-block tracking-wider">GFS • ICON • ECMWF</span>
            </div>
          )}

          {/* Official IST Generation & Day Phase Grounding Badge */}
          <div className="px-3 sm:px-5 py-1.5 sm:py-2 border-t border-theme-border flex items-center justify-between text-[10px] sm:text-[11px] text-theme-muted opacity-85 flex-wrap gap-1 bg-black/5 dark:bg-white/[0.02]">
            <div className="flex items-center gap-1 sm:gap-1.5 font-medium text-[9px] sm:text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0"></span>
              <span>{message.timestamp || 'Live IST Synchronized'}</span>
            </div>
            {message.dayPhase && (
              <span className="text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300">
                {message.dayPhase}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
