import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function SevereAlertBanner() {
  const { state, dispatch } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [govExpanded, setGovExpanded] = useState(false);

  const hasGovAlerts = state.governmentAlerts && state.governmentAlerts.length > 0;
  
  if (!state.severeAlert && !hasGovAlerts) return null;

  return (
    <div className="mx-3 mb-1 space-y-2">
      {hasGovAlerts && state.governmentAlerts.map((alert, idx) => (
        <div key={idx} className="bg-red-950/60 glass-alert text-white rounded-3xl overflow-hidden border-red-500/40">
          <button
            onClick={() => setGovExpanded(!govExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-1.998A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
                </svg>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">Authority Alert</span>
                <span className="text-[10px] bg-red-800 px-1.5 py-0.5 rounded ml-auto flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                  Live
                </span>
              </div>
              <span className="text-sm font-medium">{alert.title || "Severe Weather Warning"}</span>
            </div>
            <svg
              className={`w-4 h-4 ml-2 transition-transform ${govExpanded ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {govExpanded && (
            <div className="px-4 pb-3 space-y-2 border-t border-white/10 pt-2">
              <p className="text-sm text-white/90">{alert.description || "Official government advisory is currently active for this region."}</p>
              <p className="text-xs text-white/70 italic">Source: WeatherGPT Disaster Manager</p>
            </div>
          )}
        </div>
      ))}

      {state.severeAlert && (
        <div className={`${state.severeAlert.isSevere !== false ? 'bg-red-950/50' : 'bg-amber-950/50'} glass-alert text-white rounded-3xl overflow-hidden`}>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <div className="flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/70 mb-0.5 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Forecast-based Advisory
              </div>
              <span className="text-sm font-medium flex-1">{state.severeAlert.summary}</span>
            </div>
            <svg
              className={`w-4 h-4 ml-2 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expanded && (
            <div className="px-4 pb-3 space-y-2 border-t border-white/10 pt-2">
              <p className="text-sm text-white/90">{state.severeAlert.detail}</p>
              {state.severeAlert.action && (
                <p className="text-sm font-medium bg-white/10  rounded-xl px-3 py-2 border border-white/10">
                  🛡️ {state.severeAlert.action}
                </p>
              )}
              <button
                onClick={() => dispatch({ type: 'DISMISS_ALERT' })}
                className="text-xs text-white/70 hover:text-white underline"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
