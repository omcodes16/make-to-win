import React, { useState, useEffect } from 'react';
import { NE_DISTRICTS } from '../utils/districtData';

const STATES = ["Assam", "Meghalaya", "Manipur", "Tripura", "Nagaland", "Mizoram", "Arunachal Pradesh", "Sikkim", "Maharashtra", "Tamil Nadu", "Gujarat", "West Bengal", "Uttar Pradesh", "Odisha"];

export default function SmsRegistryPanel({ API_URL, token }) {
  const [form, setForm] = useState({ name: '', phone: '+91', category: 'General Public', village: '', pincode: '', district: '', state: '', language: 'English' });
  const [msg, setMsg] = useState('');
  const [registry, setRegistry] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRegistry();
  }, []);

  const fetchRegistry = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/sms/registry`);
      if (res.ok) {
        const data = await res.json();
        setRegistry(data);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/sms/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setForm({ ...form, name: '', phone: '+91', village: '', pincode: '' });
        setMsg("Number registered successfully!");
        fetchRegistry();
        setTimeout(() => setMsg(""), 3000);
      }
    } catch (e) {
      setMsg("Error registering number");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Registration Form */}
      <div className="glass-panel border border-white/10 p-6 rounded-2xl">
        <h2 className="text-xl font-bold mb-4">Register Citizen Phone</h2>
        {msg && <div className="bg-green-500/20 text-green-300 border border-green-500 p-3 rounded-lg mb-4 text-sm">{msg}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">Citizen Name</label>
            <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Ramesh Kumar" className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Phone Number</label>
            <input required type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+91XXXXXXXXXX" className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white" />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">Category</label>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white">
              <option value="General Public">General Public</option>
              <option value="Farmer">Farmer</option>
              <option value="Fisherman">Fisherman</option>
              <option value="Aviation">Aviation</option>
              <option value="Urban Planning">Urban Planning</option>
              <option value="Emergency Response">Emergency Response</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-white/70 mb-1">State</label>
            <select value={form.state} onChange={e => setForm({...form, state: e.target.value, district: ""})} className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white" required>
              <option value="">Select State...</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">District</label>
            {NE_DISTRICTS[form.state] ? (
              <select value={form.district} onChange={e => setForm({...form, district: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white" required>
                <option value="">Select District...</option>
                {NE_DISTRICTS[form.state].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            ) : (
              <input type="text" value={form.district} onChange={e => setForm({...form, district: e.target.value})} placeholder="Enter district name" className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white" required />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">Village/Town</label>
              <input required type="text" value={form.village} onChange={e => setForm({...form, village: e.target.value})} placeholder="Village name" className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white" />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">PIN Code</label>
              <input required type="text" value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})} placeholder="6 digits" maxLength="6" className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">Preferred SMS Language</label>
            <select value={form.language} onChange={e => setForm({...form, language: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white">
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Bengali">Bengali</option>
              <option value="Assamese">Assamese</option>
            </select>
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg mt-2">Register Number</button>
        </form>
      </div>

      {/* Registry List */}
      <div className="glass-panel border border-white/10 p-6 rounded-2xl flex flex-col">
        <h2 className="text-xl font-bold mb-4 flex justify-between">
          Registered Phones 
          <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">{registry.length}</span>
        </h2>
        
        <div className="flex-1 overflow-y-auto space-y-3 max-h-[500px]">
          {loading ? (
            <p className="text-white/40">Loading registry...</p>
          ) : registry.length === 0 ? (
            <p className="text-white/40">No numbers registered yet.</p>
          ) : (
            registry.map(r => (
              <div key={r.id || r._id} className="bg-black/40 border border-white/10 p-3 rounded-xl flex flex-col gap-1 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-lg block">{r.name}</span>
                    <span className="text-xs bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded border border-indigo-500/30 mt-1 inline-block">{r.category || 'General'}</span>
                  </div>
                  <span className="text-xs bg-white/10 px-2 py-1 rounded">{r.language}</span>
                </div>
                <div className="font-mono text-white/80 text-sm mt-1">{r.phone}</div>
                <div className="text-xs text-white/50 mt-1">
                  {r.village ? `${r.village}, ` : ''}{r.district}, {r.state} {r.pincode ? `- ${r.pincode}` : ''}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
