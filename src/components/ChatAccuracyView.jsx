import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const ACCURACY_I18N = {
  en: {
    title: 'AI Answer Accuracy & Ground-Truth Verification',
    subtitle: 'Every numerical claim in each AI advisory is audited and verified against real observed meteorological station data.',
    backBtn: '← Back to Chat Consultation',
    backBtnShort: '← Back to Chat',
    verifiedSummary: (pct, total) => `${pct}% of ${total} verified weather claims matched observed ground sensors`,
    empty: 'No consultations match this filter. Verified claims appear after the sensor observation window.',
    loading: 'Loading real-time meteorological accuracy audit…',
    tabUpcoming: '⏳ Upcoming (Pending)',
    tabDiverged: '⚠️ Diverged Only',
    tabAll: 'All Consultations',
    tabAccurate: '✓ Exact Matches',
    upcomingBadge: '⏳ Awaiting Observation',
    upcomingCardTitle: 'Active Observation Window (Locked for Audit)',
    upcomingTodayNote: 'Forecast logged. Minimum 12-hour observation window active before real ground sensor verification.',
    upcomingTomorrowNote: "Tomorrow's forecast logged. Verification runs after tomorrow concludes and IMD records synchronize.",
    upcomingWeeklyNote: '7-Day outlook logged. Verification runs after the complete weekly observation cycle finishes.',
    hoursRemainingText: (hrs) => `~${hrs} hours remaining until sensor audit window`,
    targetSensor: 'Target Sensor',
    pendingSync: 'Pending Sync',
    divergenceAnalysis: 'Divergence Analysis & Root Cause',
    question: 'User Question',
    aiSaid: 'AI Forecast',
    actual: 'Observed Sensor',
    delta: 'Delta (Δ)',
    status: 'Verdict',
    accurate: 'Accurate',
    close: 'Close',
    off: 'Off',
    diverged: 'Diverged',
    pending: 'Awaiting Sensor',
    claimLabels: {
      temperature: 'Temperature',
      rain_probability: 'Rain Chance',
      rain_mm: 'Rainfall',
      wind_speed: 'Wind Speed',
      humidity: 'Humidity',
      uv_index: 'UV Index',
      other: 'Observation',
      weather_outlook: 'General Outlook',
    },
  },
  hi: {
    title: 'AI उत्तर सटीकता एवं ज़मीनी सत्यापन ऑडिट',
    subtitle: 'प्रत्येक AI उत्तर में हर संख्यात्मक दावे को वास्तविक मौसम वेधशाला सेंसर डेटा से सत्यापित किया जाता है।',
    backBtn: '← वापस मुख्य चैट पर जाएं',
    backBtnShort: '← मुख्य चैट',
    verifiedSummary: (pct, total) => `${total} सत्यापित दावों में से ${pct}% वास्तविक वेधशाला सेंसर से मेल खाते हैं`,
    empty: 'इस फ़िल्टर में कोई प्रश्न नहीं है। वेधशाला सेंसर अवलोकन पूरा होने पर ऑडिट यहाँ दिखेगा।',
    loading: 'वास्तविक मौसम सटीकता ऑडिट लोड हो रहा है…',
    tabUpcoming: '⏳ आगामी / प्रतीक्षित (Upcoming)',
    tabDiverged: '⚠️ केवल भिन्न (Diverged)',
    tabAll: 'सभी प्रश्न',
    tabAccurate: '✓ सटीक मिलान',
    upcomingBadge: '⏳ अवलोकन प्रतीक्षित',
    upcomingCardTitle: 'अवलोकन अवधि सक्रिय (ऑडिट हेतु दर्ज)',
    upcomingTodayNote: 'पूर्वानुमान दर्ज है। वास्तविक ज़मीनी वेधशाला सेंसर से मिलान हेतु न्यूनतम 12 घंटे का डेटा आवश्यक है।',
    upcomingTomorrowNote: 'कल का पूर्वानुमान दर्ज है। कल का दिन पूरा होने एवं वेधशाला डेटा आने के बाद सत्यापन होगा।',
    upcomingWeeklyNote: '7-दिवसीय पूर्वानुमान दर्ज है। संपूर्ण सप्ताह समाप्त होने के बाद सत्यापन किया जाएगा।',
    hoursRemainingText: (hrs) => `वेधशाला ऑडिट में लगभग ${hrs} घंटे शेष`,
    targetSensor: 'लक्ष्य वेधशाला सेंसर',
    pendingSync: 'सत्यापन प्रतीक्षित',
    divergenceAnalysis: 'भिन्नता एवं मूल कारण विश्लेषण',
    question: 'उपयोगकर्ता का प्रश्न',
    aiSaid: 'AI पूर्वानुमान',
    actual: 'वास्तविक सेंसर',
    delta: 'अंतर (Δ)',
    status: 'स्थिति',
    accurate: 'सटीक',
    close: 'करीब',
    off: 'गलत',
    diverged: 'भिन्न',
    pending: 'अवलोकन प्रतीक्षित',
    claimLabels: {
      temperature: 'तापमान',
      rain_probability: 'वर्षा संभावना',
      rain_mm: 'वर्षा मात्रा',
      wind_speed: 'हवा गति',
      humidity: 'आर्द्रता',
      uv_index: 'UV सूचकांक',
      other: 'मौसम आंकड़ा',
      weather_outlook: 'मौसम स्थिति',
    },
  },
};

