import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

// ---------------------------------------------------------------------------
// Translations
// ---------------------------------------------------------------------------
const MODAL_I18N = {
  en: {
    title: 'WeatherGPT Trust & Accuracy',
    subtitle: 'Every AI claim is tracked and verified against real observed weather.',
    badge: (pct, total) => `${pct}% of ${total} verified claims were accurate`,
    empty: 'Answer-accuracy tracking has started. Verified answers and pending claims will appear here soon.',
    loading: 'Loading accuracy feed...',
    userQuestion: 'User Question',
    aiAnswer: 'Full AI Answer',
    aiPredicted: 'AI Predicted',
    actualOutcome: 'Actual Weather',
    accurate: 'Accurate',
    close: 'Close',
    off: 'Off',
    pending: 'Pending 24h',
    waiting: 'Waiting...',
    details: 'Details & Verification',
    claimsTitle: 'Claims Verified',
    metric: 'Metric',
    noAnswer: 'Full answer not stored for this entry.',
    noClaims: 'No quantifiable claims were extracted from this answer.',
    claimLabels: {
      rain_probability: 'Rain Probability',
      rain_mm: 'Rainfall',
      wind_speed: 'Wind Speed',
      humidity: 'Humidity',
      uv_index: 'UV Index',
      other: 'Stat',
    },
    units: {
      rain_probability: '%',
      rain_mm: ' mm',
      wind_speed: ' km/h',
      humidity: '%',
      uv_index: '',
      other: '',
    },
  },
  hi: {
    title: 'WeatherGPT विश्वास और सटीकता',
    subtitle: 'प्रत्येक AI दावे को वास्तविक मौसम से सत्यापित किया जाता है।',
    badge: (pct, total) => `${total} सत्यापित दावों में से ${pct}% सटीक थे`,
    empty: 'उत्तर-सटीकता ट्रैकिंग शुरू हो गई है। जल्द ही डेटा उपलब्ध होगा।',
    loading: 'सटीकता फ़ीड लोड हो रहा है...',
    userQuestion: 'उपयोगकर्ता का प्रश्न',
    aiAnswer: 'AI का पूरा उत्तर',
    aiPredicted: 'AI की भविष्यवाणी',
    actualOutcome: 'वास्तविक मौसम',
    accurate: 'सटीक',
    close: 'करीब',
    off: 'गलत',
    pending: '24 घंटे लंबित',
    waiting: 'प्रतीक्षा में...',
    details: 'विवरण और सत्यापन',
    claimsTitle: 'सत्यापित दावे',
    metric: 'मीट्रिक',
    noAnswer: 'इस एंट्री के लिए पूर्ण उत्तर उपलब्ध नहीं है।',
    noClaims: 'इस उत्तर से कोई मात्रात्मक दावा नहीं निकाला गया।',
    claimLabels: {
      rain_probability: 'वर्षा संभावना',
      rain_mm: 'वर्षा',
      wind_speed: 'हवा गति',
      humidity: 'आर्द्रता',
      uv_index: 'UV सूचकांक',
      other: 'आंकड़ा',
    },
    units: {
      rain_probability: '%',
      rain_mm: ' मिमी',
      wind_speed: ' किमी/घंटा',
      humidity: '%',
      uv_index: '',
      other: '',
    },
  },
  bn: {
    title: 'WeatherGPT বিশ্বাস এবং নির্ভুলতা',
    subtitle: 'প্রতিটি AI দাবি বাস্তব আবহাওয়ার বিপরীতে যাচাই করা হয়।',
    badge: (pct, total) => `${total} টি যাচাইকৃত দাবির মধ্যে ${pct}% নির্ভুল ছিল`,
    empty: 'ট্র্যাকিং শুরু হয়েছে। যাচাইকৃত তথ্য শীঘ্রই আসবে।',
    loading: 'নির্ভুলতা ফিড লোড হচ্ছে...',
    userQuestion: 'ব্যবহারকারীর প্রশ্ন',
    aiAnswer: 'AI-এর সম্পূর্ণ উত্তর',
    aiPredicted: 'AI পূর্বাভাস দিয়েছে',
    actualOutcome: 'প্রকৃত আবহাওয়া',
    accurate: 'সঠিক',
    close: 'কাছাকাছি',
    off: 'ভুল',
    pending: '২৪ ঘণ্টা অপেক্ষমাণ',
    waiting: 'অপেক্ষমাণ...',
    details: 'বিশদ ও যাচাইকরণ',
    claimsTitle: 'যাচাইকৃত দাবি',
    metric: 'মেট্রিক',
    noAnswer: 'এই এন্ট্রির জন্য সম্পূর্ণ উত্তর পাওয়া যায়নি।',
    noClaims: 'এই উত্তর থেকে কোনো পরিমাপযোগ্য দাবি পাওয়া যায়নি।',
    claimLabels: {
      rain_probability: 'বৃষ্টির সম্ভাবনা',
      rain_mm: 'বৃষ্টিপাত',
      wind_speed: 'বায়ু গতি',
      humidity: 'আর্দ্রতা',
      uv_index: 'UV সূচক',
      other: 'পরিসংখ্যান',
    },
    units: {
      rain_probability: '%',
      rain_mm: ' মিমি',
      wind_speed: ' কিমি/ঘণ্টা',
      humidity: '%',
      uv_index: '',
      other: '',
    },
  },
  as: {
    title: 'WeatherGPT বিশ্বাস আৰু সঠিকতা',
    subtitle: 'প্ৰতিটো AI দাবী প্ৰকৃত বতৰৰ বিপৰীতে পৰীক্ষা কৰা হয়।',
    badge: (pct, total) => `${total} টা প্ৰমাণিত দাবীৰ ভিতৰত ${pct}% সঠিক আছিল`,
    empty: 'ট্ৰেকিং আৰম্ভ হৈছে। সোনকালে তথ্য আহিব।',
    loading: "সঠিকতা ফিড ল'ড হৈ আছে...",
    userQuestion: 'ব্যৱহাৰকাৰীৰ প্ৰশ্ন',
    aiAnswer: 'AI-ৰ সম্পূৰ্ণ উত্তৰ',
    aiPredicted: 'AI পূৰ্বানুমান',
    actualOutcome: 'প্ৰকৃত বতৰ',
    accurate: 'সঠিক',
    close: 'ওচৰৰ',
    off: 'ভুল',
    pending: '২৪ ঘণ্টা বাকী',
    waiting: 'অপেক্ষা কৰি থকা হৈছে...',
    details: 'বিৱৰণ আৰু প্ৰমাণীকৰণ',
    claimsTitle: 'প্ৰমাণিত দাবী',
    metric: 'মেট্ৰিক',
    noAnswer: 'এই এণ্ট্ৰিৰ বাবে সম্পূৰ্ণ উত্তৰ উপলব্ধ নহয়।',
    noClaims: 'এই উত্তৰৰ পৰা কোনো পৰিমাপযোগ্য দাবী পোৱা নগ\u2019ল।',
    claimLabels: {
      rain_probability: 'বৰষুণৰ সম্ভাৱনা',
      rain_mm: 'বৰষুণ',
      wind_speed: 'বতাহৰ গতি',
      humidity: 'আৰ্দ্ৰতা',
      uv_index: 'UV সূচক',
      other: 'পৰিসংখ্যা',
    },
    units: {
      rain_probability: '%',
      rain_mm: ' মিমি',
      wind_speed: ' কিমি/ঘণ্টা',
      humidity: '%',
      uv_index: '',
      other: '',
    },
  },
};

