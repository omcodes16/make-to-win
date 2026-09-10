import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { LOADING_TEXTS } from '../utils/constants';

export default function LoadingIndicator() {
  const { state } = useApp();
  const [textIndex, setTextIndex] = useState(0);

  const texts = LOADING_TEXTS[state.language] || LOADING_TEXTS.en;

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex(prev => (prev + 1) % texts.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [texts.length]);

  return (
    <div className="flex justify-start mb-4 sm:mb-6 animate-slide-up">
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-500/10 dark:bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 mr-2.5 sm:mr-3 flex-shrink-0 shadow-xs mt-0.5">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5 animate-spin" style={{ animationDuration: '3.5s' }}>
          <path d="M12 2a10 10 0 1 0 10 10" />
          <path d="M12 6a6 6 0 1 0 6 6" />
          <path d="M12 10a2 2 0 1 0 2 2" />
          <path d="M12 12 21.5 2.5" />
        </svg>
      </div>
      <div className="glass-ai-card rounded-2xl sm:rounded-3xl rounded-tl-sm px-4 sm:px-5 py-3.5 max-w-[85%] sm:max-w-[65%]">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5 shrink-0">
            <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium transition-all duration-300 truncate">
            {texts[textIndex]}
          </p>
        </div>
        <div className="mt-2.5 space-y-1.5">
          <div className="h-2.5 skeleton-pulse rounded-full w-3/4"></div>
          <div className="h-2.5 skeleton-pulse rounded-full w-1/2"></div>
        </div>
      </div>
    </div>
  );
}
