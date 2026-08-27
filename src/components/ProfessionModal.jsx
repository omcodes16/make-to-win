import React, { useEffect, useState } from 'react';
import { getSpecializedData } from '../services/weatherApi';
import { useApp } from '../context/AppContext';
import { FarmerIcon, FishermanIcon, AviationIcon, UrbanIcon } from './HubIcons';

// --- TRANSLATIONS DICTIONARY ---
const tHub = {
  en: {
    syncing: 'Syncing satellite & terrain data...',
    error: 'Failed to load specialized data for this location.',
    liveData: 'Live satellite data for',
    // Farmer
    farmerTitle: 'Agriculture Intelligence Hub',
    soilMoisture: 'Soil Moisture',
    soilTemp: 'Soil Temp (6cm)',
    evapo: 'Evapotranspiration',
    spraying: 'Pesticide Spraying',
    diseaseRisk: 'Fungal Disease Risk',
    optMoisture: 'Optimal Growing Conditions',
    optMoistureDesc: 'Current soil parameters are stable. No immediate weather-related agricultural stress detected.',
    irrigationReq: 'Irrigation Required',
    irrigationDesc: 'Soil moisture is critically low in the root zone. Immediate watering recommended.',
    heatStress: 'Heat Stress Warning',
    heatStressDesc: 'High apparent temperatures may cause crop wilting. Ensure adequate soil moisture.',
    seedGermination: 'Crucial for seed germination.',
    waterLoss: 'Water loss from crops this hour.',
    sprayOpt: 'Optimal (Clear & Calm)',
    sprayWind: 'Caution (High Wind Drift)',
    sprayRain: 'Do Not Spray (Rain Washout)',
    sprayBad: 'Do Not Spray (Rain & Wind)',
    fungalHigh: 'High Risk (Warm & Humid)',
    fungalLow: 'Low Risk',
    // Fisherman
    fishTitle: 'Marine & Coastal Hub',
    waveHeight: 'Max Wave Height',
    wavePeriod: 'Wave Period',
    direction: 'Wave Direction',
    surfaceWind: 'Surface Wind',
    fishActivity: 'Fish Activity Index',
    safeMarine: 'Safe Marine Conditions',
    safeMarineDesc: 'Wave heights and swells are currently stable for fishing operations.',
    unsafeMarine: 'Unsafe to Sail (High Waves)',
    unsafeMarineDesc: 'Ocean conditions are rough. Avoid venturing into deep sea.',
    activityHigh: 'Excellent (Favorable Pressure)',
    activityLow: 'Moderate to Low',
    // Aviation
    avTitle: 'Aviation Weather Hub',
    visibility: 'Visibility',
    lowClouds: 'Low Cloud Cover',
    windGusts: 'Wind Gusts',
    cape: 'CAPE (Storm Risk)',
    droneSafety: 'Drone Flight Safety',
    clearFlight: 'Clear Flight Conditions',
    clearFlightDesc: 'Excellent visibility and stable atmospheric conditions for VFR.',
    badFlight: 'Caution for VFR & Drones',
    badFlightDesc: 'Visibility is severely limited or low cloud cover is extremely dense. Check NOTAMs.',
    droneGood: 'Safe to Fly (VLOS)',
    droneBad: 'Grounded (High Winds/Vis)',
    // Urban
    urbanTitle: 'City Management Hub',
    pm25: 'PM 2.5 (Fine Dust)',
    pm10: 'PM 10 (Coarse)',
    uvIndex: 'UV Index',
    heatIndex: 'Heat Index',
    workerSafety: 'Outdoor Worker Advisory',
    cityNormal: 'City Conditions Normal',
    cityNormalDesc: 'Air quality and heat indices are well within safe limits.',
    cityWarning: 'City Health Warning Active',
    cityWarningDesc: 'Dangerous heat or pollution detected. Recommend issuing health advisories.',
    workerSafe: 'Standard Breaks Required',
    workerDanger: 'Mandatory 30min Breaks (Heat/Smog)'
  },
  hi: {
    syncing: 'सैटेलाइट और इलाके का डेटा सिंक हो रहा है...',
    error: 'इस स्थान के लिए विशेष डेटा लोड करने में विफल।',
    liveData: 'लाइव सैटेलाइट डेटा:',
    farmerTitle: 'कृषि खुफिया हब',
    soilMoisture: 'मिट्टी की नमी',
    soilTemp: 'मिट्टी का तापमान (6cm)',
    evapo: 'वाष्पीकरण (Evapotranspiration)',
    spraying: 'कीटनाशक छिड़काव',
    diseaseRisk: 'फंगल रोग का खतरा',
    optMoisture: 'इष्टतम बढ़ती स्थिति',
    optMoistureDesc: 'मिट्टी के पैरामीटर स्थिर हैं। कोई कृषि तनाव नहीं है।',
    irrigationReq: 'सिंचाई की आवश्यकता है',
    irrigationDesc: 'मिट्टी की नमी बहुत कम है। तुरंत पानी देने की सलाह दी जाती है।',
    heatStress: 'हीट स्ट्रेस चेतावनी',
    heatStressDesc: 'उच्च तापमान से फसल मुरझा सकती है। नमी बनाए रखें।',
    seedGermination: 'बीज अंकुरण के लिए महत्वपूर्ण।',
    waterLoss: 'इस घंटे फसलों से पानी की कमी।',
    sprayOpt: 'इष्टतम (साफ और शांत)',
    sprayWind: 'सावधान (तेज हवा)',
    sprayRain: 'छिड़काव न करें (बारिश)',
    sprayBad: 'छिड़काव न करें (बारिश और हवा)',
    fungalHigh: 'उच्च जोखिम (गर्म और नम)',
    fungalLow: 'कम जोखिम',
    fishTitle: 'समुद्री और तटीय हब',
    waveHeight: 'अधिकतम लहर की ऊंचाई',
    wavePeriod: 'लहर की अवधि',
    direction: 'लहर की दिशा',
    surfaceWind: 'सतही हवा',
    fishActivity: 'मछली गतिविधि सूचकांक',
    safeMarine: 'सुरक्षित समुद्री स्थिति',
    safeMarineDesc: 'मछली पकड़ने के लिए लहरें स्थिर हैं।',
    unsafeMarine: 'नौकायन के लिए असुरक्षित (ऊंची लहरें)',
    unsafeMarineDesc: 'समुद्र की स्थिति खराब है। गहरे समुद्र में जाने से बचें।',
    activityHigh: 'उत्कृष्ट',
    activityLow: 'मध्यम से कम',
    avTitle: 'विमानन मौसम हब',
    visibility: 'दृश्यता (Visibility)',
    lowClouds: 'कम बादल (Low Clouds)',
    windGusts: 'हवा के झोंके',
    cape: 'तूफान का जोखिम (CAPE)',
    droneSafety: 'ड्रोन उड़ान सुरक्षा',
    clearFlight: 'स्पष्ट उड़ान की स्थिति',
    clearFlightDesc: 'VFR के लिए उत्कृष्ट दृश्यता और स्थिर स्थिति।',
    badFlight: 'VFR और ड्रोन के लिए सावधानी',
    badFlightDesc: 'दृश्यता सीमित है या बादल घने हैं।',
    droneGood: 'उड़ने के लिए सुरक्षित',
    droneBad: 'ग्राउंडेड (तेज हवा/खराब दृश्यता)',
    urbanTitle: 'शहर प्रबंधन हब',
    pm25: 'PM 2.5 (प्रदूषण)',
    pm10: 'PM 10 (धूल)',
    uvIndex: 'यूवी इंडेक्स (UV)',
    heatIndex: 'हीट इंडेक्स (गर्मी)',
    workerSafety: 'बाहरी कार्यकर्ता सलाह',
    cityNormal: 'शहर की स्थिति सामान्य',
    cityNormalDesc: 'हवा की गुणवत्ता और गर्मी सुरक्षित सीमा के भीतर हैं।',
    cityWarning: 'शहर स्वास्थ्य चेतावनी सक्रिय',
    cityWarningDesc: 'खतरनाक गर्मी या प्रदूषण। स्वास्थ्य सलाह जारी करें।',
    workerSafe: 'मानक ब्रेक आवश्यक',
    workerDanger: 'अनिवार्य 30 मिनट ब्रेक (गर्मी/स्मॉग)'
  },
  // Default to Hindi/English structures for BN and AS for now to ensure instant delivery without translation errors, 
  // but we will provide accurate Bengali and Assamese terms for key fields.
  bn: {
    syncing: 'স্যাটেলাইট ডেটা সিঙ্ক হচ্ছে...',
    error: 'ডেটা লোড করতে ব্যর্থ হয়েছে।',
    liveData: 'লাইভ ডেটা:',
    farmerTitle: 'কৃষি গোয়েন্দা হাব',
    soilMoisture: 'মাটির আর্দ্রতা',
    soilTemp: 'মাটির তাপমাত্রা',
    evapo: 'বাষ্পীভবন (Evapotranspiration)',
    spraying: 'কীটনাশক স্প্রে',
    diseaseRisk: 'ছত্রাকজনিত রোগের ঝুঁকি',
    optMoisture: 'অনুকূল বৃদ্ধির অবস্থা',
    optMoistureDesc: 'মাটির অবস্থা স্থিতিশীল।',
    irrigationReq: 'সেচ প্রয়োজন',
    irrigationDesc: 'মাটির আর্দ্রতা গুরুতরভাবে কম। জল দেওয়া প্রয়োজন।',
    heatStress: 'তাপ চাপ সতর্কতা',
    heatStressDesc: 'উচ্চ তাপমাত্রা ফসলের ক্ষতি করতে পারে।',
    seedGermination: 'বীজ অঙ্কুরোদগমের জন্য গুরুত্বপূর্ণ।',
    waterLoss: 'ফসলের জলের ক্ষতি।',
    sprayOpt: 'অনুকূল',
    sprayWind: 'সতর্কতা (উচ্চ বাতাস)',
    sprayRain: 'স্প্রে করবেন না (বৃষ্টি)',
    sprayBad: 'স্প্রে করবেন না',
    fungalHigh: 'উচ্চ ঝুঁকি',
    fungalLow: 'কম ঝুঁকি',
    fishTitle: 'সামুদ্রিক হাব',
    waveHeight: 'ঢেউয়ের উচ্চতা',
    wavePeriod: 'ঢেউয়ের সময়কাল',
    direction: 'ঢেউয়ের দিক',
    surfaceWind: 'পৃষ্ঠের বাতাস',
    fishActivity: 'মাছের ক্রিয়াকলাপ',
    safeMarine: 'নিরাপদ সামুদ্রিক অবস্থা',
    safeMarineDesc: 'ঢেউ স্থিতিশীল আছে।',
    unsafeMarine: 'অনিরাপদ (উঁচু ঢেউ)',
    unsafeMarineDesc: 'সমুদ্র রুক্ষ। গভীরে যাবেন না।',
    activityHigh: 'চমৎকার',
    activityLow: 'মাঝারি',
    avTitle: 'এভিয়েশন হাব',
    visibility: 'দৃশ্যমানতা',
    lowClouds: 'মেঘের আবরণ',
    windGusts: 'দমকা বাতাস',
    cape: 'ঝড়ের ঝুঁকি',
    droneSafety: 'ড্রোন নিরাপত্তা',
    clearFlight: 'পরিষ্কার আকাশ',
    clearFlightDesc: 'উড্ডয়নের জন্য নিরাপদ।',
    badFlight: 'সতর্কতা',
    badFlightDesc: 'দৃশ্যমানতা কম।',
    droneGood: 'উড্ডয়নের জন্য নিরাপদ',
    droneBad: 'নিরাপদ নয়',
    urbanTitle: 'শহর ব্যবস্থাপনা হাব',
    pm25: 'PM 2.5',
    pm10: 'PM 10',
    uvIndex: 'UV ইনডেক্স',
    heatIndex: 'তাপ সূচক',
    workerSafety: 'কর্মীদের জন্য পরামর্শ',
    cityNormal: 'স্বাভাবিক অবস্থা',
    cityNormalDesc: 'শহরের অবস্থা নিরাপদ।',
    cityWarning: 'স্বাস্থ্য সতর্কতা',
    cityWarningDesc: 'প্রচণ্ড গরম বা দূষণ।',
    workerSafe: 'নিরাপদ',
    workerDanger: 'বিপজ্জনক'
  }
};
// Fallback Assamese to Bengali mapping since they share script and many terms
tHub.as = { ...tHub.bn, farmerTitle: 'কৃষি চোৰাংচোৱা হাব', fishTitle: 'সামুদ্ৰিক হাব' };



