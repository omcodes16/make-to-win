import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { requestMarineSafety } from '../services/marineSafetyApi';
import { COASTAL_SIH_SCENARIOS, playMarineFoghorn } from '../utils/marineScenarios';

export default function SagarRakshakModal({ isOpen, onClose, locationData, language = 'en' }) {
  const [selectedPort, setSelectedPort] = useState({
    name: locationData?.name || 'Chennai Coast, Tamil Nadu',
    lat: locationData?.lat || 13.0827,
    lng: locationData?.lng || 80.2707
  });

  const [activeBoatClass, setActiveBoatClass] = useState('vallam'); // 'catamaran' | 'vallam' | 'trawler'
  const [activeScenarioKey, setActiveScenarioKey] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen]);

  // Fetch report whenever port changes or on initial open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    requestMarineSafety({
      lat: selectedPort.lat,
      lng: selectedPort.lng,
      locationName: selectedPort.name,
      language
    })
      .then((data) => {
        if (isMounted) {
          setReportData(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Marine report fetch error:', err);
          setError(err.message || 'Unable to fetch marine data');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedPort, language]);

  if (!isOpen) return null;

  // Handle scenario selection
  const handleSelectScenario = (sc) => {
    setActiveScenarioKey(sc.key);
    setSelectedPort({
      name: sc.port,
      lat: sc.lat,
      lng: sc.lng
    });
  };

  // Speech Readout
  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const script = reportData?.spokenAudioScript || 'Sagar-Rakshak Marine Safety Advisory active.';
    const utterance = new SpeechSynthesisUtterance(script);

    const voices = window.speechSynthesis.getVoices();
    const langCode = language === 'hi' ? 'hi-IN' : language === 'bn' ? 'bn-IN' : 'en-IN';
    const voice = voices.find(v => v.lang.startsWith(langCode) || v.lang.includes(langCode));
    if (voice) utterance.voice = voice;

    utterance.rate = 0.95;
    utterance.pitch = 0.95;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Sound Foghorn
  const handleFoghorn = () => {
    playMarineFoghorn();
  };

  // Printable slip
  const handlePrint = () => {
    window.print();
  };

  const isHi = language === 'hi';
  const t = reportData?.telemetry || {};
  const sea = reportData?.seaState || {};
  const portSig = reportData?.portSignal || {};
  const kallakkadal = reportData?.kallakkadal || {};
  const imbl = reportData?.imbl || {};
  const boatLimits = reportData?.boatLimits || {};
  const activeBoat = boatLimits[activeBoatClass] || {};

  const modalContent = (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-fade-in font-body text-white">
      <div className="relative w-full max-w-4xl bg-slate-900/95 border border-cyan-500/30 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-cyan-950/70 via-slate-900 to-blue-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-xl shadow-inner">
              🌊
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide text-cyan-300">
                  {isHi ? 'सागर रक्षक (Sagar-Rakshak)' : 'Sagar-Rakshak Marine Safety'}
                </h2>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  SIH PS-26068
                </span>
              </div>
              <p className="text-[11px] text-white/60">
                {isHi ? 'कल्लाकडाल अचानक लहरें • समुद्री सीमा (IMBL) रडार • नौका-वार सुरक्षित सीमा' : 'Kallakkadal Swell Alert • IMBL Border Radar • 3-Tier Boat Safe Limits'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-cyan-500/30">
          
          {/* Active Port & Coordinates Pill */}
          <div className="glass-panel border border-cyan-500/30 bg-cyan-950/20 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-cyan-300 font-medium flex-wrap">
              <span>⚓ {selectedPort.name}</span>
              <span className="opacity-40">|</span>
              <span>Lat: {Number(selectedPort.lat).toFixed(2)}°N, Lng: {Number(selectedPort.lng).toFixed(2)}°E</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 font-semibold text-[11px] text-cyan-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                Live Marine Telemetry
              </span>
            </div>
          </div>

          {/* 1-Click SIH Live Sea Test Scenarios */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <span>⚡</span> {isHi ? '1-क्लिक त्वरित समुद्री परीक्षण (SIH Demo Scenarios)' : '1-Click SIH Marine Demo Scenarios'}
              </span>
              <span className="text-[10px] text-white/50">Instant Coastal Ports</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {COASTAL_SIH_SCENARIOS.map((sc) => (
                <button
                  key={sc.key}
                  onClick={() => handleSelectScenario(sc)}
                  className={`p-3 rounded-2xl text-left border transition-all duration-200 flex flex-col gap-1.5 ${
                    activeScenarioKey === sc.key
                      ? 'bg-cyan-600/30 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-[1.02]'
                      : 'bg-slate-800/60 hover:bg-slate-800 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{sc.icon}</span>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${sc.badgeColor}`}>
                      {sc.badge}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-white line-clamp-1">
                    {isHi ? sc.titleHi : sc.title}
                  </div>
                  <div className="text-[10px] text-white/50 line-clamp-1">{sc.port}</div>
                </button>
              ))}
            </div>
          </div>

          {/* LOADING STATE */}
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-cyan-300">
              <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-bold uppercase tracking-wider animate-pulse">
                {isHi ? 'महासागरीय टेलीमेट्री व सीमा गणना जारी...' : 'Analyzing Ocean Swell & IMBL Distance...'}
              </span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* MAIN MARINE INTELLIGENCE VIEW */}
          {!isLoading && reportData && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Kallakkadal High Swell Alert (If Triggered) */}
              {kallakkadal.isTriggered && (
                <div className="p-4 rounded-3xl bg-gradient-to-r from-cyan-900/60 via-blue-900/50 to-indigo-900/60 border border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.3)] flex items-start gap-3.5 animate-pulse">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/30 border border-cyan-400 flex items-center justify-center text-2xl shrink-0">
                    🌊
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-400 text-black">
                        {kallakkadal.severity} SWELL SURGE
                      </span>
                      <span className="text-xs font-bold text-cyan-200">
                        {isHi ? kallakkadal.warningHindi : kallakkadal.warningTitle}
                      </span>
                    </div>
                    <p className="text-xs text-white/90 leading-relaxed font-medium">
                      {kallakkadal.explanation}
                    </p>
                    <div className="mt-2 text-[11px] font-bold text-cyan-300">
                      ⚡ Action: Anchor catamarans and fiber crafts beyond the high tide breaker zone immediately!
                    </div>
                  </div>
                </div>
              )}

              {/* IMBL (International Maritime Boundary Line) Radar Alert */}
              <div className={`p-4 sm:p-5 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl ${
                imbl.status === 'critical'
                  ? 'bg-red-950/60 border-red-500 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.35)]'
                  : imbl.status === 'caution'
                  ? 'bg-amber-950/50 border-amber-500/50'
                  : 'bg-slate-800/80 border-white/10'
              }`}>
                <div className="flex items-start gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border ${
                    imbl.status === 'critical'
                      ? 'bg-red-500/20 text-red-300 border-red-500/40'
                      : imbl.status === 'caution'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {imbl.status === 'critical' ? '🚨' : imbl.status === 'caution' ? '⚠️' : '🛡️'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider text-white/60">
                        IMBL Border Proximity Radar
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        imbl.status === 'critical'
                          ? 'bg-red-500/30 text-red-300 border-red-500/40'
                          : imbl.status === 'caution'
                          ? 'bg-amber-500/30 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                      }`}>
                        {imbl.status.toUpperCase()} ZONE
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-black text-white">
                      {imbl.distanceKm} km ({imbl.distanceNm} Nautical Miles) to {imbl.nearestBorderName}
                    </h4>
                    <p className="text-xs text-white/80 mt-0.5 leading-relaxed">
                      {imbl.warningMessage}
                    </p>
                  </div>
                </div>

                {imbl.isAudibleAlarm && (
                  <button
                    onClick={handleFoghorn}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black shadow-lg shadow-red-600/40 shrink-0 flex items-center gap-2 active:scale-95 transition-all animate-bounce"
                  >
                    <span>📢</span>
                    <span>Sound Border Horn</span>
                  </button>
                )}
              </div>

              {/* Primary Marine Telemetry Grid (Waves, Swells, Sea State, Port Signal) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Wave Height */}
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-white/10 flex flex-col justify-between">
                  <div className="text-[10px] uppercase font-bold text-white/50">Primary Wave Height</div>
                  <div className="text-2xl sm:text-3xl font-black text-cyan-300 my-1">
                    {t.waveHeight} <span className="text-sm font-normal text-white/60">m</span>
                  </div>
                  <div className="text-[11px] font-bold text-white/80">
                    Period: {t.wavePeriod}s • Dir: {t.waveCardinal} ({t.waveDirection}°)
                  </div>
                </div>

                {/* Ocean Swell */}
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-white/10 flex flex-col justify-between">
                  <div className="text-[10px] uppercase font-bold text-white/50">Ocean Swell</div>
                  <div className="text-2xl sm:text-3xl font-black text-blue-300 my-1">
                    {t.swellHeight} <span className="text-sm font-normal text-white/60">m</span>
                  </div>
                  <div className="text-[11px] font-bold text-white/80">
                    Period: {t.swellPeriod}s • {t.swellCardinal}
                  </div>
                </div>

                {/* Sea State */}
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-white/10 flex flex-col justify-between">
                  <div className="text-[10px] uppercase font-bold text-white/50">Douglas Sea State</div>
                  <div className={`text-xl sm:text-2xl font-black my-1 ${sea.color}`}>
                    {sea.label}
                  </div>
                  <div className="text-[11px] font-bold text-white/60">
                    Code {sea.code} • {sea.desc}
                  </div>
                </div>

                {/* Port Danger Signal */}
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-white/10 flex flex-col justify-between">
                  <div className="text-[10px] uppercase font-bold text-white/50">WMO Port Signal</div>
                  <div className={`text-sm sm:text-base font-black my-1 ${portSig.color}`}>
                    {portSig.signalName}
                  </div>
                  <div className="text-[10px] text-white/60 line-clamp-1">
                    Flag: {portSig.flagCode}
                  </div>
                </div>
              </div>

              {/* Boat-Class Safe Venturing Limits Matrix */}
              <div className="glass-panel border border-cyan-500/30 bg-cyan-950/20 rounded-3xl p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-sm font-black text-cyan-300 uppercase tracking-wide">
                      {isHi ? 'नौका वर्ग अनुसार सुरक्षित सीमा (Boat-Class Safe Venturing Matrix)' : '3-Tier Boat-Class Safe Venturing Limits'}
                    </h4>
                    <p className="text-xs text-white/60 mt-0.5">
                      {isHi ? 'अपनी नाव का प्रकार चुनें और अनुमत समुद्री दूरी जानें' : 'Select vessel type to inspect certified offshore venturing limits'}
                    </p>
                  </div>
                </div>

                {/* Boat Class Tabs */}
                <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-800/60 border border-white/10">
                  {[
                    { key: 'catamaran', label: isHi ? 'पारंपरिक काटामारन' : 'Catamaran / Canoe', icon: '🛶' },
                    { key: 'vallam', label: isHi ? 'मोटराइज्ड वल्लम' : 'Motorized Vallam', icon: '🚤' },
                    { key: 'trawler', label: isHi ? 'मशीनीकृत ट्रॉलर' : 'Mechanized Trawler', icon: '🚢' },
                  ].map(b => (
                    <button
                      key={b.key}
                      onClick={() => setActiveBoatClass(b.key)}
                      className={`py-2 px-2 sm:px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        activeBoatClass === b.key
                          ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 scale-[1.02]'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className="text-sm">{b.icon}</span>
                      <span className="truncate">{b.label}</span>
                    </button>
                  ))}
                </div>

                {/* Active Boat Detail Box */}
                {activeBoat && (
                  <div className="p-4 rounded-2xl bg-slate-800/80 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">{activeBoat.label}</span>
                        <span className="text-[10px] text-white/50">Wave Threshold: {activeBoat.waveLimit}</span>
                      </div>
                      <p className="text-xs text-white/80 leading-relaxed">
                        {activeBoat.advice}
                      </p>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <div className="text-[10px] uppercase font-bold text-white/50">Venturing Permission</div>
                      <div className={`text-base sm:text-lg font-black ${
                        activeBoat.status === 'safe'
                          ? 'text-emerald-400'
                          : activeBoat.status === 'caution'
                          ? 'text-amber-400'
                          : 'text-red-400'
                      }`}>
                        {activeBoat.maxDistance}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Foghorn sound */}
                  <button
                    onClick={handleFoghorn}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/15 text-white text-xs font-bold flex items-center gap-2 shadow-sm active:scale-95 transition-all"
                  >
                    <span>📯</span>
                    <span>{isHi ? 'समुद्री हॉर्न (Foghorn)' : 'Sound Foghorn'}</span>
                  </button>

                  {/* Audio Readout */}
                  <button
                    onClick={handleToggleSpeech}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 shadow-sm ${
                      isSpeaking
                        ? 'bg-red-600/30 border-red-400 text-red-200 animate-pulse'
                        : 'bg-cyan-600/20 hover:bg-cyan-600/30 border-cyan-500/30 text-cyan-300'
                    }`}
                  >
                    <span>{isSpeaking ? '⏹️' : '🎙️'}</span>
                    <span>{isSpeaking ? (isHi ? 'रोकें' : 'Stop Audio') : (isHi ? 'रेडियो बुलेटिन सुनें' : 'Listen Marine Voice')}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span>🖨️</span>
                    <span>{isHi ? 'पोर्ट क्लीयरेंस पर्ची' : 'Port Clearance Slip'}</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-slate-950/80 flex items-center justify-between text-xs text-white/60">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>Open-Meteo Marine Suite • WMO Douglas Sea Scale • IMD Coastal Warning</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
          >
            {isHi ? 'बंद करें' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
