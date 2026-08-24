import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function SevereAlertBanner() {
  const { state, dispatch } = useApp();
  const [expanded, setExpanded] = useState(false);

  if (!state.severeAlert) return null;

  const { summary, detail, action, isSevere } = state.severeAlert;

  return (
    <div className={`${
      isSevere !== false ? 'bg-clay' : 'bg-amber'
    } text-white mx-3 mb-1 rounded-bubble overflow-hidden shadow-lg`}>
      {/* Summary bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-medium flex-1">{summary}</span>
        <svg
          className={`w-4 h-4 ml-2 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-3 space-y-2 border-t border-white/20 pt-2">
          <p className="text-sm text-white/90">{detail}</p>
          {action && (
            <p className="text-sm font-medium bg-white/15 rounded-lg px-3 py-2">
              💡 {action}
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
  );
}
