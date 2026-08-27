import React, { useEffect, useState } from 'react';
import { UI_TRANSLATIONS } from '../utils/translations';

export default function AccuracyTracker({ locationName, language }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startedAt, setStartedAt] = useState('');

  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS['en'];
  // We'll hardcode some fallback translations if they aren't in translations.js
  const tl = {
    title: language === 'hi' ? 'पूर्वानुमान सटीकता ट्रैकर' : 'Forecast Accuracy Tracker',
    desc: language === 'hi' ? 'हम अपनी भविष्यवाणियों को वास्तविक मौसम से मापते हैं ताकि आप हम पर भरोसा कर सकें।' : 'We measure our past predictions against actual observed weather to prove reliability.',
    date: language === 'hi' ? 'तारीख' : 'Date',
    predicted: language === 'hi' ? 'भविष्यवाणी' : 'Predicted',
    actual: language === 'hi' ? 'वास्तविक' : 'Actual',
    diff: language === 'hi' ? 'अंतर' : 'Diff',
    sampleTag: language === 'hi' ? 'नमूना' : 'Sample',
    accurate: language === 'hi' ? 'सटीक' : 'Accurate',
    close: language === 'hi' ? 'करीब' : 'Close',
    off: language === 'hi' ? 'गलत' : 'Off',
    disclaimer: language === 'hi' ? 'यह सुविधा आज शुरू की गई। स्पष्टता के लिए नमूना डेटा दिखाया गया है।' : 'Tracking started today. Sample data is shown for demonstration purposes until real history accumulates.',
  };

  useEffect(() => {
    if (!locationName) return;
    setLoading(true);
    const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
    fetch(`${baseUrl}/api/accuracy?location=${encodeURIComponent(locationName)}`)
      .then(res => res.json())
      .then(json => {
        setData(json.data || []);
        if (json.trackingStartedAt) {
          setStartedAt(new Date(json.trackingStartedAt).toLocaleDateString());
        }
      })
      .catch(err => console.error("Accuracy Tracker failed:", err))
      .finally(() => setLoading(false));
  }, [locationName]);

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-xl mb-6 animate-pulse min-h-[200px]">
        <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-white/10 rounded w-1/2 mb-6"></div>
        <div className="space-y-3">
          <div className="h-10 bg-white/5 rounded"></div>
          <div className="h-10 bg-white/5 rounded"></div>
          <div className="h-10 bg-white/5 rounded"></div>
        </div>
      </div>
    );
  }

  if (data.length === 0) return null;

  const accurateCount = data.filter(d => d.accuracyStatus === 'accurate').length;
  const accuracyPercentage = Math.round((accurateCount / data.length) * 100);

  return (
    <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 sm:p-6 shadow-xl mb-6 sm:mb-8 transition-colors">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
        <div>
          <h2 className="text-white/90 font-bold text-lg tracking-wide flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            {tl.title}
          </h2>
          <p className="text-white/50 text-xs sm:text-sm mt-1">{tl.desc}</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-2xl font-bold text-green-400">{accuracyPercentage}%</div>
          <div className="text-[10px] uppercase tracking-widest text-white/40">{tl.accurate} ({accurateCount}/{data.length})</div>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full text-left min-w-[500px]">
          <thead>
            <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wider">
              <th className="pb-3 px-4 font-semibold">{tl.date}</th>
              <th className="pb-3 px-4 font-semibold">{tl.predicted}</th>
              <th className="pb-3 px-4 font-semibold">{tl.actual}</th>
              <th className="pb-3 px-4 font-semibold">{tl.diff}</th>
              <th className="pb-3 px-4 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors group">
                <td className="py-4 px-4">
                  <div className="text-sm font-medium text-white/90">{new Date(row.date).toLocaleDateString()}</div>
                  {row.isSample && (
                    <span className="text-[9px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded border border-yellow-500/30 uppercase tracking-widest font-bold mt-1 inline-block">
                      {tl.sampleTag}
                    </span>
                  )}
                </td>
                <td className="py-4 px-4">
                  <div className="text-sm text-white/80">{row.predictedTemp}°C</div>
                  <div className="text-xs text-white/40">{row.predictedRainProb}% rain</div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-sm text-white/80">{row.actualTemp}°C</div>
                  <div className="text-xs text-white/40">{row.actualRainProb}% rain</div>
                </td>
                <td className="py-4 px-4">
                  <div className={`text-sm font-bold ${row.tempDiff <= 1.5 ? 'text-green-400' : row.tempDiff <= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {row.tempDiff > 0 ? '+' : ''}{row.tempDiff}°C
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  {row.accuracyStatus === 'accurate' && (
                    <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      ✅ {tl.accurate}
                    </span>
                  )}
                  {row.accuracyStatus === 'close' && (
                    <span className="inline-flex items-center gap-1.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      ⚠️ {tl.close}
                    </span>
                  )}
                  {row.accuracyStatus === 'off' && (
                    <span className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      ❌ {tl.off}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 text-center sm:text-left">
        <p className="text-[11px] text-white/40 flex items-center justify-center sm:justify-start gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          {tl.disclaimer}
        </p>
      </div>
    </div>
  );
}
