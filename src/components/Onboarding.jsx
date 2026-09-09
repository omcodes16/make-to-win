import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LANGUAGES } from '../utils/constants';
import UserGuideModal from './UserGuideModal';

const PROFILES = [
  {
    code: 'farmer',
    label: 'Farmer / Agriculture',
    sub: 'किसान / कृषि',
    icon: '🌾',
    badge: 'Agri Intelligence',
    bg: '/backgrounds/farmer.jpg',
    description: 'Soil moisture, irrigation alerts, crop spray windows & fungal disease risk.',
    tags: ['Soil Moisture', 'Spraying Window', 'Evapotranspiration'],
    accent: 'emerald',
    bullets: [
      { hi: '🌿 पत्ती रोग पहचान एवं फंगस जोखिम चेतावनी', en: 'Leaf Disease Detection & Fungal Infection Alerts' },
      { hi: '💧 48 घंटे सुरक्षित स्प्रे समय (दवा बर्बादी से बचाव)', en: '48-Hour Safe Spray Window (Prevents chemical loss)' },
      { hi: '🌦️ पाला, ओलावृष्टि एवं PMFBY फसल बीमा सहायता', en: 'Frost, Hailstorm & PMFBY Crop Insurance Support' },
    ]
  },
  {
    code: 'fisherman',
    label: 'Fisherman / Coastal Marine',
    sub: 'मछुआरा / तटीय सुरक्षा',
    icon: '🎣',
    badge: 'Marine Hub',
    bg: '/backgrounds/fisherman.jpg',
    description: 'Oceanic wave heights, swell period, sea surface winds & storm warnings.',
    tags: ['Wave Height', 'Sea Wind', 'Safe to Sail'],
    accent: 'cyan',
    bullets: [
      { hi: '🌊 कल्लाकडाल (Kallakkadal) अचानक लहर पूर्व चेतावनी', en: 'INCOIS Kallakkadal Sudden Swell Surge Early Warning' },
      { hi: '🚨 IMBL समुद्री सीमा रडार (विदेशी नेवी गिरफ्तारी से बचाव)', en: 'IMBL Border Radar (Prevents Sri Lanka/Pak Navy Arrests)' },
      { hi: '🛶 नाव श्रेणी अनुसार सुरक्षा (काटामारन, वल्लम, ट्रॉलर)', en: '3-Tier Vessel Seaworthiness (Catamaran, Vallam, Trawler)' },
    ]
  },
  {
    code: 'aviation',
    label: 'Aviation & Drone Pilot',
    sub: 'उड्डयन / पायलट और ड्रोन',
    icon: '✈️',
    badge: 'Aero Met',
    bg: '/backgrounds/aviation.jpg',
    description: 'Visibility, cloud ceiling, VFR/IFR conditions, wind gusts & drone safety.',
    tags: ['Visibility', 'Cloud Ceiling', 'Drone VLOS'],
    accent: 'sky',
    bullets: [
      { hi: '✈️ VFR/IFR दृश्यता एवं क्लाउड बेस सीलिंग', en: 'VFR/IFR Surface Visibility & Cloud Base Ceiling' },
      { hi: '🌪️ विंड शियर, टर्बुलेंस एवं अल्टीमीटर प्रेशर', en: 'Wind Shear, Atmospheric Turbulence & Altimeter' },
      { hi: '🛸 ड्रोन पायलट सुरक्षा एवं दृश्य सीमा (VLOS)', en: 'Drone Pilot VLOS & High Altitude Gust Limits' },
    ]
  },
  {
    code: 'urbanPlanning',
    label: 'Urban Planner / City Ops',
    sub: 'शहरी योजनाकार / नगर निगम',
    icon: '🏙️',
    badge: 'City Ops',
    bg: '/backgrounds/urban.jpg',
    description: 'PM2.5/PM10 AQI, urban heat island, drainage flood risk & worker safety.',
    tags: ['PM2.5 AQI', 'Heat Index', 'Drainage Alert'],
    accent: 'purple',
    bullets: [
      { hi: '🏙️ PM2.5/PM10 वायु गुणवत्ता एवं प्रदूषण चेतावनी', en: 'Real-Time PM2.5 & PM10 Particulate AQI Tracking' },
      { hi: '🌡️ NWS हीट इंडेक्स एवं आउटडोर वर्कर सुरक्षा', en: 'NWS Rothfusz Heat Index & Outdoor Worker Safety' },
      { hi: '🌧️ ड्रेनेज ओवरफ्लो एवं शहरी जलभराव जोखिम', en: 'High-Runoff Urban Drainage Flood & Waterlogging Risk' },
    ]
  },
  {
    code: 'general',
    label: 'General Citizen / Commuter',
    sub: 'सामान्य नागरिक / दैनिक मौसम',
    icon: '🌍',
    badge: 'Daily Living',
    bg: '/backgrounds/general.jpg',
    description: 'Hourly forecast, rain probability, UV index, commute tips & air quality.',
    tags: ['Daily Forecast', 'Rain Likelihood', 'Commute Tips'],
    accent: 'indigo',
    bullets: [
      { hi: '🌤️ प्रति-घंटे का मौसम, बारिश की संभावना व छाता अलर्ट', en: 'Hourly Forecast, Rain Probability & Umbrella Alerts' },
      { hi: '🚨 NDMA सचेत आपदा एवं चक्रवात चेतावनी अलर्ट', en: 'Official NDMA Sachet Disaster & Cyclone Early Warnings' },
      { hi: '📻 आवाज बुलेटिन एवं स्थानीय भाषा में वॉइस चैट', en: 'Aawaz-e-Mausam Spoken Bulletin & Voice-First Chat' },
    ]
  }
];

const ROLE_CARDS = [
  {
    code: 'farmer',
    icon: '🌾',
    name: { hi: 'किसान', en: 'Farmer', bn: 'কৃষক', as: 'কৃষক', default: 'Farmer' },
    sub: { hi: 'फसल डॉक्टर • 48h स्प्रे', en: 'Leaf Doctor • Safe Spray', bn: 'ফসল ডাক্তার • স্প্রে', as: 'শস্য ডাক্তাৰ • স্প্ৰে', default: 'Crop Defense' },
    badge: 'Agri',
  },
  {
    code: 'fisherman',
    icon: '🎣',
    name: { hi: 'मछुआरा', en: 'Fisherman', bn: 'মৎস্যজীবী', as: 'মাছমৰীয়া', default: 'Fisherman' },
    sub: { hi: 'लहर रडार • IMBL सीमा', en: 'Swell Waves • IMBL Radar', bn: 'ঢেউ রাডার • সীমানা', as: 'ঢৌ ৰাডাৰ • সীমা', default: 'Marine Safety' },
    badge: 'Marine',
  },
  {
    code: 'aviation',
    icon: '✈️',
    name: { hi: 'उड्डयन', en: 'Aviation', bn: 'বিমান চালনা', as: 'বিমান পৰিবহণ', default: 'Aviation' },
    sub: { hi: 'दृश्यता • विंड शियर', en: 'Visibility • Wind Shear', bn: 'দৃশ্যমানতা • উইন্ড শিয়ার', as: 'দৃশ্যমানতা • বতাহ', default: 'Aero Met' },
    badge: 'Aero',
  },
  {
    code: 'urbanPlanning',
    icon: '🏙️',
    name: { hi: 'शहरी निकाय', en: 'City Ops', bn: 'শহর পরিকল্পনা', as: 'নগৰ পৰিকল্পনা', default: 'City Ops' },
    sub: { hi: 'AQI • जलभराव खतरा', en: 'AQI • Drainage Flood', bn: 'বায়ু মান • বন্যা ঝুঁকি', as: 'বায়ু মান • বানপানী', default: 'City Ops' },
    badge: 'Urban',
  },
  {
    code: 'general',
    icon: '🌍',
    name: { hi: 'आम नागरिक', en: 'Citizen', bn: 'নাগরিক', as: 'নাগৰিক', default: 'Citizen' },
    sub: { hi: 'दैनिक मौसम • आपात SOS', en: 'Daily Weather • SOS', bn: 'দৈনিক আবহাওয়া • SOS', as: 'দৈনিক বতৰ • SOS', default: 'Living' },
    badge: 'Citizen',
  },
];

