import React from 'react';
import { useApp } from '../context/AppContext';

export default function OfflineBanner() {
  const { state } = useApp();

  if (state.isOnline) return null;

  const cachedTime = state.lastCachedResponse?.cachedAt
    ? new Date(state.lastCachedResponse.cachedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="fixed top-[54px] left-0 right-0 z-30 bg-amber/10 border-b border-amber/20">
      <div className="max-w-lg mx-auto px-4 py-2 flex items-center gap-2">
        <span className="text-amber text-sm">📡</span>
        <p className="text-xs text-dusk/70">
          {state.language === 'en'
            ? `You're offline — ${cachedTime ? `showing last forecast from ${cachedTime}` : 'no cached data available'}`
            : `ऑफलाइन — ${cachedTime ? `अंतिम पूर्वानुमान ${cachedTime} से` : 'कोई कैश डेटा नहीं'}`
          }
        </p>
      </div>
    </div>
  );
}
