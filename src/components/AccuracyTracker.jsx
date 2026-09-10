import React, { useEffect, useState, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Localised strings — kept self-contained so no translation file is touched
// ---------------------------------------------------------------------------
const I18N = {
  en: {
    title:        'AI Answer Accuracy',
    desc:         'Every quantifiable claim in each AI answer is tracked and verified against real observed weather.',
    empty:        'No verified answers yet. Data appears after the first 24 hours of operation.',
    loading:      'Loading accuracy feed…',
    accurate:     'Accurate',
    close:        'Close',
    off:          'Off',
    diverged:     'Diverged',
    unknown:      'Unknown',
    pending:      'Pending',
    details:      'Details & Divergence Audit',
    question:     'Question',
    aiAnswer:     'AI Answer',
    aiSaid:       'AI Said',
    actual:       'Actual',
    claims:       'Claims & Divergence Verified',
    divergenceCol:'Divergence (Δ)',
    divergenceAnalysis: 'Divergence Analysis & Root Cause',
    tabDiverged:  '⚠️ Diverged Only (Inaccurate)',
    tabAll:       'All Questions',
    tabAccurate:  '✓ Exact Matches',
    noAnswer:     'Full answer not available for this entry.',
    showMore:     (count) => `View ${count} More Questions`,
    showLess:     'Show Less',
    claimLabels: {
      rain_probability: 'Rain Chance',
      rain_mm:          'Rainfall',
      wind_speed:       'Wind Speed',
      humidity:         'Humidity',
      uv_index:         'UV Index',
      other:            'Stat',
    },
    units: {
      rain_probability: '%',
      rain_mm:          ' mm',
      wind_speed:       ' km/h',
      humidity:         '%',
      uv_index:         '',
      other:            '',
    },
  },
  hi: {
    title:        'AI उत्तर सटीकता',
    desc:         'प्रत्येक AI उत्तर में हर संख्यात्मक दावे को वास्तविक मौसम से सत्यापित किया जाता है।',
    empty:        'अभी कोई सत्यापित उत्तर नहीं है। 24 घंटे के बाद डेटा उपलब्ध होगा।',
    loading:      'सटीकता फ़ीड लोड हो रहा है…',
    accurate:     'सटीक',
    close:        'करीब',
    off:          'गलत',
    diverged:     'अंतर (Diverged)',
    unknown:      'अज्ञात',
    pending:      'लंबित',
    details:      'विवरण एवं भिन्नता ऑडिट',
    question:     'प्रश्न',
    aiAnswer:     'AI उत्तर',
    aiSaid:       'AI ने कहा',
    actual:       'वास्तविक',
    claims:       'सत्यापित दावे एवं अंतर',
    divergenceCol:'अंतर (Δ)',
    divergenceAnalysis: 'भिन्नता एवं मूल कारण विश्लेषण',
    tabDiverged:  '⚠️ केवल भिन्न (Inaccurate)',
    tabAll:       'सभी प्रश्न',
    tabAccurate:  '✓ सटीक मिलान',
    noAnswer:     'इस एंट्री के लिए पूर्ण उत्तर उपलब्ध नहीं है।',
    showMore:     (count) => `अन्य ${count} प्रश्न देखें`,
    showLess:     'कम दिखाएं',
    claimLabels: {
      rain_probability: 'वर्षा संभावना',
      rain_mm:          'वर्षा',
      wind_speed:       'हवा गति',
      humidity:         'आर्द्रता',
      uv_index:         'UV सूचकांक',
      other:            'आंकड़ा',
    },
    units: {
      rain_probability: '%',
      rain_mm:          ' मिमी',
      wind_speed:       ' किमी/घंटा',
      humidity:         '%',
      uv_index:         '',
      other:            '',
    },
  },
  bn: {
    title:        'AI উত্তর নির্ভুলতা',
    desc:         'প্রতিটি AI উত্তরে প্রতিটি পরিমাপযোগ্য দাবি বাস্তব আবহাওয়ার বিপরীতে যাচাই করা হয়।',
    empty:        'এখনো কোনো যাচাইকৃত উত্তর নেই। ২৪ ঘণ্টার পর ডেটা আসবে।',
    loading:      'নির্ভুলতা ফিড লোড হচ্ছে…',
    accurate:     'সঠিক',
    close:        'কাছাকাছি',
    off:          'ভুল',
    diverged:     'পার্থক্যযুক্ত',
    unknown:      'অজানা',
    pending:      'অপেক্ষমাণ',
    details:      'বিশদ ও পার্থক্য নিরীক্ষা',
    question:     'প্রশ্ন',
    aiAnswer:     'AI উত্তর',
    aiSaid:       'AI বলেছে',
    actual:       'প্রকৃত',
    claims:       'যাচাইকৃত দাবি ও পার্থক্য',
    divergenceCol:'পার্থক্য (Δ)',
    divergenceAnalysis: 'পার্থক্য ও কারণ বিশ্লেষণ',
    tabDiverged:  '⚠️ শুধু পার্থক্যযুক্ত',
    tabAll:       'সকল প্রশ্ন',
    tabAccurate:  '✓ সঠিক মিল',
    noAnswer:     'এই এন্ট্রির জন্য পূর্ণ উত্তর পাওয়া যায়নি।',
    showMore:     (count) => `আরও ${count}টি প্রশ্ন দেখুন`,
    showLess:     'কম দেখান',
    claimLabels: {
      rain_probability: 'বৃষ্টির সম্ভাবনা',
      rain_mm:          'বৃষ্টিপাত',
      wind_speed:       'বায়ু গতি',
      humidity:         'আর্দ্রতা',
      uv_index:         'UV সূচক',
      other:            'পরিসংখ্যান',
    },
    units: {
      rain_probability: '%',
      rain_mm:          ' মিমি',
      wind_speed:       ' কিমি/ঘণ্টা',
      humidity:         '%',
      uv_index:         '',
      other:            '',
    },
  },
  as: {
    title:        'AI উত্তৰৰ সঠিকতা',
    desc:         'প্ৰতিটো AI উত্তৰত প্ৰতিটো পৰিমাপযোগ্য দাবী প্ৰকৃত বতৰৰ বিপৰীতে পৰীক্ষা কৰা হয়।',
    empty:        'এতিয়ালৈকে কোনো প্ৰমাণিত উত্তৰ নাই। ২৪ ঘণ্টাৰ পাছত তথ্য আহিব।',
    loading:      'সঠিকতা ফিড ল\'ড হৈ আছে…',
    accurate:     'সঠিক',
    close:        'ওচৰৰ',
    off:          'ভুল',
    diverged:     'পাৰ্থক্যযুক্ত',
    unknown:      'অজানা',
    pending:      'বাকী',
    details:      'বিৱৰণ আৰু পাৰ্থক্য পৰীক্ষণ',
    question:     'প্ৰশ্ন',
    aiAnswer:     'AI উত্তৰ',
    aiSaid:       'AI এ কৈছে',
    actual:       'প্ৰকৃত',
    claims:       'প্ৰমাণিত দাবী আৰু পাৰ্থক্য',
    divergenceCol:'পাৰ্থক্য (Δ)',
    divergenceAnalysis: 'পাৰ্থক্য আৰু কাৰণ বিশ্লেষণ',
    tabDiverged:  '⚠️ কেৱল পাৰ্থক্যযুক্ত',
    tabAll:       'সকলো প্ৰশ্ন',
    tabAccurate:  '✓ সঠিক মিল',
    noAnswer:     `এই এণ্ট্ৰিৰ বাবে সম্পূৰ্ণ উত্তৰ পোৱা নগ\u2019ল।`,
    showMore:     (count) => `আৰু ${count}টা প্ৰশ্ন চাওক`,
    showLess:     'কম দেখুৱাওক',
    claimLabels: {
      rain_probability: 'বৰষুণৰ সম্ভাৱনা',
      rain_mm:          'বৰষুণ',
      wind_speed:       'বতাহৰ গতি',
      humidity:         'আৰ্দ্ৰতা',
      uv_index:         'UV সূচক',
      other:            'পৰিসংখ্যা',
    },
    units: {
      rain_probability: '%',
      rain_mm:          ' মিমি',
      wind_speed:       ' কিমি/ঘণ্টা',
      humidity:         '%',
      uv_index:         '',
      other:            '',
    },
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const statusStyles = {
  accurate: { 
    dot: 'bg-emerald-500',  
    text: 'text-emerald-800 dark:text-emerald-400 font-bold',  
    badge: 'bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-500/15 dark:border-emerald-400/30 dark:text-emerald-300'  
  },
  diverged: { 
    dot: 'bg-amber-500', 
    text: 'text-amber-800 dark:text-amber-400 font-bold', 
    badge: 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-500/15 dark:border-amber-400/30 dark:text-amber-300' 
  },
  close: { 
    dot: 'bg-amber-500', 
    text: 'text-amber-800 dark:text-amber-400 font-bold', 
    badge: 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-500/15 dark:border-amber-400/30 dark:text-amber-300' 
  },
  off: { 
    dot: 'bg-rose-500',    
    text: 'text-rose-800 dark:text-rose-400 font-bold',    
    badge: 'bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-500/15 dark:border-rose-400/30 dark:text-rose-300'        
  },
  unknown: { 
    dot: 'bg-slate-400 dark:bg-white/30',   
    text: 'text-slate-700 dark:text-white/40 font-bold',   
    badge: 'bg-slate-100 border-slate-300 text-slate-800 dark:bg-white/5 dark:border-white/10 dark:text-white/40'           
  },
  pending: { 
    dot: 'bg-sky-600 dark:bg-blue-400 animate-pulse', 
    text: 'text-sky-950 dark:text-blue-300 font-bold', 
    badge: 'bg-sky-100 border-sky-300 text-sky-950 dark:bg-blue-500/15 dark:border-blue-500/30 dark:text-blue-300 font-bold' 
  },
};

function StatusBadge({ status, label }) {
  const s = statusStyles[status] || statusStyles.unknown;
  return (
    <span className={`inline-flex items-center gap-1.5 border px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide shadow-sm ${s.badge}`}>
      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
      {label}
    </span>
  );
}

function ClaimRow({ claim, t }) {
  const label = t.claimLabels[claim.claimType] || t.claimLabels.other;
  const unit  = t.units[claim.claimType] ?? '';
  const isDiverged = claim.accuracyStatus === 'diverged' || claim.accuracyStatus === 'off' || claim.accuracyStatus === 'close';
  const s     = claim.accuracyStatus ? (statusStyles[claim.accuracyStatus] || statusStyles.unknown) : statusStyles.unknown;

  const fmtVal = (v) => v != null ? `${v}${unit}` : '—';

  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--theme-border)] last:border-0 gap-2 text-xs">
      <span className="font-semibold text-[var(--text-primary)] w-28 shrink-0">{label}</span>
      <span className="font-bold text-amber-700 dark:text-amber-300 w-16 text-right">{fmtVal(claim.claimValue)}</span>
      <span className="text-[var(--text-secondary)] text-xs">→</span>
      <span className={`font-bold w-16 text-right ${s.text}`}>{fmtVal(claim.actualValue)}</span>
      <span className={`font-black w-24 text-right ${claim.actualValue == null ? 'text-[var(--text-secondary)]' : isDiverged ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
        {claim.deltaSign ? `${claim.deltaSign}${claim.deltaPct != null ? ` (${claim.delta > 0 ? '+' : ''}${claim.deltaPct}%)` : ''}` : (claim.actualValue != null ? '0 (Exact)' : '—')}
      </span>
      <span className={`font-extrabold uppercase w-16 text-right text-[11px] ${s.text}`}>
        {t[claim.accuracyStatus] || claim.accuracyStatus || '—'}
      </span>
    </div>
  );
}

function AccuracyCard({ item, t }) {
  const [open, setOpen] = useState(false);

  const overall   = item.verified ? (item.accuracyStatus || 'unknown') : 'pending';
  const s         = statusStyles[overall] || statusStyles.unknown;
  const dateLabel = item.loggedAt
    ? new Date(item.loggedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    : new Date(item.date).toLocaleDateString();

  const rawClaims = Array.isArray(item.claims) ? item.claims : [];
  const claims = rawClaims.map(c => {
    const val = c.actualValue ?? (item.actualValue != null && (c.claimType === item.claimType || rawClaims.length === 1) ? item.actualValue : null);
    const status = c.accuracyStatus || (val != null ? (item.accuracyStatus || 'accurate') : null);
    return { ...c, actualValue: val, accuracyStatus: status };
  });
  const hasClaims   = claims.length > 0;
  const hasAnswer   = !!item.answerText;

  const overallLabel = t[overall] || overall;

  return (
    <div className="glass-panel rounded-2xl border border-[var(--theme-border)] shadow-sm hover:shadow-md transition-all overflow-hidden mb-3">
      {/* ── Card Header ── */}
      <div className="p-4 sm:p-5">
        {/* Top row: date + status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-xs font-medium">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span className="font-semibold">{dateLabel}</span>
            {item.location && item.location !== 'Unknown' && (
              <span className="opacity-60">· {item.location}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {item.horizonLabel && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 shadow-sm">
                <span>📅</span>
                <span>{item.horizonLabel}</span>
              </span>
            )}
            <StatusBadge status={overall} label={`${overall === 'diverged' ? '⚠️ ' : ''}${overallLabel}`} />
          </div>
        </div>

        {/* Question (Bold & Crisp) */}
        <div className="mb-3 pl-3.5 pr-3 py-2.5 rounded-xl border border-blue-500/25 bg-blue-500/10 shadow-sm">
          <span className="text-blue-700 dark:text-blue-400 text-[10px] uppercase tracking-wider font-black block mb-1">{t.question}</span>
          <p className="font-bold text-[var(--text-primary)] text-sm sm:text-[15px] leading-snug">"{item.question}"</p>
        </div>

        {/* Quick claims summary (inline chips) with Divergence Delta */}
        {hasClaims && (
          <div className="flex flex-wrap gap-1.5">
            {claims.map((c, idx) => {
              const lbl  = t.claimLabels[c.claimType] || t.claimLabels.other;
              const unit = t.units[c.claimType] ?? '';
              const isDiverged = c.accuracyStatus === 'diverged' || c.accuracyStatus === 'off' || c.accuracyStatus === 'close';
              const cs   = c.accuracyStatus ? (statusStyles[c.accuracyStatus] || statusStyles.pending) : statusStyles.pending;
              return (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1.5 border px-3 py-1 rounded-full text-[11px] font-extrabold shadow-sm ${cs.badge}`}
                >
                  <span>{lbl}: {c.claimValue}{unit}</span>
                  {c.actualValue != null && (
                    <>
                      <span>→</span>
                      <span className={cs.text}>{c.actualValue}{unit}</span>
                      {c.deltaSign && (
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${isDiverged ? 'bg-amber-500/20 text-amber-900 dark:text-amber-200' : 'bg-emerald-500/20 text-emerald-900 dark:text-emerald-200'}`}>
                          Δ {c.deltaSign}{c.deltaPct != null ? ` (${c.delta > 0 ? '+' : ''}${c.deltaPct}%)` : ''}
                        </span>
                      )}
                    </>
                  )}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Expandable Details Toggle ── */}
      {(hasClaims || hasAnswer) && (
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 sm:px-5 py-2.5 border-t border-[var(--theme-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)] transition-colors text-xs font-bold uppercase tracking-wider"
        >
          <span className="flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6"/>
            </svg>
            {t.details}
          </span>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      )}

      {/* ── Expanded Details Panel ── */}
      {open && (
        <div className="border-t border-[var(--theme-border)] px-4 sm:px-5 pb-4 pt-3 space-y-4 bg-[var(--card-bg)]">

          {/* All-claims table */}
          {hasClaims && (
            <div>
              <p className="text-[11px] uppercase tracking-wider font-extrabold text-[var(--text-secondary)] mb-2">{t.claims}</p>
              <div className="rounded-xl border border-[var(--theme-border)] px-3 py-1 bg-[var(--glass-bg)] shadow-sm">
                {/* Column headers */}
                <div className="flex items-center justify-between py-1.5 border-b border-[var(--theme-border)] mb-1 gap-2">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-[var(--text-secondary)] w-28">Metric</span>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-[var(--text-secondary)] w-16 text-right">{t.aiSaid}</span>
                  <span className="w-4" />
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-[var(--text-secondary)] w-16 text-right">{t.actual}</span>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-[var(--text-secondary)] w-24 text-right">{t.divergenceCol}</span>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-[var(--text-secondary)] w-16 text-right">Status</span>
                </div>
                {claims.map((c, idx) => <ClaimRow key={idx} claim={c} t={t} />)}
              </div>
            </div>
          )}

          {/* Divergence & Ground Truth Audit Box */}
          {item.verified && (
            <div className={`p-3.5 rounded-2xl border ${item.hasDivergence || overall === 'diverged' || overall === 'off' ? 'border-amber-400/40 bg-amber-500/10 dark:bg-amber-950/20' : 'border-emerald-400/30 bg-emerald-500/10'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{item.hasDivergence || overall === 'diverged' || overall === 'off' ? '🔍' : '✓'}</span>
                <p className="text-[12px] font-black uppercase tracking-wider text-[var(--text-primary)]">
                  {item.hasDivergence || overall === 'diverged' || overall === 'off' ? (t.divergenceAnalysis || 'Divergence Analysis & Root Cause Audit') : 'Observed Alignment Audit'}
                </p>
              </div>

              {item.hasDivergence || overall === 'diverged' || overall === 'off' ? (
                <div className="space-y-2 text-xs">
                  {claims.filter(c => c.accuracyStatus !== 'accurate').map((c, i) => (
                    <div key={i} className="pl-3 border-l-2 border-amber-500/60 dark:border-amber-400/60 py-0.5">
                      <p className="font-extrabold text-amber-900 dark:text-amber-300">
                        {t.claimLabels[c.claimType] || c.claimType}: Stated {c.claimValue}{t.units[c.claimType] || ''} vs Observed {c.actualValue}{t.units[c.claimType] || ''} (Δ {c.deltaSign || '—'}{c.deltaPct != null ? `, ${c.delta > 0 ? '+' : ''}${c.deltaPct}%` : ''})
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mt-0.5">
                        {c.divergenceReason || `AI prediction diverged by ${c.deltaSign || 'variance'} from station records.`}
                      </p>
                    </div>
                  ))}
                  <p className="text-[10px] text-[var(--text-secondary)] opacity-80 italic pt-1 border-t border-amber-500/20">
                    * WeatherGPT Radical Transparency: Every forecast difference is openly cataloged with meteorological causality.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                  ✓ High-Precision Match: All quantifiable forecast claims matched ground station observations within instrument tolerance limits.
                </p>
              )}
            </div>
          )}

          {/* Full AI answer text */}
          {hasAnswer && (
            <div>
              <p className="text-[11px] uppercase tracking-wider font-extrabold text-[var(--text-secondary)] mb-2">{t.aiAnswer}</p>
              <div className="rounded-xl border border-[var(--theme-border)] p-3.5 bg-[var(--glass-bg)] shadow-inner">
                <p className="text-[var(--text-primary)] text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap font-medium">{item.answerText}</p>
              </div>
            </div>
          )}

          {/* Horizon Verification Info */}
          {!item.verified ? (
            <div className="flex items-start gap-2.5 p-3 bg-blue-500/10 rounded-xl border border-blue-500/25 text-blue-900 dark:text-blue-200 text-xs">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div className="space-y-0.5">
                <p className="font-extrabold text-[12px]">
                  Target Window: {item.timeHorizon === 'weekly' ? `${item.targetDate} → ${item.targetEndDate} (7 Days)` : (item.targetDate || item.date)}
                </p>
                <p className="text-[11px] opacity-90 leading-normal">
                  {item.timeHorizon === 'tomorrow'
                    ? `Verification scheduled for ${item.verifyAfter} (after tomorrow concludes) against observed ground truth.`
                    : item.timeHorizon === 'weekly'
                    ? `Verification scheduled for ${item.verifyAfter} (aggregating rainfall sum, peak gusts, and UV across the full week).`
                    : `Verification scheduled for ${item.verifyAfter} (after the 24h period concludes) against Open-Meteo recorded data.`}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/25 text-emerald-900 dark:text-emerald-300 text-xs font-semibold">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0 text-emerald-600 dark:text-emerald-400">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span>Verified against actual recorded weather {item.verifiedAt ? `on ${new Date(item.verifiedAt).toLocaleDateString()}` : ''}.</span>
            </div>
          )}

          {!hasClaims && !hasAnswer && (
            <p className="text-[var(--text-secondary)] text-xs italic">{t.noAnswer}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------
export default function AccuracyTracker({ locationName, language }) {
  const t = I18N[language] || I18N['en'];
  const [feed,    setFeed]    = useState([]);
  const [stats,   setStats]   = useState({ totalVerified: 0, accuratePercent: 0 });
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [filterTab, setFilterTab] = useState('diverged'); // 'diverged' | 'all' | 'accurate'

  const fetchFeed = useCallback(() => {
    const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
    const loc     = locationName ? `?location=${encodeURIComponent(locationName)}` : '';
    fetch(`${baseUrl}/api/chat-accuracy${loc}`)
      .then(r => r.json())
      .then(json => {
        setFeed(json.feed || []);
        setStats({ totalVerified: json.totalVerified || 0, accuratePercent: json.accuratePercent || 0 });
      })
      .catch(err => console.error('AccuracyTracker fetch failed:', err))
      .finally(() => setLoading(false));
  }, [locationName]);

  useEffect(() => {
    if (!locationName) return;
    setLoading(true);
    fetchFeed();
  }, [locationName, fetchFeed]);

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="glass-panel border border-white/10 rounded-2xl p-6 shadow-xl mt-6 mb-6 animate-pulse min-h-[200px]">
        <div className="h-5 bg-white/10 rounded w-1/3 mb-3" />
        <div className="h-3 bg-white/10 rounded w-1/2 mb-6" />
        <div className="space-y-3">
          <div className="h-24 bg-white/10 rounded-2xl" />
          <div className="h-24 bg-white/10 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (feed.length === 0) return null;

  const divergedCount = feed.filter(f => f.hasDivergence || f.accuracyStatus === 'diverged' || f.accuracyStatus === 'off' || f.accuracyStatus === 'close').length;
  const accurateCount = feed.filter(f => !f.hasDivergence && f.accuracyStatus === 'accurate').length;

  const filteredFeed = feed.filter(item => {
    if (filterTab === 'diverged') {
      return item.hasDivergence || item.accuracyStatus === 'diverged' || item.accuracyStatus === 'off' || item.accuracyStatus === 'close';
    }
    if (filterTab === 'accurate') {
      return !item.hasDivergence && item.accuracyStatus === 'accurate';
    }
    return true;
  });

  const visibleFeed = showAll ? filteredFeed : filteredFeed.slice(0, 3);
  const hasMore = filteredFeed.length > 3;

  return (
    <div className="glass-panel border border-white/10 rounded-2xl p-4 sm:p-6 shadow-xl mt-6 mb-6 sm:mb-8 transition-colors">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <div>
          <h2 className="text-white/90 font-bold text-lg tracking-wide flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            {t.title}
          </h2>
          <p className="text-white/50 text-xs sm:text-sm mt-1">{t.desc}</p>
        </div>
        {stats.totalVerified > 0 && (
          <div className="flex flex-col items-end shrink-0">
            <div className="text-2xl font-bold text-amber-400">{divergedCount} Diverged</div>
            <div className="text-[10px] uppercase tracking-widest text-white/40">
              of {stats.totalVerified} verified
            </div>
          </div>
        )}
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={() => { setFilterTab('diverged'); setShowAll(false); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
            filterTab === 'diverged'
              ? 'bg-amber-500 text-white shadow-amber-500/25 ring-2 ring-amber-400 scale-105'
              : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
          }`}
        >
          <span>⚠️</span>
          <span>{t.tabDiverged}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 text-white font-black">
            {divergedCount}
          </span>
        </button>

        <button
          onClick={() => { setFilterTab('all'); setShowAll(false); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
            filterTab === 'all'
              ? 'bg-blue-600 text-white shadow-blue-500/25 ring-2 ring-blue-400 scale-105'
              : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
          }`}
        >
          <span>{t.tabAll}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 text-white font-black">
            {feed.length}
          </span>
        </button>

        <button
          onClick={() => { setFilterTab('accurate'); setShowAll(false); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
            filterTab === 'accurate'
              ? 'bg-emerald-600 text-white shadow-emerald-500/25 ring-2 ring-emerald-400 scale-105'
              : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
          }`}
        >
          <span>✓</span>
          <span>{t.tabAccurate}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 text-white font-black">
            {accurateCount}
          </span>
        </button>
      </div>

      {/* ── Cards (limited to 3 by default) ── */}
      {visibleFeed.length === 0 ? (
        <div className="py-8 text-center text-white/40 text-xs">
          No questions match this filter.
        </div>
      ) : (
        <div className="space-y-3">
          {visibleFeed.map((item) => (
            <AccuracyCard key={item.id || item._id} item={item} t={t} />
          ))}
        </div>
      )}

      {/* ── View More / Show Less Toggle ── */}
      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setShowAll(prev => !prev)}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 active:scale-95 transition-all border border-white/15 text-white/90 shadow-sm cursor-pointer"
          >
            <span>{showAll ? (t.showLess || 'Show Less') : (t.showMore ? t.showMore(filteredFeed.length - 3) : `View ${filteredFeed.length - 3} More Questions`)}</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              className={`transition-transform duration-300 ${showAll ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Footer ── */}
      <div className="mt-5 pt-4 border-t border-white/10">
        <p className="text-[11px] text-white/30 flex items-center gap-1.5">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          Claims are verified the next day using Open-Meteo's weather archive.
          {stats.totalVerified === 0 && ' Data appears after the first 24 hours of operation.'}
        </p>
      </div>
    </div>
  );
}