const STEP0_I18N = {
  hi: {
    welcome: 'आपका मौसम साथी — WeatherGPT',
    tagline: 'भारत का राष्ट्रीय AI मौसम, कृषि एवं तटीय सुरक्षा तंत्र',
    sub: 'किसानों, मछुआरों व नागरिकों हेतु सटीक चेतावनी, बोलता रेडियो व आपातकालीन सहायता',
    cta: 'सेटअप शुरू करें / Get Started',
    langSelectTitle: 'अपनी भाषा चुनें (Select Language):'
  },
  bn: {
    welcome: 'আপনার আবহাওয়া বন্ধু — WeatherGPT',
    tagline: 'ভারতের জাতীয় এআই আবহাওয়া ও উপকূলীয় সুরক্ষা ব্যবস্থা',
    sub: 'কৃষক, মৎস্যজীবী ও সাধারণ নাগরিকদের জন্য সঠিক পরামর্শ ও জরুরি সুরক্ষা',
    cta: 'সেটআপ শুরু করুন / Get Started',
    langSelectTitle: 'ভাষা নির্বাচন করুন (Select Language):'
  },
  as: {
    welcome: 'আপোনাৰ বতৰৰ বন্ধু — WeatherGPT',
    tagline: 'ভাৰতৰ ৰাষ্ট্ৰীয় এআই বতৰ আৰু উপকূলীয় সুৰক্ষা ব্যৱস্থা',
    sub: 'কৃষক, মাছমৰীয়া আৰু সাধাৰণ নাগৰিকৰ বাবে নিৰ্ভুল সতৰ্কবাণী আৰু জৰুৰী সাহাৰ্য',
    cta: 'ছেটআপ আৰম্ভ কৰক / Get Started',
    langSelectTitle: 'ভাষা বাছনি কৰক (Select Language):'
  },
  en: {
    welcome: 'Your Weather Companion — WeatherGPT',
    tagline: "Bharat's National AI Climate, Agriculture & Coastal Defense Network",
    sub: 'Tailored intelligence for farmers, fishermen, aviation pilots & every citizen',
    cta: 'Get Started / सेटअप शुरू करें',
    langSelectTitle: 'Choose Your Language / अपनी भाषा चुनें:'
  }
};

const STEPPER_ITEMS = [
  { step: 0, title: 'Intro', sub: 'Welcome', icon: '✨' },
  { step: 1, title: 'Your Role', sub: 'I am a...', icon: '👤' },
  { step: 2, title: 'Language', sub: 'Dialect', icon: '🌐' },
  { step: 3, title: 'Launch', sub: 'Ready', icon: '🚀' },
];

const POPULAR_LANG_CODES = ['hi', 'en', 'bn', 'as', 'mr', 'ta', 'te', 'gu', 'pa', 'kn'];

