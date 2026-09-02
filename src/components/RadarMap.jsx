import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UI_TRANSLATIONS } from '../utils/translations';

export default function RadarMap({ lat, lng }) {
  const { state } = useApp();
  const [interactive, setInteractive] = useState(false);
  const t = UI_TRANSLATIONS[state.language] || UI_TRANSLATIONS['en'];

  const centerLat = lat || 20.5937;
  const centerLng = lng || 78.9629;
  const zoom = lat && lng ? 13 : 4;

  const windyUrl = `https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=%C2%B0C&metricWind=km%2Fh&zoom=${zoom}&overlay=rain&product=ecmwf&level=surface&lat=${centerLat}&lon=${centerLng}&message=true`;

  return (
    <div className="w-full h-full relative z-0 rounded-2xl overflow-hidden group">
      <iframe
        width="100%"
        height="100%"
        src={windyUrl}
        frameBorder="0"
        title="Live Weather Radar"
        className={`w-full h-full ${interactive ? 'pointer-events-auto' : 'pointer-events-none'}`}
        allowFullScreen
      ></iframe>
      {!interactive ? (
        <div 
          onClick={() => setInteractive(true)}
          className="absolute inset-0 bg-black/20 hover:bg-black/10 flex items-center justify-center cursor-pointer transition-all"
        >
          <span className="bg-black/75 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold border border-white/20 shadow-xl flex items-center gap-2 hover:scale-105 transition-transform">
            <span>🖐️</span> Tap to interact with radar
          </span>
        </div>
      ) : (
        <button 
          onClick={() => setInteractive(false)}
          className="absolute top-3 right-3 bg-black/75 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold border border-white/20 shadow-md hover:bg-black/90 transition-all flex items-center gap-1.5 z-10"
        >
          <span>🔒</span> Lock Scroll
        </button>
      )}
    </div>
  );
}
