import React, { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function SosButton() {
  const [phase, setPhase] = useState("idle"); // idle | confirm | locating | form | sending | success | error
  const [coords, setCoords] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [errorMsg, setErrorMsg] = useState("");

  const handleSosClick = () => setPhase("confirm");

  const handleGetLocation = () => {
    setPhase("locating");
    if (!navigator.geolocation) {
      setErrorMsg("Your browser does not support GPS location.");
      setPhase("error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setPhase("form");
      },
      (err) => {
        setErrorMsg("Location access denied. Please allow GPS and try again.");
        setPhase("error");
      },
      { timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coords) return;
    setPhase("sending");
    try {
      const res = await fetch(`${API_URL}/api/sos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, lat: coords.lat, lng: coords.lng }),
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
  };

  const reset = () => {
    setPhase("idle");
    setCoords(null);
    setForm({ name: "", phone: "", message: "" });
    setErrorMsg("");
  };

  return (
    <>
      {/* Floating SOS Button */}
      <button
        onClick={handleSosClick}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-2xl shadow-red-900/60 border-2 border-red-400 animate-pulse flex flex-col items-center justify-center gap-0.5 transition-transform hover:scale-110"
        title="Send Emergency SOS Alert"
      >
        <span className="text-xl">🆘</span>
        <span className="text-[10px] font-bold tracking-wide">SOS</span>
      </button>

      {/* Modal Overlay */}
      {phase !== "idle" && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-red-500/40 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-white">

            {/* CONFIRM */}
            {phase === "confirm" && (
              <div className="text-center space-y-4">
                <div className="text-5xl">🆘</div>
                <h2 className="text-2xl font-bold text-red-400">Emergency SOS</h2>
                <p className="text-white/70 text-sm">This will share your exact GPS location with disaster management authorities so they can dispatch rescue teams to you.</p>
                <div className="flex gap-3 mt-4">
                  <button onClick={reset} className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors">Cancel</button>
                  <button onClick={handleGetLocation} className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-bold transition-colors">Share Location</button>
                </div>
              </div>
            )}

            {/* LOCATING */}
            {phase === "locating" && (
              <div className="text-center space-y-4 py-4">
                <div className="text-4xl animate-spin">📡</div>
                <p className="text-white/80 font-medium">Getting your GPS location...</p>
                <p className="text-white/50 text-sm">Please allow location access when prompted.</p>
              </div>
            )}

            {/* FORM */}
            {phase === "form" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl">📍</div>
                  <h2 className="text-xl font-bold text-red-400 mt-1">Location Captured!</h2>
                  <p className="text-white/50 text-xs mt-1">{coords?.lat.toFixed(5)}, {coords?.lng.toFixed(5)}</p>
                </div>
                <div>
                  <label className="text-xs text-white/60 block mb-1">Your Name (Optional)</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Ramesh Kumar" className="w-full bg-white/10 border border-white/20 rounded-lg p-2.5 text-sm focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="text-xs text-white/60 block mb-1">Phone Number (Optional)</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="e.g. 9876543210" className="w-full bg-white/10 border border-white/20 rounded-lg p-2.5 text-sm focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="text-xs text-white/60 block mb-1">Emergency Description (Optional)</label>
                  <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="e.g. House flooded, need evacuation" rows={2} className="w-full bg-white/10 border border-white/20 rounded-lg p-2.5 text-sm focus:outline-none focus:border-red-500 resize-none" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={reset} className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors text-sm">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-sm transition-colors">🆘 Send SOS Now</button>
                </div>
              </form>
            )}

            {/* SENDING */}
            {phase === "sending" && (
              <div className="text-center space-y-4 py-4">
                <div className="text-4xl animate-bounce">📤</div>
                <p className="text-white/80 font-medium">Sending your SOS alert...</p>
              </div>
            )}

            {/* SUCCESS */}
            {phase === "success" && (
              <div className="text-center space-y-4 py-4">
                <div className="text-5xl">✅</div>
                <h2 className="text-2xl font-bold text-green-400">Help is Coming!</h2>
                <p className="text-white/70 text-sm">Your location has been sent to disaster management authorities. A rescue team will be dispatched to your coordinates.</p>
                <p className="text-white/50 text-xs">Keep your phone on and stay in a safe location if possible.</p>
                <button onClick={reset} className="w-full py-3 bg-green-700 hover:bg-green-600 rounded-lg font-bold transition-colors">OK</button>
              </div>
            )}

            {/* ERROR */}
            {phase === "error" && (
              <div className="text-center space-y-4 py-4">
                <div className="text-5xl">⚠️</div>
                <h2 className="text-xl font-bold text-amber-400">Could Not Send SOS</h2>
                <p className="text-white/70 text-sm">{errorMsg}</p>
                <p className="text-red-400 font-bold">📞 Call 112 immediately!</p>
                <button onClick={reset} className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors">Close</button>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
