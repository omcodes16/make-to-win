import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LANGUAGES } from '../utils/constants';
import UserGuideModal from './UserGuideModal';

const PROFILES = [
  {
    code: 'farmer',
    label: 'Farmer / Agriculture',
    sub: 'किसान / कृषि',
    icon: '🌾',
    badge: 'Agri Intelligence',
    bg: '/backgrounds/farmer.jpg',
    description: 'Soil moisture, irrigation alerts, crop spray windows & fungal disease risk.',
    tags: ['Soil Moisture', 'Spraying Window', 'Evapotranspiration'],
    accent: 'emerald'
  },
  {
    code: 'fisherman',
    label: 'Fisherman / Coastal Marine',
    sub: 'मछुआरा / तटीय सुरक्षा',
    icon: '🎣',
    badge: 'Marine Hub',
    bg: '/backgrounds/fisherman.jpg',
    description: 'Oceanic wave heights, swell period, sea surface winds & storm warnings.',
    tags: ['Wave Height', 'Sea Wind', 'Safe to Sail'],
    accent: 'cyan'
  },
  {
    code: 'aviation',
    label: 'Aviation & Drone Pilot',
    sub: 'उड्डयन / पायलट और ड्रोन',
    icon: '✈️',
    badge: 'Aero Met',
    bg: '/backgrounds/aviation.jpg',
    description: 'Visibility, cloud ceiling, VFR/IFR conditions, wind gusts & drone safety.',
    tags: ['Visibility', 'Cloud Ceiling', 'Drone VLOS'],
    accent: 'sky'
  },
  {
    code: 'urbanPlanning',
    label: 'Urban Planner / City Ops',
    sub: 'शहरी योजनाकार / नगर निगम',
    icon: '🏙️',
    badge: 'City Ops',
    bg: '/backgrounds/urban.jpg',
    description: 'PM2.5/PM10 AQI, urban heat island, drainage flood risk & worker safety.',
    tags: ['PM2.5 AQI', 'Heat Index', 'Drainage Alert'],
    accent: 'purple'
  },
  {
    code: 'general',
    label: 'General Citizen / Commuter',
    sub: 'सामान्य नागरिक / दैनिक मौसम',
    icon: '🌍',
    badge: 'Daily Living',
    bg: '/backgrounds/general.jpg',
    description: 'Hourly forecast, rain probability, UV index, commute tips & air quality.',
    tags: ['Daily Forecast', 'Rain Likelihood', 'Commute Tips'],
    accent: 'indigo'
  }
];

const POPULAR_LANG_CODES = ['hi', 'en', 'bn', 'mr', 'ta', 'te', 'gu', 'pa', 'as'];