export default function ProfessionModal({ profile, lat, lng, locationName, weather, onClose }) {
  const { state } = useApp();
  const lang = state.language || 'en';
  const t = tHub[lang] || tHub['en'];
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const res = await getSpecializedData(lat, lng, profile);
      setData(res);
      setLoading(false);
    }
    fetchData();
  }, [lat, lng, profile]);

  if (!profile || profile === 'general') return null;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white/60 font-medium tracking-wide animate-pulse">{t.syncing}</p>
        </div>
      );
    }

    if (!data) return <p className="text-red-400 py-10 text-center">{t.error}</p>;

    // --- FARMER (AGRICULTURE HUB) ---
    if (profile === 'farmer') {
      const moisturePct = (data.soil_moisture * 100).toFixed(1);
      const isDry = data.soil_moisture < 0.2;
      const windSpeed = weather?.windSpeed || 0;
      const isWindy = windSpeed > 15;
      const isRaining = (weather?.rain || 0) > 0 || (weather?.precipitation || 0) > 0;
      
      let sprayingStatus = t.sprayOpt;
      let sprayingColor = "text-emerald-400";
      if (isWindy && isRaining) { sprayingStatus = t.sprayBad; sprayingColor = "text-red-400"; }
      else if (isWindy) { sprayingStatus = t.sprayWind; sprayingColor = "text-amber-400"; }
      else if (isRaining) { sprayingStatus = t.sprayRain; sprayingColor = "text-red-400"; }

      const heatStress = (weather?.feelsLike || 0) > 35;
      const fungalRisk = ((weather?.feelsLike || 0) > 25 && (weather?.humidity || 0) > 85);

      return (
        <div className="space-y-6">
          <div className={`p-5 rounded-2xl border flex items-start gap-4 ${isDry || heatStress ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]'}`}>
            <div className={`text-3xl ${isDry || heatStress ? 'text-amber-400' : 'text-emerald-400'}`}>
              {isDry || heatStress ? '⚠️' : '✅'}
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isDry || heatStress ? 'text-amber-400' : 'text-emerald-400'}`}>
                {isDry ? t.irrigationReq : heatStress ? t.heatStress : t.optMoisture}
              </h3>
              <p className="text-white/70 text-sm mt-1 leading-relaxed">
                {isDry ? t.irrigationDesc : heatStress ? t.heatStressDesc : t.optMoistureDesc}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-surface-2 to-surface-0 border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-blue-500/30 transition-all shadow-lg">
              <div className="relative z-10">
                <div className="text-white/50 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span className="text-blue-400">💧</span> {t.soilMoisture}
                </div>
                <div className="text-3xl font-black text-white mb-3 tracking-tight">{moisturePct}%</div>
                <div className="w-full bg-black/50 rounded-full h-2.5 overflow-hidden border border-white/5">
                  <div className={`h-full rounded-full ${isDry ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 'bg-gradient-to-r from-blue-600 to-blue-400'}`} style={{ width: `${Math.min(moisturePct, 100)}%` }}></div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-surface-2 to-surface-0 border border-white/10 rounded-2xl p-5 hover:border-amber-500/30 transition-all shadow-lg">
              <div className="text-white/50 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="text-amber-500">🌡️</span> {t.soilTemp}
              </div>
              <div className="text-3xl font-black text-white tracking-tight">{data.soil_temp.toFixed(1)}°C</div>
              <p className="text-white/40 text-[10px] sm:text-xs mt-2 font-medium">{t.seedGermination}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-surface-2 border border-white/5 rounded-2xl p-4">
              <div className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-1">{t.evapo}</div>
              <div className="text-lg font-bold text-white">{data.evapotranspiration.toFixed(2)} mm</div>
              <p className="text-white/40 text-[9px] mt-1">{t.waterLoss}</p>
            </div>
            
            <div className="bg-surface-2 border border-white/5 rounded-2xl p-4">
              <div className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-1">{t.spraying}</div>
              <div className={`text-sm font-bold mt-1 ${sprayingColor}`}>{sprayingStatus}</div>
              <p className="text-white/40 text-[9px] mt-1">W: {windSpeed}km/h | R: {weather?.rain || 0}mm</p>
            </div>

            <div className={`bg-surface-2 border ${fungalRisk ? 'border-red-500/30' : 'border-white/5'} rounded-2xl p-4`}>
              <div className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-1">{t.diseaseRisk}</div>
              <div className={`text-sm font-bold mt-1 ${fungalRisk ? 'text-red-400' : 'text-emerald-400'}`}>
                {fungalRisk ? t.fungalHigh : t.fungalLow}
              </div>
              <p className="text-white/40 text-[9px] mt-1">T: {weather?.feelsLike}°C | H: {weather?.humidity}%</p>
            </div>
          </div>
        </div>
      );
    }

    // --- FISHERMAN (MARINE HUB) ---
    if (profile === 'fisherman') {
      const isDangerous = data.wave_height > 1.5;
      const windSpeed = weather?.windSpeed || 0;
      const activityHigh = !isDangerous && windSpeed < 20;

      return (
        <div className="space-y-6">
          <div className={`p-5 rounded-2xl border flex items-start gap-4 ${isDangerous ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
             <div className={`text-3xl ${isDangerous ? 'text-red-400' : 'text-emerald-400'}`}>
              {isDangerous ? '⛔' : '✅'}
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isDangerous ? 'text-red-400' : 'text-emerald-400'}`}>
                {isDangerous ? t.unsafeMarine : t.safeMarine}
              </h3>
              <p className="text-white/70 text-sm mt-1 leading-relaxed">
                {isDangerous ? t.unsafeMarineDesc : t.safeMarineDesc}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-900/40 to-black/40 border border-blue-500/30 rounded-2xl p-5 col-span-2 sm:col-span-3 flex items-center justify-between shadow-[0_0_30px_rgba(59,130,246,0.1)]">
              <div>
                <div className="text-blue-400/80 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">{t.waveHeight}</div>
                <div className="text-5xl font-black text-white tracking-tight">{data.wave_height ? data.wave_height.toFixed(1) : '0'} <span className="text-xl text-white/50 font-medium">m</span></div>
              </div>
              <div className="text-7xl opacity-20 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">🌊</div>
            </div>
            <div className="bg-surface-2 border border-white/5 rounded-2xl p-5">
              <div className="text-white/50 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2">{t.wavePeriod}</div>
              <div className="text-2xl font-bold text-white">{data.wave_period ? data.wave_period.toFixed(1) : '0'}s</div>
            </div>
            <div className="bg-surface-2 border border-white/5 rounded-2xl p-5">
              <div className="text-white/50 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2">{t.surfaceWind}</div>
              <div className="text-2xl font-bold text-white">{windSpeed} km/h</div>
            </div>
            <div className="bg-surface-2 border border-white/5 rounded-2xl p-5 sm:col-span-1 col-span-2">
              <div className="text-white/50 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2">{t.fishActivity}</div>
              <div className={`text-lg font-bold ${activityHigh ? 'text-emerald-400' : 'text-amber-400'}`}>{activityHigh ? t.activityHigh : t.activityLow}</div>
            </div>
          </div>
        </div>
      );
    }

    // --- AVIATION ---
    if (profile === 'aviation') {
      const isBadVis = data.visibility < 3000 || data.cloudcover_low > 80;
      return (
        <div className="space-y-4">
          <div className={`p-5 rounded-2xl border ${isBadVis ? 'bg-amber-500/10 border-amber-500/30' : 'bg-blue-500/10 border-blue-500/30'}`}>
            <h3 className={`text-lg font-bold ${isBadVis ? 'text-amber-400' : 'text-blue-400'}`}>
              {isBadVis ? t.badFlight : t.clearFlight}
            </h3>
            <p className="text-white/70 text-sm mt-1">{isBadVis ? t.badFlightDesc : t.clearFlightDesc}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-2 border border-white/5 rounded-2xl p-5 shadow-lg">
              <div className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">{t.visibility}</div>
              <div className="text-3xl font-black text-white">{(data.visibility / 1000).toFixed(1)} km</div>
            </div>
            <div className="bg-surface-2 border border-white/5 rounded-2xl p-5 shadow-lg">
              <div className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">{t.lowClouds}</div>
              <div className="text-3xl font-black text-white">{data.cloudcover_low}%</div>
            </div>
            <div className="bg-surface-2 border border-white/5 rounded-2xl p-4">
              <div className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-1">{t.windGusts}</div>
              <div className="text-xl font-bold text-white">{data.windgusts.toFixed(1)} km/h</div>
            </div>
            <div className="bg-surface-2 border border-white/5 rounded-2xl p-4">
              <div className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-1">{t.droneSafety}</div>
              <div className={`text-sm font-bold mt-1 ${isBadVis ? 'text-red-400' : 'text-emerald-400'}`}>{isBadVis ? t.droneBad : t.droneGood}</div>
            </div>
          </div>
        </div>
      );
    }

    // --- URBAN PLANNING ---
    if (profile === 'urbanPlanning') {
      const isSevereHeat = data.feels_like > 38;
      const isPolluted = data.pm2_5 > 50;
      return (
        <div className="space-y-4">
          <div className={`p-5 rounded-2xl border ${(isSevereHeat || isPolluted) ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
            <h3 className={`text-lg font-bold ${(isSevereHeat || isPolluted) ? 'text-red-400' : 'text-emerald-400'}`}>
              {(isSevereHeat || isPolluted) ? t.cityWarning : t.cityNormal}
            </h3>
            <p className="text-white/70 text-sm mt-1">
              {(isSevereHeat || isPolluted) ? t.cityWarningDesc : t.cityNormalDesc}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-2 border border-white/5 rounded-2xl p-4 shadow-lg">
              <div className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">{t.pm25}</div>
              <div className={`text-3xl font-black ${isPolluted ? 'text-red-400' : 'text-white'}`}>{data.pm2_5.toFixed(1)} <span className="text-sm font-normal text-white/40">µg/m³</span></div>
            </div>
            <div className="bg-surface-2 border border-white/5 rounded-2xl p-4 shadow-lg">
              <div className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">{t.heatIndex}</div>
              <div className={`text-3xl font-black ${isSevereHeat ? 'text-red-400' : 'text-white'}`}>{data.feels_like.toFixed(1)}°C</div>
            </div>
            <div className="bg-surface-2 border border-white/5 rounded-2xl p-4">
              <div className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-1">{t.uvIndex}</div>
              <div className="text-xl font-bold text-white">{data.uv_index.toFixed(1)}</div>
            </div>
            <div className="bg-surface-2 border border-white/5 rounded-2xl p-4">
              <div className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-1">{t.workerSafety}</div>
              <div className={`text-xs font-bold mt-1 ${isSevereHeat ? 'text-red-400' : 'text-emerald-400'}`}>{isSevereHeat ? t.workerDanger : t.workerSafe}</div>
            </div>
          </div>
        </div>
      );
    }
  };

  const getProfileTitle = (t) => {
    if (profile === 'farmer') return t.farmerTitle;
    if (profile === 'fisherman') return t.fishTitle;
    if (profile === 'aviation') return t.avTitle;
    if (profile === 'urbanPlanning') return t.urbanTitle;
    return '';
  };

  const IconMap = {
    farmer: () => <FarmerIcon className="w-8 h-8 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]" />,
    fisherman: () => <FishermanIcon className="w-8 h-8 text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]" />,
    aviation: () => <AviationIcon className="w-8 h-8 text-indigo-400 drop-shadow-[0_0_10px_rgba(129,140,248,0.8)]" />,
    urbanPlanning: () => <UrbanIcon className="w-8 h-8 text-purple-400 drop-shadow-[0_0_10px_rgba(192,132,252,0.8)]" />
  };
  const ProfileIcon = IconMap[profile] || (() => null);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#030712]/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-gradient-to-b from-surface-0 to-surface-0 border border-white/10 rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden animate-slide-up flex flex-col max-h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
              <ProfileIcon />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{getProfileTitle(t)}</h2>
              <div className="text-white/40 text-[11px] sm:text-xs mt-1.5 flex items-center gap-1.5 uppercase tracking-wider font-semibold">
                <span>{t.liveData}</span>
                <span className="text-indigo-400">{locationName}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-all self-start shadow-sm border border-white/5 hover:scale-105"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
