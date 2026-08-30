import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const MODAL_I18N = {
  en: {
    title: "WeatherGPT Trust & Accuracy",
    subtitle: "Tracking AI predictions against actual weather.",
    badge: (pct, total) => `${pct}% of ${total} verified claims were accurate`,
    empty: "Answer-accuracy tracking has started. Verified answers and pending claims will appear here soon.",
    loading: "Loading accuracy feed...",
    userQuestion: "User Question",
    aiPredicted: "AI Predicted",
    actualOutcome: "Actual Weather",
    accurate: "Accurate",
    close: "Close",
    off: "Off",
    pending: "Pending 24h",
    waiting: "Waiting...",
    fmtRainAI: (val) => `${val}% Chance of Rain`,
    fmtRainActual: (val) => `${val} mm Rain`,
    fmtTemp: (val) => `${val}°C`,
    fmtWind: (val) => `${val} km/h`,
    fmtHumidity: (val) => `${val}% Humidity`,
    fmtUv: (val) => `${val} UV`,
    fmtDefault: (type, val) => `${type}: ${val}`
  },
  hi: {
    title: "WeatherGPT विश्वास और सटीकता",
    subtitle: "वास्तविक मौसम के खिलाफ एआई भविष्यवाणियों को ट्रैक करना।",
    badge: (pct, total) => `${total} सत्यापित दावों में से ${pct}% सटीक थे`,
    empty: "उत्तर-सटीकता ट्रैकिंग शुरू हो गई है। सत्यापित उत्तर और लंबित दावे जल्द ही यहां दिखाई देंगे।",
    loading: "सटीकता फ़ीड लोड हो रहा है...",
    userQuestion: "उपयोगकर्ता का प्रश्न",
    aiPredicted: "एआई की भविष्यवाणी",
    actualOutcome: "वास्तविक मौसम",
    accurate: "सटीक",
    close: "करीब",
    off: "गलत",
    pending: "24 घंटे लंबित",
    waiting: "प्रतीक्षा में...",
    fmtRainAI: (val) => `बारिश की ${val}% संभावना`,
    fmtRainActual: (val) => `${val} मिमी बारिश`,
    fmtTemp: (val) => `${val}°C`,
    fmtWind: (val) => `${val} किमी/घंटा`,
    fmtHumidity: (val) => `${val}% नमी`,
    fmtUv: (val) => `${val} यूवी`,
    fmtDefault: (type, val) => `${type}: ${val}`
  },
  bn: {
    title: "WeatherGPT বিশ্বাস এবং নির্ভুলতা",
    subtitle: "প্রকৃত আবহাওয়ার বিপরীতে এআই পূর্বাভাস ট্র্যাক করা হচ্ছে।",
    badge: (pct, total) => `${total} টি যাচাইকৃত দাবির মধ্যে ${pct}% নির্ভুল ছিল`,
    empty: "উত্তর-নির্ভুলতা ট্র্যাকিং শুরু হয়েছে। যাচাইকৃত উত্তর এবং মুলতুবি দাবিগুলি শীঘ্রই এখানে প্রদর্শিত হবে।",
    loading: "নির্ভুলতা ফিড লোড হচ্ছে...",
    userQuestion: "ব্যবহারকারীর প্রশ্ন",
    aiPredicted: "এআই পূর্বাভাস দিয়েছে",
    actualOutcome: "প্রকৃত আবহাওয়া",
    accurate: "সঠিক",
    close: "কাছাকাছি",
    off: "ভুল",
    pending: "২৪ ঘণ্টা অপেক্ষমাণ",
    waiting: "অপেক্ষমাণ...",
    fmtRainAI: (val) => `বৃষ্টির ${val}% সম্ভাবনা`,
    fmtRainActual: (val) => `${val} মিমি বৃষ্টি`,
    fmtTemp: (val) => `${val}°C`,
    fmtWind: (val) => `${val} কিমি/ঘণ্টা`,
    fmtHumidity: (val) => `${val}% আর্দ্রতা`,
    fmtUv: (val) => `${val} ইউভি`,
    fmtDefault: (type, val) => `${type}: ${val}`
  },
  as: {
    title: "WeatherGPT বিশ্বাস আৰু সঠিকতা",
    subtitle: "প্ৰকৃত বতৰৰ বিপৰীতে এআই পূৰ্বানুমান ট্ৰেক কৰা হৈছে।",
    badge: (pct, total) => `${total} টা প্ৰমাণিত দাবীৰ ভিতৰত ${pct}% সঠিক আছিল`,
    empty: "উত্তৰ-সঠিকতা ট্ৰেকিং আৰম্ভ হৈছে। প্ৰমাণিত উত্তৰ আৰু বাকী থকা দাবীসমূহ অতি সোনকালে ইয়াত দেখা যাব।",
    loading: "সঠিকতা ফিড ল'ড হৈ আছে...",
    userQuestion: "ব্যৱহাৰকাৰীৰ প্ৰশ্ন",
    aiPredicted: "এআই পূৰ্বানুমান",
    actualOutcome: "প্ৰকৃত বতৰ",
    accurate: "সঠিক",
    close: "ওচৰৰ",
    off: "ভুল",
    pending: "২৪ ঘণ্টা বাকী",
    waiting: "অপেক্ষা কৰি থকা হৈছে...",
    fmtRainAI: (val) => `বৰষুণৰ ${val}% সম্ভাৱনা`,
    fmtRainActual: (val) => `${val} মিমি বৰষুণ`,
    fmtTemp: (val) => `${val}°C`,
    fmtWind: (val) => `${val} কিমি/ঘণ্টা`,
    fmtHumidity: (val) => `${val}% আৰ্দ্ৰতা`,
    fmtUv: (val) => `${val} ইউভি`,
    fmtDefault: (type, val) => `${type}: ${val}`
  }
};