const SENSOR_TARGET_NAMES = {
  en: {
    temperature: 'IMD AWS Digital Thermometer (°C)',
    humidity: 'Hygrometer RH Sensor (%)',
    wind_speed: 'Sonic Anemometer (km/h)',
    rain_probability: 'Doppler Radar Precipitation Scan (%)',
    rain_mm: 'Tipping Bucket Rain Gauge (mm)',
    uv_index: 'Pyranometer Solar Radiation Sensor',
    weather_outlook: 'METAR Station Ground Observation',
    other: 'Automated Weather Station (AWS)',
  },
  hi: {
    temperature: 'IMD AWS डिजिटल थर्मामीटर (°C)',
    humidity: 'हाइग्रोमीटर आर्द्रता सेंसर (%)',
    wind_speed: 'सोनिक एनीमोमीटर वायुमापी (km/h)',
    rain_probability: 'डॉपलर मौसम रडार वर्षा स्कैन (%)',
    rain_mm: 'वेधशाला टिपिंग बकेट वर्षामापी (mm)',
    uv_index: 'पाइरानोमीटर सौर विकिरण सेंसर',
    weather_outlook: 'METAR स्टेशन ज़मीनी अवलोकन',
    other: 'स्वचालित मौसम केंद्र (AWS)',
  },
};

const STATUS_CONFIG = {
  accurate: { 
    dot: 'bg-emerald-500',  
    badge: 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-400/30 dark:text-emerald-300'  
  },
  diverged: { 
    dot: 'bg-amber-500', 
    badge: 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-500/15 dark:border-amber-400/30 dark:text-amber-300' 
  },
  close: { 
    dot: 'bg-amber-500', 
    badge: 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-500/15 dark:border-amber-400/30 dark:text-amber-300' 
  },
  off: { 
    dot: 'bg-rose-500',    
    badge: 'bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-500/15 dark:border-rose-400/30 dark:text-rose-300'        
  },
  pending: { 
    dot: 'bg-indigo-500 animate-pulse', 
    badge: 'bg-indigo-50 border-indigo-300 text-indigo-800 dark:bg-indigo-500/15 dark:border-indigo-400/30 dark:text-indigo-300' 
  },
};

