import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LANGUAGES } from '../utils/constants';
import AccessibilityPanel from './AccessibilityPanel';
import { UI_TRANSLATIONS } from '../utils/translations';

export default function Header() {
  const { state, dispatch } = useApp();
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showA11y, setShowA11y] = useState(false);

  const currentLang = LANGUAGES.find(l => l.code === state.language) || LANGUAGES[0];
  const t = UI_TRANSLATIONS[state.language] || UI_TRANSLATIONS['en'];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0c1a]/80 backdrop-blur-md border-b border-white/10 pt-3 pb-3">
      <div className="mx-auto px-6 flex items-center justify-between max-w-[1400px]">
        
        {/* Left: App name */}
        <div className="flex items-center gap-3 w-1/3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <span className="text-white text-xs font-bold">W</span>
          </div>
          <h1 className="font-heading font-semibold text-lg tracking-tight text-white drop-shadow-md">
            WeatherGPT
          </h1>
        </div>

        {/* Center: Dual Mode Tabs */}
        <div className="flex justify-center flex-1 max-w-md mx-4">
          <div className="flex w-full rounded-full p-1 bg-white/5 border border-white/10 shadow-inner overflow-x-auto scrollbar-hide">
            <button
              onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'chat' })}
              className={`flex-1 px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all duration-300 whitespace-nowrap ${
                state.activeTab === 'chat'
                  ? 'bg-white/15 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)] border border-white/20'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {t.tabChat}
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'stage' })}
              className={`flex-1 px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all duration-300 whitespace-nowrap ${
                state.activeTab === 'stage'
                  ? 'bg-white/15 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)] border border-white/20'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {t.tabStage}
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'alerts' })}
              className={`flex-1 px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all duration-300 whitespace-nowrap ${
                state.activeTab === 'alerts'
                  ? 'bg-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)] border border-red-500/30'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <span className="flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                {t.tabAlerts}
              </span>
            </button>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center justify-end gap-3 w-1/3">
          {/* Accessibility toggle */}
          <button
            onClick={() => setShowA11y(!showA11y)}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-colors text-white/70 hover:bg-white/10 bg-white/5 border border-white/10"
            aria-label="Accessibility settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8a1 1 0 100-2 1 1 0 000 2zm-3 4h6m-5 4h4"/>
            </svg>
          </button>

          {/* Language pill */}
          <div className="relative">
            <button
              onClick={() => setShowLangPicker(!showLangPicker)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 bg-white/5 hover:bg-white/10 text-white border border-white/10"
              aria-label={`Language: ${currentLang.label}`}
            >
              {currentLang.nativeLabel}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            {showLangPicker && (
              <div className="absolute right-0 top-full mt-2 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.5)] py-1 min-w-[140px] z-50 border bg-[#1a1c29] border-white/10 text-white">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      dispatch({ type: 'SET_LANGUAGE', payload: lang.code });
                      setShowLangPicker(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-white/10 ${
                      state.language === lang.code 
                        ? 'text-blue-400 font-medium' 
                        : ''
                    }`}
                  >
                    {lang.nativeLabel}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Profile Icon Placeholder */}
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 text-white border border-white/10">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
        </div>
      </div>

      {/* Accessibility panel slides down */}
      {showA11y && <AccessibilityPanel onClose={() => setShowA11y(false)} />}
    </header>
  );
}
