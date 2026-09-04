import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { saveSosOffline, getSosQueueCount, flushSosQueue } from "../utils/sosQueue";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function SosButton() {
  const { state } = useApp();
  const [phase, setPhase] = useState("idle"); // idle | confirm | locating | form | sending | success | queued-offline | error
  const [coords, setCoords] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", message: "", helpType: "Medical Emergency" });
  const [imageString, setImageString] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);

  const helpCategories = [
    "Medical Emergency",
    "Evacuation Needed",
    "Food/Water Required",
    "Shelter Needed",
    "Fire Rescue",
    "Other"
  ];

  const playSiren = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'square';
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      // Sweep frequency up and down to mimic an emergency siren
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.3);
      osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.6);
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.9);
      osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 1.2);
      
      // Fade out
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {
      console.log('Audio Context not supported');
    }
  };

  const handleSosClick = () => {
    // 1. Haptic Feedback (Intense SOS vibration)
    if (navigator.vibrate) {
      navigator.vibrate([300, 100, 300, 100, 300]);
    }
    // 2. Play Emergency Siren Sound
    playSiren();
    
    setPhase("form");
  };

  useEffect(() => {
    const handleOpenSos = () => {
      handleSosClick();
    };
    window.addEventListener('weathergpt-open-sos', handleOpenSos);

    const refreshQueue = async () => {
      try {
        const count = await getSosQueueCount();
        setOfflineQueueCount(count);
      } catch (e) {}
    };
    refreshQueue();

    const handleOnline = async () => {
      try {
        const result = await flushSosQueue(API_URL);
        if (result.flushed > 0) {
          refreshQueue();
        }
      } catch (e) {}
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('weathergpt-sos-queue-changed', refreshQueue);
    window.addEventListener('weathergpt-sos-flushed', refreshQueue);

    return () => {
      window.removeEventListener('weathergpt-open-sos', handleOpenSos);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('weathergpt-sos-queue-changed', refreshQueue);
      window.removeEventListener('weathergpt-sos-flushed', refreshQueue);
    };
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        setImageString(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Multi-tier location resolver: Live Satellite GPS -> Cached GPS Fix -> Active Dashboard City -> Default
  const resolveLocation = async () => {
    // 1. Hardware Geolocation: Attempt high accuracy with 3.5s timeout (fails fast in Airplane mode)
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 3500,
            maximumAge: 300000, // Accept any GPS fix from the last 5 minutes
          });
        });
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          localStorage.setItem("weathergpt_last_known_gps", JSON.stringify({ lat, lng, time: Date.now() }));
        } catch (e) {}
        return { lat, lng, source: "live_gps", note: "Live Satellite GPS Fix" };
      } catch (err) {
        console.warn("Live GPS unavailable (normal in Airplane/offline mode):", err.message);
      }
    }

    // 2. Fallback: Last known hardware GPS fix saved on this device
    try {
      const savedGps = JSON.parse(localStorage.getItem("weathergpt_last_known_gps") || "null");
      if (savedGps && savedGps.lat && savedGps.lng) {
        return {
          lat: Number(savedGps.lat),
          lng: Number(savedGps.lng),
          source: "cached_gps",
          note: `Cached Device GPS (${new Date(savedGps.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
        };
      }
    } catch (e) {}

    // 3. Fallback: Active Dashboard City Coordinates from App State
    const activeCityLat = state.weatherStageData?.lat || state.currentWeather?.lat;
    const activeCityLng = state.weatherStageData?.lng || state.currentWeather?.lng;
    const cityName = state.weatherStageData?.locationName || state.currentWeather?.locationName;

    if (activeCityLat && activeCityLng) {
      return {
        lat: Number(activeCityLat),
        lng: Number(activeCityLng),
        source: "cached_city",
        note: `Session Location (${cityName || 'Active City'})`
      };
    }

    // 4. Fallback: Default National Emergency Coordinates (New Delhi)
    return {
      lat: 28.6139,
      lng: 77.2090,
      source: "emergency_default",
      note: "Offline Airplane Mode (Default Location)"
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPhase("locating");

    // Resolve location with zero-failure fallback
    const loc = await resolveLocation();
    setCoords(loc);

    const sosPayload = {
      ...form,
      lat: loc.lat,
      lng: loc.lng,
      locationSource: loc.source,
      locationNote: loc.note,
      image: imageString,
    };

    // Proactive offline check: If browser is offline / airplane mode, immediately save to vault!
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await saveSosOffline(sosPayload);
      setPhase("queued-offline");
      return;
    }

    // Live transmission
    setPhase("sending");
    try {
      const res = await fetch(`${API_URL}/api/sos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sosPayload),
      });
      if (res.ok) {
        setPhase("success");
      } else {
        // Server rejected or unreachable -> save to offline vault
        await saveSosOffline(sosPayload);
        setPhase("queued-offline");
      }
    } catch (e) {
      // Network fetch error -> save to offline vault
      await saveSosOffline(sosPayload);
      setPhase("queued-offline");
    }
  };

  const handleManualSync = async () => {
    setPhase("sending");
    try {
      const result = await flushSosQueue(API_URL);
      if (result.flushed > 0) {
        setPhase("success");
      } else {
        setPhase("queued-offline");
      }
    } catch (err) {
      setPhase("queued-offline");
    }
  };

  const reset = () => {
    setPhase("idle");
    setCoords(null);
    setForm({ name: "", phone: "", message: "", helpType: "Medical Emergency" });
    setImageString(null);
    setErrorMsg("");
  };

  return (
    <>
      <button
        onClick={handleSosClick}
        className="hidden md:flex fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-tr from-red-700 to-rose-600 hover:from-red-600 hover:to-rose-500 text-white font-bold text-xs shadow-2xl shadow-red-900/60 border-2 border-red-400/80 animate-pulse flex-col items-center justify-center gap-0.5 transition-transform hover:scale-110 active:scale-95 relative"
        title={offlineQueueCount > 0 ? `⚠️ ${offlineQueueCount} SOS Alert(s) Queued in Offline Vault` : "Send Emergency SOS Alert"}
      >
        <span className="text-lg">🆘</span>
        <span className="text-[10px] font-black tracking-wider">SOS</span>
        {offlineQueueCount > 0 && (
          <span 
            className="absolute -top-1.5 -right-1.5 bg-amber-400 text-black font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-neutral-900 shadow-lg animate-bounce"
            title={`${offlineQueueCount} pending offline SOS`}
          >
            {offlineQueueCount}
          </span>
        )}
      </button>

      {phase !== "idle" && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={reset}>
          <div 
            className="theme-modal border border-red-500/40 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-[var(--text-primary)] max-h-[95vh] overflow-y-auto relative"
            onClick={e => e.stopPropagation()}
          >

            {phase === "form" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="text-center space-y-1.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white text-base font-black shadow-lg shadow-red-500/30 mx-auto mb-1">
                    SOS
                  </div>
                  <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Emergency SOS</h2>
                  <p className="text-[var(--text-secondary)] text-xs font-medium">Fill details and share location to dispatch rescue.</p>
                </div>
                
                <div className="pt-2">
                  <label className="text-[11px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">Required Help Category *</label>
                  <select 
                    value={form.helpType} 
                    onChange={e => setForm({...form, helpType: e.target.value})} 
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-[var(--text-primary)] font-semibold shadow-inner"
                  >
                    {helpCategories.map(cat => <option key={cat} value={cat} className="bg-[var(--modal-bg)] text-[var(--text-primary)] font-medium">{cat}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">Upload Photo of Situation (Optional)</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    onChange={handleImageUpload} 
                    className="w-full text-xs text-[var(--text-secondary)] file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border file:border-[var(--theme-border)] file:text-xs file:font-bold file:bg-[var(--glass-bg)] file:text-[var(--text-primary)] hover:file:bg-[var(--glass-bg-hover)] cursor-pointer" 
                  />
                  {imageString && <img src={imageString} alt="Preview" className="mt-2 h-20 w-auto rounded-xl border border-[var(--theme-border)] object-cover shadow-sm" />}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">Your Name</label>
                    <input 
                      type="text" 
                      value={form.name} 
                      onChange={e => setForm({...form, name: e.target.value})} 
                      placeholder="Optional" 
                      className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 font-medium shadow-inner" 
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">Phone Number</label>
                    <input 
                      type="tel" 
                      value={form.phone} 
                      onChange={e => setForm({...form, phone: e.target.value})} 
                      placeholder="Optional" 
                      className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 font-medium shadow-inner" 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">Additional Details (Optional)</label>
                  <textarea 
                    value={form.message} 
                    onChange={e => setForm({...form, message: e.target.value})} 
                    placeholder="e.g. 3 people trapped on roof" 
                    rows={2} 
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 font-medium shadow-inner" 
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={reset} 
                    className="flex-1 py-3 bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)] border border-[var(--theme-border)] rounded-xl font-bold transition-all text-sm text-[var(--text-primary)] shadow-sm active:scale-95"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 rounded-xl font-black text-sm transition-all shadow-lg shadow-red-600/30 text-white active:scale-95"
                  >
                    📍 Share Location & Send
                  </button>
                </div>
              </form>
            )}

            {phase === "locating" && (
              <div className="text-center space-y-4 py-4">
                <div className="text-4xl animate-spin">📡</div>
                <p className="text-[var(--text-primary)] font-bold">Acquiring GPS Location...</p>
                <p className="text-[var(--text-secondary)] text-sm font-medium">Please allow location access when prompted.</p>
              </div>
            )}

            {phase === "sending" && (
              <div className="text-center space-y-4 py-4">
                <div className="text-4xl animate-bounce">📤</div>
                <p className="text-[var(--text-primary)] font-bold">Transmitting Data & Images...</p>
              </div>
            )}

            {phase === "success" && (
              <div className="text-center space-y-4 py-4">
                <div className="text-5xl">
                  {state.activeSosStatus?.status === 'dispatched' ? '🚨' : state.activeSosStatus?.status === 'resolved' ? '✅' : '📡'}
                </div>
                <h2 className="text-2xl font-black text-emerald-600 dark:text-green-400">
                  {state.activeSosStatus?.status === 'dispatched' 
                    ? 'Rescue Team Dispatched!' 
                    : state.activeSosStatus?.status === 'resolved'
                    ? 'Emergency Resolved'
                    : 'Help is Coming!'}
                </h2>
                <p className="text-[var(--text-secondary)] text-sm font-medium">
                  {state.activeSosStatus?.status === 'dispatched'
                    ? 'Disaster response personnel have been dispatched to your GPS coordinates.'
                    : state.activeSosStatus?.status === 'resolved'
                    ? 'Disaster management officers have marked this emergency incident as resolved.'
                    : 'Your location and details have been transmitted to disaster management authorities in real-time.'}
                </p>
                {state.activeSosStatus?.status && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                    Live Status: {state.activeSosStatus.status.toUpperCase()}
                  </div>
                )}
                <button onClick={reset} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white transition-all shadow-lg shadow-emerald-600/30">OK</button>
              </div>
            )}

            {phase === "queued-offline" && (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500/60 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-amber-500/20 animate-pulse">
                  🛡️
                </div>
                <div className="space-y-1">
                  <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    Offline SOS Vault Engaged
                  </span>
                  <h2 className="text-2xl font-black text-amber-500 tracking-tight">
                    Saved Locally to Vault
                  </h2>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 text-left space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-amber-400">
                    <span className="flex items-center gap-1.5">
                      <span>📡</span>
                      <span>Auto-Transmission Active</span>
                    </span>
                    <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                      Vault Stored
                    </span>
                  </div>
                  {coords && (
                    <div className="bg-black/40 border border-amber-500/20 rounded-xl p-2 font-mono text-[11px] text-amber-200/90 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span>📍</span>
                        <span className="font-bold">{coords.lat?.toFixed(4)}°, {coords.lng?.toFixed(4)}°</span>
                      </div>
                      <div className="text-[10px] text-amber-300/60 pl-4">
                        Source: {coords.note || 'Hardware GPS Lock'}
                      </div>
                    </div>
                  )}
                  <p className="text-[var(--text-secondary)] text-[11px] leading-snug">
                    WeatherGPT will automatically transmit this SOS and exact coordinates to disaster authorities the second any mobile signal (2G/3G/4G/5G) or Wi-Fi is restored.
                  </p>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleManualSync}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 rounded-xl font-bold text-xs text-white shadow-md transition-all active:scale-95"
                  >
                    🔄 Retry Send Now
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="flex-1 py-3 bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)] border border-[var(--theme-border)] rounded-xl font-bold text-xs text-[var(--text-primary)] transition-all active:scale-95"
                  >
                    Keep in Vault (OK)
                  </button>
                </div>
                <p className="text-red-500 font-bold text-[11px]">
                  📞 If telephone signal works, call 112 immediately!
                </p>
              </div>
            )}

            {phase === "error" && (
              <div className="text-center space-y-4 py-4">
                <div className="text-5xl">⚠️</div>
                <h2 className="text-xl font-black text-amber-700 dark:text-amber-400">Transmission Failed</h2>
                <p className="text-[var(--text-secondary)] text-sm font-medium">{errorMsg}</p>
                <p className="text-red-600 font-bold">📞 Call 112 immediately!</p>
                <button onClick={reset} className="w-full py-3 bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)] border border-[var(--theme-border)] text-[var(--text-primary)] rounded-xl font-bold transition-colors">Close</button>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
