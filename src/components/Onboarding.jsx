import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LANGUAGES } from '../utils/constants';
import { WEATHER_THEMES } from '../utils/themes';
import { EXTRA_I18N } from '../utils/translationsExtra';
import UserGuideModal from './UserGuideModal';

const PROFILES = [
  { code: 'general', label: 'General User', sub: 'सामान्य नागरिक', icon: '🌍' },
  { code: 'farmer', label: 'Farmer', sub: 'किसान / कृषि', icon: '🌾' },
  { code: 'fisherman', label: 'Fisherman', sub: 'मछुआरा / तटीय', icon: '🎣' },
  { code: 'aviation', label: 'Aviation', sub: 'उड्डयन / पायलट', icon: '✈️' },
  { code: 'urbanPlanning', label: 'Urban Planner', sub: 'शहरी योजनाकार', icon: '🏙️' }
];

export default function Onboarding() {
  const { state, dispatch } = useApp();
  const theme = WEATHER_THEMES.clear;
  const [step, setStep] = useState(1);
  const [langSearch, setLangSearch] = useState('');
  const [isGuideOpen, setGuideOpen] = useState(false);
  const t = EXTRA_I18N[state.language] || EXTRA_I18N.en;

  const filteredLanguages = LANGUAGES.filter(l => 
    l.label.toLowerCase().includes(langSearch.toLowerCase()) ||
    l.nativeLabel.toLowerCase().includes(langSearch.toLowerCase()) ||
    l.code.toLowerCase().includes(langSearch.toLowerCase())
  );

  const handleProfileSelect = (profileCode) => {
    dispatch({ type: 'SET_PROFILE', payload: profileCode });
    setStep(2);
  };

  const handleLanguageSelect = (langCode) => {
    dispatch({ type: 'SET_LANGUAGE', payload: langCode });
    dispatch({ type: 'SET_ONBOARDED' });
  };

  const handleSkip = () => {
    dispatch({ type: 'SET_ONBOARDED' });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 sm:p-6 bg-transparent relative transition-colors duration-1000">
      {/* Fixed Background Image */}
      <div className="fixed inset-0 z-0 bg-cover bg-center transition-opacity duration-1000" style={{ backgroundImage: 'url(/backgrounds/onboarding_clean.jpg)' }}></div>
      
      {/* Overlay */}
      <div className={`fixed inset-0 z-0 bg-gradient-to-br ${theme.overlay} pointer-events-none`}></div>

      {/* Top Action Bar */}
      <div className="absolute top-5 right-5 flex items-center gap-2 z-50">
        <button 
          onClick={() => setGuideOpen(true)}
          className="text-indigo-200 hover:text-white transition-all text-xs sm:text-sm font-semibold px-3.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 rounded-full border border-indigo-400/30 backdrop-blur-md shadow-lg flex items-center gap-1.5"
        >
          <span>📖</span>
          <span>User Guide</span>
        </button>

        <button 
          onClick={handleSkip} 
          className="text-white/70 hover:text-white transition-all text-xs sm:text-sm font-semibold px-3.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-full border border-white/15 backdrop-blur-md shadow-lg"
        >
          Skip ➔
        </button>
      </div>

      <div className="w-full max-w-sm sm:max-w-md flex flex-col items-center animate-fade-in relative z-10 space-y-6">
        
        {/* Logo / Brand Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(99,102,241,0.5)] border-2 border-indigo-400/40 p-0.5 bg-gradient-to-tr from-indigo-600 to-sky-400">
            <img src="/logo.png" alt="WeatherGPT Logo" className="w-full h-full object-cover rounded-[22px]" />
          </div>
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-3xl sm:text-4xl font-heading font-black text-white drop-shadow-md tracking-tight">
                Weather<span className="text-indigo-400">GPT</span>
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md">SIH '26</span>
            </div>
            <p className="text-white/80 text-sm sm:text-base font-medium">
              {step === 1 ? "Select your Category / श्रेणी चुनें" : "Choose Language / भाषा चुनें"}
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          <span className={`w-8 h-1.5 rounded-full transition-all ${step === 1 ? 'bg-indigo-400 w-12' : 'bg-white/30'}`}></span>
          <span className={`w-8 h-1.5 rounded-full transition-all ${step === 2 ? 'bg-indigo-400 w-12' : 'bg-white/30'}`}></span>
        </div>

        {/* Selection Grid */}
        <div className="w-full grid grid-cols-1 gap-3 pt-2">
          {step === 1 ? (
            PROFILES.map((profile) => (
              <button
                key={profile.code}
                onClick={() => handleProfileSelect(profile.code)}
                className="glass-panel border border-white/10 hover:bg-indigo-600/30 hover:border-indigo-400/50 text-white font-medium py-3.5 px-5 rounded-2xl transition-all shadow-lg flex items-center justify-between group text-left"
              >
                <div className="flex items-center gap-3.5">
                  <span className="text-2xl sm:text-3xl p-2 rounded-xl bg-white/10 group-hover:scale-110 transition-transform">{profile.icon}</span>
                  <div>
                    <div className="text-base sm:text-lg font-bold text-white group-hover:text-indigo-200 transition-colors">{profile.label}</div>
                    <div className="text-xs text-white/60">{profile.sub}</div>
                  </div>
                </div>
                <span className="text-white/40 group-hover:text-indigo-300 group-hover:translate-x-1 transition-all text-lg font-bold">➔</span>
              </button>
            ))
          ) : (
            <div className="space-y-3">
              {/* Language Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={langSearch}
                  onChange={(e) => setLangSearch(e.target.value)}
                  placeholder="🔍 Search language / भाषा खोजें..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/50 focus:outline-none focus:border-emerald-400/80 focus:bg-white/15 transition-all shadow-inner"
                  autoFocus
                />
                {langSearch && (
                  <button 
                    onClick={() => setLangSearch('')}
                    className="absolute right-3 top-2.5 text-xs text-white/60 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Scrollable Language List */}
              <div className="max-h-64 sm:max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filteredLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang.code)}
                    className="w-full glass-panel border border-white/10 hover:bg-emerald-600/30 hover:border-emerald-400/50 text-white font-medium py-2.5 px-4 rounded-xl transition-all shadow-lg flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base sm:text-lg font-bold">{lang.nativeLabel}</span>
                      <span className="text-xs text-white/60">({lang.label})</span>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 group-hover:bg-emerald-500/20 text-emerald-300 transition-all font-semibold">Start 🚀</span>
                  </button>
                ))}

                {filteredLanguages.length === 0 && (
                  <div className="text-center py-6 text-white/50 text-xs">
                    No languages match "{langSearch}".
                  </div>
                )}
              </div>

              <button
                onClick={() => setStep(1)}
                className="w-full py-2 text-xs text-white/60 hover:text-white transition-colors flex items-center justify-center gap-1.5 font-medium"
              >
                ← Change Category / श्रेणी बदलें
              </button>
            </div>
          )}
        </div>

        {/* User Guide Card button */}
        <button
          onClick={() => setGuideOpen(true)}
          className="w-full py-2.5 px-4 rounded-2xl glass-panel border border-indigo-400/30 hover:border-indigo-400/60 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
        >
          <span>📖</span>
          <span>{state.language === 'hi' ? 'ऐप कैसे उपयोग करें? (यूज़र गाइड)' : 'How to use app? (User Guide)'}</span>
        </button>

        {/* Footer info */}
        <p className="text-[11px] text-white/40 pt-1 text-center">
          Powered by MoES • IMD & Multi-Model Weather Consensus
        </p>

      </div>

      <UserGuideModal isOpen={isGuideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}