export default function AccuracyFeedModal({ onClose }) {
  const { state } = useApp();
  const [data, setData] = useState({ totalVerified: 0, accuratePercent: 0, feed: [] });
  const [loading, setLoading] = useState(true);

  const lang = MODAL_I18N[state.language] || MODAL_I18N['en'];

  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      try {
        const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
        const url = `${baseUrl}/api/chat-accuracy`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to fetch chat accuracy:', err);
      } finally {
        setLoading(false);
      }
    };
    
    // Fetch immediately on open
    fetchFeed();
    
    // Also poll every 10 seconds
    const interval = setInterval(fetchFeed, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatData = (type, val, isAI) => {
    if (val === null || val === undefined) return lang.waiting;
    const t = type.toLowerCase();
    if (t.includes('rain') || t.includes('precip')) {
      return isAI ? lang.fmtRainAI(val) : lang.fmtRainActual(val);
    }
    if (t.includes('temp')) return lang.fmtTemp(val);
    if (t.includes('wind')) return lang.fmtWind(val);
    if (t.includes('humid')) return lang.fmtHumidity(val);
    if (t.includes('uv')) return lang.fmtUv(val);
    return lang.fmtDefault(type.replace('_', ' '), val);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div 
        className="w-full max-w-2xl glass-panel !bg-[#1a103c]/95 border border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[85vh] relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header / Trust Score */}
        <div className="p-5 sm:p-6 border-b border-white/10 relative shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 sm:top-6 sm:right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-white/60 hover:text-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          
          <div className="flex flex-col items-center text-center mt-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-green-500/20 to-blue-500/20 border border-green-400/30 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
              {lang.title}
            </h2>
            <p className="text-white/60 text-sm max-w-md mx-auto">
              {lang.subtitle}
            </p>
            
            {!loading && data.totalVerified > 0 && (
              <div className="mt-4 bg-green-500/10 border border-green-500/30 px-5 py-2 rounded-full text-green-400 font-bold text-sm sm:text-base flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                {lang.badge(data.accuratePercent, data.totalVerified)}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Feed Area */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
          {loading && data.feed.length === 0 ? (
            <div className="py-12 text-center text-white/50">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p>{lang.loading}</p>
            </div>
          ) : data.feed.length === 0 ? (
            <div className="py-10 px-4 bg-black/20 rounded-2xl border border-white/5 text-center flex flex-col items-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20 mb-3"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <p className="text-white/60 text-sm max-w-[250px]">
                {lang.empty}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.feed.map((item) => (
                <div key={item.id || item._id} className="p-4 sm:p-5 bg-black/20 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="font-medium text-white/80 flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      {new Date(item.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center font-bold text-sm">
                      {item.verified ? (
                        <>
                          {item.accuracyStatus === 'accurate' && <span className="text-green-400 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> {lang.accurate}</span>}
                          {item.accuracyStatus === 'close' && <span className="text-yellow-400 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span> {lang.close}</span>}
                          {item.accuracyStatus === 'off' && <span className="text-red-400 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> {lang.off}</span>}
                        </>
                      ) : (
                        <span className="text-blue-300/80 flex items-center gap-1.5 font-medium text-xs sm:text-sm">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                          {lang.pending}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-4 pl-3 border-l-2 border-blue-500/30">
                    <span className="text-blue-400/70 text-[10px] sm:text-xs uppercase tracking-wider font-bold">{lang.userQuestion}</span>
                    <p className="italic text-white/90 text-sm mt-1">"{item.question}"</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                    <div>
                      <span className="text-white/40 text-[10px] sm:text-xs block uppercase font-bold mb-1">{lang.aiPredicted}</span>
                      <span className="text-amber-400 font-medium text-sm sm:text-base">
                        {formatData(item.claimType, item.claimValue, true)}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/40 text-[10px] sm:text-xs block uppercase font-bold mb-1">{lang.actualOutcome}</span>
                      <span className="text-white font-medium text-sm sm:text-base">
                        {item.verified ? (
                           <span className={item.accuracyStatus === 'accurate' ? 'text-green-400 font-bold' : ''}>
                             {formatData(item.claimType, item.actualValue, false)}
                           </span>
                        ) : (
                           <span className="text-white/30 italic">{lang.waiting}</span>
                        )}
                      </span>
                    </div>
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