const DOMAIN_TELEMETRY = {
  farmer: {
    engine: 'Mausam-Drishti Agri-AI 2.0',
    tag: 'Agri Intelligence',
    accentColor: '#10b981',
    accentBorder: 'rgba(16, 185, 129, 0.45)',
    accentBg: 'rgba(16, 185, 129, 0.12)',
    badge: '🌿 Live Agri-Vision Net',
    metrics: [
      { label: 'Soil Moisture', value: '64%', status: 'Optimal Root Zone', dot: '#10b981', icon: '🌱' },
      { label: 'Spray Window', value: 'Open 48h', status: 'Wind < 12 km/h', dot: '#10b981', icon: '💧' },
      { label: 'Fungal Risk', value: 'Low', status: 'Humidity 58%', dot: '#10b981', icon: '🦠' },
    ],
    tools: [
      { icon: '📷', label: 'Fasal Doctor Vision AI' },
      { icon: '💧', label: '48h Safe Spray Advisor' },
      { icon: '🌾', label: 'PMFBY Crop Insurance Desk' },
    ],
    sampleQuery: {
      hi: 'क्या आज बारिश होगी और मैं कीटनाशक स्प्रे कर सकता हूं?',
      en: 'Will it rain today and is it safe to spray my crops?',
      bn: 'আজ কি বৃষ্টি হবে এবং ফসলে ওষুধ স্প্রে করা কি নিরাপদ?',
      as: 'আজি বৰষুণ হবনে আৰু শস্যত ঔষধ স্প্ৰে কৰিব পাৰিমনে?',
      mr: 'आज पाऊस पडेल का आणि औषध फवारणी करणे सुरक्षित आहे का?',
      default: 'Will it rain today and is it safe to spray my crops?'
    }
  },
  fisherman: {
    engine: 'Sagar-Rakshak Coastal Marine 2.0',
    tag: 'Marine Safety Hub',
    accentColor: '#06b6d4',
    accentBorder: 'rgba(6, 182, 212, 0.45)',
    accentBg: 'rgba(6, 182, 212, 0.12)',
    badge: '🌊 INCOIS Ocean Radar',
    metrics: [
      { label: 'Swell Waves', value: '1.6 m', status: 'Safe for Vallam', dot: '#10b981', icon: '🌊' },
      { label: 'IMBL Radar', value: '22 NM Safe', status: 'Border Clear', dot: '#10b981', icon: '🧭' },
      { label: 'Kallakkadal', value: 'Surge Clear', status: 'No Tidal Shock', dot: '#10b981', icon: '⚡' },
    ],
    tools: [
      { icon: '🌊', label: 'Ocean Swell Waves Radar' },
      { icon: '🚨', label: 'IMBL GPS Border Alarm' },
      { icon: '📻', label: 'Marine Spoken Radio' },
    ],
    sampleQuery: {
      hi: 'क्या आज समुद्र में मछली पकड़ना सुरक्षित है? लहरों की ऊंचाई?',
      en: 'Is the sea safe for fishing today? Wave height & swell forecast?',
      bn: 'আজ কি সমুদ্রে মাছ ধরা নিরাপদ? ঢেউয়ের উচ্চতা কত?',
      as: 'আজি সমুদ্ৰত মাছ মৰা নিৰাপদনে? ঢৌৰ উচ্চতা কিমান?',
      mr: 'आज समुद्रात मासेमारी करणे सुरक्षित आहे का? लाटांची उंची किती?',
      default: 'Is the sea safe for fishing today? Wave height & swell forecast?'
    }
  },
  aviation: {
    engine: 'AeroMet Precision Vector 2.0',
    tag: 'Aviation & Drone Net',
    accentColor: '#38bdf8',
    accentBorder: 'rgba(56, 189, 248, 0.45)',
    accentBg: 'rgba(56, 189, 248, 0.12)',
    badge: '✈️ METAR/TAF Realtime',
    metrics: [
      { label: 'Flight Rules', value: 'VFR Active', status: 'Ceiling > 4,500 ft', dot: '#10b981', icon: '🛫' },
      { label: 'Runway Vis', value: '9,000 m', status: 'Approach Clear', dot: '#10b981', icon: '👀' },
      { label: 'Wind Shear', value: 'Nil Delta', status: '< 8 kts Microburst Free', dot: '#10b981', icon: '🌪️' },
    ],
    tools: [
      { icon: '🛩️', label: 'METAR/TAF Terminal Decoders' },
      { icon: '🌪️', label: 'Low-Level Wind Shear Alert' },
      { icon: '🛸', label: 'Drone VLOS Flight Ceiling' },
    ],
    sampleQuery: {
      hi: 'क्या आज VFR उड़ान और ड्रोन उड़ाने की अनुमति है?',
      en: 'Are current conditions VFR or IFR? Cloud ceiling & visibility?',
      bn: 'আজকে VFR নাকি IFR অবস্থা? ক্লাউড সিলিং কত?',
      as: 'আজি VFR নে IFR অৱস্থা? ডাৱৰৰ উচ্চতা কিমান?',
      mr: 'आज VFR की IFR परिस्थिती आहे? धावपट्टीची दृश्यमानता?',
      default: 'Are current conditions VFR or IFR? Cloud ceiling & visibility?'
    }
  },
  urbanPlanning: {
    engine: 'CityAQI & Urban Resilience 2.0',
    tag: 'Municipal Disaster Grid',
    accentColor: '#a855f7',
    accentBorder: 'rgba(168, 85, 247, 0.45)',
    accentBg: 'rgba(168, 85, 247, 0.12)',
    badge: '🏙️ CPCB Realtime AQI',
    metrics: [
      { label: 'CPCB AQI', value: '142 Mod', status: 'PM2.5 Dominant', dot: '#f59e0b', icon: '🏭' },
      { label: 'Heat Index', value: '34°C Caution', status: 'Worker Hydration', dot: '#f59e0b', icon: '🌡️' },
      { label: 'Urban Flood', value: '12% Low', status: 'Drainage Clear', dot: '#10b981', icon: '🌧️' },
    ],
    tools: [
      { icon: '😷', label: 'PM2.5 / PM10 AQI Matrix' },
      { icon: '🌡️', label: 'NWS Heat Island Forecast' },
      { icon: '🌧️', label: 'Stormwater Runoff Model' },
    ],
    sampleQuery: {
      hi: 'आज वायु गुणवत्ता सूचकांक (AQI) और जलभराव का खतरा क्या है?',
      en: 'What is the real-time PM2.5 AQI and urban drainage flood risk?',
      bn: 'আজকের AQI কত এবং ড্রেনেজ বন্যার ঝুঁকি কি আছে?',
      as: 'আজিৰ বায়ুৰ মান (AQI) আৰু চহৰৰ বানপানীৰ আশংকা কিমান?',
      mr: 'आज हवेची गुणवत्ता (AQI) आणि पाणी तुंबण्याचा धोका काय आहे?',
      default: 'What is the real-time PM2.5 AQI and urban drainage flood risk?'
    }
  },
  general: {
    engine: 'Sachet Public Met-Defense 2.0',
    tag: 'Citizen Life Safety',
    accentColor: '#6366f1',
    accentBorder: 'rgba(99, 102, 241, 0.45)',
    accentBg: 'rgba(99, 102, 241, 0.12)',
    badge: '🚨 NDMA Emergency Net',
    metrics: [
      { label: 'Microclimate', value: '28°C Clear', status: 'Partly Cloudy', dot: '#10b981', icon: '🌤️' },
      { label: 'NDMA Sachet', value: 'All Clear', status: 'Green Alert Zone', dot: '#10b981', icon: '🚨' },
      { label: 'Rain Chance', value: '15% Low', status: 'No Umbrella Needed', dot: '#10b981', icon: '☔' },
    ],
    tools: [
      { icon: '🌤️', label: 'Hourly Hyperlocal Forecast' },
      { icon: '📻', label: 'Aawaz-e-Mausam Spoken Radio' },
      { icon: '🆘', label: 'Air-Gapped Offline SOS Mesh' },
    ],
    sampleQuery: {
      hi: 'आज मेरे शहर में बारिश होगी क्या? क्या कोई चक्रवात अलर्ट है?',
      en: 'Will it rain today in my city? Any active cyclone warning?',
      bn: 'আজ কি আমার শহরে বৃষ্টি হবে? কোনো ঝড় বা বৃষ্টির সতর্কতা আছে?',
      as: 'আজি মোৰ চহৰত বৰষুণ হবনে? ওচৰত কোনো ঘূৰ্ণীবতাহৰ সতৰ্কতা আছেনে?',
      mr: 'आज माझ्या शहरात पाऊस पडेल का? चक्रीवादळाचा इशारा आहे का?',
      default: 'Will it rain today in my city? Any active cyclone warning?'
    }
  }
};

const JUDGE_PRESETS = [
  {
    label: '🌾 Kisan Demo (Hindi)',
    role: 'farmer',
    lang: 'hi',
    badge: 'Agri AI',
  },
  {
    label: '🎣 Machhua Demo (Bengali)',
    role: 'fisherman',
    lang: 'bn',
    badge: 'Marine Hub',
  },
  {
    label: '✈️ Drone Pilot (English)',
    role: 'aviation',
    lang: 'en',
    badge: 'Aero Met',
  },
  {
    label: '🏙️ City AQI (English)',
    role: 'urbanPlanning',
    lang: 'en',
    badge: 'City Ops',
  },
  {
    label: '🚨 Sachet SOS Demo (Hindi)',
    role: 'general',
    lang: 'hi',
    badge: 'NDMA Alert',
  },
];

