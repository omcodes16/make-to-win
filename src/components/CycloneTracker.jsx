
import React, { useState, useEffect } from "react";

const SEVERITY_COLOR = { severe: "text-red-400", high: "text-red-400", moderate: "text-orange-400" };
const SEVERITY_DOT   = { severe: "bg-red-500 animate-pulse", high: "bg-red-500 animate-pulse", moderate: "bg-orange-500" };
const WINDY_OVERLAY  = { cyclone: "wind", flood: "rain", heatwave: "temp", thunderstorm: "thunder", storm: "wind", default: "wind" };

export default function CycloneTracker({ lat, lon, locationName = "your area" }) {
  const [alerts, setAlerts]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [selected, setSelected] = useState(0);

  const fetchAlerts = async () => {
    if (!lat || !lon) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/extreme-alerts?lat=${lat}&lon=${lon}`);
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setAlerts(data.alerts || []);
      setSelected(0);
    } catch (e) {
      setError("Could not load live alerts. Retrying...");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [lat, lon]);

  if (loading) {
    return (
      <div className="bg-[#231A3F]/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl animate-pulse h-64 flex items-center justify-center">
        <div className="text-white/30 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Fetching live disaster data...
        </div>
      </div>
    );
  }

  if (!alerts.length) {
    return (
      <div className="bg-[#231A3F]/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col items-center justify-center h-48 gap-3">
        <div className="text-center text-white/40">
          <svg className="w-10 h-10 mx-auto mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p className="font-medium">No active extreme weather alerts</p>
          <p className="text-xs mt-1 text-white/25">Sources: GDACS | Open-Meteo  |  Updates every 10 min</p>
        </div>
        {error && (
          <button onClick={fetchAlerts} className="text-xs text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded-full hover:bg-indigo-500/10 transition-colors">
            Retry
          </button>
        )}
      </div>
    );
  }

  const active = alerts[selected];
  const windyOverlay = WINDY_OVERLAY[active.type] || WINDY_OVERLAY.default;

  return (
    <div className="flex flex-col gap-3">
      {alerts.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {alerts.map((a, i) => (
            <button key={i} onClick={() => setSelected(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${i === selected ? "bg-[#231A3F] border-white/20 text-white" : "bg-transparent border-white/10 text-white/40 hover:border-white/10 hover:text-white/60"}`}>
              <span>{a.icon}</span>
              <span className="capitalize">{a.type}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${SEVERITY_DOT[a.severity]}`}/>
            </button>
          ))}
        </div>
      )}

      {/* Main alert card - PURPLE DESIGN MATCHING SAMPLE */}
      <div className="bg-[#2A2346]/95 backdrop-blur-xl border border-white/5 rounded-3xl p-6 relative overflow-hidden flex flex-col xl:flex-row gap-8 shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
        
        {/* Left: details */}
        <div className="flex-1 text-white">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center border border-red-500/30 bg-red-500/10 text-red-400 text-2xl shadow-inner">
              {active.icon}
            </div>
            <div className="flex-1 mt-1">
              <h3 className="text-[22px] font-bold text-white leading-tight mb-2 tracking-wide">{active.title} in {locationName}</h3>
              <p className="text-sm text-white/70 leading-relaxed pr-4">{active.description}</p>
            </div>
            <div className="flex-shrink-0">
              <span className="text-[10px] font-bold tracking-widest uppercase border px-3 py-1.5 rounded bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                {active.severity}
              </span>
            </div>
          </div>

          <div className="h-[1px] w-full bg-white/5 mb-6" />

          <div className="grid grid-cols-2 gap-y-8 gap-x-4 mb-8">
            <div>
              <div className="text-[11px] uppercase font-bold text-white/40 tracking-widest mb-1.5 flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> 
                PROBABILITY
              </div>
              <div className="text-2xl font-bold tracking-wide">{active.probability || "100%"}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase font-bold text-white/40 tracking-widest mb-1.5 flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
                EXPECTED
              </div>
              <div className="text-2xl font-bold tracking-wide">{active.expected || "N/A"}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase font-bold text-white/40 tracking-widest mb-1.5 flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                RISK WINDOW
              </div>
              <div className="text-2xl font-bold tracking-wide">{active.riskWindow || "Next 24 hrs"}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase font-bold text-white/40 tracking-widest mb-1.5 flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                IMPACT LEVEL
              </div>
              <div className={`text-2xl font-bold capitalize ${SEVERITY_COLOR[active.severity]}`}>{active.severity}</div>
            </div>
          </div>

          <div className="border border-red-500/30 bg-[#351B2E] rounded-xl p-5 mb-5 shadow-inner">
            <div className="flex items-center gap-2 text-[11px] font-bold text-red-400 tracking-widest uppercase mb-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              PRECAUTION / ACTION
            </div>
            <p className="text-[15px] text-white/90 leading-relaxed font-medium">{active.precaution || "Exercise extreme caution and follow local emergency guidelines immediately."}</p>
          </div>

          <button className="w-full py-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-[13px] font-bold tracking-widest uppercase flex items-center justify-center gap-2 text-white/80 hover:text-white">
            View Details <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </div>

        {/* Right: Windy live map */}
        <div className="w-full xl:w-[45%] h-[320px] xl:h-auto min-h-[350px] rounded-2xl overflow-hidden border border-white/10 relative">
          <iframe
            key={`${lat}-${lon}-${windyOverlay}`}
            width="100%" height="100%"
            src={`https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=%C2%B0C&metricWind=km/h&zoom=9&overlay=${windyOverlay}&product=ecmwf&level=surface&lat=${lat || 20}&lon=${lon || 80}&detailLat=${lat}&detailLon=${lon}&marker=true`}
            frameBorder="0"
            style={{ border: 0 }}
            title="Extreme Weather Live Map"
          />
        </div>
      </div>
    </div>
  );
}
