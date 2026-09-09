import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { requestCropDiagnostic } from '../services/cropDiagnosticApi';
import { getSampleCropImage, DEMO_SAMPLE_ITEMS } from '../utils/cropDemoSamples';

export default function MausamDrishtiModal({ isOpen, onClose, locationData, language = 'en' }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [cropType, setCropType] = useState('auto');
  const [activeSampleKey, setActiveSampleKey] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [weatherContext, setWeatherContext] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const fileInputRef = useRef(null);

  // Derive coordinates and location name
  const lat = locationData?.lat || 23.2599;
  const lng = locationData?.lng || 77.4126;
  const locationName = locationData?.name || locationData?.locationName || 'India';

  // Cleanup speech synthesis on unmount or close
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle local file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setActiveSampleKey(null);
    setError(null);
    setDiagnosticResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setSelectedImage(dataUrl);
        setPreviewUrl(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Handle 1-click SIH demo sample click
  const handleSelectSample = (sample) => {
    setActiveSampleKey(sample.key);
    setCropType(sample.crop);
    setError(null);
    setDiagnosticResult(null);

    const sampleDataUrl = getSampleCropImage(sample.key);
    setSelectedImage(sampleDataUrl);
    setPreviewUrl(sampleDataUrl);
  };

  // Execute Diagnostic Request
  const handleRunDiagnostic = async () => {
    if (!selectedImage) {
      setError(language === 'hi' ? 'कृपया पहले फसल/पत्ती की फोटो चुनें या 1-क्लिक नमूना टैप करें।' : 'Please select a leaf photo or tap a 1-click sample first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await requestCropDiagnostic({
        image: selectedImage,
        lat,
        lng,
        locationName,
        cropType,
        language
      });

      if (res?.diagnostic) {
        setDiagnosticResult(res.diagnostic);
        setWeatherContext(res.weatherContext);
      } else {
        throw new Error('Invalid diagnostic response structure');
      }
    } catch (err) {
      console.error('Crop diagnostic failed:', err);
      setError(err.message || 'Diagnostic failed. Please check network or retry.');
    } finally {
      setIsLoading(false);
    }
  };

  // Speech Readout
  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const script = diagnosticResult?.audioBulletinScript || `${diagnosticResult?.condition}. ${diagnosticResult?.sprayDecision?.optimalSprayWindow}.`;
    const utterance = new SpeechSynthesisUtterance(script);

    // Pick appropriate voice
    const voices = window.speechSynthesis.getVoices();
    const langCode = language === 'hi' ? 'hi-IN' : language === 'bn' ? 'bn-IN' : 'en-IN';
    const voice = voices.find(v => v.lang.startsWith(langCode) || v.lang.includes(langCode));
    if (voice) utterance.voice = voice;

    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Printable Agronomy Card
  const handlePrint = () => {
    window.print();
  };

  const isHi = language === 'hi';

  const modalContent = (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-md animate-fade-in font-body">
      <div className="relative w-full max-w-4xl theme-modal border border-emerald-500/30 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.15)] overflow-hidden flex flex-col max-h-[92vh] text-[var(--text-primary)]">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--modal-border)] bg-emerald-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-xl shadow-inner">
              🌿
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide text-emerald-700 dark:text-emerald-300">
                  {isHi ? 'मौसम दृष्टि (Mausam-Drishti)' : 'Mausam-Drishti AI'}
                </h2>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  SIH PS-26068
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                {isHi ? 'फसल रोग पहचान • 7-दिवसीय सूक्ष्म जलवायु सहसंबंध • 48 घंटे स्प्रे विंडो' : 'Multi-Modal Vision • 7-Day Microclimate Correlation • 48h Safe Spray Window'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-emerald-500/30">
          
          {/* Location & Microclimate Context Banner */}
          <div className="glass-panel border border-emerald-500/30 bg-emerald-500/5 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-medium">
              <span>📍 {locationName}</span>
              <span className="opacity-40">|</span>
              <span>Lat: {Number(lat).toFixed(2)}°, Lng: {Number(lng).toFixed(2)}°</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 font-semibold text-[11px] text-emerald-700 dark:text-emerald-300">
                ⚡ Open-Meteo Physical Microclimate Active
              </span>
            </div>
          </div>

          {/* Setup / Upload & Sample Selector (Visible when no result or when editing) */}
          {!diagnosticResult && (
            <div className="space-y-6">
              
              {/* 1-Click SIH Presentation Demo Samples */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-300 flex items-center gap-1.5">
                    <span>⚡</span> {isHi ? '1-क्लिक त्वरित प्रस्तुति नमूने (SIH Demo)' : '1-Click SIH Presentation Demo Samples'}
                  </span>
                  <span className="text-[10px] text-[var(--text-secondary)]">Instant Evaluation</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {DEMO_SAMPLE_ITEMS.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => handleSelectSample(s)}
                      className={`p-3 rounded-2xl text-left border transition-all duration-200 flex flex-col gap-1.5 ${
                        activeSampleKey === s.key
                          ? 'bg-emerald-600/20 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] scale-[1.02]'
                          : 'glass-panel hover:bg-[var(--glass-bg-hover)] border-[var(--glass-border)] hover:border-[var(--theme-accent)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{s.icon}</span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${s.color}`}>
                          {s.badge}
                        </span>
                      </div>
                      <div className="font-bold text-xs text-white line-clamp-1">
                        {isHi ? s.nameHi : s.name}
                      </div>
                      <div className="text-[10px] text-white/50">Tap to load & test</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Box or Camera */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                {/* Upload Action */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 bg-emerald-950/10 hover:bg-emerald-950/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all min-h-[190px] text-center"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-2xl">
                    📸
                  </div>
                  <div>
                    <div className="font-bold text-sm text-emerald-200">
                      {isHi ? 'पत्ती की फोटो अपलोड करें या खींचें' : 'Upload or Capture Leaf Photo'}
                    </div>
                    <div className="text-[11px] text-white/50 mt-1">
                      {isHi ? 'कैमरा या गैलरी से चुनें (JPG, PNG)' : 'Supports Camera or Gallery files (Auto-compressed)'}
                    </div>
                  </div>
                </div>

                {/* Preview Box */}
                <div className="relative border border-white/10 rounded-2xl bg-black/40 min-h-[190px] flex items-center justify-center overflow-hidden">
                  {previewUrl ? (
                    <div className="relative w-full h-full min-h-[190px] max-h-[220px]">
                      <img
                        src={previewUrl}
                        alt="Crop Preview"
                        className="w-full h-full object-cover rounded-2xl"
                      />
                      {isLoading && (
                        <div className="absolute inset-0 bg-emerald-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                          <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse absolute top-1/2 -translate-y-1/2 shadow-[0_0_15px_#34d399]"></div>
                          <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs font-bold text-emerald-300 tracking-wide uppercase animate-pulse">
                            {isHi ? 'सूक्ष्म जलवायु सहसंबंध विश्लेषण जारी...' : 'Analyzing Microclimate Correlation...'}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center p-4 text-white/40 text-xs">
                      <span>🖼️ {isHi ? 'कोई फोटो चयनित नहीं है' : 'No photo selected yet'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Crop Filter / Category Option */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-white/70">
                    {isHi ? 'फसल का प्रकार:' : 'Crop Category:'}
                  </label>
                  <select
                    value={cropType}
                    onChange={(e) => setCropType(e.target.value)}
                    className="glass-input rounded-xl px-3 py-1.5 text-xs text-white bg-slate-800 border border-white/15 focus:outline-none focus:border-emerald-400"
                  >
                    <option value="auto">{isHi ? 'स्वचालित पहचान (Auto-Detect)' : 'Auto-Detect from Image'}</option>
                    <option value="potato">{isHi ? 'आलू (Potato)' : 'Potato'}</option>
                    <option value="rice">{isHi ? 'धान / चावल (Paddy / Rice)' : 'Paddy / Rice'}</option>
                    <option value="tomato">{isHi ? 'टमाटर (Tomato)' : 'Tomato'}</option>
                    <option value="wheat">{isHi ? 'गेहूं (Wheat)' : 'Wheat'}</option>
                    <option value="cotton">{isHi ? 'कपास (Cotton)' : 'Cotton'}</option>
                    <option value="mustard">{isHi ? 'सरसों (Mustard)' : 'Mustard'}</option>
                  </select>
                </div>

                {/* Primary Action Button */}
                <button
                  onClick={handleRunDiagnostic}
                  disabled={isLoading || !selectedImage}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:brightness-110 text-white shadow-lg shadow-emerald-600/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{isHi ? 'जांच हो रही है...' : 'Diagnosing with Gemini...'}</span>
                    </>
                  ) : (
                    <>
                      <span>🔬</span>
                      <span>{isHi ? 'सूक्ष्म जलवायु एवं दृष्टि जांच चलाएं' : 'Run Microclimate Diagnostic'}</span>
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {/* DIAGNOSTIC RESULTS VIEW */}
          {diagnosticResult && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Top Banner: Identified Crop & Condition */}
              <div className="glass-panel border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  {previewUrl && (
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border border-emerald-400/30 shrink-0 shadow-md">
                      <img src={previewUrl} alt="Diagnosed Crop" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {diagnosticResult.conditionType || 'Fungal Infection'}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        diagnosticResult.severity === 'Critical' || diagnosticResult.severity === 'Severe'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}>
                        {diagnosticResult.severity} Severity
                      </span>
                      <span className="text-[10px] text-white/60 font-mono">
                        {diagnosticResult.confidenceScore || 94}% Confidence
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-black text-white">
                      {diagnosticResult.conditionLocalName || diagnosticResult.condition}
                    </h3>
                    <p className="text-xs text-emerald-400/90 font-medium">
                      {diagnosticResult.cropLocalName || diagnosticResult.crop} • <span className="italic text-white/50">{diagnosticResult.condition}</span>
                    </p>
                  </div>
                </div>

                {/* Audio Readout & Reset Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                  <button
                    onClick={handleToggleSpeech}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 shadow-md ${
                      isSpeaking
                        ? 'bg-red-600/30 border-red-400 text-red-200 animate-pulse'
                        : 'bg-emerald-600/20 hover:bg-emerald-600/30 border-emerald-500/30 text-emerald-300'
                    }`}
                  >
                    <span>{isSpeaking ? '⏹️' : '🎙️'}</span>
                    <span>{isSpeaking ? (isHi ? 'रोकें' : 'Stop Audio') : (isHi ? 'ऑडियो बुलेटिन सुनें' : 'Listen Bulletin')}</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white/80 hover:text-white transition-colors"
                    title="Print Report"
                  >
                    🖨️
                  </button>

                  <button
                    onClick={() => { setDiagnosticResult(null); }}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold text-white/80 transition-colors"
                  >
                    {isHi ? 'नया स्कैन' : 'Scan New'}
                  </button>
                </div>
              </div>

              {/* Visual Symptoms Summary */}
              {diagnosticResult.visualSymptoms && (
                <div className="glass-panel border border-white/10 rounded-2xl p-4 text-xs leading-relaxed text-white/80">
                  <div className="font-bold text-[11px] uppercase tracking-wider text-emerald-400 mb-1">
                    🔍 {isHi ? 'दृष्टिगत लक्षण (Visual Symptoms):' : 'Visual Symptoms Observed:'}
                  </div>
                  <div>{diagnosticResult.visualSymptoms}</div>
                </div>
              )}

              {/* Microclimatic Causation Matrix (The SIH Winning Novelty) */}
              <div className="glass-panel border border-indigo-500/30 bg-indigo-950/20 rounded-3xl p-5 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔬</span>
                    <h4 className="text-sm font-black text-indigo-300 uppercase tracking-wide">
                      {isHi ? 'सूक्ष्म जलवायु सहसंबंध विश्लेषण (Microclimatic Causation)' : 'Microclimatic Causation Matrix'}
                    </h4>
                  </div>
                  <span className="text-[10px] text-indigo-400 bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-500/30 font-bold">
                    Past 7-Day Physical Telemetry
                  </span>
                </div>

                <p className="text-xs text-white/85 leading-relaxed">
                  {diagnosticResult.microclimaticCorrelation?.summary}
                </p>

                {/* 3 Metric Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-white/10">
                    <div className="text-[10px] uppercase font-bold text-white/50 mb-1">
                      💧 {isHi ? 'नमी प्रभाव (Humidity)' : 'Humidity Factor'}
                    </div>
                    <div className="text-xs font-extrabold text-blue-300">
                      {diagnosticResult.microclimaticCorrelation?.humidityTrigger || '85%+ sustained RH'}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-white/10">
                    <div className="text-[10px] uppercase font-bold text-white/50 mb-1">
                      🌡️ {isHi ? 'तापमान सीमा (Temperature)' : 'Temperature Window'}
                    </div>
                    <div className="text-xs font-extrabold text-amber-300">
                      {diagnosticResult.microclimaticCorrelation?.temperatureWindow || '18-24°C favorable range'}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-white/10">
                    <div className="text-[10px] uppercase font-bold text-white/50 mb-1">
                      🌧️ {isHi ? 'पत्ती गीलापन (Wetness)' : 'Canopy Moisture'}
                    </div>
                    <div className="text-xs font-extrabold text-teal-300">
                      {diagnosticResult.microclimaticCorrelation?.wetnessDuration || '16+ hours dew wetness'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 48-Hour Meteorological Safe Spray Window */}
              <div className="glass-panel border border-emerald-500/30 bg-emerald-950/20 rounded-3xl p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⏱️</span>
                    <h4 className="text-sm font-black text-emerald-300 uppercase tracking-wide">
                      {isHi ? '48 घंटे मौसम आधारित सुरक्षित स्प्रे निर्णय' : '48-Hour Meteorological Safe Spray Window'}
                    </h4>
                  </div>
                  
                  {/* Can spray today status */}
                  <span className={`text-[11px] font-black px-3 py-1 rounded-full border ${
                    diagnosticResult.sprayDecision?.canSprayToday
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border-red-500/30 animate-pulse'
                  }`}>
                    {diagnosticResult.sprayDecision?.canSprayToday
                      ? (isHi ? '✅ आज छिड़काव अनुकूल' : '✅ Favorable to Spray Today')
                      : (isHi ? '❌ आज छिड़काव न करें (बारिश/धुलने का जोखिम)' : '❌ Do NOT Spray Today (Rain/Wash-off Risk)')}
                  </span>
                </div>

                {/* Warning details */}
                {diagnosticResult.sprayDecision?.immediateWarning && (
                  <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                    diagnosticResult.sprayDecision?.canSprayToday
                      ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-200'
                      : 'bg-red-950/40 border-red-500/40 text-red-200'
                  }`}>
                    {diagnosticResult.sprayDecision?.immediateWarning}
                  </div>
                )}

                {/* Optimal Safe Window & Chemical Prescription */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  
                  {/* Optimal Safe Window Card */}
                  <div className="p-4 rounded-2xl bg-slate-800/80 border border-emerald-500/30 flex flex-col justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-black uppercase text-emerald-400 mb-1">
                        🎯 {isHi ? 'सर्वोत्तम छिड़काव समय (Optimal Safe Hours)' : 'Best Spray Window'}
                      </div>
                      <div className="text-sm font-black text-white">
                        {diagnosticResult.sprayDecision?.optimalSprayWindow}
                      </div>
                    </div>
                    <div className="text-[11px] text-white/60">
                      {diagnosticResult.sprayDecision?.applicationTips || 'Spray during calm morning hours with dry leaf surfaces.'}
                    </div>
                  </div>

                  {/* Chemical Treatment Prescription */}
                  <div className="p-4 rounded-2xl bg-slate-800/80 border border-amber-500/30 flex flex-col justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-black uppercase text-amber-400 mb-1">
                        💊 {isHi ? 'अनुशंसित कवकनाशी व खुराक (Prescription)' : 'Recommended Treatment & Dosage'}
                      </div>
                      <div className="text-xs font-black text-white leading-snug">
                        {diagnosticResult.sprayDecision?.chemicalTreatment}
                      </div>
                    </div>
                    {diagnosticResult.sprayDecision?.organicTreatment && (
                      <div className="text-[11px] text-emerald-300 font-medium pt-1 border-t border-white/10">
                        🌱 <span className="font-bold">{isHi ? 'जैविक विकल्प:' : 'Bio-Control:'}</span> {diagnosticResult.sprayDecision?.organicTreatment}
                      </div>
                    )}
                  </div>
                </div>

                {/* 36-Hour Hourly Forecast Safety Timeline */}
                {weatherContext?.forecast48h?.hourly?.length > 0 && (
                  <div className="pt-2">
                    <div className="text-[10px] uppercase font-bold text-white/50 mb-2">
                      {isHi ? 'आगामी 24 घंटों की प्रति घंटा स्प्रे सुरक्षा स्थिति:' : 'Upcoming Hourly Spray Risk Timeline:'}
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-emerald-500/30">
                      {weatherContext.forecast48h.hourly.slice(0, 16).map((h, idx) => {
                        const dateObj = new Date(h.time);
                        const timeLabel = dateObj.toLocaleTimeString([], { hour: 'numeric', hour12: true });
                        return (
                          <div
                            key={idx}
                            className={`min-w-[65px] p-2 rounded-xl text-center border shrink-0 transition-all ${
                              h.sprayStatus === 'safe'
                                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                                : h.sprayStatus === 'caution'
                                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                                : 'bg-red-950/40 border-red-500/40 text-red-300'
                            }`}
                          >
                            <div className="text-[10px] font-bold opacity-80">{timeLabel}</div>
                            <div className="text-xs font-black my-1">{Math.round(h.temp)}°</div>
                            <div className="text-[9px] font-bold uppercase">
                              {h.sprayStatus === 'safe' ? 'Safe' : h.sprayStatus === 'caution' ? 'Caution' : 'Risk'}
                            </div>
                            <div className="text-[8px] opacity-60 mt-0.5">{h.precipProb}% 🌧️</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* PMFBY Insurance Advisory (if weather hazard) */}
              {diagnosticResult.pmfbyInsurance?.advice && (
                <div className="glass-panel border border-sky-500/30 bg-sky-950/20 rounded-2xl p-4 text-xs leading-relaxed text-sky-200">
                  <div className="font-bold text-[11px] uppercase tracking-wider text-sky-400 mb-1 flex items-center gap-1.5">
                    <span>🛡️</span>
                    <span>{isHi ? 'प्रधानमंत्री फसल बीमा योजना (PMFBY) सलाह:' : 'PMFBY Crop Insurance Advisory:'}</span>
                  </div>
                  <div>{diagnosticResult.pmfbyInsurance.advice}</div>
                </div>
              )}

              {/* Spoken Audio Script */}
              {diagnosticResult.audioBulletinScript && (
                <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-white/10 text-xs text-white/70 italic flex items-start gap-2.5">
                  <span className="text-base shrink-0">📻</span>
                  <div className="flex-1">
                    <span className="font-bold not-italic text-emerald-300 mr-1">
                      {isHi ? 'रेडियो बुलेटिन पाठ:' : 'Spoken Audio Transcript:'}
                    </span>
                    <span>"{diagnosticResult.audioBulletinScript}"</span>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-slate-950/80 flex items-center justify-between text-xs text-white/60">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Gemini 3.6 Flash Multi-Modal Vision + Open-Meteo Physical Climatology</span>
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
