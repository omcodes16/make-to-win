import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getFarmerAdvisory } from '../utils/farmerAdvisory';
import { getFishermanAdvisory } from '../utils/fishermanAdvisory';
import { getAviationAdvisory } from '../utils/aviationAdvisory';
import { getUrbanPlanningAdvisory } from '../utils/urbanPlanningAdvisory';
import { computeHeatIndex, getHeatRisk } from '../utils/heatIndex';

const CHIPS = {
  farmer: {
    en: ['Will it rain today and should I spray?', 'Spray window in next 48 hours?', 'Frost risk tonight for my crops?', 'Fungal disease risk this week?'],
    hi: ['क्या आज बारिश होगी और स्प्रे करूं?', 'अगले 48 घंटे स्प्रे का सही समय?', 'आज रात फसल पर पाला पड़ेगा?', 'इस सप्ताह फंगस का खतरा?'],
    bn: ['আজ বৃষ্টি হবে, স্প্রে করব?', '৪৮ ঘণ্টায় স্প্রে উইন্ডো?', 'আজ রাতে শিলাবৃষ্টি?', 'এ সপ্তাহে ছত্রাকের ঝুঁকি?'],
    as: ["আজি বৰষুণ হ'ব, স্প্ৰে কৰিব?", '৪৮ ঘণ্টাত স্প্ৰেৰ সময়?', 'আজি ৰাতি পাল পৰিব?', 'এই সপ্তাহত ফাংগাল?'],
  },
  fisherman: {
    en: ['Is the sea safe for fishing today?', 'Wave height and swell forecast?', 'Any cyclone or storm warning nearby?', 'How far am I from IMBL border?'],
    hi: ['क्या आज समुद्र में मछली पकड़ना सुरक्षित है?', 'लहरों की ऊंचाई का पूर्वानुमान?', 'पास में कोई चक्रवात चेतावनी?', 'मैं IMBL सीमा से कितनी दूर हूं?'],
    bn: ['আজ সমুদ্রে মাছ ধরা কি নিরাপদ?', 'ঢেউয়ের উচ্চতার পূর্বাভাস?', 'কাছে ঘূর্ণিঝড় সতর্কতা?', 'IMBL সীমা থেকে কতটা দূরে?'],
    as: ['আজি সমুদ্ৰত মাছ মৰা নিৰাপদ?', 'ঢৌৰ উচ্চতাৰ পূৰ্বাভাস?', 'ওচৰত ঘূৰ্ণীবতাহ সতৰ্কতা?', 'IMBL সীমাৰ পৰা কিমান দূৰ?'],
  },
  aviation: {
    en: ['VFR or IFR conditions today?', 'Cloud ceiling and visibility?', 'Wind shear and turbulence risk?', 'Visibility at Chennai airport?'],
    hi: ['आज VFR या IFR परिस्थितियां?', 'बादल की छत और दृश्यता?', 'पवन कतरनी और अशांति जोखिम?', 'चेन्नई हवाई अड्डे पर दृश्यता?'],
    bn: ['আজ VFR বা IFR অবস্থা?', 'মেঘের সিলিং এবং দৃশ্যমানতা?', 'উইন্ড শিয়ার ঝুঁকি?', 'বিমানবন্দরে দৃশ্যমানতা?'],
    as: ['আজি VFR নে IFR?', 'ডাৱৰৰ উচ্চতা আৰু দৃশ্যমানতা?', 'বতাহ কতৰনিৰ বিপদ?', 'বিমানবন্দৰত দৃশ্যমানতা?'],
  },
  urbanPlanning: {
    en: ['AQI and air quality today?', 'Heat island and heatwave risk?', 'Urban drainage flood risk?', 'Worker safety index for outdoor work?'],
    hi: ['आज AQI और वायु गुणवत्ता?', 'हीट आइलैंड और लू का जोखिम?', 'शहरी जल निकासी बाढ़ जोखिम?', 'बाहरी काम के लिए कामगार सुरक्षा?'],
    bn: ['আজ AQI এবং বায়ু মান?', 'তাপ দ্বীপ ও তাপপ্রবাহ?', 'শহুরে বন্যার ঝুঁকি?', 'বহিরাঙ্গন কাজে শ্রমিক সুরক্ষা?'],
    as: ['আজি AQI আৰু বায়ু মান?', 'তাপ দ্বীপ আৰু তাপপ্ৰবাহ?', 'চহৰৰ বানপানীৰ আশংকা?', 'বাহিৰৰ কামত শ্ৰমিক সুৰক্ষা?'],
  },
  general: {
    en: ['Will it rain today in my city?', 'Is there a cyclone warning nearby?', 'Safe for fishermen to go to sea?', 'Compare this monsoon with last year'],
    hi: ['क्या आज मेरे शहर में बारिश होगी?', 'क्या पास में चक्रवात चेतावनी है?', 'क्या मछुआरे समुद्र में जा सकते हैं?', 'इस मानसून की पिछले साल से तुलना'],
    bn: ['আজ আমার শহরে বৃষ্টি হবে?', 'কাছে ঘূর্ণিঝড় সতর্কতা?', 'মৎস্যজীবীরা সমুদ্রে যেতে পারবে?', 'গত বছরের সাথে এই বর্ষার তুলনা'],
    as: ['আজি মোৰ চহৰত বৰষুণ?', 'ওচৰত ঘূৰ্ণীবতাহ সতৰ্কতা?', 'মাছ মৰা সমুদ্ৰলৈ যাব পাৰিব?', 'যোৱা বছৰৰ সৈতে বৰ্ষাৰ তুলনা'],
  },
};

