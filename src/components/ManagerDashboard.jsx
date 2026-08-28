import React, { useState, useEffect } from "react";
import { NE_DISTRICTS } from "../utils/districtData";
import { geocodeLocation } from "../services/weatherApi";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function ManagerDashboard() {
  const [token, setToken] = useState(null); // Start null, validate on mount
  const [passcode, setPasscode] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [sosRequests, setSosRequests] = useState([]);
  
  const [form, setForm] = useState({ 
    targetMode: "state", // 'state', 'district', 'radius'
    state: "Assam", 
    district: "", 
    locationName: "", // for radius mode searching
    lat: null, 
    lng: null, 
    radius: 50, 
    severity: "severe", 
    title: "", 
    description: "", 
    durationHours: 24 
  });
  
  const [msg, setMsg] = useState("");
  const [isSearchingLoc, setIsSearchingLoc] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const STATES = ["Assam", "Meghalaya", "Manipur", "Tripura", "Nagaland", "Mizoram", "Arunachal Pradesh", "Sikkim", "Maharashtra", "Tamil Nadu", "Gujarat", "West Bengal", "Uttar Pradesh", "Odisha"];

  // Validate saved token on mount - clear if expired/invalid
  useEffect(() => {
    const saved = sessionStorage.getItem("mgr_token");
    if (saved) {
      try {
        const [payloadB64] = saved.split(".");
        const payload = JSON.parse(atob(payloadB64));
        if (payload.exp && payload.exp > Date.now()) {
          setToken(saved);
        } else {
          sessionStorage.removeItem("mgr_token");
        }
      } catch {
        sessionStorage.removeItem("mgr_token");
      }
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchAlerts();
      fetchSos();
      // Auto-refresh SOS every 30 seconds
      const interval = setInterval(fetchSos, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/manager/alerts`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setAlerts(await res.json());
      else if (res.status === 401) { sessionStorage.removeItem("mgr_token"); setToken(null); }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/manager/sos`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setSosRequests(await res.json());
    } catch (e) { console.error(e); }
  };

  const updateSosStatus = async (id, status) => {
    try {
      await fetch(`${API_URL}/api/manager/sos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      fetchSos();
    } catch (e) { console.error(e); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!passcode.trim()) { setMsg("Please enter the passcode"); return; }
    setIsLoggingIn(true);
    setMsg("");
    try {
      const res = await fetch(`${API_URL}/api/manager/login`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ passcode: passcode.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem("mgr_token", data.token);
        setToken(data.token);
        setMsg("");
      } else {
        const errData = await res.json().catch(() => ({}));
        setMsg(res.status === 401 ? "❌ Wrong passcode. Try: weather2026" : `Error ${res.status}: ${errData.error || 'Unknown error'}`);
      }
    } catch (e) {
      setMsg(`❌ Cannot connect to server. Make sure the backend is running.`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGeocode = async (e) => {
    e.preventDefault();
    if (!form.locationName.trim()) return;
    setIsSearchingLoc(true);
    try {
      const loc = await geocodeLocation(form.locationName);
      if (loc) {
        setForm({ ...form, lat: loc.lat, lng: loc.lng, state: loc.state || form.state, district: loc.district || form.district, locationName: loc.name });
        setMsg(`Found location: ${loc.name} (${loc.lat.toFixed(2)}, ${loc.lng.toFixed(2)})`);
      } else {
        setMsg("Location not found");
      }
    } catch (err) {
      setMsg("Geocoding failed");
    } finally {
      setIsSearchingLoc(false);
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.targetMode === 'radius' && (!form.lat || !form.lng)) {
      setMsg("Please search for a location first to get coordinates.");
      setTimeout(() => setMsg(""), 3000);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/manager/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setForm({ ...form, title: "", description: "" });
        fetchAlerts();
        setMsg("Alert broadcasted successfully!");
        setTimeout(() => setMsg(""), 3000);
      }
    } catch (e) {
      setMsg("Error broadcasting alert");
    }
  };

  const revokeAlert = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/manager/alerts/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchAlerts();
    } catch (e) {
      console.error(e);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white/10 p-8 rounded-2xl backdrop-blur-xl border border-white/20 w-full max-w-sm">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Disaster Manager Auth</h2>
          <input 
            type="password" 
            value={passcode} 
            onChange={e => setPasscode(e.target.value)} 
            placeholder="Enter Passcode (weather2026)" 
            className="w-full bg-black/40 text-white p-3 rounded-lg border border-white/10 mb-4 focus:outline-none focus:border-indigo-500" 
            disabled={isLoggingIn}
          />
          <button 
            type="submit" 
            disabled={isLoggingIn}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-3 rounded-lg transition-colors"
          >
            {isLoggingIn ? "Verifying..." : "Access Panel"}
          </button>
          <button type="button" onClick={() => window.location.href = '/'} className="mt-4 w-full bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg transition-colors border border-white/10 text-sm">← Back to Main App</button>
          {msg && <p className="text-red-400 mt-4 text-center text-sm">{msg}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-0 text-white p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-amber-400">Disaster Management Panel</h1>
          <div className="flex gap-2">
            <button onClick={() => window.location.href = '/'} className="text-sm bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20">Back to App</button>
            <button onClick={() => { sessionStorage.removeItem("mgr_token"); setToken(null); }} className="text-sm bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20">Logout</button>
          </div>
        </div>

        {msg && <div className="bg-green-500/20 text-green-300 border border-green-500 p-3 rounded-lg">{msg}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Issue Alert Form */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-lg">
            <h2 className="text-xl font-bold mb-4">Broadcast New Alert</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="flex gap-2 p-1 bg-black/40 rounded-lg border border-white/10">
                <button type="button" onClick={() => setForm({...form, targetMode: 'state'})} className={`flex-1 py-2 text-sm rounded-md transition-colors ${form.targetMode === 'state' ? 'bg-white/20' : 'text-white/50'}`}>State</button>
                <button type="button" onClick={() => setForm({...form, targetMode: 'district'})} className={`flex-1 py-2 text-sm rounded-md transition-colors ${form.targetMode === 'district' ? 'bg-white/20' : 'text-white/50'}`}>District</button>
                <button type="button" onClick={() => setForm({...form, targetMode: 'radius'})} className={`flex-1 py-2 text-sm rounded-md transition-colors ${form.targetMode === 'radius' ? 'bg-white/20' : 'text-white/50'}`}>Radius</button>
              </div>

              {(form.targetMode === 'state' || form.targetMode === 'district') && (
                <div>
                  <label className="block text-sm text-white/70 mb-1">Target State</label>
                  <select value={form.state} onChange={e => setForm({...form, state: e.target.value, district: ""})} className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white">
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              {form.targetMode === 'district' && (
                <div>
                  <label className="block text-sm text-white/70 mb-1">Target District</label>
                  {NE_DISTRICTS[form.state] ? (
                    <select value={form.district} onChange={e => setForm({...form, district: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white" required>
                      <option value="">Select a district...</option>
                      {NE_DISTRICTS[form.state].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={form.district} onChange={e => setForm({...form, district: e.target.value})} placeholder="Enter district name" className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white" required />
                  )}
                </div>
              )}

              {form.targetMode === 'radius' && (
                <div className="space-y-4 border border-white/10 p-4 rounded-lg bg-black/20">
                  <p className="text-xs text-amber-400 mb-2">Hint: For a specific village, search its nearest town and set a small radius (e.g. 10km).</p>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Search Epicenter</label>
                    <div className="flex gap-2">
                      <input type="text" value={form.locationName} onChange={e => setForm({...form, locationName: e.target.value})} placeholder="Village / Town name..." className="flex-1 bg-black/40 border border-white/10 p-3 rounded-lg text-white" />
                      <button type="button" onClick={handleGeocode} disabled={isSearchingLoc} className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-lg text-sm font-semibold">{isSearchingLoc ? '...' : 'Find'}</button>
                    </div>
                    {form.lat && form.lng && <div className="text-xs text-green-400 mt-2">Coordinates acquired: {form.lat.toFixed(4)}, {form.lng.toFixed(4)}</div>}
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Radius (km)</label>
                    <div className="flex items-center gap-4">
                      <input type="range" min="5" max="250" step="5" value={form.radius} onChange={e => setForm({...form, radius: parseInt(e.target.value)})} className="flex-1" />
                      <span className="text-sm font-bold w-12 text-right">{form.radius} km</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm text-white/70 mb-1">Severity</label>
                <select value={form.severity} onChange={e => setForm({...form, severity: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white">
                  <option value="minor">Minor / Watch</option>
                  <option value="moderate">Moderate / Advisory</option>
                  <option value="severe">Severe / Warning</option>
                  <option value="extreme">Extreme / Emergency</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Headline</label>
                <input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Flash Flood Warning" className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Detailed Description</label>
                <textarea required rows="3" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Actionable advice and details..." className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Expiry (Hours from now)</label>
                <input type="number" min="1" value={form.durationHours} onChange={e => setForm({...form, durationHours: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white" />
              </div>
              <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg mt-2">Broadcast Alert</button>
            </form>
          </div>

          {/* Active Alerts List */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-lg">
            <h2 className="text-xl font-bold mb-4 flex justify-between">Active Broadcasts <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm">{alerts.length}</span></h2>
            <div className="space-y-4">
              {alerts.length === 0 ? <p className="text-white/40">No active alerts currently broadcasted.</p> : alerts.map(a => (
                <div key={a.id} className="bg-black/40 border border-white/10 p-4 rounded-xl flex flex-col gap-2 relative overflow-hidden">
                  <div className="absolute left-0 top-0 w-1 h-full bg-red-500"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold">{a.title}</h3>
                      <p className="text-xs text-white/60">
                        Target: {a.targetMode === 'district' ? `${a.district}, ${a.state}` : a.targetMode === 'radius' ? `${a.radius}km around [${a.lat?.toFixed(2)}, ${a.lng?.toFixed(2)}]` : a.state} &bull; Expires: {new Date(a.expiresAt).toLocaleString()}
                      </p>
                    </div>
                    <button onClick={() => revokeAlert(a.id)} className="bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-xs px-3 py-1.5 rounded transition-colors">Revoke</button>
                  </div>
                  <p className="text-sm text-white/80">{a.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live SOS Emergency Requests */}
        <div className="bg-red-950/30 border border-red-500/30 p-6 rounded-2xl backdrop-blur-lg">
          <h2 className="text-xl font-bold mb-4 flex justify-between items-center">
            <span className="flex items-center gap-2">🆘 Live SOS Requests</span>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${sosRequests.length > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-white/50'}`}>
              {sosRequests.length} Active
            </span>
          </h2>
          {sosRequests.length === 0 ? (
            <p className="text-white/40 text-sm">✅ No active SOS requests. All clear.</p>
          ) : (
            <div className="space-y-4">
              {sosRequests.map((sos) => (
                <div key={sos._id || sos.id} className="bg-black/50 border border-red-500/30 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-red-300">{sos.name || 'Anonymous'}</p>
                      {sos.phone && <p className="text-xs text-white/60">📞 {sos.phone}</p>}
                      <p className="text-sm text-white/80 mt-1">{sos.message}</p>
                      <p className="text-xs text-white/50 mt-1">🕐 {new Date(sos.timestamp).toLocaleString('en-IN')}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${sos.status === 'pending' ? 'bg-red-500/30 text-red-300' : 'bg-amber-500/30 text-amber-300'}`}>
                      {sos.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href={`https://www.google.com/maps?q=${sos.lat},${sos.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-blue-600/40 hover:bg-blue-600/70 text-blue-300 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      📍 Open in Maps ({sos.lat?.toFixed(4)}, {sos.lng?.toFixed(4)})
                    </a>
                    {sos.status === 'pending' && (
                      <button onClick={() => updateSosStatus(sos._id || sos.id, 'dispatched')} className="text-xs bg-amber-600/40 hover:bg-amber-600/70 text-amber-300 px-3 py-1.5 rounded-lg transition-colors">
                        🚁 Dispatch Rescue
                      </button>
                    )}
                    <button onClick={() => updateSosStatus(sos._id || sos.id, 'resolved')} className="text-xs bg-green-600/40 hover:bg-green-600/70 text-green-300 px-3 py-1.5 rounded-lg transition-colors">
                      ✅ Mark Resolved
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
