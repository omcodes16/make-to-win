import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LANGUAGES } from '../utils/constants';
import { WEATHER_THEMES } from '../utils/themes';
import { EXTRA_I18N } from '../utils/translationsExtra';
import UserGuideModal from './UserGuideModal';

const PROFILES = [
  { code: 'general', label: 'General / सामान्य', icon: '🌍' },
  { code: 'farmer', label: 'Farmer / किसान', icon: '🌾' },
  { code: 'fisherman', label: 'Fisherman / मछुआरा', icon: '🎣' },
  { code: 'aviation', label: 'Aviation / उड्डयन', icon: '✈️' },
  { code: 'urbanPlanning', label: 'Urban Planner / शहरी योजनाकार', icon: '🏙️' }
];

export default function Onboarding() {
  const { state, dispatch } = useApp();
  const theme = WEATHER_THEMES.clear;
  const [step, setStep] = useState(1);
  const [isGuideOpen, setGuideOpen] = useState(false);
  const t = EXTRA_I18N[state.language] || EXTRA_I18N.en;
  
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-transparent relative transition-colors duration-1000">
      {/* Fixed Background Image */}
      <div className="fixed inset-0 z-0 bg-cover bg-center transition-opacity duration-1000" style={{ backgroundImage: 'url(/backgrounds/onboarding_clean.jpg)' }}></div>
      
      {/* Overlay */}
      <div className={`fixed inset-0 z-0 bg-gradient-to-br ${theme.overlay} pointer-events-none`}></div>

      {step > 2 && (
        <button onClick={() => dispatch({ type: 'SET_ONBOARDED' })} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-50 font-medium px-4 py-2 bg-black/20 rounded-full border border-white/10 ">
          Skip
        </button>
      )}

      <div className="w-full max-w-sm flex flex-col items-center animate-fade-in relative z-10 space-y-8">
        
        {/* Logo / Icon */}
        <img src="/logo.png" alt="WeatherGPT Logo" className="w-24 h-24 rounded-3xl object-cover shadow-[0_0_40px_rgba(59,130,246,0.6)]" />

        {/* Text */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-heading font-bold text-white drop-shadow-md">
            WeatherGPT
          </h1>
          <p className="text-white/70 text-lg">
            {step === 1 ? "Select your profile" : step === 2 ? "Choose your language" : step === 3 ? "Voice & Languages" : "Understanding the Data"}
          </p>
        </div>

        {/* Selection Grid */}
        <div className="w-full grid grid-cols-1 gap-4 pt-4">
          {step === 1 ? (
            PROFILES.map((profile) => (
              <button
                key={profile.code}
                onClick={() => {
                  dispatch({ type: 'SET_PROFILE', payload: profile.code });
                  setStep(2);
                }}
                className="glass-panel border border-white/10 hover:bg-white/20 hover:border-white/40 text-white font-medium py-4 px-6 rounded-2xl transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center gap-4 group"
              >
                <span className="text-2xl">{profile.icon}</span>
                <span className="text-lg">{profile.label}</span>
              </button>
            ))
          ) : (
            LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  dispatch({ type: 'SET_LANGUAGE', payload: lang.code });
                  setStep(3);
                }}
                className="glass-panel border border-white/10 hover:bg-white/20 hover:border-white/40 text-white font-medium py-4 px-6 rounded-2xl transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-between group"
              >
                <span className="text-lg">{lang.nativeLabel}</span>
                <span className="text-white/50 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  {lang.label}
                </span>
              </button>
            ))
          )}

        {step === 3 && (
          <div className="glass-panel border border-white/10 text-white p-6 rounded-2xl shadow-xl flex flex-col gap-4 text-center animate-fade-in w-full">
            <span className="text-5xl mb-2">🌍</span>
            <h2 className="text-2xl font-bold">{t.onboardingAskLangTitle || 'Ask in Your Language'}</h2>
            <p className="text-white/80 text-[15px] leading-relaxed">
              {t.onboardingAskLangDesc || 'Speak or type freely in English, Hindi, Bengali, or Assamese. Tap the microphone to talk, and the play icon to hear the forecast read aloud.'}
            </p>
            <button onClick={() => setStep(4)} className="mt-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 py-3.5 px-6 rounded-xl font-semibold transition-colors shadow-lg">Next</button>
          </div>
        )}
        {step === 4 && (
          <div className="glass-panel border border-white/10 text-white p-6 rounded-2xl shadow-xl flex flex-col gap-4 text-center animate-fade-in w-full">
            <span className="text-5xl mb-2">🧠</span>
            <h2 className="text-2xl font-bold">{t.onboardingInsightsTitle || 'Smart Insights'}</h2>
            <p className="text-white/80 text-[15px] leading-relaxed">
              {t.onboardingInsightsDesc || 'Look for the Heat Index to know how hot it actually feels, and the Models Agree badge to see how reliable the forecast is based on supercomputer consensus.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full justify-center">
              <button onClick={() => setGuideOpen(true)} className="bg-white/10 hover:bg-white/20 border border-white/20 py-3.5 px-6 rounded-xl font-semibold transition-colors shadow-lg flex-1">Read Guide</button>
              <button onClick={() => dispatch({ type: 'SET_ONBOARDED' })} className="bg-emerald-500 hover:bg-emerald-600 py-3.5 px-6 rounded-xl font-semibold transition-colors shadow-lg flex-1">Get Started</button>
            </div>
          </div>
        )}

        </div>

        {/* SIH credit */}
        <p className="text-xs text-white/30 pt-4">
          Built for Smart India Hackathon 2026 • PS 26068
        </p>

      </div>
    <UserGuideModal isOpen={isGuideOpen} onClose={() => setGuideOpen(false)} />
    </div>
      
  );
}
