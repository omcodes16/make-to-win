import React, { useState, useEffect } from 'react';

export default function SmsSimulatorModal({ isOpen, onClose, alert, API_URL, token }) {
  const [recipients, setRecipients] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [sentLogs, setSentLogs] = useState([]);
  const [currentLang, setCurrentLang] = useState('English');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (isOpen && alert) {
      fetchRecipients();
    }
  }, [isOpen, alert]);

  const fetchRecipients = async () => {
    setLoading(true);
    try {
      const stateQuery = alert.state ? `state=${encodeURIComponent(alert.state)}` : '';
      const districtQuery = alert.district ? `&district=${encodeURIComponent(alert.district)}` : '';
      const res = await fetch(`${API_URL}/api/sms/registry?${stateQuery}${districtQuery}`);
      if (res.ok) {
        const data = await res.json();
        setRecipients(data);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const startSimulation = async () => {
    setIsSimulating(true);
    setSentLogs([]);
    try {
      const res = await fetch(`${API_URL}/api/sms/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          alertId: alert.id,
          title: alert.title,
          description: alert.description,
          recipients: recipients
        })
      });
      if (res.ok) {
        const data = await res.json();
        
        // Animate delivery
        let currentLogs = [];
        data.logs.forEach((log, i) => {
          setTimeout(() => {
            currentLogs = [...currentLogs, log];
            setSentLogs([...currentLogs]);
            if (i === data.logs.length - 1) {
              setIsSimulating(false);
            }
          }, (i + 1) * 300); // 300ms delay per SMS
        });
      } else { setIsSimulating(false); }
    } catch (e) {
      console.error(e);
      setIsSimulating(false);
    }
  };

  const downloadCSV = () => {
    if (sentLogs.length === 0) return;
    const header = "phone,name,district,state,language,message,timestamp,status\n";
    const rows = sentLogs.map(l => `"${l.phone}","${l.name}","${alert.district || ''}","${alert.state || ''}","${l.language}","${l.message.replace(/"/g, '""')}","${l.sentAt}","${l.status}"`).join("\n");
    
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sms_broadcast_${alert.id}.csv`;
    a.click();
  };

  if (!isOpen) return null;

  const deliveredCount = sentLogs.length;
  const totalCount = recipients.length;
  
  const mockMessages = {
    'English': `WEATHERGPT ALERT: ${alert.title}. ${(alert.description || '').substring(0, 80)}... Take precautions.`,
    'Hindi': `चेतावनी: ${alert.title}. ${(alert.description || '').substring(0, 60)}... सुरक्षित रहें।`,
    'Bengali': `সতর্কতা: ${alert.title}. ${(alert.description || '').substring(0, 60)}... নিরাপদে থাকুন।`,
    'Assamese': `সতৰ্কতা: ${alert.title}. ${(alert.description || '').substring(0, 60)}... সাৱধানে থাকক।`
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/20 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/20">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              SMS Broadcast Simulator
            </h2>
            <p className="text-sm text-white/50">Target: {alert.targetMode === 'district' ? `${alert.district}, ${alert.state}` : alert.state}</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white p-2">&times; Close</button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Side: Phone Mockup */}
          <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-white/10 flex flex-col items-center justify-center bg-black/40">
            <h3 className="text-sm font-bold text-white/70 mb-4 uppercase tracking-widest">Phone Preview</h3>
            
            {/* Nokia Style Phone Frame */}
            <div className="w-[220px] h-[400px] bg-gray-300 rounded-[30px] p-2 shadow-[inset_0_-4px_10px_rgba(0,0,0,0.2)] border-2 border-gray-400 relative flex flex-col">
              <div className="w-10 h-1 bg-gray-400 mx-auto mt-2 rounded-full mb-3 shrink-0"></div>
              {/* Screen */}
              <div className="w-full h-[180px] bg-[#9EA381] rounded-lg border-4 border-gray-400 p-2 font-mono flex flex-col shadow-[inset_0_0_10px_rgba(0,0,0,0.1)] shrink-0 overflow-hidden">
                <div className="flex justify-between items-center text-[#1E2113] text-[9px] mb-2 font-bold border-b border-[#1E2113]/30 pb-1">
                  <span>Tll </span>
                  <span>100%</span>
                </div>
                <div className="text-[10px] text-[#1E2113] font-bold mb-1">WeatherGPT-GOV</div>
                <div className="text-[10px] text-[#1E2113] leading-tight flex-1 whitespace-pre-wrap overflow-hidden">
                  {mockMessages[currentLang]}
                </div>
                <div className="text-[8px] text-[#1E2113] text-right mt-1">16:45</div>
              </div>
              
              {/* Keypad mockup */}
              <div className="mt-4 flex flex-col gap-2 px-2 flex-1">
                <div className="flex justify-between">
                  <div className="w-10 h-6 bg-gray-400 rounded-full"></div>
                  <div className="w-12 h-10 bg-gray-400 rounded-full"></div>
                  <div className="w-10 h-6 bg-gray-400 rounded-full"></div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[...Array(9)].map((_, i) => <div key={i} className="h-6 bg-gray-400/50 rounded-full"></div>)}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              {['English', 'Hindi', 'Bengali', 'Assamese'].map(lang => (
                <button 
                  key={lang}
                  onClick={() => setCurrentLang(lang)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${currentLang === lang ? 'bg-blue-600 border-blue-500 text-white' : 'bg-transparent border-white/20 text-white/50 hover:bg-white/10'}`}
                >
                  {lang.substring(0, 2).toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Right Side: Delivery Status */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-white/10">
              <div className="flex justify-between items-end mb-2">
                <h3 className="text-sm font-bold text-white/70 uppercase tracking-widest">Delivery Roster</h3>
                <span className={`text-sm font-bold ${deliveredCount === totalCount && totalCount > 0 ? 'text-green-400' : 'text-amber-400'}`}>
                  {deliveredCount} / {totalCount} Delivered
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: totalCount > 0 ? `${(deliveredCount / totalCount) * 100}%` : '0%' }}
                ></div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[300px] md:max-h-none">
              {loading ? (
                <div className="text-white/50 text-center py-10 text-sm">Loading registry...</div>
              ) : recipients.length === 0 ? (
                <div className="text-white/50 text-center py-10 text-sm">No registered phones found for this region.</div>
              ) : (
                recipients.map((r, idx) => {
                  const isSent = sentLogs.find(l => l.phone === r.phone);
                  return (
                    <div key={idx} className="flex justify-between items-center p-2 rounded bg-white/5 border border-white/5 text-sm">
                      <div className="flex items-center gap-3">
                        {isSent ? (
                          <span className="text-green-500 animate-pulse">✅</span>
                        ) : (
                          <span className="text-white/30">⏳</span>
                        )}
                        <div>
                          <div className="font-mono text-white/90">{r.phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')}</div>
                          <div className="text-xs text-white/50">{r.name} &bull; {r.language}</div>
                        </div>
                      </div>
                      <div className="text-xs text-white/40">{isSent ? 'Sent' : 'Pending'}</div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="p-4 border-t border-white/10 flex gap-3">
              <button 
                onClick={startSimulation} 
                disabled={isSimulating || recipients.length === 0 || deliveredCount > 0}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
              >
                {isSimulating ? 'Sending...' : deliveredCount > 0 ? 'Sent' : 'Simulate Broadcast'}
              </button>
              
              <button 
                onClick={downloadCSV}
                disabled={deliveredCount === 0}
                className="px-6 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg flex items-center justify-center gap-2"
                title="Download CSV for telecom operator"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                CSV
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
