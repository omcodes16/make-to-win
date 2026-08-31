import React from 'react';
import { useApp } from '../context/AppContext';
import { EXAMPLE_QUESTIONS } from '../utils/constants';

const CARD_ACCENTS = [
  { emoji: '🌾', hover: 'hover:border-indigo-400/40 hover:shadow-[0_0_20px_rgba(129,140,248,0.15)]', iconHover: 'group-hover:bg-indigo-500/20 group-hover:border-indigo-400/30', arrow: 'group-hover:text-indigo-400' },
  { emoji: '✈️', hover: 'hover:border-sky-400/40 hover:shadow-[0_0_20px_rgba(56,189,248,0.15)]', iconHover: 'group-hover:bg-sky-500/20 group-hover:border-sky-400/30', arrow: 'group-hover:text-sky-400' },
  { emoji: '🌊', hover: 'hover:border-rose-400/40 hover:shadow-[0_0_20px_rgba(244,63,94,0.15)]', iconHover: 'group-hover:bg-rose-500/20 group-hover:border-rose-400/30', arrow: 'group-hover:text-rose-400' },
  { emoji: '🚢', hover: 'hover:border-teal-400/40 hover:shadow-[0_0_20px_rgba(45,212,191,0.15)]', iconHover: 'group-hover:bg-teal-500/20 group-hover:border-teal-400/30', arrow: 'group-hover:text-teal-400' },
];

export default function EmptyState() {
  const { state, dispatch } = useApp();

  const questions = EXAMPLE_QUESTIONS[state.language] || EXAMPLE_QUESTIONS.en;

  const handleTapQuestion = (question) => {
    const event = new CustomEvent('weathergpt-send', { detail: question });
    window.dispatchEvent(event);
  };

  return (
    <div className="flex flex-col items-center justify-center pt-2 sm:pt-8 pb-32 sm:pb-40 px-2 sm:px-4 animate-fade-in mt-0 sm:mt-8">
      {/* Glowing Orb */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-indigo-500 via-purple-500 to-blue-400 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.5)] mb-6 sm:mb-8 animate-pulse-rays">
        <span className="text-3xl sm:text-4xl drop-shadow-lg">🌤️</span>
      </div>
      
      {/* Gradient Hero Heading */}
      <h2 className="text-xl sm:text-3xl md:text-4xl font-heading font-bold text-gradient-hero text-center tracking-tight mb-2 sm:mb-3">
        {state.language === 'en' ? 'What would you like to know?' :
         state.language === 'hi' ? 'आप क्या जानना चाहेंगे?' :
         state.language === 'as' ? 'আপুনি কি জানিব বিচাৰে?' :
         'আপনি কী জানতে চান?'}
      </h2>
      <p className="text-theme-muted text-center mb-6 sm:mb-10 max-w-md text-xs sm:text-base px-4 drop-shadow-sm">
        {state.language === 'en' ? 'Tap a question below or type your own' :
         state.language === 'hi' ? 'नीचे एक सवाल टैप करें या अपना लिखें' :
         state.language === 'as' ? 'তলৰ প্ৰশ্ন এটা টিপক বা নিজৰ লিখক' :
         'নিচের একটি প্রশ্ন ট্যাপ করুন বা নিজের লিখুন'}
      </p>

      {/* Glassmorphism Suggestion Cards */}
      <div className="w-full flex flex-col gap-2.5 sm:gap-4 max-w-2xl px-2 sm:px-0">
        {questions.map((q, idx) => {
          const accent = CARD_ACCENTS[idx % CARD_ACCENTS.length];
          return (
            <button
              key={idx}
              onClick={() => handleTapQuestion(q)}
              className={`group glass-panel shimmer-hover rounded-2xl p-3 sm:p-5 flex items-center gap-3 sm:gap-4 ${accent.hover} hover:scale-[1.02] transition-all duration-300 text-left active:scale-[0.98]`}
            >
              {/* Emoji Icon Circle */}
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${accent.iconHover} transition-colors border border-theme-border text-base sm:text-xl`} style={{ background: 'var(--glass-bg)' }}>
                {accent.emoji}
              </div>
              {/* Text */}
              <div className="flex-1">
                <p className="text-theme-muted group-hover:text-theme-primary transition-colors text-[13px] sm:text-base font-medium">{q}</p>
              </div>
              {/* Arrow */}
              <svg className={`w-4 h-4 sm:w-5 sm:h-5 text-theme-muted opacity-50 group-hover:opacity-100 ${accent.arrow} transition-all duration-300 transform group-hover:translate-x-1 flex-shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}
