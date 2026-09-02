import React, { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function SosButton() {
  const [phase, setPhase] = useState("idle"); // idle | confirm | locating | form | sending | success | error
  const [coords, setCoords] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", message: "", helpType: "Medical Emergency" });
  const [imageString, setImageString] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

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
    return () => window.removeEventListener('weathergpt-open-sos', handleOpenSos);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setPhase("locating");

    if (!navigator.geolocation) {
      setErrorMsg("Your browser does not support GPS location.");
      setPhase("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        
        // Now send data
        setPhase("sending");
        try {
          const res = await fetch(`${API_URL}/api/sos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, lat, lng, image: imageString }),
          });
          if (res.ok) {
            setPhase("success");
          } else {
            setErrorMsg("Failed to send SOS. Please call emergency services directly.");
            setPhase("error");
          }
        } catch (e) {
          setErrorMsg("Cannot connect to server. Please call emergency services directly.");
          setPhase("error");
        }
      },
      (err) => {
        setErrorMsg("Location access denied. Please allow GPS and try again.");
        setPhase("error");
      },
      { timeout: 10000 }
    );
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
        className="hidden md:flex fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-tr from-red-700 to-rose-600 hover:from-red-600 hover:to-rose-500 text-white font-bold text-xs shadow-2xl shadow-red-900/60 border-2 border-red-400/80 animate-pulse flex-col items-center justify-center gap-0.5 transition-transform hover:scale-110 active:scale-95"
        title="Send Emergency SOS Alert"
      >
        <span className="text-lg">🆘</span>
        <span className="text-[10px] font-black tracking-wider">SOS</span>
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
                <div className="text-5xl">✅</div>
                <h2 className="text-2xl font-black text-emerald-600 dark:text-green-400">Help is Coming!</h2>
                <p className="text-[var(--text-secondary)] text-sm font-medium">Your location and details have been sent to disaster management authorities.</p>
                <button onClick={reset} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white transition-all shadow-lg shadow-emerald-600/30">OK</button>
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