export default function Onboarding() {
  const { state, dispatch } = useApp();

  // Steps:
  // 0: Welcome to WeatherGPT Hero Screen
  // 1: Select Your Role
  // 2: Select Language
  // 3: Summary & Ready to Launch
  const [step, setStep] = useState(0);

  const [selectedProfile, setSelectedProfile] = useState(state.userProfile || 'farmer');
  const [selectedLanguage, setSelectedLanguage] = useState(state.language || 'en');
  const [langSearch, setLangSearch] = useState('');
  const [isGuideOpen, setGuideOpen] = useState(false);

  const activeProfileData = PROFILES.find(p => p.code === selectedProfile) || PROFILES[0];
  const activeLangData = LANGUAGES.find(l => l.code === selectedLanguage) || LANGUAGES[0];

  const filteredLanguages = LANGUAGES.filter(l =>
    l.label.toLowerCase().includes(langSearch.toLowerCase()) ||
    l.nativeLabel.toLowerCase().includes(langSearch.toLowerCase()) ||
    l.code.toLowerCase().includes(langSearch.toLowerCase())
  );

  const handleStartApp = () => {
    dispatch({ type: 'SET_PROFILE', payload: selectedProfile });
    dispatch({ type: 'SET_LANGUAGE', payload: selectedLanguage });
    dispatch({ type: 'SET_ONBOARDED' });
  };

  const handleSkip = () => {
    dispatch({ type: 'SET_ONBOARDED' });
  };

  const isLight = state.uiTheme === 'light';

  return (
    <div 
      className="min-h-[100dvh] flex flex-col items-center justify-center p-3 sm:p-6 relative overflow-x-hidden font-sans select-none transition-colors duration-700"
      style={{ color: 'var(--text-primary)' }}
    >
      {/* Weather-Informed Atmospheric Sky Canvas */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center transition-all duration-1000 scale-105 blur-[2px]"
        style={{
          backgroundImage: `url(${step === 1 && activeProfileData ? activeProfileData.bg : '/backgrounds/onboarding_clean.jpg'})`,
          opacity: isLight ? 0.12 : 0.28,
        }}
      />

      {/* Atmospheric Deep Sky-Blue to Indigo Gradient Overlay */}
      <div 
        className="fixed inset-0 z-0 transition-colors duration-700 pointer-events-none" 
        style={{
          background: isLight
            ? 'radial-gradient(120% 90% at 50% 0%, rgba(224, 242, 254, 0.94) 0%, rgba(240, 249, 255, 0.96) 50%, rgba(248, 250, 252, 0.98) 100%)'
            : 'radial-gradient(130% 95% at 50% -10%, rgba(14, 45, 95, 0.65) 0%, rgba(10, 22, 55, 0.85) 45%, rgba(6, 11, 28, 0.98) 100%)',
        }} 
      />

      {/* Faint Sunrise Dawn Radial Accent */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-1000"
        style={{
          background: 'radial-gradient(circle at 50% 12%, rgba(249, 115, 22, 0.09) 0%, rgba(99, 102, 241, 0.06) 40%, transparent 70%)',
          opacity: isLight ? 0.4 : 0.75,
        }}
      />

      {/* Top Header Bar */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 py-2 sm:px-8 sm:py-3 backdrop-blur-xl border-b transition-colors duration-500 shadow-sm"
        style={{ 
          backgroundColor: 'var(--header-bg)',
          borderColor: 'var(--header-border)' 
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden p-0.5 bg-gradient-to-tr from-amber-500 via-orange-500 to-indigo-600 shadow-md flex items-center justify-center">
            <img src="/logo.png" alt="WeatherGPT" className="w-full h-full object-cover rounded-[10px]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-black text-sm sm:text-base tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Weather<span className="text-amber-500 dark:text-amber-400">GPT</span>
              </span>
              <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                SIH '26
              </span>
            </div>
            <p className="text-[10px] hidden sm:block font-medium" style={{ color: 'var(--text-secondary)' }}>
              Powered by IMD | MoES | Supports 12 Indian Languages | Voice Enabled
            </p>
          </div>
        </div>

        {/* Center Header: National Met-Grid Status or Step Progression */}
        {step === 0 ? (
          <div 
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm backdrop-blur-md"
            style={{
              backgroundColor: 'var(--glass-bg)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              National Meteorological Grid Online
            </span>
            <span className="text-[10px] opacity-40">•</span>
            <span className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              37 Doppler Radars • 12 Languages Live
            </span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 md:gap-2.5">
            {STEPPER_ITEMS.map((item, i) => (
              <div
                key={item.title}
                onClick={() => {
                  if (i <= step) setStep(i);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all cursor-pointer border ${
                  step === i
                    ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-sky-700 text-white shadow-md shadow-indigo-600/30 scale-105 border-indigo-400'
                    : i < step
                    ? 'border-[var(--theme-border)] text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)]'
                    : 'border-transparent text-[var(--text-secondary)] opacity-55 hover:opacity-80'
                }`}
                style={{
                  backgroundColor: step === i ? undefined : 'var(--glass-bg)'
                }}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${step === i ? 'bg-amber-400 text-slate-950 shadow-sm' : 'bg-black/10 dark:bg-white/20'}`}>
                  {i + 1}
                </span>
                <div className="flex flex-col text-left leading-tight">
                  <span className="text-[11px] font-bold tracking-tight">{item.title}</span>
                  <span className={`text-[9px] font-medium ${step === i ? 'text-amber-200' : 'opacity-65'}`}>{item.sub}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Top Right: Theme Switcher & Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Quick Theme Switcher Pill */}
          <div 
            className="flex items-center p-0.5 rounded-full border shadow-sm"
            style={{ 
              backgroundColor: 'var(--glass-bg)',
              borderColor: 'var(--theme-border)'
            }}
          >
            {[
              { key: 'dark', icon: '🌙', label: 'Dark' },
              { key: 'light', icon: '☀️', label: 'Light' },
              { key: 'glass', icon: '🔮', label: 'Glass' },
            ].map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => dispatch({ type: 'SET_UI_THEME', payload: key })}
                className={`px-2 sm:px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                  state.uiTheme === key
                    ? 'bg-indigo-600 text-white shadow-sm scale-105'
                    : 'hover:text-[var(--text-primary)]'
                }`}
                style={{
                  color: state.uiTheme === key ? '#ffffff' : 'var(--text-secondary)'
                }}
                title={`Switch to ${label} Theme`}
              >
                <span>{icon}</span>
                <span className="hidden md:inline text-[10px]">{label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setGuideOpen(true)}
            className="hidden lg:flex transition-all text-xs font-semibold px-3 py-1.5 rounded-full border backdrop-blur-md items-center gap-1.5 shadow-sm"
            style={{
              backgroundColor: 'var(--glass-bg)',
              borderColor: 'var(--theme-border)',
              color: 'var(--text-primary)'
            }}
            title="Open User Guide"
          >
            <span>📖</span>
            <span>Guide</span>
          </button>

          <button
            onClick={handleSkip}
            className="transition-all text-xs font-semibold px-3 py-1.5 rounded-full border backdrop-blur-md flex items-center gap-1 shadow-sm"
            style={{
              backgroundColor: 'var(--glass-bg)',
              borderColor: 'var(--theme-border)',
              color: 'var(--text-secondary)'
            }}
          >
            <span>Skip</span>
            <span>➔</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-7xl relative z-10 pt-14 sm:pt-16 pb-2 px-2 sm:px-5 flex flex-col justify-between items-center min-h-[calc(100dvh-54px)] max-h-[100dvh] overflow-y-auto sm:overflow-hidden">
        {/* ========================================================================= */}
        {/* STEP 0: EXPRESS SETUP & DEMO LAUNCH (No-Scroll Presentation Mode) */}
        {/* ========================================================================= */}
        {step === 0 && (() => {
          const s0 = STEP0_I18N[selectedLanguage] || STEP0_I18N.en;
          const isHi = ['hi', 'mr', 'pa', 'gu'].includes(selectedLanguage);
          const activeRoleObj = ROLE_CARDS.find(r => r.code === selectedProfile) || ROLE_CARDS[0];
          const activeRoleTitle = activeRoleObj.name[selectedLanguage] || activeRoleObj.name.default;
          const activeLangObj = LANGUAGES.find(l => l.code === selectedLanguage) || LANGUAGES[0];
          const activeLangTitle = activeLangObj.nativeLabel || activeLangObj.label;
          const telemetry = DOMAIN_TELEMETRY[selectedProfile] || DOMAIN_TELEMETRY.farmer;
          const currentQuery = telemetry.sampleQuery[selectedLanguage] || telemetry.sampleQuery.default;

          return (
            <div className="w-full flex-1 flex flex-col justify-between items-center gap-2 sm:gap-2.5 py-1">
              {/* TOP HERO BRAND & TRUST BANNER */}
              <div 
                className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 px-3 py-1.5 rounded-2xl border backdrop-blur-xl shadow-sm hero-anim-1"
                style={{
                  backgroundColor: 'var(--glass-bg)',
                  borderColor: 'var(--theme-border)',
                }}
              >
                <div className="flex items-center gap-2.5 text-left">
                  {/* Living sky halo & radar icon */}
                  <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl p-0.5 bg-gradient-to-tr from-amber-500 via-orange-500 to-indigo-600 shadow-md flex items-center justify-center shrink-0">
                    <img src="/logo.png" alt="WeatherGPT Logo" className="w-full h-full object-cover rounded-[10px]" />
                    <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-slate-900" />
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-base sm:text-lg font-heading font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        Weather<span className="text-amber-500 dark:text-amber-400">GPT</span>
                      </h1>
                      <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/35 tracking-wider">
                        🇮🇳 SIH 2026 GRAND FINALIST
                      </span>
                    </div>
                    <p className="text-[11px] font-medium hidden sm:block truncate max-w-xl" style={{ color: 'var(--text-secondary)' }}>
                      {s0.tagline} • {s0.sub}
                    </p>
                  </div>
                </div>

                {/* 4 Trust Badges in sleek compact row */}
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {[
                    { icon: '🟢', text: '37 IMD Radars' },
                    { icon: '🗣️', text: '12 Languages' },
                    { icon: '⚡', text: 'Zero Login' },
                    { icon: '🆘', text: 'Offline SOS' },
                  ].map((b, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border backdrop-blur-md"
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--theme-border)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <span className="text-[9px]">{b.icon}</span>
                      <span>{b.text}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* MAIN TWO-COLUMN COMMAND CONSOLE (Zero Void, Balanced Grid) */}
              <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 flex-1 items-stretch">
                {/* LEFT COLUMN (7 Cols on LG): Domain Selection + Language + Presets */}
                <div className="lg:col-span-7 flex flex-col justify-between gap-2">
                  {/* 1. DOMAIN SELECTION (5 Persona Cards) */}
                  <div className="w-full flex flex-col gap-1.5 hero-anim-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <span>👤</span>
                        <span>{isHi ? '1. अपनी भूमिका चुनें (Select Domain / Persona):' : '1. Select Operational Domain / Persona:'}</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        ✓ {activeRoleTitle} Activated
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2 w-full">
                      {ROLE_CARDS.map((r) => {
                        const isSelected = selectedProfile === r.code;
                        const rTitle = r.name[selectedLanguage] || r.name.default;
                        const rSub = r.sub[selectedLanguage] || r.sub.default;

                        return (
                          <button
                            key={r.code}
                            type="button"
                            onClick={() => setSelectedProfile(r.code)}
                            className={`p-2 sm:p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-1 relative overflow-hidden group active:scale-95 ${
                              isSelected
                                ? 'border-amber-500 ring-2 ring-amber-400/50 shadow-md shadow-amber-500/20 scale-[1.02]'
                                : 'border-[var(--theme-border)] hover:border-amber-400/40 hover:bg-white/5'
                            }`}
                            style={{
                              backgroundColor: isSelected
                                ? (isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.14)')
                                : 'var(--card-bg)',
                            }}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xl p-1 rounded-lg bg-black/5 dark:bg-white/5">{r.icon}</span>
                              <span
                                className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${
                                  isSelected
                                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-xs'
                                    : 'bg-white/10 text-[var(--text-secondary)] border-transparent'
                                }`}
                              >
                                {isSelected ? '✓ ACTIVE' : r.badge}
                              </span>
                            </div>
                            <div>
                              <div
                                className="text-xs font-bold truncate"
                                style={{ color: isSelected ? (isLight ? '#92400e' : '#fbbf24') : 'var(--text-primary)' }}
                              >
                                {rTitle}
                              </div>
                              <div className="text-[9px] font-medium leading-tight truncate opacity-80" style={{ color: 'var(--text-secondary)' }}>
                                {rSub}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. REGIONAL LANGUAGE SELECTOR (10 Prominent Indian Languages) */}
                  <div className="w-full flex flex-col gap-1 hero-anim-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <span>🌐</span>
                        <span>{isHi ? '2. क्षेत्रीय भाषा चुनें (Select Indic Language):' : '2. Select Regional Language / Dialect:'}</span>
                      </span>
                      <span className="text-[10px] font-bold text-sky-500 dark:text-sky-400">
                        🗣️ {activeLangTitle} (Speech + Text)
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 w-full">
                      {POPULAR_LANG_CODES.map((code) => {
                        const langObj = LANGUAGES.find(l => l.code === code) || { label: code, nativeLabel: code };
                        const isCurrent = selectedLanguage === code;
                        return (
                          <button
                            key={code}
                            type="button"
                            onClick={() => {
                              setSelectedLanguage(code);
                              dispatch({ type: 'SET_LANGUAGE', payload: code });
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border shadow-xs active:scale-95 cursor-pointer outline-none ${
                              isCurrent
                                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white border-amber-300 shadow-sm shadow-amber-600/30 scale-105 ring-2 ring-amber-400/40 font-black'
                                : 'border-[var(--theme-border)] hover:border-amber-400/40 hover:bg-white/5'
                            }`}
                            style={{
                              backgroundColor: isCurrent ? undefined : 'var(--card-bg)',
                              color: isCurrent ? '#ffffff' : 'var(--text-primary)'
                            }}
                          >
                            <span>{langObj.nativeLabel || langObj.label}</span>
                            {code === 'hi' && <span className="ml-1 text-[9px] opacity-80">(Hindi)</span>}
                            {code === 'en' && <span className="ml-1 text-[9px] opacity-80">(EN)</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. 1-CLICK JUDGE PRESENTATION PRESETS (SIH Winning Showcase Feature) */}
                  <div className="w-full flex flex-col gap-1 hero-anim-4">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                        <span>🎯</span>
                        <span>{isHi ? 'जूरी त्वरित डेमो शॉर्टकट (Judge 1-Click Demo Presets):' : 'Judge & Jury 1-Click Demo Shortcuts:'}</span>
                      </span>
                      <span className="text-[9px] font-semibold text-[var(--text-secondary)]">
                        ⚡ Instant Profile & Dialect Sync
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 w-full">
                      {JUDGE_PRESETS.map((preset, pIdx) => {
                        const isMatched = selectedProfile === preset.role && selectedLanguage === preset.lang;
                        return (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => {
                              setSelectedProfile(preset.role);
                              setSelectedLanguage(preset.lang);
                              dispatch({ type: 'SET_PROFILE', payload: preset.role });
                              dispatch({ type: 'SET_LANGUAGE', payload: preset.lang });
                            }}
                            className={`px-2 py-1.5 rounded-lg border text-left transition-all text-[10px] font-bold flex flex-col justify-between cursor-pointer active:scale-95 ${
                              isMatched
                                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md ring-1 ring-indigo-400'
                                : 'border-[var(--theme-border)] hover:border-indigo-400/50 hover:bg-indigo-500/10'
                            }`}
                            style={{
                              backgroundColor: isMatched ? undefined : 'var(--card-bg)',
                              color: isMatched ? '#ffffff' : 'var(--text-primary)',
                            }}
                          >
                            <span className="truncate">{preset.label}</span>
                            <span className={`text-[8px] font-semibold ${isMatched ? 'text-amber-200' : 'text-indigo-400 dark:text-indigo-300'}`}>
                              {preset.badge}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN (5 Cols on LG): Live Domain Intelligence Cockpit + Launch CTA */}
                <div className="lg:col-span-5 flex flex-col justify-between gap-2.5 hero-anim-5">
                  {/* Dynamic Live Engine Preview Cockpit Card */}
                  <div 
                    className="w-full flex-1 rounded-2xl border p-3 flex flex-col justify-between gap-2.5 backdrop-blur-xl shadow-md transition-all duration-300"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: telemetry.accentBorder,
                    }}
                  >
                    {/* Cockpit Card Header */}
                    <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--theme-border)' }}>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl p-1.5 rounded-xl border" style={{ backgroundColor: telemetry.accentBg, borderColor: telemetry.accentBorder }}>
                          {activeRoleObj.icon}
                        </span>
                        <div>
                          <div className="text-xs font-black tracking-tight" style={{ color: telemetry.accentColor }}>
                            {telemetry.engine}
                          </div>
                          <div className="text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                            {telemetry.tag} • Real-time AI Feed
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black border"
                        style={{
                          backgroundColor: telemetry.accentBg,
                          borderColor: telemetry.accentBorder,
                          color: telemetry.accentColor,
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: telemetry.accentColor }} />
                        <span>LIVE ENGINE READY</span>
                      </div>
                    </div>

                    {/* 3 Real-time Simulated Telemetry Gauges */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {telemetry.metrics.map((m, mIdx) => (
                        <div
                          key={mIdx}
                          className="rounded-xl p-2 border flex flex-col justify-between text-left"
                          style={{
                            backgroundColor: 'var(--glass-bg)',
                            borderColor: 'var(--theme-border)',
                          }}
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-xs">{m.icon}</span>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.dot }} />
                          </div>
                          <div className="text-xs font-black truncate mt-1" style={{ color: 'var(--text-primary)' }}>
                            {m.value}
                          </div>
                          <div className="text-[8px] font-medium leading-tight truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            {m.status}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Specialized Tool Suite for this Domain */}
                    <div className="space-y-1">
                      <div className="text-[9px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                        Domain Specialized Capabilities:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {telemetry.tools.map((t, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-lg border"
                            style={{
                              backgroundColor: 'var(--glass-bg)',
                              borderColor: 'var(--theme-border)',
                              color: 'var(--text-primary)',
                            }}
                          >
                            {t.icon} {t.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Live Query Speech Bubble */}
                    <div 
                      className="rounded-xl p-2 border flex items-start gap-2 text-left text-[11px] font-medium"
                      style={{
                        backgroundColor: telemetry.accentBg,
                        borderColor: telemetry.accentBorder,
                        color: 'var(--text-primary)',
                      }}
                    >
                      <span className="text-base shrink-0">💬</span>
                      <div className="flex-1">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider block opacity-75">
                          Instant Query Greeting:
                        </span>
                        <span className="font-semibold italic">"{currentQuery}"</span>
                      </div>
                    </div>
                  </div>

                  {/* High-Contrast Sunrise Launch Button */}
                  <div className="w-full space-y-1">
                    <button
                      onClick={handleStartApp}
                      className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:via-orange-500 hover:to-rose-400 text-white font-black text-sm sm:text-base cta-sunrise-glow transition-all duration-200 active:scale-[0.98] hover:scale-[1.01] flex items-center justify-center gap-2 group cursor-pointer border border-amber-300/40 shadow-xl shadow-amber-500/30"
                    >
                      <span className="tracking-tight drop-shadow-sm">
                        {isHi
                          ? `🚀 WeatherGPT प्रोटोटाइप शुरू करें (${activeRoleTitle} • ${activeLangTitle})`
                          : `🚀 Launch WeatherGPT Prototype (${activeRoleTitle} • ${activeLangTitle})`}
                      </span>
                      <span className="text-lg group-hover:translate-x-1.5 transition-transform duration-200">➔</span>
                    </button>

                    <div 
                      className="flex items-center justify-center gap-2 text-[10px] font-semibold opacity-80"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <span>⚡ 100% Client-Side Ready</span>
                      <span>•</span>
                      <span>MoES & IMD Synced</span>
                      <span>•</span>
                      <span>Zero Setup Required</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM FULL-WIDTH NATIONAL INFRASTRUCTURE TRUST BAR */}
              <div 
                className="w-full text-center py-1.5 px-3 rounded-xl border backdrop-blur-md flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[10px] font-semibold shadow-xs hero-anim-6"
                style={{
                  backgroundColor: 'var(--glass-bg)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--text-secondary)',
                }}
              >
                <span className="flex items-center gap-1">
                  <span>🏛️</span>
                  <span>Ministry of Earth Sciences (MoES) & IMD Data Pipeline</span>
                </span>
                <span className="opacity-40">•</span>
                <span className="flex items-center gap-1">
                  <span>🛰️</span>
                  <span>INSAT-3DR & Doppler Radar Grid</span>
                </span>
                <span className="opacity-40">•</span>
                <span className="flex items-center gap-1">
                  <span>🔒</span>
                  <span>AES-256 Air-Gapped SOS Mesh</span>
                </span>
                <span className="opacity-40">•</span>
                <span className="flex items-center gap-1">
                  <span>⚡</span>
                  <span>Tri-Model Ensemble (IMD-GFS + ECMWF + NCMRWF)</span>
                </span>
              </div>
            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* STEP 1: SELECT YOUR ROLE */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="w-full flex flex-col items-center animate-fade-in space-y-5">
            <div className="text-center space-y-1">
              <div 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold mb-1 shadow-sm"
                style={{
                  backgroundColor: 'var(--glass-bg)',
                  borderColor: 'var(--theme-border)',
                  color: isLight ? '#c2410c' : '#fba759'
                }}
              >
                <span>Step 1 of 3 • Your Role / भूमिका</span>
              </div>
              <h1 
                className="text-2xl sm:text-3xl font-heading font-black"
                style={{ color: 'var(--text-primary)' }}
              >
                {['hi', 'mr', 'pa', 'gu'].includes(selectedLanguage) ? 'अपनी भूमिका चुनें (Your Role)' : 'Who Are You? / Select Your Role'}
              </h1>
              <p 
                className="text-xs sm:text-sm max-w-md"
                style={{ color: 'var(--text-muted)' }}
              >
                {['hi', 'mr', 'pa', 'gu'].includes(selectedLanguage)
                  ? 'अपनी भूमिका चुनें ताकि WeatherGPT मौसम की सलाह, मिट्टी के आंकड़े, समुद्री लहरें और आपदा चेतावनी आपके अनुकूल तैयार करे।'
                  : 'Choose your role so WeatherGPT customizes crop spray timers, ocean swell radars, flight visibility, or city heat indices for you.'}
              </p>
            </div>

            {/* Category Cards List */}
            <div className="w-full space-y-2.5">
              {PROFILES.map((profile) => {
                const isSelected = selectedProfile === profile.code;
                const isHi = ['hi', 'mr', 'pa', 'gu'].includes(selectedLanguage);
                return (
                  <div
                    key={profile.code}
                    onClick={() => setSelectedProfile(profile.code)}
                    className={`w-full text-left p-4 rounded-2xl transition-all cursor-pointer border backdrop-blur-md relative group shadow-sm overflow-hidden ${
                      isSelected
                        ? 'border-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.25)] ring-2 ring-indigo-500/40 scale-[1.01]'
                        : 'hover:border-indigo-400/40 hover:scale-[1.005]'
                    }`}
                    style={{
                      backgroundColor: isSelected ? (isLight ? '#eef2ff' : 'rgba(99, 102, 241, 0.12)') : 'var(--card-bg)',
                      borderColor: isSelected ? '#6366f1' : 'var(--glass-border)'
                    }}
                  >
                    {/* Visual Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        <div 
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition-transform group-hover:scale-110 shadow-sm border ${
                            isSelected ? 'bg-indigo-600 text-white border-indigo-500' : 'border-[var(--theme-border)]'
                          }`}
                          style={{
                            backgroundColor: isSelected ? undefined : 'var(--glass-bg)'
                          }}
                        >
                          {profile.icon}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h2 
                              className="text-base sm:text-lg font-bold tracking-tight"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {profile.label}
                            </h2>
                            <span 
                              className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border"
                              style={{
                                backgroundColor: 'var(--glass-bg)',
                                borderColor: 'var(--theme-border)',
                                color: 'var(--text-secondary)'
                              }}
                            >
                              {profile.badge}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">{profile.sub}</p>
                          <p className="text-xs pt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{profile.description}</p>
                          
                          {/* Concrete Real-World Benefits Bullets */}
                          {Array.isArray(profile.bullets) && profile.bullets.length > 0 && (
                            <div className="pt-2 mt-1 border-t border-[var(--theme-border)] space-y-1">
                              {profile.bullets.map((b, bIdx) => (
                                <div key={bIdx} className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>
                                  <span className="text-emerald-500 font-bold shrink-0">✓</span>
                                  <span>{isHi ? b.hi : b.en}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Tags */}
                          <div className="flex flex-wrap gap-1.5 pt-1.5">
                            {profile.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-2 py-0.5 rounded-full font-medium border"
                                style={{
                                  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--glass-bg)',
                                  borderColor: isSelected ? 'rgba(99, 102, 241, 0.35)' : 'var(--theme-border)',
                                  color: isSelected ? (isLight ? '#4338ca' : '#c7d2fe') : 'var(--text-secondary)'
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Selection Radio Icon */}
                      <div className="shrink-0 pt-1">
                        <div 
                          className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                              : 'border-[var(--theme-border)]'
                          }`}
                        >
                          {isSelected && <span className="text-xs font-bold">✓</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation buttons */}
            <div className="w-full flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => setStep(0)}
                className="py-3 px-5 rounded-xl border text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                style={{
                  backgroundColor: 'var(--glass-bg)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--text-primary)'
                }}
              >
                <span>←</span>
                <span>{['hi', 'mr', 'pa', 'gu'].includes(selectedLanguage) ? 'पीछे' : 'Back'}</span>
              </button>

              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{['hi', 'mr', 'pa', 'gu'].includes(selectedLanguage) ? 'आगे बढ़ें: भाषा पुष्टि' : 'Continue: Language & Location'}</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: SELECT LANGUAGE */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="w-full flex flex-col items-center animate-fade-in space-y-5">
            <div className="text-center space-y-1">
              <div 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold mb-1 shadow-sm"
                style={{
                  backgroundColor: 'var(--glass-bg)',
                  borderColor: 'var(--theme-border)',
                  color: isLight ? '#059669' : '#6ee7b7'
                }}
              >
                <span>Step 2 of 3</span>
              </div>
              <h1 
                className="text-2xl sm:text-3xl font-heading font-black"
                style={{ color: 'var(--text-primary)' }}
              >
                Choose Your Language / भाषा चुनें
              </h1>
              <p 
                className="text-xs sm:text-sm max-w-md"
                style={{ color: 'var(--text-muted)' }}
              >
                WeatherGPT will speak, chat, and generate meteorological advisories in your preferred language.
              </p>
            </div>

            {/* Search Box */}
            <div className="w-full relative">
              <input
                type="text"
                value={langSearch}
                onChange={(e) => setLangSearch(e.target.value)}
                placeholder="🔍 Search language / भाषा खोजें (e.g., Hindi, বাংলা, Tamil)..."
                className="w-full rounded-2xl px-4 py-3 text-sm transition-all shadow-sm border focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--input-border)',
                  color: 'var(--input-text)'
                }}
                autoFocus
              />
              {langSearch && (
                <button
                  onClick={() => setLangSearch('')}
                  className="absolute right-3.5 top-3 text-sm hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Popular Chips */}
            {!langSearch && (
              <div className="w-full flex flex-col gap-1.5">
                <span 
                  className="text-[11px] font-bold uppercase tracking-wider px-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Quick Select:
                </span>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_LANG_CODES.map((code) => {
                    const l = LANGUAGES.find(item => item.code === code);
                    if (!l) return null;
                    const isSelected = selectedLanguage === l.code;
                    return (
                      <button
                        key={l.code}
                        onClick={() => setSelectedLanguage(l.code)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-md border-emerald-500 ring-1 ring-emerald-400'
                            : 'hover:border-emerald-400/40'
                        }`}
                        style={{
                          backgroundColor: isSelected ? undefined : 'var(--glass-bg)',
                          borderColor: isSelected ? undefined : 'var(--theme-border)',
                          color: isSelected ? '#ffffff' : 'var(--text-primary)'
                        }}
                      >
                        <span>{l.nativeLabel}</span>
                        <span className="text-[10px] opacity-70">({l.label})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Languages Grid */}
            <div className="w-full max-h-72 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredLanguages.map((lang) => {
                  const isSelected = selectedLanguage === lang.code;
                  return (
                    <div
                      key={lang.code}
                      onClick={() => setSelectedLanguage(lang.code)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group shadow-sm ${
                        isSelected
                          ? 'border-emerald-500 ring-2 ring-emerald-500/40 shadow-md'
                          : 'hover:border-emerald-400/40'
                      }`}
                      style={{
                        backgroundColor: isSelected ? (isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.14)') : 'var(--card-bg)',
                        borderColor: isSelected ? '#10b981' : 'var(--glass-border)',
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div 
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border ${
                            isSelected ? 'bg-emerald-600 text-white border-emerald-500' : 'border-[var(--theme-border)]'
                          }`}
                          style={{
                            backgroundColor: isSelected ? undefined : 'var(--glass-bg)',
                            color: isSelected ? '#ffffff' : 'var(--text-primary)'
                          }}
                        >
                          {lang.code.toUpperCase()}
                        </div>
                        <div>
                          <div 
                            className="text-sm font-bold group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {lang.nativeLabel}
                          </div>
                          <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                            {lang.label}
                          </div>
                        </div>
                      </div>

                      <div 
                        className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold transition-all ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'border-[var(--theme-border)]'
                        }`}
                      >
                        {isSelected ? '✓' : ''}
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredLanguages.length === 0 && (
                <div 
                  className="text-center py-8 text-xs font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  No languages match "{langSearch}". Try searching by English or native spelling.
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="w-full flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="py-3 px-5 rounded-xl border text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                style={{
                  backgroundColor: 'var(--glass-bg)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--text-primary)'
                }}
              >
                <span>←</span>
                <span>Back</span>
              </button>

              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Review & Start / समीक्षा करें</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: SUMMARY & LAUNCH APP */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div className="w-full flex flex-col items-center animate-fade-in space-y-6">
            <div className="text-center space-y-1">
              <div 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold mb-1 shadow-sm"
                style={{
                  backgroundColor: 'var(--glass-bg)',
                  borderColor: 'var(--theme-border)',
                  color: isLight ? '#4338ca' : '#a5b4fc'
                }}
              >
                <span>Final Step</span>
              </div>
              <h1 
                className="text-3xl sm:text-4xl font-heading font-black"
                style={{ color: 'var(--text-primary)' }}
              >
                You're All Set! / आप तैयार हैं!
              </h1>
              <p 
                className="text-xs sm:text-sm max-w-md"
                style={{ color: 'var(--text-muted)' }}
              >
                WeatherGPT has configured its predictive engine and AI personality according to your selections.
              </p>
            </div>

            {/* Summary Preview Box */}
            <div 
              className="w-full p-5 rounded-3xl border backdrop-blur-xl shadow-2xl space-y-4"
              style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--glass-border)'
              }}
            >
              <div 
                className="text-xs font-bold uppercase tracking-wider pb-1 border-b"
                style={{ 
                  color: isLight ? '#4338ca' : '#a5b4fc',
                  borderColor: 'var(--theme-border)'
                }}
              >
                Setup Configuration / कॉन्फ़िगरेशन
              </div>

              {/* Selected Profile Card */}
              <div 
                className="flex items-center justify-between p-3.5 rounded-2xl border shadow-sm"
                style={{
                  backgroundColor: 'var(--glass-bg)',
                  borderColor: 'var(--theme-border)'
                }}
              >
                <div className="flex items-center gap-3">
                  <span 
                    className="text-3xl p-2 rounded-xl border shadow-sm"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--theme-border)'
                    }}
                  >
                    {activeProfileData.icon}
                  </span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Selected Category
                    </span>
                    <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                      {activeProfileData.label}
                    </h2>
                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                      {activeProfileData.sub}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs font-bold underline px-2 py-1 text-indigo-600 dark:text-indigo-400 hover:opacity-80"
                >
                  Change
                </button>
              </div>

              {/* Selected Language Card */}
              <div 
                className="flex items-center justify-between p-3.5 rounded-2xl border shadow-sm"
                style={{
                  backgroundColor: 'var(--glass-bg)',
                  borderColor: 'var(--theme-border)'
                }}
              >
                <div className="flex items-center gap-3">
                  <span 
                    className="text-2xl p-2 rounded-xl border shadow-sm"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--theme-border)'
                    }}
                  >
                    🗣️
                  </span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Selected Language
                    </span>
                    <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                      {activeLangData.nativeLabel}
                    </h2>
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {activeLangData.label}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="text-xs font-bold underline px-2 py-1 text-emerald-600 dark:text-emerald-400 hover:opacity-80"
                >
                  Change
                </button>
              </div>

              {/* Engine Status */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>Supercomputer NWP & Live GPS Sensors Ready</span>
                </div>
                <span className="text-[11px] font-black tracking-wide">100% ONLINE</span>
              </div>
            </div>

            {/* Launch CTA */}
            <div className="w-full space-y-3 pt-2">
              <button
                onClick={handleStartApp}
                className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-indigo-600 via-sky-500 to-indigo-600 hover:from-indigo-500 hover:to-sky-400 text-white font-black text-lg shadow-[0_0_35px_rgba(99,102,241,0.45)] hover:shadow-[0_0_50px_rgba(99,102,241,0.65)] transition-all active:scale-[0.98] flex items-center justify-center gap-3 group cursor-pointer"
              >
                <span>Start WeatherGPT 🚀</span>
                <span className="text-xl group-hover:translate-x-1.5 transition-transform">➔</span>
              </button>

              <button
                onClick={() => setStep(1)}
                className="w-full py-2 text-xs font-medium transition-colors hover:opacity-100"
                style={{ color: 'var(--text-secondary)' }}
              >
                ← Back to Categories & Settings
              </button>
            </div>
          </div>
        )}
      </main>

      {/* User Guide Modal */}
      <UserGuideModal isOpen={isGuideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}
