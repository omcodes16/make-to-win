import React from 'react';
import { useApp } from '../context/AppContext';

export default function AccessibilityPanel({ onClose }) {
  const { state, dispatch } = useApp();

  return (
    <div className="border-t border-cloud bg-base/95 backdrop-blur-sm">
      <div className="max-w-lg mx-auto px-4 py-3 space-y-3">
        {/* Large text toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-dusk">Large text</span>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_LARGE_TEXT' })}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              state.isLargeText ? 'bg-teal' : 'bg-cloud'
            }`}
            role="switch"
            aria-checked={state.isLargeText}
            aria-label="Toggle large text"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                state.isLargeText ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {/* High contrast toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-dusk">High contrast</span>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_HIGH_CONTRAST' })}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              state.isHighContrast ? 'bg-teal' : 'bg-cloud'
            }`}
            role="switch"
            aria-checked={state.isHighContrast}
            aria-label="Toggle high contrast"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                state.isHighContrast ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
