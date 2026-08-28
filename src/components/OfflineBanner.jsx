import React from 'react';
import { useApp } from '../context/AppContext';

export default function OfflineBanner() {
  const { state } = useApp();

  if (state.isOnline) return null;

  const cachedTime = state.lastCachedResponse?.cachedAt
    ? new Date(state.lastCachedResponse.cachedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="fixed top-[54px] left-0 right-0 z-30 bg-amber-950/60 backdrop-blur-xl border-b border-amber-500/20">
      <div className="max-w-lg mx-auto px-4 py-2 flex items-center gap-2">
        <span className="text-amber-400 text-sm">📡</span>
        <p className="text-xs text-amber-200/80">
          {state.language === 'en'
            ? `You're offline — ${cachedTime ? `showing last forecast from ${cachedTime}` : 'no cached data available'}`
            : `ऑफलाइन — ${cachedTime ? `अंतिम पूर्वानुमान ${cachedTime} से` : 'कोई कैश डेटा नहीं'}`
          }
        </p>
      </div>
    </div>
  );
}
