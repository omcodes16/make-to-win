import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { requestMarineSafety } from '../services/marineSafetyApi';
import { COASTAL_SIH_SCENARIOS, playMarineFoghorn } from '../utils/marineScenarios';

export default function SagarRakshakModal({ isOpen, onClose, locationData, language = 'en' }) {
  const { state } = useApp();
  const isLight = state?.uiTheme === 'light';

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

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    requestMarineSafety({
      lat: selectedPort.lat,
      lng: selectedPort.lng,
      locationName: selectedPort.name,
      language,
      scenario: selectedPort.scenario || activeScenarioKey || null
    })
      .then((data) => {
        if (isMounted) {
          setReportData(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to fetch marine report.');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedPort, language, activeScenarioKey]);

  // Scenario 1-click trigger
  const handleSelectScenario = (sc) => {
    setActiveScenarioKey(sc.key);
    setSelectedPort({
      name: sc.port,
      lat: sc.lat,
      lng: sc.lng,
      scenario: sc.key
    });
  };

  // Text to Speech playback for coastal bulletin
  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!reportData) return;

    const textToRead = `${reportData.spokenAudioScript || reportData.bulletinText || ''}. ${reportData.kallakkadal?.explanation || ''}. ${reportData.imbl?.warningMessage || ''}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Border alarm horn sound
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
    <div
      className={`fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 overflow-y-auto ${
        isLight ? 'bg-black/50' : 'bg-black/85'
      } backdrop-blur-md animate-fade-in font-body transition-colors duration-200`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`relative w-full max-w-4xl rounded-3xl overflow-hidden flex flex-col max-h-[92vh] shadow-2xl border transition-colors duration-200 ${
          isLight
            ? 'bg-[#fcfaf7] text-slate-800 border-cyan-300 shadow-slate-300/60'
            : 'bg-[#0b1120]/95 text-slate-100 border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.25)]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${
            isLight
              ? 'bg-gradient-to-r from-cyan-100/70 via-sky-50 to-blue-100/70 border-cyan-200/80 text-slate-900'
              : 'bg-gradient-to-r from-cyan-950/70 via-slate-900 to-blue-950/70 border-white/10 text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-inner ${
                isLight
                  ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-900'
                  : 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300'
              }`}
            >
              🌊
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  className={`text-base sm:text-lg font-black tracking-wide ${
                    isLight ? 'text-cyan-900' : 'text-cyan-300'
                  }`}
                >
                  {isHi ? 'सागर रक्षक (Sagar-Rakshak)' : 'Sagar-Rakshak Marine Safety'}
                </h2>
                <span
                  className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full border ${
                    isLight
                      ? 'bg-cyan-100 text-cyan-800 border-cyan-300'
                      : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                  }`}
                >
                  SIH PS-26068
                </span>
              </div>
              <p
                className={`text-[11px] ${
                  isLight ? 'text-slate-600' : 'text-white/60'
                }`}
              >
                {isHi
                  ? 'कल्लाकडाल अचानक लहरें • समुद्री सीमा (IMBL) रडार • नौका-वार सुरक्षित सीमा'
                  : 'Kallakkadal Swell Alert • IMBL Border Radar • 3-Tier Boat Safe Limits'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isLight
                ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-700'
                : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10'
            }`}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          className={`p-4 sm:p-6 overflow-y-auto space-y-6 scrollbar-thin ${
            isLight
              ? 'scrollbar-thumb-slate-300'
              : 'scrollbar-thumb-cyan-500/30'
          }`}
        >
          {/* Active Port & Coordinates Pill */}
          <div
            className={`rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs border ${
              isLight
                ? 'bg-white border-cyan-200 shadow-xs'
                : 'bg-cyan-950/20 border-cyan-500/30'
            }`}
          >
            <div
              className={`flex items-center gap-2 font-semibold flex-wrap ${
                isLight ? 'text-cyan-900' : 'text-cyan-300'
              }`}
            >
              <span>⚓ {selectedPort.name}</span>
              <span className="opacity-40">|</span>
              <span>
                Lat: {Number(selectedPort.lat).toFixed(2)}°N, Lng:{' '}
                {Number(selectedPort.lng).toFixed(2)}°E
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-full font-bold text-[11px] flex items-center gap-1.5 border ${
                  isLight
                    ? 'bg-cyan-100 text-cyan-800 border-cyan-300'
                    : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping"></span>
                Live Marine Telemetry
              </span>
            </div>
          </div>

          {/* 1-Click SIH Live Sea Test Scenarios */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  isLight ? 'text-amber-800' : 'text-amber-300'
                }`}
              >
                <span>⚡</span>{' '}
                {isHi
                  ? '1-क्लिक त्वरित समुद्री परीक्षण (SIH Demo Scenarios)'
                  : '1-Click SIH Marine Demo Scenarios'}
              </span>
              <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                Instant Coastal Ports
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {COASTAL_SIH_SCENARIOS.map((sc) => {
                const isSelectedScenario = activeScenarioKey === sc.key;
                return (
                  <button
                    key={sc.key}
                    onClick={() => handleSelectScenario(sc)}
                    className={`p-3 rounded-2xl text-left border transition-all duration-200 flex flex-col gap-1.5 cursor-pointer ${
                      isSelectedScenario
                        ? isLight
                          ? 'bg-cyan-100 border-cyan-500 shadow-md scale-[1.02]'
                          : 'bg-cyan-600/30 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-[1.02]'
                        : isLight
                        ? 'bg-white hover:bg-cyan-50/60 border-slate-200 shadow-xs'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{sc.icon}</span>
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${sc.badgeColor}`}
                      >
                        {sc.badge}
                      </span>
                    </div>
                    <div
                      className={`font-bold text-xs line-clamp-1 ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      {isHi ? sc.titleHi : sc.title}
                    </div>
                    <div
                      className={`text-[10px] line-clamp-1 ${
                        isLight ? 'text-slate-500' : 'text-white/50'
                      }`}
                    >
                      {sc.port}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* LOADING STATE */}
          {isLoading && (
            <div
              className={`py-12 flex flex-col items-center justify-center gap-3 ${
                isLight ? 'text-cyan-700' : 'text-cyan-300'
              }`}
            >
              <div
                className={`w-8 h-8 border-3 border-t-transparent rounded-full animate-spin ${
                  isLight ? 'border-cyan-600' : 'border-cyan-400'
                }`}
              ></div>
              <span className="text-xs font-bold uppercase tracking-wider animate-pulse">
                {isHi
                  ? 'महासागरीय टेलीमेट्री व सीमा गणना जारी...'
                  : 'Analyzing Ocean Swell & IMBL Distance...'}
              </span>
            </div>
          )}

          {error && (
            <div
              className={`p-4 rounded-2xl text-xs flex items-center gap-2 border ${
                isLight
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-red-500/20 border-red-500/30 text-red-300'
              }`}
            >
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* MAIN MARINE INTELLIGENCE VIEW */}
          {!isLoading && reportData && (
            <div className="space-y-6 animate-fade-in">
              {/* Kallakkadal High Swell Alert (If Triggered) */}
              {kallakkadal.isTriggered && (
                <div
                  className={`p-4 rounded-3xl border flex items-start gap-3.5 animate-pulse ${
                    isLight
                      ? 'bg-cyan-50 border-2 border-cyan-500 shadow-md text-slate-800'
                      : 'bg-gradient-to-r from-cyan-900/60 via-blue-900/50 to-indigo-900/60 border border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.3)] text-white'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border ${
                      isLight
                        ? 'bg-cyan-200 border-cyan-400 text-cyan-900'
                        : 'bg-cyan-500/30 border border-cyan-400 text-cyan-200'
                    }`}
                  >
                    🌊
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500 text-white">
                        {kallakkadal.severity} SWELL SURGE
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          isLight ? 'text-cyan-950' : 'text-cyan-200'
                        }`}
                      >
                        {isHi ? kallakkadal.warningHindi : kallakkadal.warningTitle}
                      </span>
                    </div>
                    <p
                      className={`text-xs leading-relaxed font-medium ${
                        isLight ? 'text-slate-700' : 'text-white/90'
                      }`}
                    >
                      {kallakkadal.explanation}
                    </p>
                    <div
                      className={`mt-2 text-[11px] font-bold ${
                        isLight ? 'text-cyan-800' : 'text-cyan-300'
                      }`}
                    >
                      ⚡ Action: Anchor catamarans and fiber crafts beyond the high tide breaker zone immediately!
                    </div>
                  </div>
                </div>
              )}

              {/* IMBL (International Maritime Boundary Line) Radar Alert */}
              <div
                className={`p-4 sm:p-5 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md ${
                  imbl.status === 'critical'
                    ? isLight
                      ? 'bg-red-50 border-2 border-red-500 shadow-red-200'
                      : 'bg-red-950/60 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.35)] animate-pulse'
                    : imbl.status === 'caution'
                    ? isLight
                      ? 'bg-amber-50 border-2 border-amber-500 shadow-amber-100'
                      : 'bg-amber-950/50 border-amber-500/50'
                    : isLight
                    ? 'bg-white border-slate-200 text-slate-800'
                    : 'bg-slate-800/80 border-white/10'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border ${
                      imbl.status === 'critical'
                        ? 'bg-red-500/20 text-red-500 border-red-500/40'
                        : imbl.status === 'caution'
                        ? 'bg-amber-500/20 text-amber-500 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40'
                    }`}
                  >
                    {imbl.status === 'critical' ? '🚨' : imbl.status === 'caution' ? '⚠️' : '🛡️'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider ${
                          isLight ? 'text-slate-600' : 'text-white/60'
                        }`}
                      >
                        IMBL Border Proximity Radar
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          imbl.status === 'critical'
                            ? isLight
                              ? 'bg-red-100 text-red-800 border-red-300'
                              : 'bg-red-500/30 text-red-300 border-red-500/40'
                            : imbl.status === 'caution'
                            ? isLight
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-amber-500/30 text-amber-300 border-amber-500/40'
                            : isLight
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {imbl.status.toUpperCase()} ZONE
                      </span>
                    </div>

                    <h4
                      className={`text-sm sm:text-base font-black ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      {imbl.distanceKm} km ({imbl.distanceNm} Nautical Miles) to {imbl.nearestBorderName}
                    </h4>
                    <p
                      className={`text-xs mt-0.5 leading-relaxed ${
                        isLight ? 'text-slate-700' : 'text-white/80'
                      }`}
                    >
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
                <div
                  className={`p-4 rounded-2xl border flex flex-col justify-between shadow-xs ${
                    isLight
                      ? 'bg-white border-slate-200'
                      : 'bg-slate-800/80 border-white/10'
                  }`}
                >
                  <div
                    className={`text-[10px] uppercase font-bold ${
                      isLight ? 'text-slate-500' : 'text-white/50'
                    }`}
                  >
                    Primary Wave Height
                  </div>
                  <div
                    className={`text-2xl sm:text-3xl font-black my-1 ${
                      isLight ? 'text-cyan-700' : 'text-cyan-300'
                    }`}
                  >
                    {t.waveHeight}{' '}
                    <span
                      className={`text-sm font-normal ${
                        isLight ? 'text-slate-500' : 'text-white/60'
                      }`}
                    >
                      m
                    </span>
                  </div>
                  <div
                    className={`text-[11px] font-bold ${
                      isLight ? 'text-slate-700' : 'text-white/80'
                    }`}
                  >
                    Period: {t.wavePeriod}s • Dir: {t.waveCardinal} ({t.waveDirection}°)
                  </div>
                </div>

                {/* Ocean Swell */}
                <div
                  className={`p-4 rounded-2xl border flex flex-col justify-between shadow-xs ${
                    isLight
                      ? 'bg-white border-slate-200'
                      : 'bg-slate-800/80 border-white/10'
                  }`}
                >
                  <div
                    className={`text-[10px] uppercase font-bold ${
                      isLight ? 'text-slate-500' : 'text-white/50'
                    }`}
                  >
                    Ocean Swell
                  </div>
                  <div
                    className={`text-2xl sm:text-3xl font-black my-1 ${
                      isLight ? 'text-blue-700' : 'text-blue-300'
                    }`}
                  >
                    {t.swellHeight}{' '}
                    <span
                      className={`text-sm font-normal ${
                        isLight ? 'text-slate-500' : 'text-white/60'
                      }`}
                    >
                      m
                    </span>
                  </div>
                  <div
                    className={`text-[11px] font-bold ${
                      isLight ? 'text-slate-700' : 'text-white/80'
                    }`}
                  >
                    Period: {t.swellPeriod}s • {t.swellCardinal}
                  </div>
                </div>

                {/* Sea State */}
                <div
                  className={`p-4 rounded-2xl border flex flex-col justify-between shadow-xs ${
                    isLight
                      ? 'bg-white border-slate-200'
                      : 'bg-slate-800/80 border-white/10'
                  }`}
                >
                  <div
                    className={`text-[10px] uppercase font-bold ${
                      isLight ? 'text-slate-500' : 'text-white/50'
                    }`}
                  >
                    Douglas Sea State
                  </div>
                  <div className={`text-xl sm:text-2xl font-black my-1 ${sea.color}`}>
                    {sea.label}
                  </div>
                  <div
                    className={`text-[11px] font-bold ${
                      isLight ? 'text-slate-600' : 'text-white/60'
                    }`}
                  >
                    Code {sea.code} • {sea.desc}
                  </div>
                </div>

                {/* Port Danger Signal */}
                <div
                  className={`p-4 rounded-2xl border flex flex-col justify-between shadow-xs ${
                    isLight
                      ? 'bg-white border-slate-200'
                      : 'bg-slate-800/80 border-white/10'
                  }`}
                >
                  <div
                    className={`text-[10px] uppercase font-bold ${
                      isLight ? 'text-slate-500' : 'text-white/50'
                    }`}
                  >
                    WMO Port Signal
                  </div>
                  <div className={`text-sm sm:text-base font-black my-1 ${portSig.color}`}>
                    {portSig.signalName}
                  </div>
                  <div
                    className={`text-[10px] line-clamp-1 ${
                      isLight ? 'text-slate-600' : 'text-white/60'
                    }`}
                  >
                    Flag: {portSig.flagCode}
                  </div>
                </div>
              </div>

              {/* Boat-Class Safe Venturing Limits Matrix */}
              <div
                className={`rounded-3xl p-5 space-y-4 border ${
                  isLight
                    ? 'bg-cyan-50/60 border-cyan-200/90 shadow-sm'
                    : 'border-cyan-500/30 bg-cyan-950/20'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4
                      className={`text-sm font-black uppercase tracking-wide ${
                        isLight ? 'text-cyan-900' : 'text-cyan-300'
                      }`}
                    >
                      {isHi
                        ? 'नौका वर्ग अनुसार सुरक्षित सीमा (Boat-Class Safe Venturing Matrix)'
                        : '3-Tier Boat-Class Safe Venturing Limits'}
                    </h4>
                    <p
                      className={`text-xs mt-0.5 ${
                        isLight ? 'text-slate-600' : 'text-white/60'
                      }`}
                    >
                      {isHi
                        ? 'अपनी नाव का प्रकार चुनें और अनुमत समुद्री दूरी जानें'
                        : 'Select vessel type to inspect certified offshore venturing limits'}
                    </p>
                  </div>
                </div>

                {/* Boat Class Tabs */}
                <div
                  className={`grid grid-cols-3 gap-2 p-1.5 rounded-2xl border ${
                    isLight
                      ? 'bg-white/90 border-cyan-200 shadow-inner'
                      : 'bg-slate-800/60 border-white/10'
                  }`}
                >
                  {[
                    { key: 'catamaran', label: isHi ? 'पारंपरिक काटामारन' : 'Catamaran / Canoe', icon: '🛶' },
                    { key: 'vallam', label: isHi ? 'मोटराइज्ड वल्लम' : 'Motorized Vallam', icon: '🚤' },
                    { key: 'trawler', label: isHi ? 'मशीनीकृत ट्रॉलर' : 'Mechanized Trawler', icon: '🚢' },
                  ].map((b) => (
                    <button
                      key={b.key}
                      onClick={() => setActiveBoatClass(b.key)}
                      className={`py-2 px-2 sm:px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        activeBoatClass === b.key
                          ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 scale-[1.02]'
                          : isLight
                          ? 'text-slate-600 hover:text-cyan-900 hover:bg-cyan-50'
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
                  <div
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm ${
                      isLight
                        ? 'bg-white border-cyan-200'
                        : 'bg-slate-800/80 border-white/10'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-black ${
                            isLight ? 'text-slate-900' : 'text-white'
                          }`}
                        >
                          {activeBoat.label}
                        </span>
                        <span
                          className={`text-[10px] ${
                            isLight ? 'text-slate-500' : 'text-white/50'
                          }`}
                        >
                          Wave Threshold: {activeBoat.waveLimit}
                        </span>
                      </div>
                      <p
                        className={`text-xs leading-relaxed ${
                          isLight ? 'text-slate-700' : 'text-white/80'
                        }`}
                      >
                        {activeBoat.advice}
                      </p>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <div
                        className={`text-[10px] uppercase font-bold ${
                          isLight ? 'text-slate-500' : 'text-white/50'
                        }`}
                      >
                        Venturing Permission
                      </div>
                      <div
                        className={`text-base sm:text-lg font-black ${
                          activeBoat.status === 'safe'
                            ? isLight
                              ? 'text-emerald-600'
                              : 'text-emerald-400'
                            : activeBoat.status === 'caution'
                            ? isLight
                              ? 'text-amber-600'
                              : 'text-amber-400'
                            : isLight
                            ? 'text-red-600'
                            : 'text-red-400'
                        }`}
                      >
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
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs active:scale-95 transition-all border cursor-pointer ${
                      isLight
                        ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                        : 'bg-slate-800 hover:bg-slate-700 border-white/15 text-white'
                    }`}
                  >
                    <span>📯</span>
                    <span>{isHi ? 'समुद्री हॉर्न (Foghorn)' : 'Sound Foghorn'}</span>
                  </button>

                  {/* Audio Readout */}
                  <button
                    onClick={handleToggleSpeech}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 shadow-xs cursor-pointer ${
                      isSpeaking
                        ? isLight
                          ? 'bg-red-100 border-red-400 text-red-800 animate-pulse'
                          : 'bg-red-600/30 border-red-400 text-red-200 animate-pulse'
                        : isLight
                        ? 'bg-cyan-100 hover:bg-cyan-200 border-cyan-300 text-cyan-900'
                        : 'bg-cyan-600/20 hover:bg-cyan-600/30 border-cyan-500/30 text-cyan-300'
                    }`}
                  >
                    <span>{isSpeaking ? '⏹️' : '🎙️'}</span>
                    <span>
                      {isSpeaking
                        ? isHi
                          ? 'रोकें'
                          : 'Stop Audio'
                        : isHi
                        ? 'रेडियो बुलेटिन सुनें'
                        : 'Listen Marine Voice'}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border cursor-pointer ${
                      isLight
                        ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                        : 'bg-white/10 hover:bg-white/20 border-white/10 text-white'
                    }`}
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
        <div
          className={`px-5 py-3 border-t flex items-center justify-between text-xs ${
            isLight
              ? 'bg-slate-100/90 border-slate-200 text-slate-600'
              : 'bg-slate-950/80 border-white/10 text-white/60'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
            <span>Open-Meteo Marine Suite • WMO Douglas Sea Scale • IMD Coastal Warning</span>
          </div>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
              isLight
                ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            {isHi ? 'बंद करें' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
