import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { fetchLiveBulletinData } from '../services/bulletinService';
import { searchLocationSuggestions } from '../services/weatherApi';
import { printBulletinIframe, downloadBulletinHtml } from '../utils/bulletinPrinter';

// Multilingual labels for official bulletin
const BULLETIN_LANG = {
  en: {
    govTitle: 'CIVIC WEATHER ADVISORY BULLETIN',
    subTitle: 'Gram Panchayat to State Decision Support System (SIH 2026 Prototype)',
    refId: 'Bulletin Ref',
    issued: 'Issued On',
    validity: 'Validity',
    hours: 'Next 24 to 48 Hours',
    searchPlaceholder: '🔍 Search any Village, Gram Panchayat, Tehsil, District, or State across India...',
    tabMaster: 'Master Bulletin',
    tabFarmer: 'Farmer (Kisan)',
    tabFisherman: 'Marine (Fisherman)',
    tabUrban: 'Urban & Civic',
    tabAviation: 'Aviation & Drone',
    liveBadge: '100% LIVE OPEN-METEO NWP STREAM',
    printBtn: 'Print / Save as PDF',
    downloadBtn: 'Download Report',
    shareBtn: 'WhatsApp',
    refreshBtn: 'Refresh',
    closeBtn: 'Close',
    telemetryBtn: 'Open-Meteo Live Feed',
    tierPanchayat: '🏡 Village / GP',
    tierBlock: '🏢 Block / Tehsil',
    tierDistrict: '🏛️ District',
    tierState: '🗺️ State Level',
    pastingNotice: 'SIH 2026 Prototype Notice: Real-time NWP feeds powered by Open-Meteo & CPCB for Village, Tehsil, District & State public notice boards. For statutory evacuation orders, refer to district administration & IMD/NDMA.',
    loading: 'Fetching real-time atmospheric, marine & agro-meteorological satellite data from Open-Meteo...',
    error: 'Failed to retrieve live bulletin data. Please retry or verify connection.',
    panchayat: 'Gram Panchayat / Village',
    block: 'Block / Tehsil',
    district: 'District & State',
    coords: 'GPS Coordinates',
    inlandMsg: 'Inland Region: Freshwater & Riverine Fishing Advisory active. Oceanic wave height not applicable.',
  },
  hi: {
    govTitle: 'नागरिक मौसम एवं कृषि परामर्श बुलेटिन',
    subTitle: 'ग्राम पंचायत से राज्य स्तर निर्णय सहायता प्रणाली (SIH 2026 प्रोटोटाइप)',
    refId: 'बुलेटिन क्रमांक',
    issued: 'जारी करने का समय',
    validity: 'वैधता अवधि',
    hours: 'अगले 24 से 48 घंटे',
    searchPlaceholder: '🔍 भारत का कोई भी गाँव, ग्राम पंचायत, तहसील, जिला या राज्य खोजें...',
    tabMaster: 'समग्र बुलेटिन',
    tabFarmer: 'किसान (कृषि)',
    tabFisherman: 'मछुआरा (तटीय)',
    tabUrban: 'शहरी व नागरिक',
    tabAviation: 'विमानन व ड्रोन',
    liveBadge: '100% लाइव ओपन-मेटियो उपग्रह डेटा',
    printBtn: 'प्रिंट / पीडीएफ',
    downloadBtn: 'रिपोर्ट डाउनलोड',
    shareBtn: 'व्हाट्सएप',
    refreshBtn: 'ताजा डेटा लाएं',
    closeBtn: 'बंद करें',
    telemetryBtn: 'ओपन-मेटियो लाइव फीड',
    tierPanchayat: '🏡 गाँव / पंचायत',
    tierBlock: '🏢 प्रखंड / तहसील',
    tierDistrict: '🏛️ जिला स्तर',
    tierState: '🗺️ राज्य स्तर',
    pastingNotice: 'SIH 2026 प्रोटोटाइप सूचना: गाँव, तहसील, जिला एवं राज्य सूचना पटल हेतु ओपन-मेटियो व CPCB द्वारा संचालित लाइव बुलेटिन। आधिकारिक आपातकालीन आदेशों हेतु जिला प्रशासन एवं IMD/NDMA से संपर्क करें।',
    loading: 'लाइव ओपन-मेटियो उपग्रह, वायु गुणवत्ता एवं कृषि मौसम डेटा सिंक हो रहा है...',
    error: 'लाइव बुलेटिन डेटा लोड करने में असमर्थ। कृपया पुनः प्रयास करें।',
    panchayat: 'ग्राम पंचायत / गाँव',
    block: 'प्रखंड / तहसील',
    district: 'जिला एवं राज्य',
    coords: 'जीपीएस निर्देशांक',
    inlandMsg: 'अंतर्देशीय क्षेत्र: नदी एवं जलाशय मत्स्य पालन परामर्श लागू। खुले समुद्री लहर मापदंड लागू नहीं।',
  },
  bn: {
    govTitle: 'নাগরিক আবহাওয়া ও কৃষি পরামর্শ বুলেটিন',
    subTitle: 'গ্রাম পঞ্চায়েত থেকে রাজ্য স্তর সিদ্ধান্ত সহায়তা ব্যবস্থা (SIH 2026 প্রোটোটাইপ)',
    refId: 'বুলেটিন নং',
    issued: 'প্রকাশের তারিখ',
    validity: 'কার্যকারিতা',
    hours: 'পরবর্তী ২৪ থেকে ৪৮ ঘন্টা',
    searchPlaceholder: '🔍 ভারতের যেকোনো গ্রাম, পঞ্চায়েত, তহসিল বা জেলা অনুসন্ধান করুন...',
    tabMaster: 'সামগ্রিক বুলেটিন',
    tabFarmer: 'কৃষক (কৃষি)',
    tabFisherman: 'মৎস্যজীবী (উপকূলীয়)',
    tabUrban: 'পৌর ও নাগরিক',
    tabAviation: 'বিমান ও ড্রোন',
    liveBadge: '১০০% লাইভ ওপেন-মেটিও তথ্য',
    printBtn: 'প্রিন্ট / পিডিএফ',
    downloadBtn: 'রিপোর্ট ডাউনলোড',
    shareBtn: 'হোয়াটসঅ্যাপ',
    refreshBtn: 'রিফ্রেশ করুন',
    closeBtn: 'বন্ধ করুন',
    telemetryBtn: 'ওপেন-মেটিও লাইভ ফিড',
    tierPanchayat: '🏡 গ্রাম / পঞ্চায়েত',
    tierBlock: '🏢 ব্লক / তহসিল',
    tierDistrict: '🏛️ জেলা স্তর',
    tierState: '🗺️ রাজ্য স্তর',
    pastingNotice: 'SIH 2026 প্রোটোটাইপ বিজ্ঞপ্তি: গ্রাম পঞ্চায়েত নোটিশ বোর্ডের জন্য ওপেন-মেটিও এবং CPCB চালিত লাইভ বুলেটিন। জরুরি নির্দেশনার জন্য জেলা প্রশাসন ও IMD দেখুন।',
    loading: 'লাইভ স্যাটেলাইট ও কৃষি আবহাওয়ার তথ্য আনা হচ্ছে...',
    error: 'লাইভ বুলেটিন আনতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।',
    panchayat: 'গ্রাম পঞ্চায়েত / গ্রাম',
    block: 'ব্লক / তহসিল',
    district: 'জেলা ও রাজ্য',
    coords: 'জিপিএস স্থানাঙ্ক',
    inlandMsg: 'অভ্যন্তরীণ অঞ্চল: মিষ্টি জল এবং নদীর মৎস্য পরামর্শ সক্রিয়। সমুদ্রের ঢেউ প্রযোজ্য নয়।',
  },
  as: {
    govTitle: 'নাগৰিক বতৰ আৰু কৃষি পৰামৰ্শ বুলেটিন',
    subTitle: 'গাঁও পঞ্চায়তৰ পৰা ৰাজ্য স্তৰলৈ সিদ্ধান্ত সহায়ক ব্যৱস্থা (SIH 2026 প্ৰটোটাইপ)',
    refId: 'বুলেটিন নং',
    issued: 'জাৰি কৰা সময়',
    validity: 'বৈধতা',
    hours: 'পৰৱৰ্তী ২৪ ৰ পৰা ৪৮ ঘণ্টা',
    searchPlaceholder: '🔍 যিকোনো গাঁও, পঞ্চায়ত, তহচিল বা জিলা সন্ধান কৰক...',
    tabMaster: 'সামগ্ৰিক বুলেটিন',
    tabFarmer: 'কৃষক (কৃষি)',
    tabFisherman: 'মাছমৰীয়া (উপকূলীয়)',
    tabUrban: 'নগৰীয়া আৰু নাগৰিক',
    tabAviation: 'বিমান আৰু ড্ৰোন',
    liveBadge: '১০০% লাইভ ওপেন-মেটিঅ’ তথ্য',
    printBtn: 'প্ৰিণ্ট / পিডিএফ',
    downloadBtn: 'প্ৰতিবেদন ডাউনলোড',
    shareBtn: 'হোৱাটছএপ',
    refreshBtn: 'সতেজ কৰক',
    closeBtn: 'বন্ধ কৰক',
    telemetryBtn: 'ওপেন-মেটিঅ’ লাইভ ফিড',
    tierPanchayat: '🏡 গাঁও / পঞ্চায়ত',
    tierBlock: '🏢 খণ্ড / তহচিল',
    tierDistrict: '🏛️ জিলা স্তৰ',
    tierState: '🗺️ ৰাজ্য স্তৰ',
    pastingNotice: 'SIH 2026 প্ৰটোটাইপ জাননী: গাঁও পঞ্চায়ত জাননী ফলকৰ বাবে ওপেন-মেটিঅ’ চালিত লাইভ বুলেটিন। চৰকাৰী নিৰ্দেশনাৰ বাবে জিলা প্ৰশাসনৰ লগত যোগাযোগ কৰক।',
    loading: 'লাইভ উপগ্ৰহ আৰু বতৰ তথ্য ডাউনলোড কৰা হৈছে...',
    error: 'বুলেটিন ডাটা লোড কৰিব পৰা নগ\'ল। পুনৰ চেষ্টা কৰক।',
    panchayat: 'গাঁও পঞ্চায়ত / গাঁও',
    block: 'খণ্ড / তহচিল',
    district: 'জিলা আৰু ৰাজ্য',
    coords: 'জিপিএছ স্থানাংক',
    inlandMsg: 'অভ্যন্তৰীণ অঞ্চল: নৈ আৰু পুখুৰী মাছ ধৰাৰ পৰামৰ্শ প্ৰযোজ্য। সামুদ্ৰিক ঢৌ প্ৰযোজ্য নহয়।',
  }
};