const ADVISORY_STYLE = {
  danger:  { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.35)',  text: '#fca5a5', dot: '#ef4444' },
  caution: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', text: '#fcd34d', dot: '#f59e0b' },
  good:    { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)', text: '#6ee7b7', dot: '#10b981' },
};

const PROFESSION_META = {
  farmer:        { icon: '🌾', labelHi: 'किसान ब्रीफिंग', labelEn: "Kisan's Briefing" },
  fisherman:     { icon: '🎣', labelHi: 'मछुआरा ब्रीफिंग', labelEn: "Machhua's Briefing" },
  aviation:      { icon: '✈️', labelHi: 'विमानन ब्रीफिंग', labelEn: 'Aviation Briefing' },
  urbanPlanning: { icon: '🏙️', labelHi: 'शहर ब्रीफिंग',   labelEn: 'City Briefing' },
  general:       { icon: '🌍', labelHi: 'आज का मौसम',     labelEn: "Today's Briefing" },
};

function getSpecialButtons(profile, lang) {
  const isHi = ['hi','mr','pa','gu','or','ur'].includes(lang);
  const isBn = lang === 'bn';
  if (profile === 'farmer') return [
    { label: isHi ? '📷 फसल डॉक्टर' : isBn ? '📷 ফসল ডাক্তার' : '📷 Fasal Doctor', event: 'weathergpt-open-mausam-drishti', gradient: 'linear-gradient(135deg,#059669,#047857)' },
    { label: isHi ? '📻 आवाज बुलेटिन' : isBn ? '📻 ভয়েস বুলেটিন' : '📻 Voice Bulletin', event: 'weathergpt-open-bulletin', gradient: 'linear-gradient(135deg,#d97706,#b45309)' },
  ];
  if (profile === 'fisherman') return [
    { label: isHi ? '🌊 सागर रक्षक' : isBn ? '🌊 সাগর রক্ষক' : '🌊 Sagar Rakshak', event: 'weathergpt-open-sagar-rakshak', gradient: 'linear-gradient(135deg,#0891b2,#0e7490)' },
    { label: isHi ? '📻 समुद्री बुलेटिन' : isBn ? '📻 সামুদ্রিক বুলেটিন' : '📻 Marine Bulletin', event: 'weathergpt-open-bulletin', gradient: 'linear-gradient(135deg,#2563eb,#1d4ed8)' },
  ];
  return [
    { label: isHi ? '🔬 अनुसंधान' : isBn ? '🔬 গবেষণা' : '🔬 Research', tabSwitch: 'research', gradient: 'linear-gradient(135deg,#4f46e5,#4338ca)' },
    { label: isHi ? '🚨 अलर्ट देखें' : isBn ? '🚨 সতর্কতা দেখুন' : '🚨 View Alerts', tabSwitch: 'alerts', gradient: 'linear-gradient(135deg,#dc2626,#b91c1c)' },
  ];
}

