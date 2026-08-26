import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LANGUAGES } from '../utils/constants';
import { WEATHER_THEMES } from '../utils/themes';

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
  
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-[#0a0c1a] relative transition-colors duration-1000">
      {/* Fixed Background Image */}
      <div className="fixed inset-0 z-0 bg-cover bg-center transition-opacity duration-1000" style={{ backgroundImage: `url(${theme.bgImage})` }}></div>
      
      {/* Overlay */}
      <div className={`fixed inset-0 z-0 bg-gradient-to-br ${theme.overlay} pointer-events-none`}></div>

      <div className="w-full max-w-sm flex flex-col items-center animate-fade-in relative z-10 space-y-8">
        
        {/* Logo / Icon */}
        <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.6)]">
          <span className="text-white text-5xl font-bold">W</span>
        </div>

        {/* Text */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-heading font-bold text-white drop-shadow-md">
            WeatherGPT
          </h1>
          <p className="text-white/70 text-lg">
            {step === 1 ? "Select your profile" : "Choose your language"}
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
                className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 hover:border-white/40 text-white font-medium py-4 px-6 rounded-2xl transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center gap-4 group"
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
                  dispatch({ type: 'SET_ONBOARDED' });
                }}
                className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 hover:border-white/40 text-white font-medium py-4 px-6 rounded-2xl transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-between group"
              >
                <span className="text-lg">{lang.nativeLabel}</span>
                <span className="text-white/50 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  {lang.label}
                </span>
              </button>
            ))
          )}
        </div>

        {/* SIH credit */}
        <p className="text-xs text-white/30 pt-4">
          Built for Smart India Hackathon 2026 • PS 26068
        </p>

      </div>
    </div>
  );
}