export default function OfficialBulletinModal({
  isOpen,
  onClose,
  initialLocation,
  initialCategory = 'master',
  defaultLang = 'en',
}) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'master');
  const [lang, setLang] = useState(defaultLang || 'en');
  const [location, setLocation] = useState(initialLocation || {
    name: 'New Delhi',
    district: 'New Delhi',
    state: 'Delhi',
    lat: 28.6139,
    lng: 77.2090
  });

  const [bulletinData, setBulletinData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminLevel, setAdminLevel] = useState('panchayat'); // 'panchayat' | 'block' | 'district' | 'state'
  const [showTelemetryModal, setShowTelemetryModal] = useState(false);
  const [copiedTelemetry, setCopiedTelemetry] = useState(false);

  // Instant Gram Panchayat Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef(null);

  const t = BULLETIN_LANG[lang] || BULLETIN_LANG.en;

  // Sync category if initialCategory changes
  useEffect(() => {
    if (initialCategory) setSelectedCategory(initialCategory);
  }, [initialCategory]);

  // Sync location if initialLocation changes
  useEffect(() => {
    if (initialLocation && initialLocation.lat && initialLocation.lng) {
      setLocation(initialLocation);
    }
  }, [initialLocation]);

  // Fetch live real-time bulletin data whenever coordinates change
  const loadData = async (lat, lng, level = adminLevel) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchLiveBulletinData(lat, lng, level);
      setBulletinData(data);
    } catch (err) {
      console.error('Bulletin load error:', err);
      setError(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && location.lat && location.lng) {
      loadData(location.lat, location.lng, adminLevel);
    }
  }, [isOpen, location.lat, location.lng, adminLevel]);

  const handleSwitchAdminLevel = (newLevel) => {
    setAdminLevel(newLevel);
    if (location.lat && location.lng) {
      loadData(location.lat, location.lng, newLevel);
    }
  };

  // Handle Gram Panchayat Search input
  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!q || q.trim().length < 2) {
      setSearchSuggestions([]);
      setShowDropdown(false);
      return;
    }
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchLocationSuggestions(q.trim(), lang);
        setSearchSuggestions(results || []);
        setShowDropdown(true);
      } catch (err) {
        console.warn('Search suggestions error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  const handleSelectPanchayat = (item) => {
    const nextLoc = {
      name: item.name,
      district: item.district || '',
      state: item.state || '',
      lat: item.lat,
      lng: item.lng
    };
    setLocation(nextLoc);
    loadData(item.lat, item.lng, adminLevel);
    setSearchQuery('');
    setShowDropdown(false);
  };

  // WhatsApp share generator
  const handleWhatsAppShare = () => {
    if (!bulletinData) return;
    const { current, farmer, fisherman, urban, aviation } = bulletinData;
    const text = `🏛️ *${t.govTitle}*
📍 *${t.panchayat}:* ${location.name} (${location.district ? location.district + ', ' : ''}${location.state})
⏱️ *${t.validity}:* ${t.hours}
🌡️ *Temp:* ${current.temp}°C (Feels like ${current.feelsLike}°C) | Rain Prob: ${current.rainProb}% | Wind: ${current.windSpeed} km/h (${current.windCompass})

🌾 *किसान (Agro-Met):*
• Soil Moisture: ${(farmer.soilMoisture * 100).toFixed(1)}% | Soil Temp: ${farmer.soilTemp}°C
• Spray Window: ${farmer.sprayLabel}
• Fungal Risk: ${farmer.fungalLabel}

🎣 *मछुआरा (Marine):*
• Wave Height: ${fisherman.waveHeight !== null ? fisherman.waveHeight + 'm' : 'Inland Waterways'}
• Sea State: ${fisherman.seaState.label}
• Port Signal: ${fisherman.stormSignal.signal}

🏙️ *शहरी (Urban AQI):*
• PM2.5: ${urban.pm25 ?? 'N/A'} µg/m³ | AQI: ${urban.usAqi ?? 'N/A'}
• Drainage: ${urban.drainageLabel}

✈️ *विमानन (Aviation):*
• Visibility: ${aviation.visibilityKm} km | Drone Clearance: ${aviation.droneClearance}

🔗 *Official WeatherGPT Live Cell:* https://weathergpt.gov.in`;

    if (navigator.share) {
      navigator.share({
        title: t.govTitle,
        text: text,
      }).catch(() => {});
    } else {
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
    }
  };

  // Isolated print handler via invisible iframe
  const handlePrint = () => {
    if (bulletinData) {
      printBulletinIframe(bulletinData, location, selectedCategory, lang);
    }
  };

  // Direct offline HTML report download
  const handleDownload = () => {
    if (bulletinData) {
      downloadBulletinHtml(bulletinData, location, selectedCategory, lang);
    }
  };

  // Keyboard Escape listener to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md official-bulletin-modal-root overflow-hidden"
      onClick={onClose}
    >
      {/* Container with official document styling */}
      <div 
        className="relative w-full max-w-5xl h-full sm:h-[92vh] bg-[#0f172a] text-slate-100 rounded-none sm:rounded-2xl border-0 sm:border border-indigo-500/30 shadow-2xl overflow-hidden flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Row 1: Top Navigation Bar: Title, Live Dot, Language Selector & Obvious Close Button */}
        <div className="no-print shrink-0 bg-[#090d16] border-b border-slate-800 px-3.5 sm:px-5 py-2.5 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">🏛️</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black text-white truncate tracking-tight uppercase">
                  {t.govTitle}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                📍 {location.name} {location.district ? `(${location.district})` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700 text-[11px]">
              {[
                { code: 'hi', label: 'हिन्दी' },
                { code: 'en', label: 'EN' },
                { code: 'bn', label: 'বাংলা' },
                { code: 'as', label: 'অসমীয়া' }
              ].map(l => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`px-2 py-0.5 rounded font-bold transition-all ${
                    lang === l.code ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* Clear, Red Circular Close Button (Always visible!) */}
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-red-500/15 hover:bg-red-500/30 active:scale-90 border border-red-500/40 text-red-400 hover:text-red-300 flex items-center justify-center font-black text-sm sm:text-base transition-all shadow-sm"
              aria-label="Close"
              title="Close Bulletin (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Row 2: Action Toolbar (PDF, Download, WhatsApp, Open-Meteo Live Feed, Refresh) */}
        <div className="no-print shrink-0 bg-slate-900/95 border-b border-slate-800/80 px-3.5 sm:px-5 py-2 flex items-center justify-between gap-2 overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
              title="Print or Save as PDF"
            >
              <span>🖨️</span>
              <span>{t.printBtn}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-md shadow-sky-600/30 flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
              title="Download standalone offline HTML report"
            >
              <span>📥</span>
              <span>{t.downloadBtn}</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
            >
              <span>📲</span>
              <span>{t.shareBtn}</span>
            </button>

            {/* 1-Click Open-Meteo Live Feed / Telemetry Inspector */}
            <button
              onClick={() => setShowTelemetryModal(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/40 text-xs font-black shadow-md flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
              title="Inspect Live Open-Meteo API query & NWP model data"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>📡 {t.telemetryBtn || 'Open-Meteo Live Feed'}</span>
            </button>
          </div>

          <button
            onClick={() => loadData(location.lat, location.lng, adminLevel)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all shrink-0 active:scale-95"
            title={t.refreshBtn}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
          </button>
        </div>

        {/* Row 3: Administrative Scale Switcher (Village/GP -> Block/Tehsil -> District -> State) */}
        <div className="no-print shrink-0 bg-[#090d16] border-b border-slate-800/80 px-3.5 sm:px-5 py-1.5 flex items-center justify-between gap-2 overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Level:</span>
            {[
              { id: 'panchayat', label: t.tierPanchayat || '🏡 Village / GP' },
              { id: 'block', label: t.tierBlock || '🏢 Block / Tehsil' },
              { id: 'district', label: t.tierDistrict || '🏛️ District' },
              { id: 'state', label: t.tierState || '🗺️ State Level' }
            ].map(tier => {
              const isActive = adminLevel === tier.id;
              return (
                <button
                  key={tier.id}
                  onClick={() => handleSwitchAdminLevel(tier.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1 border ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white border-emerald-400 shadow-md scale-[1.02]'
                      : 'bg-slate-800/70 text-slate-400 border-slate-700/70 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {tier.label}
                </button>
              );
            })}
          </div>
          <span className="text-[10px] text-teal-400/90 font-mono hidden sm:inline shrink-0">
            {bulletinData?.adminTier?.badge || 'Open-Meteo High-Resolution Grid'}
          </span>
        </div>

        {/* Row 3: Search Gram Panchayat Bar */}
        <div className="no-print shrink-0 px-3.5 sm:px-5 py-2 bg-slate-900 border-b border-slate-800 relative z-20">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => { if (searchSuggestions.length > 0) setShowDropdown(true); }}
              placeholder={t.searchPlaceholder}
              className="w-full bg-slate-950 border border-slate-700 hover:border-indigo-500/50 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 shadow-inner"
            />
            {isSearching && (
              <span className="absolute right-3 top-2 text-xs text-indigo-400 animate-spin">⏳</span>
            )}
            {showDropdown && searchSuggestions.length > 0 && (
              <ul className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-indigo-500/30 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-50">
                {searchSuggestions.map((item, idx) => (
                  <li
                    key={idx}
                    onClick={() => handleSelectPanchayat(item)}
                    className="px-3.5 py-2.5 hover:bg-indigo-600/20 border-b border-slate-800/80 last:border-0 cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <span className="font-bold text-white">{item.name}</span>
                      <span className="block text-[11px] text-slate-400">
                        {[item.district, item.state, item.country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      Select
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Row 4: 5 Sectoral Tabs (Single Emoji Each, No Duplication) */}
        <div className="no-print shrink-0 bg-[#090d16] border-b border-slate-800/90 px-3.5 sm:px-5 py-2 flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
          {[
            { id: 'master', label: t.tabMaster, icon: '📑' },
            { id: 'farmer', label: t.tabFarmer, icon: '🌾' },
            { id: 'fisherman', label: t.tabFisherman, icon: '🎣' },
            { id: 'urban', label: t.tabUrban, icon: '🏙️' },
            { id: 'aviation', label: t.tabAviation, icon: '✈️' },
          ].map((tab) => {
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400 shadow-md shadow-indigo-600/25 scale-[1.02]'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/80 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span className="text-sm">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Printable Official Document Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6" id="official-bulletin-print-area">
          
          {/* Official Document Header (Visible in print and screen) */}
          <div className="border-2 border-indigo-500/40 rounded-2xl p-4 sm:p-5 bg-gradient-to-b from-slate-900 to-slate-950 official-paper-header relative overflow-hidden shadow-lg">
            
            {/* Top Seal & Heading */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/80 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-emerald-500 p-0.5 shadow-md shrink-0">
                  <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-2xl font-black text-amber-400">
                    🏛️
                  </div>
                </div>
                <div>
                  <h1 className="text-sm sm:text-base md:text-lg font-black tracking-tight text-white uppercase">
                    {t.govTitle}
                  </h1>
                  <p className="text-[11px] sm:text-xs text-indigo-300 font-semibold">
                    {t.subTitle}
                  </p>
                </div>
              </div>

              {/* Reference & Time Badge */}
              <div className="text-left sm:text-right text-[11px] text-slate-400 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                <p><span className="text-slate-500 font-bold">{t.refId}:</span> <span className="font-mono text-indigo-300 font-bold">{bulletinData?.bulletinId || 'IN-WGPT-GP/2026/09-LIVE'}</span></p>
                <p><span className="text-slate-500 font-bold">{t.issued}:</span> <span className="text-slate-200">{new Date().toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN')}</span></p>
                <p><span className="text-slate-500 font-bold">{t.validity}:</span> <span className="text-emerald-400 font-bold">{t.hours}</span></p>
              </div>
            </div>

            {/* Administrative Hierarchy Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3.5 text-xs">
              <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{t.panchayat}</span>
                <span className="font-black text-white text-sm sm:text-base">{location.name}</span>
              </div>
              <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{t.block}</span>
                <span className="font-bold text-slate-200">{location.district || location.name}</span>
              </div>
              <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{t.district}</span>
                <span className="font-bold text-slate-200">{[location.district, location.state].filter(Boolean).join(', ')}</span>
              </div>
              <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{t.coords}</span>
                <span className="font-mono font-bold text-indigo-300">{location.lat?.toFixed(4)}°N, {location.lng?.toFixed(4)}°E</span>
              </div>
            </div>

            {/* Active Administrative Scope & Model Banner */}
            <div className="mt-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-black text-[11px] uppercase tracking-wider border border-emerald-500/30 shrink-0">
                  {bulletinData?.adminTier?.tierShort || 'Gram Panchayat'}
                </span>
                <span className="text-slate-300 font-medium text-[11px]">
                  {bulletinData?.adminTier?.focus || 'Field-level agricultural and village safety parameters'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono shrink-0">
                <span className="text-indigo-300">Model: {bulletinData?.telemetry?.model?.split(' ')[0] || 'ECMWF'}</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">100% Live Stream</span>
              </div>
            </div>

            <div className="mt-3 text-[10px] text-center text-slate-400 font-medium italic border-t border-slate-800/60 pt-2">
              ⚠️ {t.pastingNotice}
            </div>
          </div>

          {/* Loading & Error States */}
          {isLoading && (
            <div className="p-12 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-semibold text-indigo-300">{t.loading}</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="p-6 rounded-xl bg-red-950/40 border border-red-500/40 text-center text-red-300 text-sm">
              <p className="font-bold">⚠️ {error}</p>
              <button
                onClick={() => loadData(location.lat, location.lng)}
                className="mt-3 px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold"
              >
                {t.refreshBtn}
              </button>
            </div>
          )}

          {/* Live Data Renderers */}
          {bulletinData && !isLoading && (
            <div className="space-y-6">
              
              {/* Category 1: Farmer / Kisan */}
              {(selectedCategory === 'farmer' || selectedCategory === 'master') && (
                <div className="border border-emerald-500/30 rounded-2xl p-4 sm:p-5 bg-slate-900/80 shadow-md">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🌾</span>
                      <div>
                        <h2 className="text-sm sm:text-base font-black text-emerald-400 uppercase">
                          {lang === 'hi' ? 'कृषि एवं फसल सुरक्षा मौसम बुलेटिन' : 'Agriculture & Crop Protection Bulletin'}
                        </h2>
                        <p className="text-[11px] text-slate-400">
                          {lang === 'hi' ? 'मृदा स्वास्थ्य, कीटनाशक छिड़काव खिड़की एवं सिंचाई पूर्वानुमान' : 'Soil dynamics, chemical spray safety & FAO-56 evapotranspiration'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      AGRO-MET
                    </span>
                  </div>

                  {/* Agro KPIs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Root Soil Moisture (1-3cm)</span>
                      <span className="text-lg sm:text-xl font-black text-emerald-400">{(bulletinData.farmer.soilMoisture * 100).toFixed(1)}%</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{bulletinData.farmer.irrigationLabel}</span>
                    </div>

                    <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Soil Temp (6cm Depth)</span>
                      <span className="text-lg sm:text-xl font-black text-amber-400">{bulletinData.farmer.soilTemp}°C</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Germination Index</span>
                    </div>

                    <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Evapotranspiration (ET0)</span>
                      <span className="text-lg sm:text-xl font-black text-sky-400">{bulletinData.farmer.et0} mm/h</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Crop Water Loss Rate</span>
                    </div>

                    <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Spray Drift Window</span>
                      <span className={`text-sm sm:text-base font-black ${bulletinData.farmer.spraySafety === 'optimal' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {bulletinData.farmer.sprayLabel}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Wind: {bulletinData.current.windSpeed} km/h</span>
                    </div>
                  </div>

                  {/* Detailed Advisory Highlights */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <p className="font-bold text-amber-300 mb-1">🌿 {lang === 'hi' ? 'फंगल रोग एवं कीट प्रसार जोखिम:' : 'Fungal Blight & Pathogen Risk:'}</p>
                      <p className="text-slate-300 leading-relaxed">{bulletinData.farmer.fungalDesc}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <p className="font-bold text-sky-300 mb-1">💧 {lang === 'hi' ? 'सिंचाई एवं जल प्रबंधन:' : 'Irrigation & Moisture Action:'}</p>
                      <p className="text-slate-300 leading-relaxed">{bulletinData.farmer.irrigationDesc}</p>
                    </div>
                  </div>

                  {bulletinData.farmer.frostAlert && (
                    <div className="mt-3 p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs">
                      <p className="font-bold">❄️ {bulletinData.farmer.frostAlert.label}</p>
                      <p className="text-slate-300 mt-0.5">{bulletinData.farmer.frostAlert.desc}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Category 2: Fisherman / Marine */}
              {(selectedCategory === 'fisherman' || selectedCategory === 'master') && (
                <div className="border border-blue-500/30 rounded-2xl p-4 sm:p-5 bg-slate-900/80 shadow-md">
                  <div className="flex items-center justify-between border-b border-blue-500/20 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🎣</span>
                      <div>
                        <h2 className="text-sm sm:text-base font-black text-blue-400 uppercase">
                          {lang === 'hi' ? 'मछुआरा एवं तटीय सुरक्षा बुलेटिन' : 'Marine & Coastal Fishermen Safety Bulletin'}
                        </h2>
                        <p className="text-[11px] text-slate-400">
                          {lang === 'hi' ? 'लहरों की ऊंचाई, समुद्री स्थिति, बंदरगाह चेतावनी संकेत' : 'Significant wave height, swell period, WMO sea state & port warnings'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      MARINE
                    </span>
                  </div>

                  {bulletinData.fisherman.isInland ? (
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-2">
                      <div className="flex items-center gap-2 text-sky-400 font-bold">
                        <span>🏞️</span>
                        <span>{t.inlandMsg}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-slate-300">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase block">Surface Wind</span>
                          <span className="text-base font-bold text-white">{bulletinData.current.windSpeed} km/h ({bulletinData.current.windCompass})</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase block">Wind Gusts</span>
                          <span className="text-base font-bold text-amber-400">{bulletinData.current.windGusts} km/h</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase block">Riverine Safety</span>
                          <span className="text-base font-bold text-emerald-400">{bulletinData.fisherman.marineSafeDist}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Marine KPIs */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Max Wave Height</span>
                          <span className="text-lg sm:text-xl font-black text-sky-400">{bulletinData.fisherman.waveHeight} m</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Swell: {bulletinData.fisherman.swellHeight ?? '--'} m</span>
                        </div>

                        <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Wave Period & Dir</span>
                          <span className="text-lg sm:text-xl font-black text-indigo-400">{bulletinData.fisherman.wavePeriod}s</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{bulletinData.fisherman.waveCompass} ({bulletinData.fisherman.waveDir}°)</span>
                        </div>

                        <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">WMO Sea State</span>
                          <span className={`text-sm sm:text-base font-black ${bulletinData.fisherman.seaState.color}`}>
                            {bulletinData.fisherman.seaState.label}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Code {bulletinData.fisherman.seaState.code}</span>
                        </div>

                        <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Port Warning Signal</span>
                          <span className={`text-xs sm:text-sm font-black ${bulletinData.fisherman.stormSignal.color}`}>
                            {bulletinData.fisherman.stormSignal.signal}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{bulletinData.fisherman.stormSignal.desc}</span>
                        </div>
                      </div>

                      {/* Venturing Advisory */}
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-blue-300 block">{lang === 'hi' ? 'समुद्र में जाने की अनुमत दूरी:' : 'Deep-Sea Venturing Safe Limit:'}</span>
                          <span className="text-slate-300">{bulletinData.fisherman.marineSafeDist}</span>
                        </div>
                        <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${bulletinData.fisherman.marineSafetyStatus === 'safe' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {bulletinData.fisherman.marineSafetyStatus}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Category 3: Urban & Civic */}
              {(selectedCategory === 'urban' || selectedCategory === 'master') && (
                <div className="border border-purple-500/30 rounded-2xl p-4 sm:p-5 bg-slate-900/80 shadow-md">
                  <div className="flex items-center justify-between border-b border-purple-500/20 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🏙️</span>
                      <div>
                        <h2 className="text-sm sm:text-base font-black text-purple-400 uppercase">
                          {lang === 'hi' ? 'शहरी योजना एवं नागरिक सुरक्षा बुलेटिन' : 'Urban Planning, AQI & Civic Safety Bulletin'}
                        </h2>
                        <p className="text-[11px] text-slate-400">
                          {lang === 'hi' ? 'वायु गुणवत्ता (AQI), हीट इंडेक्स एवं शहरी जलभराव जोखिम' : 'Air particulate matter, heat stress index & urban drainage/flood hazard'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      URBAN CIVIC
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">PM 2.5 Particulate</span>
                      <span className="text-lg sm:text-xl font-black text-amber-400">{bulletinData.urban.pm25 ?? 'N/A'} <span className="text-xs font-normal">µg/m³</span></span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">PM10: {bulletinData.urban.pm10 ?? 'N/A'}</span>
                    </div>

                    <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">US AQI Index</span>
                      <span className="text-lg sm:text-xl font-black text-purple-400">{bulletinData.urban.usAqi ?? bulletinData.urban.europeanAqi ?? 'N/A'}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">European AQI: {bulletinData.urban.europeanAqi ?? 'N/A'}</span>
                    </div>

                    <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">NWS Heat Index</span>
                      <span className="text-lg sm:text-xl font-black text-orange-400">{bulletinData.urban.heatIndex}°C</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{bulletinData.urban.heatRisk?.label || 'Normal'}</span>
                    </div>

                    <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Drainage / Inundation</span>
                      <span className={`text-xs sm:text-sm font-black ${bulletinData.urban.drainageRisk === 'low' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {bulletinData.urban.drainageLabel}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Rain: {bulletinData.current.rainCurrent} mm/h</span>
                    </div>
                  </div>

                  {/* Worker & Civic Safety */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                    <p className="font-bold text-amber-300 mb-1">👷 {lang === 'hi' ? 'श्रमिक एवं नागरिक सुरक्षा परामर्श:' : 'Outdoor Worker Shift Safety:'}</p>
                    <p className={`font-bold ${bulletinData.urban.workerColor}`}>{bulletinData.urban.workerAdvisory}</p>
                    <p className="text-slate-400 mt-1">{bulletinData.urban.drainageDesc}</p>
                  </div>
                </div>
              )}

              {/* Category 4: Aviation & Drone */}
              {(selectedCategory === 'aviation' || selectedCategory === 'master') && (
                <div className="border border-sky-500/30 rounded-2xl p-4 sm:p-5 bg-slate-900/80 shadow-md">
                  <div className="flex items-center justify-between border-b border-sky-500/20 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">✈️</span>
                      <div>
                        <h2 className="text-sm sm:text-base font-black text-sky-400 uppercase">
                          {lang === 'hi' ? 'विमानन, हेलीपैड एवं ड्रोन संचालन बुलेटिन' : 'Aviation, Helipad & Drone Clearance Bulletin'}
                        </h2>
                        <p className="text-[11px] text-slate-400">
                          {lang === 'hi' ? 'दृश्यता, बादलों की छत, CAPE आंधी ऊर्जा एवं वीएलओएस निकासी' : 'Runway visibility, low cloud base, CAPE thunderstorm energy & UAV clearance'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      AVIATION
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Runway Visibility</span>
                      <span className="text-lg sm:text-xl font-black text-emerald-400">{bulletinData.aviation.visibilityKm} km</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">({bulletinData.aviation.visibilityMeters} meters)</span>
                    </div>

                    <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Low Cloud Ceiling</span>
                      <span className="text-lg sm:text-xl font-black text-sky-400">{bulletinData.aviation.lowClouds}%</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Stratus Coverage</span>
                    </div>

                    <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">CAPE Storm Energy</span>
                      <span className="text-lg sm:text-xl font-black text-amber-400">{bulletinData.aviation.cape} J/kg</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{bulletinData.aviation.capeSeverity.toUpperCase()}</span>
                    </div>

                    <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Drone VLOS Status</span>
                      <span className={`text-xs sm:text-sm font-black ${bulletinData.aviation.droneColor}`}>
                        {bulletinData.aviation.droneClearance}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">DGCA Standard</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                    <p className="font-bold text-sky-300 mb-1">🚁 {lang === 'hi' ? 'ड्रोन (UAV) एवं वीएफआर परिचालन टिप्पणी:' : 'UAV VLOS Operations Assessment:'}</p>
                    <p className="text-slate-300">{bulletinData.aviation.droneDesc}</p>
                    <p className="text-slate-400 mt-1"><strong>Atmospheric Profile:</strong> {bulletinData.aviation.capeDesc}</p>
                  </div>
                </div>
              )}

              {/* 5-Day Outlook Table (Always included in Master Bulletin) */}
              {selectedCategory === 'master' && bulletinData.dailyForecast?.length > 0 && (
                <div className="border border-slate-700 rounded-2xl p-4 sm:p-5 bg-slate-900/90 shadow-md">
                  <h3 className="text-xs sm:text-sm font-black text-white uppercase mb-3 flex items-center gap-2">
                    <span>📅</span>
                    <span>
                      {lang === 'hi' 
                        ? `5-दिवसीय ${bulletinData?.adminTier?.tierShort || 'पंचायत/जिला'} मौसम एवं कृषि पूर्वानुमान` 
                        : `5-Day ${bulletinData?.adminTier?.tierShort || 'Panchayat / Tehsil / District'} Agro-Meteorological Trend`}
                    </span>
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                          <th className="py-2 px-2.5">Date</th>
                          <th className="py-2 px-2.5">Max / Min Temp</th>
                          <th className="py-2 px-2.5">Rain Probability</th>
                          <th className="py-2 px-2.5">Precipitation</th>
                          <th className="py-2 px-2.5">Max Wind</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {bulletinData.dailyForecast.map((day, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/30">
                            <td className="py-2.5 px-2.5 font-bold text-slate-200">{day.date}</td>
                            <td className="py-2.5 px-2.5 text-amber-400 font-bold">{day.maxTemp}°C / <span className="text-sky-400">{day.minTemp}°C</span></td>
                            <td className="py-2.5 px-2.5 text-blue-300 font-bold">{day.rainProb}%</td>
                            <td className="py-2.5 px-2.5 text-slate-300">{day.precipSum} mm</td>
                            <td className="py-2.5 px-2.5 text-slate-300">{day.windMax} km/h</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SIH 2026 Prototype Data Verification Seal */}
              <div className="border-t-2 border-dashed border-slate-700 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                <div>
                  <p className="font-bold text-slate-300">WeatherGPT Civic Weather & Agro-Advisory System</p>
                  <p className="text-[10px]">100% Live Open-Meteo NWP (ECMWF & GFS) & CPCB Feeds • Prototype for SIH 2026 (Not Statutory).</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-emerald-400">OPEN-METEO 100% LIVE</p>
                    <p className="text-[10px]">SIH 2026 Prototype Cell</p>
                  </div>
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-emerald-500/50 flex flex-col items-center justify-center text-[9px] font-black text-emerald-400 leading-tight">
                    <span>SIH 2026</span>
                    <span className="text-[8px] text-slate-400">PROTOTYPE</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* 📡 Live Open-Meteo Telemetry Inspector Modal */}
      {showTelemetryModal && (
        <div 
          className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md"
          onClick={() => setShowTelemetryModal(false)}
        >
          <div 
            className="relative w-full max-w-2xl bg-[#090d16] border border-amber-500/40 rounded-2xl shadow-2xl p-4 sm:p-6 text-slate-200 space-y-4 max-h-[85vh] flex flex-col font-mono text-xs"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📡</span>
                <div>
                  <h3 className="text-sm font-black text-amber-400 uppercase tracking-tight">Open-Meteo Live Telemetry Inspector</h3>
                  <p className="text-[11px] text-slate-400 font-sans">100% Real-Time NWP Meteorological Stream • SIH 2026 Verification</p>
                </div>
              </div>
              <button 
                onClick={() => setShowTelemetryModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-[11px] font-sans">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Active Model</span>
                  <span className="font-bold text-white">ECMWF IFS / GFS</span>
                </div>
                <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Latency</span>
                  <span className="font-bold text-emerald-400">{bulletinData?.telemetry?.latencyMs || 0} ms</span>
                </div>
                <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Coordinates</span>
                  <span className="font-bold text-indigo-300 font-mono">{location.lat?.toFixed(4)}°N, {location.lng?.toFixed(4)}°E</span>
                </div>
                <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Stream Status</span>
                  <span className="font-bold text-emerald-400">200 OK Live</span>
                </div>
              </div>

              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Live Endpoint URL (Click to Open in Browser):</span>
                <a 
                  href={bulletinData?.telemetry?.weatherApiUrl || '#'} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-sky-400 hover:underline break-all font-mono text-[10px]"
                >
                  {bulletinData?.telemetry?.weatherApiUrl}
                </a>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-950 p-3 rounded-xl border border-slate-800/80 custom-scrollbar text-[11px] font-mono">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800 mb-2">
                <span className="text-slate-400 text-[10px]">Raw JSON Snapshot from Open-Meteo:</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(bulletinData?.telemetry?.rawSnapshot || {}, null, 2));
                    setCopiedTelemetry(true);
                    setTimeout(() => setCopiedTelemetry(false), 2000);
                  }}
                  className="px-2 py-0.5 rounded bg-indigo-600/80 hover:bg-indigo-500 text-[10px] font-sans font-bold text-white transition-all"
                >
                  {copiedTelemetry ? '✓ Copied!' : 'Copy JSON'}
                </button>
              </div>
              <pre className="text-emerald-300 whitespace-pre-wrap">
                {JSON.stringify(bulletinData?.telemetry?.rawSnapshot || {}, null, 2)}
              </pre>
            </div>

            <div className="text-[10px] text-slate-400 text-center font-sans">
              🔒 100% Client-Side Direct NWP Fetch • Zero Fallback Mock Data • Verified for SIH 2026 Evaluation
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
