import React, { useState, useEffect } from 'react';
import { getWeatherInfo } from '../utils/weatherConditions';
import { useApp } from '../context/AppContext';
import { speakText, stopSpeech, subscribeToTts } from '../utils/tts';
import Tooltip from './Tooltip';
import { UI_TRANSLATIONS } from '../utils/translations';

export default function AssistantCard({ message, isLatest }) {
  const { id, text, data, advisory, severity, followUp, relevantStat, suggestedQuestions, confidence = "high" } = message;
  const [clickedChip, setClickedChip] = useState(null);
  
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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8.01" y2="16" /><line x1="16" y1="16" x2="16.01" y2="16" /></svg>
      </div>
      <div className="max-w-[85%] space-y-2">
        {/* Main response card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl rounded-tl-sm shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden">
          {/* Conversational answer */}
          <div className="px-5 pt-4 pb-3 flex justify-between items-start gap-4">
            <div className="flex-1 flex items-start gap-2">
              <span className={`w-2 h-2 rounded-full mt-2 shrink-0 ${confidence === "low" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" : confidence === "medium" ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"}`} title={`Forecast Confidence: ${confidence.toUpperCase()}`}></span>
              <p className="text-[15px] text-white leading-relaxed">{text}</p>
            </div>
            <button 
              onClick={handlePlayToggle}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-all flex-shrink-0 mt-0.5 ${
                isSpeakingThis 
                  ? 'bg-amber-500/20 text-amber-400 animate-pulse border border-amber-500/30' 
                  : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
              aria-label={isSpeakingThis ? "Stop speaking" : "Play response"}
            >
              {isSpeakingThis ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>
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
                  {relevantStat.includes('HEAT') && <Tooltip text={t.tooltipHeatIndex} />}
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
                <Tooltip text={t.tooltipSeverity} />
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
                <Tooltip text={t.tooltipNwp} />
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
        {suggestedQuestions?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 px-1 animate-slide-up" style={{ animationFillMode: 'both' }}>
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
