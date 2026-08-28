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
    <div className="flex justify-start mb-3">
      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center ai-avatar-glow mr-3 flex-shrink-0">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white animate-pulse">
          <rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" />
        </svg>
      </div>
      <div className="glass-ai-card rounded-3xl rounded-tl-sm px-5 py-4 max-w-[70%]">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-sm text-white/60 italic transition-all duration-300">
            {texts[textIndex]}
          </p>
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-3 skeleton-pulse rounded-full w-3/4"></div>
          <div className="h-3 skeleton-pulse rounded-full w-1/2"></div>
        </div>
      </div>
    </div>
  );
}
