import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function CommunityReports({ locationName }) {
  const { state } = useApp();
  const [reports, setReports] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    condition: 'Heavy Rain',
    intensity: 'Moderate',
    desc: ''
  });

  const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL || '').replace(/\/+$/, '');

  // Fetch real reports from backend when location changes
  useEffect(() => {
    if (!locationName) return;
    setReports([]);
    fetch(`${API_BASE}/api/community-reports?location=${encodeURIComponent(locationName)}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setReports(data.map(r => ({
          id:        r._id || r.id,
          user:      r.userName || 'Anonymous',
          time:      r.createdAt ? new Date(r.createdAt).toLocaleTimeString() : 'Recently',
          condition: r.condition,
          intensity: r.intensity,
          desc:      r.desc,
          verified:  r.verified || false
        })));
      })
      .catch(() => setReports([]));
  }, [locationName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/community-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location:  locationName,
          lat:       state.currentWeather?.lat  || null,
          lng:       state.currentWeather?.lng  || null,
          condition: formData.condition,
          intensity: formData.intensity,
          desc:      formData.desc,
          userName:  state.userProfile?.name || 'Anonymous'
        })
      });
      if (res.ok) {
        const saved = await res.json();
        const newReport = {
          id:        saved._id || saved.id,
          user:      saved.userName || 'Anonymous',
          time:      'Just now',
          condition: saved.condition,
          intensity: saved.intensity,
          desc:      saved.desc,
          verified:  saved.verified || false
        };
        setReports([newReport, ...reports]);
      }
    } catch (_) { /* silently ignore network errors */ }
    setIsSubmitting(false);
    setShowForm(false);
    setFormData({ condition: 'Heavy Rain', intensity: 'Moderate', desc: '' });
  };

  if (!locationName) return null;

  return (
    <div className="glass-panel border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden mt-6">
      <div className="absolute top-0 right-0 p-4 opacity-5 text-6xl pointer-events-none">👥</div>
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            Community Weather Reports
          </h3>
          <p className="text-xs text-white/50 mt-1">Live updates from users in {locationName}</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Report'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-black/30 border border-white/10 rounded-xl p-4 mb-6 relative z-10 animate-fade-in">
          <h4 className="text-sm font-bold text-indigo-300 mb-3">Submit Live Report</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-white/60 mb-1">Observed Condition</label>
              <select 
                value={formData.condition} 
                onChange={e => setFormData({...formData, condition: e.target.value})}
                className="w-full glass-panel border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option>Heavy Rain</option>
                <option>Waterlogging / Flood</option>
                <option>Hailstorm</option>
                <option>Strong Wind</option>
                <option>Extreme Heat</option>
                <option>Dense Fog</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Intensity</label>
              <select 
                value={formData.intensity} 
                onChange={e => setFormData({...formData, intensity: e.target.value})}
                className="w-full glass-panel border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option>Low</option>
                <option>Moderate</option>
                <option>High</option>
                <option>Severe (Emergency)</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs text-white/60 mb-1">Details / Description</label>
            <input 
              type="text" 
              required
              placeholder="E.g. Knee-deep water on Main Road..." 
              value={formData.desc}
              onChange={e => setFormData({...formData, desc: e.target.value})}
              className="w-full glass-panel border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-bold transition-colors"
          >
            {isSubmitting ? 'Submitting & Verifying via AI...' : 'Submit to Community'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        {reports.map(report => (
          <div key={report.id} className="glass-panel border border-white/10 rounded-xl p-4 flex gap-4 items-start">
            <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-xl ${report.intensity === 'Severe' ? 'bg-red-500/20 text-red-500' : report.intensity === 'High' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'}`}>
              {report.condition.includes('Rain') || report.condition.includes('Water') ? '🌧️' : report.condition.includes('Wind') ? '🌬️' : '🌡️'}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-white">{report.user}</span>
                {report.verified && (
                  <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    AI Verified
                  </span>
                )}
                {!report.verified && (
                  <span className="bg-white/10 text-white/50 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                    Unverified
                  </span>
                )}
              </div>
              <div className="text-[10px] text-white/40 mb-2">{report.time} &bull; {report.condition} ({report.intensity})</div>
              <p className="text-xs text-white/80 leading-relaxed">{report.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