export default function ChatAccuracyView({ onBack }) {
  const { state } = useApp();
  const [data, setData] = useState({ totalVerified: 0, accuratePercent: 0, accurateCount: 0, divergedCount: 0, upcomingCount: 0, totalQuestions: 0, feed: [] });
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('upcoming');
  const [expandedId, setExpandedId] = useState(null);

  const lang = ACCURACY_I18N[state.language] || ACCURACY_I18N['en'];
  const isHi = ['hi', 'mr', 'pa', 'gu', 'or', 'ur'].includes(state.language);

  useEffect(() => {
    let isMounted = true;
    const fetchFeed = async () => {
      try {
        const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
        const res = await fetch(`${baseUrl}/api/chat-accuracy`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted) setData(json);
        }
      } catch (e) {
        console.error('Failed to load chat accuracy feed', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchFeed();
    const timer = setInterval(fetchFeed, 12000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  const feed = Array.isArray(data.feed) ? data.feed : [];
  const upcomingCount = data.upcomingCount ?? feed.filter(f => !f.verified).length;
  const divergedCount = data.divergedCount ?? feed.filter(f => f.verified && (f.hasDivergence || f.accuracyStatus === 'diverged' || f.accuracyStatus === 'off' || f.accuracyStatus === 'close')).length;
  const accurateCount = data.accurateCount ?? feed.filter(f => f.verified && !f.hasDivergence && f.accuracyStatus === 'accurate').length;
  const totalVerified = data.totalVerified ?? (accurateCount + divergedCount);
  const accuratePercent = data.accuratePercent ?? (totalVerified > 0 ? Math.round((accurateCount / totalVerified) * 100) : 100);

  const filteredFeed = feed.filter(item => {
    if (filterTab === 'upcoming') {
      return !item.verified;
    }
    if (filterTab === 'diverged') {
      return item.verified && (item.hasDivergence || item.accuracyStatus === 'diverged' || item.accuracyStatus === 'off' || item.accuracyStatus === 'close');
    }
    if (filterTab === 'accurate') {
      return item.verified && !item.hasDivergence && item.accuracyStatus === 'accurate';
    }
    return true;
  });

  return (
    <div className="w-full max-w-4xl mx-auto py-4 sm:py-6 px-3 sm:px-4 animate-fade-in select-none">
      
      {/* ── Top Navigation & Back Action ── */}
      <div className="mb-5 pb-4 border-b border-[var(--theme-border)]">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="hidden sm:inline">{lang.backBtn}</span>
            <span className="sm:hidden">{lang.backBtnShort}</span>
          </button>

          {/* Live Ground-Truth Crest */}
          <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            IMD Ground-Truth
          </span>
        </div>

        <h2 className="text-lg sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
          {lang.title}
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-normal leading-relaxed">
          {lang.subtitle}
        </p>
      </div>

      {/* ── Accuracy Hero Metric Card ── */}
      <div className="p-3.5 sm:p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--theme-border)] shadow-sm mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight">
                {totalVerified > 0 ? `${accuratePercent}%` : '100%'}
              </span>
              <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                Verified Sensor Agreement
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {lang.verifiedSummary(accuratePercent, totalVerified)}
            </p>
          </div>

          <div className="grid grid-cols-2 xs:grid-cols-4 gap-1.5 sm:flex sm:items-center sm:gap-2 w-full sm:w-auto">
            <div className="px-2 sm:px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-700 dark:text-indigo-300 text-xs font-bold text-center">
              <div>⏳ {upcomingCount}</div>
              <div className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold opacity-80">{state.language === 'hi' ? 'प्रतीक्षित' : 'Upcoming'}</div>
            </div>
            <div className="px-2 sm:px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-bold text-center">
              <div>✓ {accurateCount}</div>
              <div className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold opacity-80">{state.language === 'hi' ? 'सटीक' : 'Exact'}</div>
            </div>
            <div className="px-2 sm:px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-bold text-center">
              <div>⚠️ {divergedCount}</div>
              <div className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold opacity-80">{state.language === 'hi' ? 'भिन्न' : 'Diverged'}</div>
            </div>
            <div className="px-2 sm:px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 border border-[var(--theme-border)] text-[var(--text-primary)] text-xs font-bold text-center">
              <div>{feed.length}</div>
              <div className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold opacity-80">{state.language === 'hi' ? 'कुल प्रश्न' : 'Total'}</div>
            </div>
          </div>
        </div>

        {/* Visual Dual Distribution Bar */}
        <div className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden flex">
          <div 
            className="bg-emerald-500 dark:bg-emerald-400 h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.max(accuratePercent, 5)}%` }}
          />
          {divergedCount > 0 && (
            <div 
              className="bg-amber-500 dark:bg-amber-400 h-full rounded-full transition-all duration-700"
              style={{ width: `${100 - accuratePercent}%` }}
            />
          )}
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
        {/* 1. Upcoming / Pending Verification Tab */}
        <button
          onClick={() => setFilterTab('upcoming')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            filterTab === 'upcoming'
              ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/40'
              : 'bg-[var(--glass-bg)] hover:bg-white/10 text-[var(--text-secondary)] border border-[var(--theme-border)]'
          }`}
        >
          <span>{lang.tabUpcoming}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-white font-bold">
            {upcomingCount}
          </span>
        </button>

        {/* 2. Diverged Tab */}
        <button
          onClick={() => setFilterTab('diverged')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            filterTab === 'diverged'
              ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-400/40'
              : 'bg-[var(--glass-bg)] hover:bg-white/10 text-[var(--text-secondary)] border border-[var(--theme-border)]'
          }`}
        >
          <span>{lang.tabDiverged}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-white font-bold">
            {divergedCount}
          </span>
        </button>

        {/* 3. Exact Matches Tab */}
        <button
          onClick={() => setFilterTab('accurate')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            filterTab === 'accurate'
              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/40'
              : 'bg-[var(--glass-bg)] hover:bg-white/10 text-[var(--text-secondary)] border border-[var(--theme-border)]'
          }`}
        >
          <span>{lang.tabAccurate}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-white font-bold">
            {accurateCount}
          </span>
        </button>

        {/* 4. All Questions Tab */}
        <button
          onClick={() => setFilterTab('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            filterTab === 'all'
              ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-400/40'
              : 'bg-[var(--glass-bg)] hover:bg-white/10 text-[var(--text-secondary)] border border-[var(--theme-border)]'
          }`}
        >
          <span>{lang.tabAll}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-white font-bold">
            {feed.length}
          </span>
        </button>
      </div>

      {/* ── Feed List ── */}
      {loading ? (
        <div className="py-12 text-center text-xs text-[var(--text-secondary)]">
          <div className="w-8 h-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin mx-auto mb-3" />
          <p>{lang.loading}</p>
        </div>
      ) : filteredFeed.length === 0 ? (
        <div className="py-12 px-4 text-center rounded-2xl border border-[var(--theme-border)] bg-[var(--card-bg)]">
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
            {lang.empty}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            Verified ground sensor observations refresh automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredFeed.map((item) => {
            const isExpanded = expandedId === (item.id || item._id);
            const overall = item.verified ? (item.accuracyStatus || 'unknown') : 'pending';
            const s = STATUS_CONFIG[overall] || STATUS_CONFIG.pending;
            const claims = Array.isArray(item.claims) ? item.claims : [];
            const dateStr = item.loggedAt ? new Date(item.loggedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : item.date;

            return (
              <div 
                key={item.id || item._id}
                className="rounded-xl sm:rounded-2xl border border-[var(--theme-border)] bg-[var(--card-bg)] hover:border-sky-500/30 transition-all p-3 sm:p-5 shadow-xs"
              >
                {/* Header Row: Location, Date, Status */}
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold text-[var(--text-secondary)]">
                    {item.location && <span>📍 {item.location}</span>}
                    <span>•</span>
                    <span>{dateStr}</span>
                    {item.observationWindowText ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
                        <span>⏱️</span>
                        <span>{item.observationWindowText}</span>
                      </span>
                    ) : item.horizonLabel ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                        {item.horizonLabel}
                      </span>
                    ) : null}
                  </div>

                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border ${s.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    {!item.verified ? (lang.upcomingBadge || 'Awaiting Observation') : (lang[overall] || overall)}
                  </span>
                </div>

                {/* User Question */}
                <div className="p-2.5 sm:p-3 rounded-xl bg-black/5 dark:bg-white/[0.03] border border-[var(--theme-border)] mb-2.5 sm:mb-3">
                  <div className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold text-sky-600 dark:text-sky-400 mb-0.5">
                    {lang.question}
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] leading-snug">
                    "{item.question}"
                  </p>
                </div>

                {/* ── BRANCH: Upcoming (Awaiting Observation Window) vs Verified ── */}
                {!item.verified ? (
                  <>
                    {/* Active Observation Window Banner */}
                    <div className="p-3 sm:p-3.5 rounded-xl bg-indigo-500/[0.08] dark:bg-indigo-950/25 border border-indigo-500/25 mb-3">
                      <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200">
                          <span className="text-sm">⏳</span>
                          <span>{lang.upcomingCardTitle}</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                          {lang.hoursRemainingText(item.hoursRemaining || 12)}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                        {item.predictionHorizon === 'weekly' 
                          ? lang.upcomingWeeklyNote 
                          : item.predictionHorizon === 'tomorrow' 
                          ? lang.upcomingTomorrowNote 
                          : lang.upcomingTodayNote}
                      </p>
                    </div>

                    {/* Claims Locked for Upcoming Ground Verification */}
                    {claims.length > 0 && (
                      <div className="rounded-xl border border-[var(--theme-border)] overflow-x-auto mb-3 scrollbar-thin">
                        <table className="w-full text-left text-xs min-w-[380px] sm:min-w-full">
                          <thead className="bg-black/5 dark:bg-white/[0.04] text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] border-b border-[var(--theme-border)]">
                            <tr>
                              <th className="py-2 px-2.5 sm:px-3">Metric</th>
                              <th className="py-2 px-2.5 sm:px-3 text-right">{lang.aiSaid}</th>
                              <th className="py-2 px-2.5 sm:px-3 text-right">{lang.targetSensor}</th>
                              <th className="py-2 px-2.5 sm:px-3 text-right">{lang.status}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--theme-border)] font-medium">
                            {claims.map((c, cIdx) => {
                              const unit = c.unit || '';
                              const sensorDict = isHi ? SENSOR_TARGET_NAMES.hi : SENSOR_TARGET_NAMES.en;
                              const sensorName = sensorDict[c.claimType] || sensorDict.other;
                              return (
                                <tr key={cIdx} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                                  <td className="py-2 px-2.5 sm:px-3 font-semibold text-[var(--text-primary)]">
                                    {lang.claimLabels[c.claimType] || c.claimType || 'Stat'}
                                  </td>
                                  <td className="py-2 px-2.5 sm:px-3 text-right font-extrabold text-amber-700 dark:text-amber-400">
                                    {c.claimValue != null ? `${c.claimValue}${unit}` : '—'}
                                  </td>
                                  <td className="py-2 px-2.5 sm:px-3 text-right text-[11px] text-[var(--text-secondary)] font-medium">
                                    {sensorName}
                                  </td>
                                  <td className="py-2 px-2.5 sm:px-3 text-right">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                      {lang.pendingSync}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Verified Claims Table */}
                    {claims.length > 0 && (
                      <div className="rounded-xl border border-[var(--theme-border)] overflow-x-auto mb-3 scrollbar-thin">
                        <table className="w-full text-left text-xs min-w-[440px] sm:min-w-full">
                          <thead className="bg-black/5 dark:bg-white/[0.04] text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] border-b border-[var(--theme-border)]">
                            <tr>
                              <th className="py-2 px-2.5 sm:px-3">Metric</th>
                              <th className="py-2 px-2.5 sm:px-3 text-right">{lang.aiSaid}</th>
                              <th className="py-2 px-2.5 sm:px-3 text-right">{lang.actual}</th>
                              <th className="py-2 px-2.5 sm:px-3 text-right">{lang.delta}</th>
                              <th className="py-2 px-2.5 sm:px-3 text-right">{lang.status}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--theme-border)] font-medium">
                            {claims.map((c, cIdx) => {
                              const unit = c.unit || '';
                              const isDiv = c.accuracyStatus === 'diverged' || c.accuracyStatus === 'off' || c.accuracyStatus === 'close';
                              return (
                                <tr key={cIdx} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                                  <td className="py-2 px-2.5 sm:px-3 font-semibold text-[var(--text-primary)]">
                                    {lang.claimLabels[c.claimType] || c.claimType || 'Stat'}
                                  </td>
                                  <td className="py-2 px-2.5 sm:px-3 text-right font-bold text-amber-700 dark:text-amber-400">
                                    {c.claimValue != null ? `${c.claimValue}${unit}` : '—'}
                                  </td>
                                  <td className="py-2 px-2.5 sm:px-3 text-right font-bold text-emerald-700 dark:text-emerald-400">
                                    {c.actualValue != null ? `${c.actualValue}${unit}` : '—'}
                                  </td>
                                  <td className={`py-2 px-2.5 sm:px-3 text-right font-bold ${isDiv ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                                    {c.deltaSign || (c.actualValue != null ? '0 (Exact)' : '—')}
                                  </td>
                                  <td className="py-2 px-2.5 sm:px-3 text-right">
                                    <span className={`text-[10px] font-bold uppercase ${isDiv ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                      {lang[c.accuracyStatus] || c.accuracyStatus || '—'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Divergence Root Cause Summary or Exact Match Note */}
                    {item.divergenceSummary ? (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-900 dark:text-amber-200 mb-2 font-medium">
                        <span className="font-bold">⚠️ Root Cause: </span>
                        <span>{item.divergenceSummary}</span>
                      </div>
                    ) : item.accuracyStatus === 'accurate' ? (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-800 dark:text-emerald-300 mb-2 font-medium flex items-center gap-1.5">
                        <span>✓</span>
                        <span>All forecast metrics matched ground meteorological observations within sensor tolerances.</span>
                      </div>
                    ) : null}
                  </>
                )}

                {/* AI Full Answer Expand Toggle */}
                {item.answerText && (
                  <div>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : (item.id || item._id))}
                      className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>{isExpanded ? 'Hide Full AI Answer ▲' : 'View Full AI Answer ▼'}</span>
                    </button>
                    {isExpanded && (
                      <div className="mt-2 p-3 rounded-xl bg-black/5 dark:bg-white/[0.02] border border-[var(--theme-border)] text-xs text-[var(--text-secondary)] font-normal leading-relaxed">
                        {item.answerText}
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
