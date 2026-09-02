import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { EXAMPLE_QUESTIONS } from '../utils/constants';
import UserGuideModal from './UserGuideModal';

const CARD_ACCENTS = [
  { emoji: '🌾', hover: 'hover:border-indigo-400/40 hover:shadow-[0_0_20px_rgba(129,140,248,0.15)]', iconHover: 'group-hover:bg-indigo-500/20 group-hover:border-indigo-400/30', arrow: 'group-hover:text-indigo-400' },
  { emoji: '✈️', hover: 'hover:border-sky-400/40 hover:shadow-[0_0_20px_rgba(56,189,248,0.15)]', iconHover: 'group-hover:bg-sky-500/20 group-hover:border-sky-400/30', arrow: 'group-hover:text-sky-400' },
  { emoji: '🌊', hover: 'hover:border-rose-400/40 hover:shadow-[0_0_20px_rgba(244,63,94,0.15)]', iconHover: 'group-hover:bg-rose-500/20 group-hover:border-rose-400/30', arrow: 'group-hover:text-rose-400' },
  { emoji: '🚢', hover: 'hover:border-teal-400/40 hover:shadow-[0_0_20px_rgba(45,212,191,0.15)]', iconHover: 'group-hover:bg-teal-500/20 group-hover:border-teal-400/30', arrow: 'group-hover:text-teal-400' },
];

export default function EmptyState() {
  const { state, dispatch } = useApp();
  const [isGuideOpen, setGuideOpen] = useState(false);

  const questions = EXAMPLE_QUESTIONS[state.language] || EXAMPLE_QUESTIONS.en;

  const handleTapQuestion = (question) => {
    const event = new CustomEvent('weathergpt-send', { detail: question });
    window.dispatchEvent(event);
  };

  return (
    <div className="flex flex-col items-center justify-center pt-2 sm:pt-6 pb-20 sm:pb-24 px-2 sm:px-4 animate-fade-in">
      {/* Glowing Orb */}
      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-tr from-indigo-500 via-purple-500 to-blue-400 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.4)] mb-3 sm:mb-5 animate-pulse-rays">
        <span className="text-2xl sm:text-3xl drop-shadow-lg">🌤️</span>
      </div>
      
      {/* Gradient Hero Heading */}
      <h2 className="text-lg sm:text-2xl md:text-3xl font-heading font-bold text-gradient-hero text-center tracking-tight mb-1 sm:mb-2">
        {state.language === 'en' ? 'What would you like to know?' :
         state.language === 'hi' ? 'आप क्या जानना चाहेंगे?' :
         state.language === 'as' ? 'আপুনি কি জানিব বিচাৰে?' :
         'আপনি কী জানতে চান?'}
      </h2>
      <p className="text-theme-muted text-center mb-3 sm:mb-4 max-w-md text-xs sm:text-sm px-4">
        {state.language === 'en' ? 'Tap a question below or type your own' :
         state.language === 'hi' ? 'नीचे एक सवाल टैप करें या अपना लिखें' :
         state.language === 'as' ? 'তলৰ প্ৰশ্ন এটা টিপক বা নিজৰ লিখক' :
         'নিচের একটি প্রশ্ন ট্যাপ করুন বা নিজের লিখুন'}
      </p>

      {/* User Guide Pill on Home Screen */}
      <button
        onClick={() => setGuideOpen(true)}
        className="mb-4 px-4 py-2 rounded-full glass-panel border border-indigo-400/40 hover:border-indigo-400/80 bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-200 hover:text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95 shimmer-hover"
      >
        <span>📖</span>
        <span>{state.language === 'hi' ? 'ऐप उपयोग गाइड (User Guide)' : 'App User Guide'}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-400/20 text-indigo-300 font-bold uppercase">Guide</span>
      </button>

      {/* Glassmorphism Suggestion Cards */}
      <div className="w-full flex flex-col gap-2 sm:gap-2.5 max-w-xl px-1 sm:px-0">
        {questions.map((q, idx) => {
          const accent = CARD_ACCENTS[idx % CARD_ACCENTS.length];
          return (
            <button
              key={idx}
              onClick={() => handleTapQuestion(q)}
              className={`group glass-panel shimmer-hover rounded-xl p-2.5 sm:p-3.5 flex items-center gap-2.5 sm:gap-3.5 ${accent.hover} hover:scale-[1.01] transition-all duration-200 text-left active:scale-[0.98]`}
            >
              {/* Emoji Icon Circle */}
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${accent.iconHover} transition-colors border border-theme-border text-sm sm:text-base`} style={{ background: 'var(--glass-bg)' }}>
                {accent.emoji}
              </div>
              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-theme-muted group-hover:text-theme-primary transition-colors text-xs sm:text-sm font-medium leading-snug">{q}</p>
              </div>
              {/* Arrow */}
              <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-theme-muted opacity-50 group-hover:opacity-100 ${accent.arrow} transition-all duration-200 transform group-hover:translate-x-0.5 flex-shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          );
        })}
      </div>

      <UserGuideModal isOpen={isGuideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}
