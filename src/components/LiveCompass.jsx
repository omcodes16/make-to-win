import React, { useState, useEffect } from 'react';

// Converts degrees (0-360) to 16-point cardinal direction
export function getCardinalDirection(deg) {
  if (deg === null || deg === undefined || isNaN(deg)) return 'N';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((deg % 360) / 22.5)) % 16;
  return directions[index];
}

export default function LiveCompass({ windDeg = 0, windSpeed = 0, isCurrentLocation = true, label = "Wind" }) {
  const [deviceHeading, setDeviceHeading] = useState(null);
  const [hasSensor, setHasSensor] = useState(false);

  // Device orientation / magnetometer listener (active when on live location)
  useEffect(() => {
    if (!isCurrentLocation) {
      setDeviceHeading(null);
      return;
    }

    const handleOrientation = (e) => {
      let heading = null;
      if (e.webkitCompassHeading !== undefined && e.webkitCompassHeading !== null) {
        // iOS Safari
        heading = Math.round(e.webkitCompassHeading);
      } else if (e.alpha !== null && e.alpha !== undefined) {
        // Android Chrome
        heading = Math.round(360 - e.alpha);
      }
      if (heading !== null && !isNaN(heading)) {
        setDeviceHeading((heading + 360) % 360);
        setHasSensor(true);
      }
    };

    if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleOrientation, true);
      }
    };
  }, [isCurrentLocation]);

  // If live device sensor is available and on current location, use device heading; otherwise use location's meteorological wind direction
  const effectiveHeading = (isCurrentLocation && deviceHeading !== null) 
    ? deviceHeading 
    : (windDeg || 0);

  const cardinal = getCardinalDirection(effectiveHeading);

  return (
    <div 
      title={hasSensor && isCurrentLocation ? `Live Device Compass Heading: ${cardinal} (${Math.round(effectiveHeading)}°)` : `Wind Direction: ${cardinal} (${Math.round(windDeg)}°) · Speed: ${windSpeed} km/h`}
      className="glass-panel border border-[var(--theme-border)] rounded-2xl sm:rounded-[2rem] p-2.5 sm:p-5 flex flex-col items-center justify-center min-w-[70px] sm:min-w-[90px] shadow-sm shimmer-hover stat-card-hover select-none transition-all"
    >
      {/* Mini Rotating Dial & Needle */}
      <div className="relative w-7 h-7 sm:w-9 sm:h-9 mb-1 sm:mb-2 flex items-center justify-center rounded-full bg-[var(--glass-bg)] border border-[var(--theme-border)] shadow-inner">
        {/* Cardinal Markers on Dial */}
        <span className="absolute top-0 text-[6px] sm:text-[7px] font-black text-red-500">N</span>
        <span className="absolute right-0.5 text-[5px] sm:text-[6px] font-bold text-[var(--text-secondary)] opacity-60">E</span>
        <span className="absolute bottom-0 text-[5px] sm:text-[6px] font-bold text-[var(--text-secondary)] opacity-60">S</span>
        <span className="absolute left-0.5 text-[5px] sm:text-[6px] font-bold text-[var(--text-secondary)] opacity-60">W</span>

        {/* Dynamic Rotating Compass Needle */}
        <div 
          className="w-full h-full absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-out"
          style={{ transform: `rotate(${effectiveHeading}deg)` }}
        >
          {/* North Pointing Arrow (Red) */}
          <div className="w-0 h-0 border-l-[2.5px] sm:border-l-[3px] border-l-transparent border-r-[2.5px] sm:border-r-[3px] border-r-transparent border-b-[10px] sm:border-b-[12px] border-b-red-500 absolute -top-0.5" />
          {/* South Pointing Arrow (Indigo) */}
          <div className="w-0 h-0 border-l-[2px] sm:border-l-[2.5px] border-l-transparent border-r-[2px] sm:border-r-[2.5px] border-r-transparent border-t-[8px] sm:border-t-[10px] border-t-indigo-400 opacity-80 absolute -bottom-0.5" />
          {/* Pivot Center Pin */}
          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm border border-black/20 z-10" />
        </div>
      </div>

      {/* Primary Value: Cardinal & Wind Speed */}
      <div className="font-bold text-xs sm:text-base mb-0.5 sm:mb-1 whitespace-nowrap text-[var(--text-primary)] font-mono flex items-center gap-1">
        <span>{cardinal}</span>
        <span className="text-[10px] sm:text-xs font-semibold text-[var(--text-secondary)]">({windSpeed})</span>
      </div>

      {/* Label */}
      <div className="text-[var(--text-secondary)] text-[8px] sm:text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
        <span>{label}</span>
        {isCurrentLocation && hasSensor && (
          <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" title="Live Sensor"></span>
        )}
      </div>
    </div>
  );
}