// ---------------------------------------------------------------------------
// Status styles
// ---------------------------------------------------------------------------
const STATUS = {
  accurate: { dot: 'bg-green-400',  text: 'text-green-400',  pill: 'bg-green-500/10 border-green-500/25 text-green-400'  },
  close:    { dot: 'bg-yellow-400', text: 'text-yellow-400', pill: 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400' },
  off:      { dot: 'bg-red-400',    text: 'text-red-400',    pill: 'bg-red-500/10 border-red-500/25 text-red-400'        },
  unknown:  { dot: 'bg-white/25',   text: 'text-white/40',   pill: 'bg-white/5 border-white/10 text-white/40'           },
  pending:  { dot: 'bg-blue-400 animate-pulse', text: 'text-blue-300/80', pill: 'bg-blue-500/10 border-blue-500/20 text-blue-300/80' },
};

// ---------------------------------------------------------------------------
// Single feed card with expandable Details
// ---------------------------------------------------------------------------
function FeedCard({ item, lang }) {
  const [open, setOpen] = useState(false);

  // Normalise claims — support both new `claims[]` and legacy single-claim fields
  const claims = (() => {
    if (Array.isArray(item.claims) && item.claims.length > 0) return item.claims;
    if (item.claimType && item.claimType !== 'other' && item.claimValue != null) {
      return [{
        claimType: item.claimType,
        claimValue: item.claimValue,
        unit: item.claimType === 'rain_probability' ? '%'
            : item.claimType === 'wind_speed' ? ' km/h'
            : item.claimType === 'humidity' ? '%' : '',
        actualValue: item.actualValue ?? null,
        accuracyStatus: item.accuracyStatus ?? null,
      }];
    }
    return [];
  })();

  const overallStatus = item.verified ? (item.accuracyStatus || 'unknown') : 'pending';
  const s = STATUS[overallStatus] || STATUS.unknown;

  const dateLabel = item.loggedAt
    ? new Date(item.loggedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    : new Date(item.date).toLocaleDateString();

  const fmtVal = (claimType, val) => {
    if (val == null) return '—';
    const unit = lang.units?.[claimType] ?? '';
    return `${val}${unit}`;
  };

  const claimLabel = (type) => lang.claimLabels?.[type] || lang.claimLabels?.other || type;

  return (
    <div className="bg-black/25 rounded-2xl border border-white/5 hover:border-white/10 transition-colors overflow-hidden">

      {/* ── Top bar: date · location · status ── */}
      <div className="flex items-center justify-between px-4 sm:px-5 pt-4 pb-3 gap-3">
        <div className="flex items-center gap-1.5 text-white/40 text-xs">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {dateLabel}
          {item.location && item.location !== 'Unknown' && (
            <span className="text-white/20">· {item.location}</span>
          )}
        </div>

        {/* Status badge */}
        <span className={`inline-flex items-center gap-1.5 border px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${s.pill}`}>
          {overallStatus === 'pending' ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          ) : (
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          )}
          {lang[overallStatus] || overallStatus}
        </span>
      </div>

      {/* ── User Question ── */}
      <div className="mx-4 sm:mx-5 mb-3 pl-3 border-l-2 border-blue-500/40 bg-blue-500/5 rounded-r-lg py-2 pr-2">
        <span className="text-blue-400/80 text-[10px] uppercase tracking-wider font-bold block mb-0.5">
          {lang.userQuestion}
        </span>
        <p className="italic text-white/90 text-sm leading-snug">"{item.question}"</p>
      </div>

      {/* ── Claim quick-chips row ── */}
      {claims.length > 0 && (
        <div className="px-4 sm:px-5 pb-3 flex flex-wrap gap-1.5">
          {claims.map((c, i) => {
            const cs = c.accuracyStatus ? STATUS[c.accuracyStatus] : STATUS.pending;
            return (
              <span key={i}
                className={`inline-flex items-center gap-1 border px-2 py-0.5 rounded-full text-[10px] font-semibold ${cs.pill}`}>
                {claimLabel(c.claimType)}: {fmtVal(c.claimType, c.claimValue)}
                {c.actualValue != null && <> → <span className={cs.text}>{fmtVal(c.claimType, c.actualValue)}</span></>}
              </span>
            );
          })}
        </div>
      )}

      {/* ── Details toggle button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 sm:px-5 py-2.5 border-t border-white/5 text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors text-xs font-semibold uppercase tracking-wider"
      >
        <span className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          {lang.details}
        </span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* ── Expanded Details Panel ── */}
      {open && (
        <div className="border-t border-white/5 px-4 sm:px-5 py-4 space-y-4 bg-black/10">

          {/* Claims verification table */}
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-white/30 mb-2 flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              {lang.claimsTitle}
            </p>

            {claims.length === 0 ? (
              <p className="text-white/30 text-xs italic px-1">{lang.noClaims}</p>
            ) : (
              <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-4 gap-2 px-3 py-2 border-b border-white/8 bg-white/3">
                  <span className="text-[9px] uppercase tracking-wider text-white/25 font-bold">{lang.metric}</span>
                  <span className="text-[9px] uppercase tracking-wider text-white/25 font-bold text-right">{lang.aiPredicted}</span>
                  <span className="text-[9px] uppercase tracking-wider text-white/25 font-bold text-right">{lang.actualOutcome}</span>
                  <span className="text-[9px] uppercase tracking-wider text-white/25 font-bold text-right">Status</span>
                </div>

                {/* Table rows — one per claim */}
                {claims.map((c, idx) => {
                  const cs = c.accuracyStatus ? STATUS[c.accuracyStatus] : STATUS.pending;
                  return (
                    <div key={idx}
                      className="grid grid-cols-4 gap-2 px-3 py-2.5 border-b border-white/5 last:border-0 items-center hover:bg-white/3 transition-colors">
                      <span className="text-xs text-white/55 font-medium truncate">{claimLabel(c.claimType)}</span>
                      <span className="text-xs font-bold text-amber-300 text-right">{fmtVal(c.claimType, c.claimValue)}</span>
                      <span className={`text-xs font-bold text-right ${c.actualValue != null ? cs.text : 'text-white/25 italic'}`}>
                        {c.actualValue != null ? fmtVal(c.claimType, c.actualValue) : lang.waiting}
                      </span>
                      <span className={`text-[10px] font-bold uppercase text-right ${cs.text}`}>
                        {c.accuracyStatus || (item.verified ? '—' : lang.pending)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Full AI answer text */}
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-white/30 mb-2 flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {lang.aiAnswer}
            </p>
            <div className="bg-black/20 rounded-xl border border-white/5 p-3">
              {item.answerText ? (
                <p className="text-white/65 text-xs leading-relaxed whitespace-pre-wrap">{item.answerText}</p>
              ) : (
                <p className="text-white/25 text-xs italic">{lang.noAnswer}</p>
              )}
            </div>
          </div>

          {/* Verification note */}
          {!item.verified && (
            <div className="flex items-start gap-2 p-2.5 bg-blue-500/5 rounded-lg border border-blue-500/15 text-blue-300/70 text-[10px]">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Verification runs the next morning using the Open-Meteo weather archive. Each claim is checked independently.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main modal
// ---------------------------------------------------------------------------
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
        const res = await fetch(`${baseUrl}/api/chat-accuracy`);
        if (res.ok) setData(await res.json());
      } catch (err) {
        console.error('Failed to fetch chat accuracy:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
    const interval = setInterval(fetchFeed, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl theme-modal rounded-3xl overflow-hidden flex flex-col max-h-[90vh] relative"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="p-5 sm:p-6 border-b border-white/10 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 sm:top-6 sm:right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-white/60 hover:text-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          <div className="flex flex-col items-center text-center mt-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-green-500/20 to-blue-500/20 border border-green-400/30 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">{lang.title}</h2>
            <p className="text-white/60 text-sm max-w-md mx-auto">{lang.subtitle}</p>

            {!loading && data.totalVerified > 0 && (
              <div className="mt-4 bg-green-500/10 border border-green-500/30 px-5 py-2 rounded-full text-green-400 font-bold text-sm flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"/>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"/>
                </span>
                {lang.badge(data.accuratePercent, data.totalVerified)}
              </div>
            )}
          </div>
        </div>

        {/* ── Scrollable feed ── */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
          {loading && data.feed.length === 0 ? (
            <div className="py-12 text-center text-white/50">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"/>
              <p>{lang.loading}</p>
            </div>
          ) : data.feed.length === 0 ? (
            <div className="py-10 px-4 bg-black/20 rounded-2xl border border-white/5 text-center flex flex-col items-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20 mb-3">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <p className="text-white/60 text-sm max-w-[280px]">{lang.empty}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.feed.map((item) => (
                <FeedCard key={item.id || item._id} item={item} lang={lang} />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-3 border-t border-white/5 shrink-0">
          <p className="text-[10px] text-white/25 text-center">
            Click <strong className="text-white/40">Details & Verification</strong> on any card to see the full AI answer and per-claim accuracy check.
          </p>
        </div>
      </div>
    </div>
  );
}
