import React from 'react';
import { useApp } from '../context/AppContext';
import { UI_TRANSLATIONS } from '../utils/translations';

export default function RadarMap({ lat, lng }) {
  const { state } = useApp();
  const t = UI_TRANSLATIONS[state.language] || UI_TRANSLATIONS['en'];

  const centerLat = lat || 20.5937;
  const centerLng = lng || 78.9629;
  const zoom = lat && lng ? 13 : 4;

  const windyUrl = `https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=%C2%B0C&metricWind=km%2Fh&zoom=${zoom}&overlay=rain&product=ecmwf&level=surface&lat=${centerLat}&lon=${centerLng}&message=true`;

  return (
    <div className="w-full h-full relative z-0 rounded-2xl overflow-hidden">
      <iframe
        width="100%"
        height="100%"
        src={windyUrl}
        frameBorder="0"
        title="Live Weather Radar"
        className="w-full h-full pointer-events-auto"
        allowFullScreen
      ></iframe>
    </div>
  );
}
