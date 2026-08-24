import React from 'react';

export default function WeatherScene({ condition, weatherCode }) {
  // condition: 'clear' | 'cloudy' | 'rain' | 'storm' | 'severe' | 'fog'
  
  // Backgrounds with slightly richer, deeper gradients for better contrast
  let bgClass = "bg-gradient-to-b from-[#4facfe] to-[#00f2fe]"; // Clear, vibrant sky
  if (condition === 'cloudy') {
    bgClass = "bg-gradient-to-b from-[#8ca8c9] to-[#d3dce3]";
  } else if (condition === 'rain') {
    bgClass = "bg-gradient-to-b from-[#405469] to-[#1B2A4A]";
  } else if (condition === 'storm' || condition === 'severe') {
    bgClass = "bg-gradient-to-b from-[#0f172a] to-[#334155]";
  } else if (condition === 'fog') {
    bgClass = "bg-gradient-to-b from-[#94a3b8] to-[#e2e8f0]";
  }

  // Show sun if clear OR partly cloudy (code 1 or 2)
  const isSunny = condition === 'clear' || weatherCode === 1 || weatherCode === 2;
  const isCloudy = condition !== 'clear';
  const isRainy = condition === 'rain' || condition === 'storm' || condition === 'severe';
  const isFoggy = condition === 'fog' || condition === 'rain' || condition === 'storm' || condition === 'severe';
  const isStormy = condition === 'storm' || condition === 'severe';

  return (
    <div className={`absolute inset-0 ${bgClass} overflow-hidden weather-scene transition-colors duration-1000`}>
      
      {/* 3D Realistic Sun */}
      {isSunny && (
        <div className="absolute top-8 right-8 w-24 h-24 rounded-full bg-[#fce570] opacity-100 animate-pulse-rays z-10"
             style={{
               boxShadow: '0 0 60px 20px rgba(253, 224, 71, 0.6), inset -10px -10px 20px rgba(234, 179, 8, 0.4), inset 10px 10px 20px rgba(255, 255, 255, 0.8)'
             }}
        ></div>
      )}

      {/* 3D Volumetric Clouds (CSS Box Shadow Magic) */}
      {isCloudy && (
        <>
          <div className="absolute top-10 left-[-10%] opacity-80 animate-drift-slow z-20">
            <div className="w-32 h-32 bg-white rounded-full relative"
                 style={{
                   boxShadow: `
                     60px -20px 0 -10px white,
                     100px 10px 0 10px white,
                     150px -10px 0 -5px white,
                     40px 10px 40px rgba(0,0,0,0.1),
                     inset -10px -20px 20px rgba(0,0,0,0.05)
                   `,
                   filter: isRainy ? 'brightness(0.6)' : 'brightness(1)'
                 }}
            ></div>
          </div>
          
          <div className="absolute top-24 left-[-20%] opacity-60 animate-drift-fast z-10" style={{ transform: 'scale(1.5)' }}>
            <div className="w-40 h-40 bg-white rounded-full relative"
                 style={{
                   boxShadow: `
                     80px -30px 0 -10px white,
                     130px 20px 0 20px white,
                     190px -20px 0 -5px white,
                     50px 20px 50px rgba(0,0,0,0.15),
                     inset -20px -30px 30px rgba(0,0,0,0.1)
                   `,
                   filter: isRainy ? 'brightness(0.5)' : 'brightness(0.9)'
                 }}
            ></div>
          </div>
        </>
      )}

      {/* Realistic Motion-Blurred Rain */}
      {isRainy && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-30" style={{ transform: 'rotate(15deg) scale(1.5)' }}>
          <div className="absolute top-[-100%] left-[-50%] w-[200%] h-[200%] animate-rain-fall flex flex-col opacity-60">
            <svg width="100%" height="100%">
              <pattern id="rain-pattern-1" width="120" height="150" patternUnits="userSpaceOnUse">
                <line x1="60" y1="0" x2="60" y2="30" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
                <line x1="20" y1="50" x2="20" y2="90" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round" />
                <line x1="100" y1="80" x2="100" y2="100" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#rain-pattern-1)" />
            </svg>
          </div>
          
          <div className="absolute top-[-100%] left-[-50%] w-[200%] h-[200%] animate-rain-fall-fast flex flex-col opacity-40">
            <svg width="100%" height="100%">
              <pattern id="rain-pattern-2" width="80" height="120" patternUnits="userSpaceOnUse">
                <line x1="40" y1="10" x2="40" y2="60" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="10" y1="70" x2="10" y2="100" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#rain-pattern-2)" />
            </svg>
          </div>
        </div>
      )}

      {/* Lightning Flash (Only Severe/Storm) */}
      {isStormy && (
        <div className="absolute inset-0 bg-white opacity-0 animate-lightning-flash z-40 pointer-events-none mix-blend-overlay"></div>
      )}

      {/* Volumetric Fog/Mist */}
      {isFoggy && (
        <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-white/60 via-white/20 to-transparent animate-pulse-slow z-20 pointer-events-none backdrop-blur-[2px]"></div>
      )}
    </div>
  );
}
