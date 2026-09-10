import React from 'react';
import { useApp } from '../context/AppContext';
import ChatInput from './ChatInput';

export default function EmptyState() {
  const { state } = useApp();
  const lang = state.language || 'en';
  const isHi = ['hi', 'mr', 'pa', 'gu', 'or', 'ur'].includes(lang);

  const stageData = state.weatherStageData;
  const weather = stageData?.weather || state.currentWeather;
  const locationName = stageData?.locationName || weather?.locationName || '';

  // Contextual time greeting based on current IST hour
  const istHour = parseInt(
    new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      hour12: false,
    }).format(new Date()),
    10
  );

  const greeting = istHour < 12 
    ? (isHi ? 'शुभ प्रभात' : 'Good morning')
    : istHour < 17 
    ? (isHi ? 'शुभ दोपहर' : 'Good afternoon')
    : istHour < 21 
    ? (isHi ? 'शुभ संध्या' : 'Good evening')
    : (isHi ? 'शुभ रात्रि' : 'Good night');

  const handleCardClick = (queryText) => {
    if (state.isLoading) return;
    window.dispatchEvent(new CustomEvent('weathergpt-send', { detail: queryText }));
  };

  const BENTO_CARDS = [
    {
      icon: '🌧️',
      title: isHi ? 'क्या आज बारिश होगी?' : 'Will it rain today?',
      desc: isHi ? 'अगले 6 घंटे बारिश का जोखिम, बादल व रडार पूर्वानुमान' : 'Hourly precipitation risk, cloud cover & rain forecast',
      query: isHi 
        ? `क्या आज ${locationName ? locationName + ' में' : ''} बारिश होगी? प्रति घंटा पूर्वानुमान बताएं।`
        : `Will it rain today${locationName ? ' in ' + locationName : ''}? Give me an hourly precipitation forecast.`,
      tag: isHi ? 'बारिश रडार' : 'Precipitation',
      tagColor: 'text-sky-700 dark:text-sky-300 bg-sky-500/10 border-sky-500/25',
    },
    {
      icon: '🌾',
      title: isHi ? 'स्प्रे का सही समय?' : 'Safe to spray crops?',
      desc: isHi ? '48 घंटे में कीटनाशक छिड़काव, हवा की गति व पाला जोखिम' : '48-hour spray window, dew risk & humidity thresholds',
      query: isHi 
        ? `क्या अगले 48 घंटों में ${locationName ? locationName + ' में' : ''} फसलों पर कीटनाशक स्प्रे करना सुरक्षित है?`
        : `Is it safe to spray pesticides on crops in the next 48 hours${locationName ? ' in ' + locationName : ''}?`,
      tag: isHi ? 'कृषि सलाह' : 'Agronomy',
      tagColor: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/25',
    },
    {
      icon: '⚡',
      title: isHi ? 'सक्रिय मौसम चेतावनी?' : 'Any severe alerts?',
      desc: isHi ? 'IMD वज्रपात, आंधी-तूफान, लू या बाढ़ की पूर्व चेतावनी' : 'Active IMD thunderstorm, lightning, heatwave or cyclone warnings',
      query: isHi 
        ? `क्या ${locationName ? locationName + ' के' : ''} आसपास कोई आंधी, चक्रवात या गंभीर मौसम चेतावनी है?`
        : `Are there any active severe weather alerts, thunderstorms, or cyclone warnings${locationName ? ' near ' + locationName : ''}?`,
      tag: isHi ? 'आपदा अलर्ट' : 'Early Warning',
      tagColor: 'text-amber-800 dark:text-amber-300 bg-amber-500/10 border-amber-500/25',
    },
    {
      icon: '📊',
      title: isHi ? 'NWP मॉडल तुलना' : 'Multi-Model Consensus',
      desc: isHi ? 'GFS, ECMWF व ICON मौसम मॉडल में सहमति और तापमान अंतर' : 'Inspect GFS, ECMWF & ICON model agreement and confidence',
      query: isHi 
        ? `GFS, ECMWF और ICON मौसम मॉडल के पूर्वानुमान की तुलना करें${locationName ? ' (' + locationName + ')' : ''}।`
        : `Compare GFS, ECMWF, and ICON weather model forecasts${locationName ? ' for ' + locationName : ''}.`,
      tag: isHi ? 'मॉडल विश्लेषण' : 'NWP Ensemble',
      tagColor: 'text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 border-indigo-500/25',
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-full py-2 sm:py-8 px-2 sm:px-4 select-none animate-fade-in">
      
      {/* 1. Header Branding & Greeting */}
      <div className="text-center max-w-2xl mx-auto mb-3 sm:mb-6">
        {/* Radar Crest Emblem */}
        <div className="inline-flex items-center justify-center w-9 h-9 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-sky-500/10 border border-sky-500/25 text-sky-400 mb-1.5 sm:mb-3.5 shadow-xs">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-7 sm:h-7">
            <path d="M12 2a10 10 0 1 0 10 10" />
            <path d="M12 6a6 6 0 1 0 6 6" />
            <path d="M12 10a2 2 0 1 0 2 2" />
            <path d="M12 12 21.5 2.5" />
          </svg>
        </div>

        {/* Greeting Heading */}
        <h1 className="text-lg sm:text-3xl lg:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight mb-1 sm:mb-2">
          {greeting}{locationName ? `, ${locationName}` : ''}
        </h1>

        <p className="text-[11px] sm:text-sm text-[var(--text-secondary)] font-normal sm:font-medium max-w-[280px] sm:max-w-lg mx-auto leading-snug sm:leading-relaxed">
          {isHi 
            ? 'मौसम विज्ञान, वर्षा पूर्वानुमान, कृषि परामर्श एवं NWP मॉडल विश्लेषण के लिए कुछ भी पूछें।' 
            : 'Ask anything about real-time weather, rainfall forecasts, agricultural advisories, or multi-model NWP ensembles.'}
        </p>

        {/* Live Weather Glance Pill (if weather data available) */}
        {weather && weather.temperature != null && (
          <div className="inline-flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-3 px-2.5 py-0.5 sm:px-3.5 sm:py-1.5 rounded-full bg-[var(--glass-bg)] border border-[var(--theme-border)] text-[10px] sm:text-xs font-semibold text-[var(--text-primary)] shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{Math.round(weather.temperature)}°C</span>
            {weather.humidity != null && (
              <>
                <span className="text-[var(--text-secondary)] opacity-50">•</span>
                <span className="text-[var(--text-secondary)] font-medium">💧 {weather.humidity}%</span>
              </>
            )}
            {weather.windSpeed != null && (
              <>
                <span className="text-[var(--text-secondary)] opacity-50">•</span>
                <span className="text-[var(--text-secondary)] font-medium">💨 {Math.round(weather.windSpeed)} km/h</span>
              </>
            )}
            {locationName && (
              <>
                <span className="text-[var(--text-secondary)] opacity-50">•</span>
                <span className="text-[var(--text-secondary)] font-medium truncate max-w-[110px] sm:max-w-[150px]">📍 {locationName}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* 2. Centered Hero AI Prompt Box */}
      <div className="w-full max-w-md sm:max-w-xl lg:max-w-2xl mb-3 sm:mb-7">
        <ChatInput isHero={true} />
      </div>

      {/* 3. Bento Inspiration Grid (4 Cards in compact 2x2 grid on phone) */}
      <div className="w-full max-w-md sm:max-w-xl lg:max-w-2xl">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2.5 px-1">
          <span className="text-[10px] sm:text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
            {isHi ? 'त्वरित परामर्श' : 'Suggested Consultations'}
          </span>
          <span className="text-[10px] sm:text-[11px] text-[var(--text-secondary)] font-medium">
            {isHi ? 'टैप करके पूछें' : 'Tap to ask'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3.5">
          {BENTO_CARDS.map((card, idx) => (
            <button
              key={idx}
              onClick={() => handleCardClick(card.query)}
              className="group relative rounded-xl sm:rounded-2xl p-2.5 sm:p-4 text-left border border-[var(--theme-border)] bg-[var(--card-bg)] hover:bg-white/[0.04] hover:border-sky-500/40 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1 sm:mb-2">
                  <span className="text-base sm:text-2xl">{card.icon}</span>
                  <span className={`px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 rounded-md sm:rounded-full text-[9px] sm:text-[11px] font-bold tracking-tight border ${card.tagColor}`}>
                    {card.tag}
                  </span>
                </div>
                <h3 className="text-xs sm:text-[14px] font-bold text-[var(--text-primary)] group-hover:text-sky-500 dark:group-hover:text-sky-300 transition-colors mb-0.5 sm:mb-1 tracking-tight leading-tight sm:leading-snug line-clamp-2">
                  {card.title}
                </h3>
                <p className="text-[9px] sm:text-xs text-[var(--text-secondary)] leading-tight line-clamp-2 font-normal hidden xs:block">
                  {card.desc}
                </p>
              </div>

              <div className="mt-1.5 sm:mt-2.5 pt-1 sm:pt-2 border-t border-[var(--theme-border)]/50 flex items-center justify-between text-[10px] sm:text-[11px] text-sky-500 dark:text-sky-400 font-semibold opacity-90 group-hover:opacity-100 transition-opacity">
                <span>{isHi ? 'पूछें' : 'Ask'}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transform group-hover:translate-x-0.5 transition-transform sm:w-3.5 sm:h-3.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
