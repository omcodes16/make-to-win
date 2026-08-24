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
      <div className="bg-cloud/50 rounded-bubble rounded-bl-sm px-4 py-3 max-w-[70%]">
        <div className="flex items-center gap-2">
          {/* Animated dots */}
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-teal rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-teal rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-teal rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-sm text-dusk/60 italic transition-all duration-300">
            {texts[textIndex]}
          </p>
        </div>
      </div>
    </div>
  );
}