function BriefingCard({ weather, locationName, profile, lang, dispatch }) {
  const meta = PROFESSION_META[profile] || PROFESSION_META.general;
  const isHi = ['hi','mr','pa','gu','or','ur'].includes(lang);

  const advisory = profile === 'farmer' ? getFarmerAdvisory(weather, 0, lang)
    : profile === 'fisherman' ? getFishermanAdvisory(weather, 0, lang)
    : profile === 'aviation' ? getAviationAdvisory(weather, 0, lang)
    : profile === 'urbanPlanning' ? getUrbanPlanningAdvisory(weather, 0, lang)
    : null;

  const style = ADVISORY_STYLE[advisory?.type] || ADVISORY_STYLE.good;
  const specialBtns = getSpecialButtons(profile, lang);
  const profLabel = isHi ? meta.labelHi : meta.labelEn;

  return (
    <div className="w-full max-w-sm rounded-2xl mb-3 overflow-hidden" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      {/* Header strip */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--theme-border)' }}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{meta.icon}</span>
          <div>
            <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{profLabel}</div>
            {locationName && (
              <div className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                📍 <span className="truncate max-w-[130px]">{locationName}</span>
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="font-black text-3xl leading-none" style={{ color: 'var(--text-primary)' }}>{Math.round(weather.temperature)}°</div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{isHi ? 'महसूस' : 'Feels'} {Math.round(weather.feelsLike ?? weather.temperature)}°</div>
        </div>
      </div>

      {/* Advisory Banner */}
      {advisory && (
        <div className="mx-3 mt-3 rounded-xl p-3" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: style.dot }} />
            <span className="text-xs font-black" style={{ color: style.text }}>{advisory.title}</span>
          </div>
          <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{advisory.advice}</p>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 mx-3 mt-3">
        {[
          { icon: '💧', val: `${weather.humidity}%`, lbl: isHi ? 'नमी' : 'Humidity' },
          { icon: '💨', val: `${Math.round(weather.windSpeed)} km/h`, lbl: isHi ? 'हवा' : 'Wind' },
          { icon: '☀️', val: `UV ${weather.uvIndex ?? '--'}`, lbl: isHi ? 'सूचकांक' : 'Index' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-2 text-center" style={{ background: 'var(--glass-bg)', border: '1px solid var(--theme-border)' }}>
            <div className="text-base">{s.icon}</div>
            <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>{s.val}</div>
            <div className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mx-3 mt-3 mb-3">
        {specialBtns.map((btn, i) => (
          <button
            key={i}
            onClick={() => {
              if (btn.event) window.dispatchEvent(new CustomEvent(btn.event));
              if (btn.tabSwitch) dispatch({ type: 'SET_ACTIVE_TAB', payload: btn.tabSwitch });
            }}
            className="flex-1 py-2.5 rounded-xl text-white text-[11px] font-black active:scale-95 transition-all shadow-md"
            style={{ background: btn.gradient }}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function EmptyState() {
  const { state, dispatch } = useApp();
  const [chipIdx, setChipIdx] = useState(0);
  const [animating, setAnimating] = useState(false);

  const lang = state.language || 'en';
  const profile = state.userProfile || 'general';
  const stageData = state.weatherStageData;
  const weather = stageData?.weather;
  const locationName = stageData?.locationName;
  const isHi = ['hi','mr','pa','gu','or','ur'].includes(lang);

  const chips = (CHIPS[profile] || CHIPS.general)[lang] || (CHIPS[profile] || CHIPS.general).en;
  const meta = PROFESSION_META[profile] || PROFESSION_META.general;

  useEffect(() => {
    const iv = setInterval(() => {
      setAnimating(true);
      setTimeout(() => { setChipIdx(p => (p + 1) % chips.length); setAnimating(false); }, 280);
    }, 3800);
    return () => clearInterval(iv);
  }, [chips.length]);

  const handleChipTap = (text) => {
    const clean = text.replace(/^[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\s]*/u, '').trim();
    window.dispatchEvent(new CustomEvent('weathergpt-send', { detail: clean || text }));
  };

  const hasBriefing = weather && weather.temperature != null;

  return (
    <div className="flex flex-col items-center justify-start h-full pb-8 px-4 pt-4 animate-fade-in overflow-y-auto">

      {hasBriefing ? (
        <BriefingCard
          weather={weather}
          locationName={locationName}
          profile={profile}
          lang={lang}
          dispatch={dispatch}
        />
      ) : (
        <div className="flex flex-col items-center mb-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-indigo-500 via-purple-500 to-blue-400 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.4)] mb-3 animate-pulse-rays">
            <span className="text-3xl sm:text-4xl drop-shadow-lg">{meta.icon}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-gradient-hero text-center tracking-tight mb-1">WeatherGPT</h2>
          <p className="text-[var(--text-secondary)] text-center text-xs sm:text-sm">
            {lang === 'hi' ? 'AI-संचालित मौसम विश्लेषण • लाइव IMD डेटा' : 'AI-Powered Weather Intelligence • Live IMD Data'}
          </p>
        </div>
      )}

      {/* Rotating question chip */}
      <div className="w-full max-w-sm">
        <p className="text-[var(--text-secondary)] text-[10px] text-center mb-2 uppercase tracking-wider font-semibold">
          {isHi ? '— पूछें —' : lang === 'bn' ? '— জিজ্ঞাসা করুন —' : lang === 'as' ? '— সোধক —' : '— Ask Me —'}
        </p>

        <button
          onClick={() => handleChipTap(chips[chipIdx])}
          className={`w-full cursor-pointer glass-panel rounded-2xl p-4 border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/50 transition-all duration-300 active:scale-[0.98] text-left mb-2 ${
            animating ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
          }`}
          style={{ transition: 'opacity 0.28s, transform 0.28s' }}
        >
          <p className="text-[var(--text-primary)] text-sm sm:text-base font-semibold leading-snug">{chips[chipIdx]}</p>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium" style={{ color: 'var(--theme-accent)' }}>
            <span>{isHi ? 'टैप करें' : lang === 'bn' ? 'ট্যাপ করুন' : lang === 'as' ? 'টেপ কৰক' : 'Tap to ask'}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </div>
        </button>

        <div className="flex flex-col gap-1.5">
          {[chips[1], chips[2]].filter(Boolean).map((chip, i) => (
            <button
              key={i}
              onClick={() => handleChipTap(chip)}
              className="cursor-pointer glass-panel rounded-xl px-3.5 py-2.5 border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/30 flex items-center gap-2 transition-all duration-200 active:scale-[0.98] text-left"
            >
              <p className="text-[var(--text-secondary)] text-xs sm:text-sm leading-snug flex-1">{chip}</p>
              <svg className="shrink-0 opacity-40" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--text-secondary)' }}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          ))}
        </div>

        <div className="flex justify-center gap-1.5 mt-3">
          {chips.map((_, i) => (
            <button
              key={i}
              onClick={() => setChipIdx(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === chipIdx ? '20px' : '6px',
                height: '6px',
                background: i === chipIdx ? 'var(--theme-accent)' : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