export default function Onboarding() {
  const { state, dispatch } = useApp();

  // Steps:
  // 0: Welcome to WeatherGPT Hero Screen
  // 1: Select Category / Role
  // 2: Select Language
  // 3: Summary & Ready to Launch
  const [step, setStep] = useState(0);

  const [selectedProfile, setSelectedProfile] = useState(state.userProfile || 'farmer');
  const [selectedLanguage, setSelectedLanguage] = useState(state.language || 'en');
  const [langSearch, setLangSearch] = useState('');
  const [isGuideOpen, setGuideOpen] = useState(false);

  const activeProfileData = PROFILES.find(p => p.code === selectedProfile) || PROFILES[0];
  const activeLangData = LANGUAGES.find(l => l.code === selectedLanguage) || LANGUAGES[0];

  const filteredLanguages = LANGUAGES.filter(l =>
    l.label.toLowerCase().includes(langSearch.toLowerCase()) ||
    l.nativeLabel.toLowerCase().includes(langSearch.toLowerCase()) ||
    l.code.toLowerCase().includes(langSearch.toLowerCase())
  );

  const handleStartApp = () => {
    dispatch({ type: 'SET_PROFILE', payload: selectedProfile });
    dispatch({ type: 'SET_LANGUAGE', payload: selectedLanguage });
    dispatch({ type: 'SET_ONBOARDED' });
  };

  const handleSkip = () => {
    dispatch({ type: 'SET_ONBOARDED' });
  };

  const isLight = state.uiTheme === 'light';

  return (
    <div 
      className="min-h-[100dvh] flex flex-col items-center justify-center p-3 sm:p-6 relative overflow-x-hidden font-sans select-none transition-colors duration-700"
      style={{ color: 'var(--text-primary)' }}
    >
      {/* Dynamic Background Image */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center transition-all duration-1000 scale-105 blur-[2px]"
        style={{
          backgroundImage: `url(${step === 1 && activeProfileData ? activeProfileData.bg : '/backgrounds/onboarding_clean.jpg'})`,
          opacity: isLight ? 0.15 : 0.35,
        }}
      />

      {/* Theme Contrast Canvas Layer */}
      <div 
        className="fixed inset-0 z-0 transition-colors duration-700 pointer-events-none" 
        style={{ backgroundColor: 'var(--overlay-dark)' }} 
      />

      {/* Ambient Accent Radial Glow */}
      <div 
        className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/15 via-transparent to-transparent pointer-events-none transition-opacity duration-700" 
        style={{ opacity: isLight ? 0.3 : 0.6 }}
      />

      {/* Top Header Bar */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 py-2.5 sm:px-8 sm:py-3.5 backdrop-blur-xl border-b transition-colors duration-500 shadow-sm"
        style={{ 
          backgroundColor: 'var(--header-bg)',
          borderColor: 'var(--header-border)' 
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden p-0.5 bg-gradient-to-tr from-indigo-500 to-sky-400 shadow-md flex items-center justify-center">
            <img src="/logo.png" alt="WeatherGPT" className="w-full h-full object-cover rounded-[10px]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-black text-sm sm:text-base tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Weather<span className="text-indigo-500 dark:text-indigo-400">GPT</span>
              </span>
              <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">
                SIH '26
              </span>
            </div>
            <p className="text-[10px] hidden sm:block font-medium" style={{ color: 'var(--text-secondary)' }}>
              MoES & IMD Supercomputing Consensus
            </p>
          </div>
        </div>

        {/* Step Progression Pills */}
        <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
          {['Intro', 'Category', 'Language', 'Launch'].map((title, i) => (
            <div
              key={title}
              onClick={() => {
                if (i <= step) setStep(i);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border ${
                step === i
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 scale-105 border-indigo-500'
                  : i < step
                  ? 'border-[var(--theme-border)] text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)]'
                  : 'border-transparent text-[var(--text-secondary)] opacity-60'
              }`}
              style={{
                backgroundColor: step === i ? undefined : 'var(--glass-bg)'
              }}
            >
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${step === i ? 'bg-white text-indigo-600' : 'bg-black/10 dark:bg-white/20'}`}>
                {i + 1}
              </span>
              <span className="hidden md:inline">{title}</span>
            </div>
          ))}
        </div>

        {/* Top Right: Theme Switcher & Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Quick Theme Switcher Pill */}
          <div 
            className="flex items-center p-0.5 rounded-full border shadow-sm"
            style={{ 
              backgroundColor: 'var(--glass-bg)',
              borderColor: 'var(--theme-border)'
            }}
          >
            {[
              { key: 'dark', icon: '🌙', label: 'Dark' },
              { key: 'light', icon: '☀️', label: 'Light' },
              { key: 'glass', icon: '🔮', label: 'Glass' },
            ].map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => dispatch({ type: 'SET_UI_THEME', payload: key })}
                className={`px-2 sm:px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                  state.uiTheme === key
                    ? 'bg-indigo-600 text-white shadow-sm scale-105'
                    : 'hover:text-[var(--text-primary)]'
                }`}
                style={{
                  color: state.uiTheme === key ? '#ffffff' : 'var(--text-secondary)'
                }}
                title={`Switch to ${label} Theme`}
              >
                <span>{icon}</span>
                <span className="hidden md:inline text-[10px]">{label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setGuideOpen(true)}
            className="hidden lg:flex transition-all text-xs font-semibold px-3 py-1.5 rounded-full border backdrop-blur-md items-center gap-1.5 shadow-sm"
            style={{
              backgroundColor: 'var(--glass-bg)',
              borderColor: 'var(--theme-border)',
              color: 'var(--text-primary)'
            }}
            title="Open User Guide"
          >
            <span>📖</span>
            <span>Guide</span>
          </button>

          <button
            onClick={handleSkip}
            className="transition-all text-xs font-semibold px-3 py-1.5 rounded-full border backdrop-blur-md flex items-center gap-1 shadow-sm"
            style={{
              backgroundColor: 'var(--glass-bg)',
              borderColor: 'var(--theme-border)',
              color: 'var(--text-secondary)'
            }}
          >
            <span>Skip</span>
            <span>➔</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-xl sm:max-w-2xl relative z-10 pt-16 sm:pt-20 pb-6 px-1 flex flex-col items-center">
        {/* ========================================================================= */}
        {/* STEP 0: WELCOME HERO SCREEN */}
        {/* ========================================================================= */}
        {step === 0 && (
          <div className="w-full flex flex-col items-center text-center animate-fade-in space-y-6">
            {/* Hero Glowing Logo */}
            <div className="relative group mt-2">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-600 rounded-3xl blur-xl opacity-60 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden p-1 bg-gradient-to-tr from-indigo-600 to-sky-400 border border-white/30 shadow-2xl">
                <img src="/logo.png" alt="WeatherGPT Logo" className="w-full h-full object-cover rounded-[20px]" />
              </div>
            </div>

            {/* Title & Slogan */}
            <div className="space-y-2 max-w-lg">
              <div 
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold mb-1 shadow-sm"
                style={{
                  backgroundColor: 'var(--glass-bg)',
                  borderColor: 'var(--theme-border)',
                  color: isLight ? '#4338ca' : '#a5b4fc'
                }}
              >
                <span>🇮🇳</span>
                <span>Smart India Hackathon 2026</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              </div>
              <h1 
                className="text-3xl sm:text-5xl font-heading font-black tracking-tight leading-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Welcome to <span className="bg-gradient-to-r from-indigo-500 via-sky-500 to-blue-600 bg-clip-text text-transparent">WeatherGPT</span>
              </h1>
              <p 
                className="text-sm sm:text-base font-medium leading-relaxed"
                style={{ color: 'var(--text-muted)' }}
              >
                Bharat's Next-Gen AI Climate & Meteorological Intelligence System
              </p>
              <p 
                className="text-xs font-semibold"
                style={{ color: 'var(--text-secondary)' }}
              >
                मौसम जीपीटी में आपका स्वागत है • Hyperlocal AI Forecasts & Early Warnings
              </p>
            </div>

            {/* Feature Showcase Grid */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
              <div 
                className="p-3.5 rounded-2xl border transition-all backdrop-blur-md shadow-sm hover:border-indigo-400/60"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--glass-border)',
                }}
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="text-2xl p-1.5 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">🌾</span>
                  <div>
                    <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>5 Tailored Sector Hubs</h2>
                    <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Farmer, Marine, Aviation & Urban</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Custom soil moisture, wave swell heights, flight visibility & urban heat indices.
                </p>
              </div>

              <div 
                className="p-3.5 rounded-2xl border transition-all backdrop-blur-md shadow-sm hover:border-sky-400/60"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--glass-border)',
                }}
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="text-2xl p-1.5 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-300">🎙️</span>
                  <div>
                    <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Bhashini Multilingual AI</h2>
                    <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>17+ Regional Indian Languages</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Voice input & audio speech narration in हिन्दी, বাংলা, मराठी, தமிழ் and more.
                </p>
              </div>

              <div 
                className="p-3.5 rounded-2xl border transition-all backdrop-blur-md shadow-sm hover:border-emerald-400/60"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--glass-border)',
                }}
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="text-2xl p-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">⚡</span>
                  <div>
                    <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Multi-Model Consensus</h2>
                    <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>ECMWF, GFS & ICON Supercomputers</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Live radar precipitation tracking with quantified meteorological confidence scores.
                </p>
              </div>

              <div 
                className="p-3.5 rounded-2xl border transition-all backdrop-blur-md shadow-sm hover:border-rose-400/60"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--glass-border)',
                }}
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="text-2xl p-1.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-300">🚨</span>
                  <div>
                    <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>NDMA Sachet & Offline SOS</h2>
                    <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Government Emergency Feeds</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Real-time severe alerts, cyclone tracking & offline SMS registry for zero-connectivity.
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="w-full pt-4 space-y-3">
              <button
                onClick={() => setStep(1)}
                className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-base sm:text-lg shadow-[0_0_30px_rgba(99,102,241,0.35)] hover:shadow-[0_0_40px_rgba(99,102,241,0.55)] transition-all active:scale-[0.98] flex items-center justify-center gap-3 group cursor-pointer"
              >
                <span>Get Started / सेटअप शुरू करें</span>
                <span className="text-xl group-hover:translate-x-1.5 transition-transform">➔</span>
              </button>

              <div 
                className="flex items-center justify-center gap-4 text-xs font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span>⚡ Zero login required</span>
                <span>•</span>
                <span>🔒 Privacy first</span>
                <span>•</span>
                <span>🌐 Real-time radar</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: SELECT CATEGORY / ROLE */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="w-full flex flex-col items-center animate-fade-in space-y-5">
            <div className="text-center space-y-1">
              <div 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold mb-1 shadow-sm"
                style={{
                  backgroundColor: 'var(--glass-bg)',
                  borderColor: 'var(--theme-border)',
                  color: isLight ? '#4338ca' : '#a5b4fc'
                }}
              >
                <span>Step 1 of 3</span>
              </div>
              <h1 
                className="text-2xl sm:text-3xl font-heading font-black"
                style={{ color: 'var(--text-primary)' }}
              >
                Select Your Category / श्रेणी चुनें
              </h1>
              <p 
                className="text-xs sm:text-sm max-w-md"
                style={{ color: 'var(--text-muted)' }}
              >
                Choose your role so WeatherGPT tailors its advisories, soil metrics, and storm warnings specifically for you.
              </p>
            </div>

            {/* Category Cards List */}
            <div className="w-full space-y-2.5">
              {PROFILES.map((profile) => {
                const isSelected = selectedProfile === profile.code;
                return (
                  <div
                    key={profile.code}
                    onClick={() => setSelectedProfile(profile.code)}
                    className={`w-full text-left p-4 rounded-2xl transition-all cursor-pointer border backdrop-blur-md relative group shadow-sm ${
                      isSelected
                        ? 'border-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.25)] ring-2 ring-indigo-500/40 scale-[1.01]'
                        : 'hover:border-indigo-400/40 hover:scale-[1.005]'
                    }`}
                    style={{
                      backgroundColor: isSelected ? (isLight ? '#eef2ff' : 'rgba(99, 102, 241, 0.12)') : 'var(--card-bg)',
                      borderColor: isSelected ? '#6366f1' : 'var(--glass-border)'
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        <div 
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition-transform group-hover:scale-110 shadow-sm border ${
                            isSelected ? 'bg-indigo-600 text-white border-indigo-500' : 'border-[var(--theme-border)]'
                          }`}
                          style={{
                            backgroundColor: isSelected ? undefined : 'var(--glass-bg)'
                          }}
                        >
                          {profile.icon}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h2 
                              className="text-base sm:text-lg font-bold tracking-tight"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {profile.label}
                            </h2>
                            <span 
                              className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border"
                              style={{
                                backgroundColor: 'var(--glass-bg)',
                                borderColor: 'var(--theme-border)',
                                color: 'var(--text-secondary)'
                              }}
                            >
                              {profile.badge}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">{profile.sub}</p>
                          <p className="text-xs pt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{profile.description}</p>
                          
                          {/* Tags */}
                          <div className="flex flex-wrap gap-1.5 pt-1.5">
                            {profile.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-2 py-0.5 rounded-full font-medium border"
                                style={{
                                  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--glass-bg)',
                                  borderColor: isSelected ? 'rgba(99, 102, 241, 0.35)' : 'var(--theme-border)',
                                  color: isSelected ? (isLight ? '#4338ca' : '#c7d2fe') : 'var(--text-secondary)'
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Selection Radio Icon */}
                      <div className="shrink-0 pt-1">
                        <div 
                          className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                              : 'border-[var(--theme-border)]'
                          }`}
                        >
                          {isSelected && <span className="text-xs font-bold">✓</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation buttons */}
            <div className="w-full flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => setStep(0)}
                className="py-3 px-5 rounded-xl border text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                style={{
                  backgroundColor: 'var(--glass-bg)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--text-primary)'
                }}
              >
                <span>←</span>
                <span>Back</span>
              </button>

              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue: Select Language / भाषा चुनें</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: SELECT LANGUAGE */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="w-full flex flex-col items-center animate-fade-in space-y-5">
            <div className="text-center space-y-1">
              <div 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold mb-1 shadow-sm"
                style={{
                  backgroundColor: 'var(--glass-bg)',
                  borderColor: 'var(--theme-border)',
                  color: isLight ? '#059669' : '#6ee7b7'
                }}
              >
                <span>Step 2 of 3</span>
              </div>
              <h1 
                className="text-2xl sm:text-3xl font-heading font-black"
                style={{ color: 'var(--text-primary)' }}
              >
                Choose Your Language / भाषा चुनें
              </h1>
              <p 
                className="text-xs sm:text-sm max-w-md"
                style={{ color: 'var(--text-muted)' }}
              >
                WeatherGPT will speak, chat, and generate meteorological advisories in your preferred language.
              </p>
            </div>

            {/* Search Box */}
            <div className="w-full relative">
              <input
                type="text"
                value={langSearch}
                onChange={(e) => setLangSearch(e.target.value)}
                placeholder="🔍 Search language / भाषा खोजें (e.g., Hindi, বাংলা, Tamil)..."
                className="w-full rounded-2xl px-4 py-3 text-sm transition-all shadow-sm border focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--input-border)',
                  color: 'var(--input-text)'
                }}
                autoFocus
              />
              {langSearch && (
                <button
                  onClick={() => setLangSearch('')}
                  className="absolute right-3.5 top-3 text-sm hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Popular Chips */}
            {!langSearch && (
              <div className="w-full flex flex-col gap-1.5">
                <span 
                  className="text-[11px] font-bold uppercase tracking-wider px-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Quick Select:
                </span>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_LANG_CODES.map((code) => {
                    const l = LANGUAGES.find(item => item.code === code);
                    if (!l) return null;
                    const isSelected = selectedLanguage === l.code;
                    return (
                      <button
                        key={l.code}
                        onClick={() => setSelectedLanguage(l.code)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-md border-emerald-500 ring-1 ring-emerald-400'
                            : 'hover:border-emerald-400/40'
                        }`}
                        style={{
                          backgroundColor: isSelected ? undefined : 'var(--glass-bg)',
                          borderColor: isSelected ? undefined : 'var(--theme-border)',
                          color: isSelected ? '#ffffff' : 'var(--text-primary)'
                        }}
                      >
                        <span>{l.nativeLabel}</span>
                        <span className="text-[10px] opacity-70">({l.label})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Languages Grid */}
            <div className="w-full max-h-72 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredLanguages.map((lang) => {
                  const isSelected = selectedLanguage === lang.code;
                  return (
                    <div
                      key={lang.code}
                      onClick={() => setSelectedLanguage(lang.code)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group shadow-sm ${
                        isSelected
                          ? 'border-emerald-500 ring-2 ring-emerald-500/40 shadow-md'
                          : 'hover:border-emerald-400/40'
                      }`}
                      style={{
                        backgroundColor: isSelected ? (isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.14)') : 'var(--card-bg)',
                        borderColor: isSelected ? '#10b981' : 'var(--glass-border)',
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div 
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border ${
                            isSelected ? 'bg-emerald-600 text-white border-emerald-500' : 'border-[var(--theme-border)]'
                          }`}
                          style={{
                            backgroundColor: isSelected ? undefined : 'var(--glass-bg)',
                            color: isSelected ? '#ffffff' : 'var(--text-primary)'
                          }}
                        >
                          {lang.code.toUpperCase()}
                        </div>
                        <div>
                          <div 
                            className="text-sm font-bold group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {lang.nativeLabel}
                          </div>
                          <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                            {lang.label}
                          </div>
                        </div>
                      </div>

                      <div 
                        className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold transition-all ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'border-[var(--theme-border)]'
                        }`}
                      >
                        {isSelected ? '✓' : ''}
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredLanguages.length === 0 && (
                <div 
                  className="text-center py-8 text-xs font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  No languages match "{langSearch}". Try searching by English or native spelling.
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="w-full flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="py-3 px-5 rounded-xl border text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                style={{
                  backgroundColor: 'var(--glass-bg)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--text-primary)'
                }}
              >
                <span>←</span>
                <span>Back</span>
              </button>

              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Review & Start / समीक्षा करें</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: SUMMARY & LAUNCH APP */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div className="w-full flex flex-col items-center animate-fade-in space-y-6">
            <div className="text-center space-y-1">
              <div 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold mb-1 shadow-sm"
                style={{
                  backgroundColor: 'var(--glass-bg)',
                  borderColor: 'var(--theme-border)',
                  color: isLight ? '#4338ca' : '#a5b4fc'
                }}
              >
                <span>Final Step</span>
              </div>
              <h1 
                className="text-3xl sm:text-4xl font-heading font-black"
                style={{ color: 'var(--text-primary)' }}
              >
                You're All Set! / आप तैयार हैं!
              </h1>
              <p 
                className="text-xs sm:text-sm max-w-md"
                style={{ color: 'var(--text-muted)' }}
              >
                WeatherGPT has configured its predictive engine and AI personality according to your selections.
              </p>
            </div>

            {/* Summary Preview Box */}
            <div 
              className="w-full p-5 rounded-3xl border backdrop-blur-xl shadow-2xl space-y-4"
              style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--glass-border)'
              }}
            >
              <div 
                className="text-xs font-bold uppercase tracking-wider pb-1 border-b"
                style={{ 
                  color: isLight ? '#4338ca' : '#a5b4fc',
                  borderColor: 'var(--theme-border)'
                }}
              >
                Setup Configuration / कॉन्फ़िगरेशन
              </div>

              {/* Selected Profile Card */}
              <div 
                className="flex items-center justify-between p-3.5 rounded-2xl border shadow-sm"
                style={{
                  backgroundColor: 'var(--glass-bg)',
                  borderColor: 'var(--theme-border)'
                }}
              >
                <div className="flex items-center gap-3">
                  <span 
                    className="text-3xl p-2 rounded-xl border shadow-sm"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--theme-border)'
                    }}
                  >
                    {activeProfileData.icon}
                  </span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Selected Category
                    </span>
                    <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                      {activeProfileData.label}
                    </h2>
                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                      {activeProfileData.sub}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs font-bold underline px-2 py-1 text-indigo-600 dark:text-indigo-400 hover:opacity-80"
                >
                  Change
                </button>
              </div>

              {/* Selected Language Card */}
              <div 
                className="flex items-center justify-between p-3.5 rounded-2xl border shadow-sm"
                style={{
                  backgroundColor: 'var(--glass-bg)',
                  borderColor: 'var(--theme-border)'
                }}
              >
                <div className="flex items-center gap-3">
                  <span 
                    className="text-2xl p-2 rounded-xl border shadow-sm"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--theme-border)'
                    }}
                  >
                    🗣️
                  </span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Selected Language
                    </span>
                    <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                      {activeLangData.nativeLabel}
                    </h2>
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {activeLangData.label}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="text-xs font-bold underline px-2 py-1 text-emerald-600 dark:text-emerald-400 hover:opacity-80"
                >
                  Change
                </button>
              </div>

              {/* Engine Status */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>Supercomputer NWP & Live GPS Sensors Ready</span>
                </div>
                <span className="text-[11px] font-black tracking-wide">100% ONLINE</span>
              </div>
            </div>

            {/* Launch CTA */}
            <div className="w-full space-y-3 pt-2">
              <button
                onClick={handleStartApp}
                className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-indigo-600 via-sky-500 to-indigo-600 hover:from-indigo-500 hover:to-sky-400 text-white font-black text-lg shadow-[0_0_35px_rgba(99,102,241,0.45)] hover:shadow-[0_0_50px_rgba(99,102,241,0.65)] transition-all active:scale-[0.98] flex items-center justify-center gap-3 group cursor-pointer"
              >
                <span>Start WeatherGPT 🚀</span>
                <span className="text-xl group-hover:translate-x-1.5 transition-transform">➔</span>
              </button>

              <button
                onClick={() => setStep(1)}
                className="w-full py-2 text-xs font-medium transition-colors hover:opacity-100"
                style={{ color: 'var(--text-secondary)' }}
              >
                ← Back to Categories & Settings
              </button>
            </div>
          </div>
        )}
      </main>

      {/* User Guide Modal */}
      <UserGuideModal isOpen={isGuideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}
