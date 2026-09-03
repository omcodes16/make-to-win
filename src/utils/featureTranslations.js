import { createTranslationProxy } from './translations.js';

const rawFeatureI18n = {
  en: {
    // Heat Risk
    heatExtremeDanger: 'Extreme Danger',
    heatDanger: 'Danger',
    heatExtremeCaution: 'Extreme Caution',
    heatCaution: 'Caution',
    heatComfortable: 'Comfortable',
    heatAdvExtremeDanger: 'Heat stroke highly likely. Avoid all outdoor activity. Seek air-conditioned shelter immediately.',
    heatAdvDanger: 'Heat cramps and exhaustion likely. Limit exertion. Drink water every 15 mins.',
    heatAdvExtremeCaution: 'Fatigue possible with prolonged exposure. Farmers should avoid noon field work.',
    heatAdvCaution: 'Fatigue possible with prolonged exertion. Stay hydrated and take breaks.',
    heatAdvComfortable: 'Comfortable conditions. Suitable for outdoor work and activities.',

    // Farmer Advisory
    farmTitleStorm: 'Stop All Field Work',
    farmAdvStorm: 'Severe thunderstorm in progress. Evacuate open fields immediately. Do not operate machinery outdoors.',
    farmTitleRain: 'Delay Field Operations',
    farmAdvRain: (val) => `Heavy rain (${val}). Delay fertiliser application, planting, and harvesting. Check drainage channels for waterlogging.`,
    farmAdvRainProb: (val) => `Heavy rain likely (${val}% probability). Plan field work for a drier day. Check drainage.`,
    farmTitleSpray: 'Avoid Pesticide Spraying',
    farmAdvSpray: (val) => `Rain likely (${val}% chance). Chemicals will be washed away — wait for a dry 4-hour window.`,
    farmTitleUV: 'Avoid Noon Field Work',
    farmAdvUV: (val) => `UV Index ${val} is Very High. Work before 10 AM or after 4 PM. Wear a hat and drink water frequently. Risk of heat exhaustion.`,
    farmTitleWind: 'High Wind — Spray Drift Risk',
    farmAdvWind: (val) => `Wind at ${val} km/h will cause spray to drift off-target. Wait for wind below 15 km/h before pesticide or fertiliser spraying.`,
    farmTitleFungal: 'Fungal Disease Alert',
    farmAdvFungal: (val) => `High humidity (${val}%) + warm temperature creates ideal conditions for fungal crop disease. Inspect crops and apply preventive fungicide.`,
    farmTitleFog: 'Dense Fog — Limited Visibility',
    farmAdvFog: 'Avoid operating tractors and machinery until fog clears. Fog promotes fungal spread on standing crops.',
    farmTitleFrost: 'Frost Risk Tonight',
    farmAdvFrost: (val) => `Temperature dropping to ${val}°C. Cover sensitive crops with mulch or polythene sheets overnight to prevent frost damage.`,
    farmTitleIdeal: 'Ideal Conditions Today',
    farmAdvIdeal: (wind) => `Clear skies, low wind (${wind || '--'} km/h), no rain forecast. Good day for pesticide spraying, fertiliser application, and field operations.`,
    farmTitleGood: 'Suitable Working Conditions',
    farmAdvGood: (uv) => `Acceptable conditions for general farm work. ${uv >= 6 ? 'UV moderate — use sun protection during 11 AM–3 PM.' : 'Comfortable day for outdoor activities.'}`,

    // Health Impacts
    healthTitle: 'Health & Activity Impact',
    healthAqiUnhealthy: (val) => `AQI ${val} is Unhealthy — respiratory irritation likely. Sensitive groups (children, elderly, asthma patients) should stay indoors.`,
    healthAqiMod: (val) => `AQI ${val} is Moderate — some pollutants may cause mild irritation for sensitive individuals.`,
    healthUvVeryHigh: (val) => `UV Index ${val} is Very High — 15 mins of unprotected sun can cause skin damage. Use SPF 50+.`,
    healthUvHigh: (val) => `UV Index ${val} is High — wear sunscreen and protective clothing between 10 AM–4 PM.`,
    healthHumidity: (val) => `Humidity at ${val}% — sweat evaporation is slow. Physical exertion feels much more exhausting than the temperature alone suggests.`,
    healthGood: 'Air quality and UV conditions are within safe limits. Good day for outdoor activities.',

    // Marine Advisory
    marineTitleStorm: 'Do Not Sail — Storm Risk',
    marineAdvStorm: 'Severe thunderstorm conditions. Do not go out to sea or river. Return to shore immediately if already out.',
    marineTitleWind: 'High Wind — Rough Waters',
    marineAdvWind: (val) => `Wind speeds at ${val} km/h make waters rough and dangerous for small boats. Avoid fishing today.`,
    marineTitleFog: 'Low Visibility — Navigation Risk',
    marineAdvFog: 'Dense fog reduces visibility significantly. High risk of collision. Delay departure until fog clears.',
    marineTitleRain: 'Heavy Rain — Slippery Deck',
    marineAdvRain: (val) => `Heavy rain (${val}). Slippery conditions and reduced visibility. Exercise caution if heading out.`,
    marineTitleGood: 'Safe for Fishing',
    marineAdvGood: (wind) => `Calm winds (${wind || '--'} km/h) and clear conditions. Safe time to head out for fishing.`,

    // Aviation Advisory
    aviationTitleStorm: 'Flight Risk — Thunderstorm',
    aviationAdvStorm: 'Severe convective activity. High risk of turbulence and lightning. Delay flight operations.',
    aviationTitleWind: 'High Wind — Crosswind Risk',
    aviationAdvWind: (val) => `Wind speeds at ${val} km/h. Caution for crosswinds during takeoff and landing. Check gusts.`,
    aviationTitleFog: 'Low Visibility — VFR Hazard',
    aviationAdvFog: 'Dense fog reducing visibility below VMC minimums. IFR conditions prevail. Ground operations may be delayed.',
    aviationTitleGood: 'VFR Conditions Acceptable',
    aviationAdvGood: (wind) => `Clear skies and acceptable winds (${wind || '--'} km/h). Good conditions for general aviation.`,

    // Urban Planning Advisory
    urbanTitleRain: 'Flood Risk — Drainage Stress',
    urbanAdvRain: (val) => `Heavy rainfall forecast (${val}). High risk of localized waterlogging. Municipalities should clear storm drains.`,
    urbanTitleHeat: 'Heatwave Preparedness',
    urbanAdvHeat: (val) => `High temperatures expected (${val}°C). Activate cooling centers and ensure public water availability.`,
    urbanTitleGood: 'Normal Municipal Operations',
    urbanAdvGood: 'Weather conditions are stable. No significant stress on city infrastructure expected.',

    // Seasonal Context
    seasonTitle: 'Historical Climate Context',
    seasonNormalFor: (month, city) => `Normal for ${month} in ${city}`,
    seasonAvgRain: 'Avg Rain',
    seasonAvgTemp: 'Avg Temp',
    seasonSummary: (month, city, rain, min, max, season) => `In ${month}, ${city} typically gets ~${rain}mm rainfall, with temps ${min}–${max}°C. Season: ${season}.`
  },
  hi: {
    // Heat Risk
    heatExtremeDanger: 'अत्यधिक खतरा',
    heatDanger: 'खतरा',
    heatExtremeCaution: 'अत्यधिक सावधानी',
    heatCaution: 'सावधानी',
    heatComfortable: 'आरामदायक',
    heatAdvExtremeDanger: 'हीट स्ट्रोक की बहुत अधिक संभावना है। सभी बाहरी गतिविधियों से बचें। तुरंत वातानुकूलित आश्रय लें।',
    heatAdvDanger: 'गर्मी से ऐंठन और थकावट की संभावना। मेहनत कम करें। हर 15 मिनट में पानी पिएं।',
    heatAdvExtremeCaution: 'लंबे समय तक रहने से थकान संभव है। किसानों को दोपहर में खेत के काम से बचना चाहिए।',
    heatAdvCaution: 'लंबे समय तक मेहनत करने से थकान संभव है। हाइड्रेटेड रहें और ब्रेक लें।',
    heatAdvComfortable: 'आरामदायक स्थिति। बाहरी काम और गतिविधियों के लिए उपयुक्त।',

    // Farmer Advisory
    farmTitleStorm: 'खेत का सभी काम रोकें',
    farmAdvStorm: 'तेज आंधी तूफान जारी है। खुले खेतों को तुरंत खाली करें। बाहर मशीनरी न चलाएं।',
    farmTitleRain: 'खेत का काम टालें',
    farmAdvRain: (val) => `भारी बारिश (${val})। उर्वरक, बुवाई और कटाई में देरी करें। जलभराव के लिए जल निकासी चैनल की जाँच करें।`,
    farmAdvRainProb: (val) => `भारी बारिश की संभावना (${val}%)। सूखे दिन के लिए खेत के काम की योजना बनाएं। जल निकासी की जाँच करें।`,
    farmTitleSpray: 'कीटनाशक छिड़काव से बचें',
    farmAdvSpray: (val) => `बारिश की संभावना (${val}%)। रसायन धुल जाएंगे - 4 घंटे की सूखी खिड़की की प्रतीक्षा करें।`,
    farmTitleUV: 'दोपहर में खेत के काम से बचें',
    farmAdvUV: (val) => `यूवी इंडेक्स ${val} बहुत अधिक है। सुबह 10 बजे से पहले या शाम 4 बजे के बाद काम करें। टोपी पहनें और बार-बार पानी पिएं।`,
    farmTitleWind: 'तेज हवा — स्प्रे बहने का जोखिम',
    farmAdvWind: (val) => `हवा ${val} किमी/घंटा की गति से स्प्रे को लक्ष्य से भटका देगी। छिड़काव से पहले हवा के 15 किमी/घंटा से कम होने की प्रतीक्षा करें।`,
    farmTitleFungal: 'फंगल रोग चेतावनी',
    farmAdvFungal: (val) => `उच्च आर्द्रता (${val}%) + गर्म तापमान फंगल फसल रोग के लिए आदर्श स्थिति बनाता है। फसलों का निरीक्षण करें।`,
    farmTitleFog: 'घना कोहरा — कम दृश्यता',
    farmAdvFog: 'कोहरा छंटने तक ट्रैक्टर और मशीनरी चलाने से बचें। कोहरे से खड़ी फसलों में फंगस फैलने को बढ़ावा मिलता है।',
    farmTitleFrost: 'आज रात पाले का जोखिम',
    farmAdvFrost: (val) => `तापमान ${val}°C तक गिर रहा है। पाले से बचाव के लिए संवेदनशील फसलों को रात भर मल्च या पॉलीथीन शीट से ढक दें।`,
    farmTitleIdeal: 'आज आदर्श स्थितियाँ',
    farmAdvIdeal: (wind) => `साफ आसमान, कम हवा (${wind || '--'} किमी/घंटा), बारिश का कोई पूर्वानुमान नहीं। कीटनाशक छिड़काव, उर्वरक और खेत के संचालन के लिए अच्छा दिन है।`,
    farmTitleGood: 'काम के लिए उपयुक्त स्थितियाँ',
    farmAdvGood: (uv) => `सामान्य खेत के काम के लिए स्वीकार्य स्थितियाँ। ${uv >= 6 ? 'यूवी मध्यम - सुबह 11 से दोपहर 3 बजे के बीच धूप से बचाव का प्रयोग करें।' : 'बाहरी गतिविधियों के लिए आरामदायक दिन।'}`,

    // Health Impacts
    healthTitle: 'स्वास्थ्य और गतिविधि प्रभाव',
    healthAqiUnhealthy: (val) => `AQI ${val} अस्वस्थ है — सांस की जलन की संभावना। संवेदनशील समूहों (बच्चों, बुजुर्गों, अस्थमा के मरीजों) को घर के अंदर रहना चाहिए।`,
    healthAqiMod: (val) => `AQI ${val} मध्यम है — कुछ प्रदूषक संवेदनशील व्यक्तियों के लिए हल्की जलन पैदा कर सकते हैं।`,
    healthUvVeryHigh: (val) => `यूवी इंडेक्स ${val} बहुत अधिक है — 15 मिनट की बिना सुरक्षा वाली धूप त्वचा को नुकसान पहुंचा सकती है। SPF 50+ का उपयोग करें।`,
    healthUvHigh: (val) => `यूवी इंडेक्स ${val} उच्च है — सुबह 10 बजे से शाम 4 बजे के बीच सनस्क्रीन और सुरक्षात्मक कपड़े पहनें।`,
    healthHumidity: (val) => `आर्द्रता ${val}% है — पसीने का वाष्पीकरण धीमा है। शारीरिक श्रम तापमान के सुझाव से कहीं अधिक थका देने वाला लगता है।`,
    healthGood: 'वायु गुणवत्ता और यूवी स्थितियाँ सुरक्षित सीमा के भीतर हैं। बाहरी गतिविधियों के लिए अच्छा दिन है।',

    // Marine Advisory
    marineTitleStorm: 'नाव न निकालें — तूफान का खतरा',
    marineAdvStorm: 'गंभीर आंधी तूफान की स्थिति। समुद्र या नदी में न जाएं। यदि पहले से बाहर हैं तो तुरंत किनारे लौट आएं।',
    marineTitleWind: 'तेज हवा — उबड़-खाबड़ पानी',
    marineAdvWind: (val) => `हवा की गति ${val} किमी/घंटा है, जिससे पानी अशांत हो जाता है जो छोटी नावों के लिए खतरनाक है। आज मछली पकड़ने से बचें।`,
    marineTitleFog: 'कम दृश्यता — नेविगेशन जोखिम',
    marineAdvFog: 'घना कोहरा दृश्यता को काफी कम कर देता है। टकराने का उच्च जोखिम। कोहरा छंटने तक प्रस्थान में देरी करें।',
    marineTitleRain: 'भारी बारिश — फिसलन',
    marineAdvRain: (val) => `भारी बारिश (${val})। फिसलन भरी स्थिति और कम दृश्यता। बाहर जाने पर सावधानी बरतें।`,
    marineTitleGood: 'मछली पकड़ने के लिए सुरक्षित',
    marineAdvGood: (wind) => `शांत हवा (${wind || '--'} किमी/घंटा) और साफ स्थिति। मछली पकड़ने जाने के लिए सुरक्षित समय।`,

    // Aviation Advisory
    aviationTitleStorm: 'उड़ान का जोखिम — आंधी तूफान',
    aviationAdvStorm: 'गंभीर संवहनी गतिविधि। अशांति और बिजली गिरने का उच्च जोखिम। उड़ान संचालन में देरी करें।',
    aviationTitleWind: 'तेज हवा — क्रॉसविंड जोखिम',
    aviationAdvWind: (val) => `हवा की गति ${val} किमी/घंटा है। टेकऑफ़ और लैंडिंग के दौरान क्रॉसविंड के लिए सावधानी।`,
    aviationTitleFog: 'कम दृश्यता — VFR खतरा',
    aviationAdvFog: 'घना कोहरा दृश्यता को कम कर रहा है। IFR स्थितियाँ प्रबल हैं। उड़ान में देरी हो सकती है।',
    aviationTitleGood: 'VFR स्थितियाँ स्वीकार्य',
    aviationAdvGood: (wind) => `साफ आसमान और स्वीकार्य हवाएं (${wind || '--'} किमी/घंटा)। सामान्य उड्डयन के लिए अच्छी स्थिति।`,

    // Urban Planning Advisory
    urbanTitleRain: 'बाढ़ का जोखिम — जल निकासी तनाव',
    urbanAdvRain: (val) => `भारी बारिश का पूर्वानुमान (${val})। स्थानीय जलभराव का उच्च जोखिम। नगर पालिका को नाले साफ करने चाहिए।`,
    urbanTitleHeat: 'हीटवेव की तैयारी',
    urbanAdvHeat: (val) => `उच्च तापमान की उम्मीद (${val}°C)। कूलिंग सेंटर सक्रिय करें और सार्वजनिक जल उपलब्धता सुनिश्चित करें।`,
    urbanTitleGood: 'सामान्य नगरपालिका संचालन',
    urbanAdvGood: 'मौसम की स्थिति स्थिर है। शहर के बुनियादी ढांचे पर कोई महत्वपूर्ण तनाव की उम्मीद नहीं है।',

    // Seasonal Context
    seasonTitle: 'ऐतिहासिक जलवायु संदर्भ',
    seasonNormalFor: (month, city) => `${city} में ${month} के लिए सामान्य`,
    seasonAvgRain: 'औसत बारिश',
    seasonAvgTemp: 'औसत तापमान',
    seasonSummary: (month, city, rain, min, max, season) => `${month} में, ${city} में आमतौर पर ~${rain} मिमी बारिश होती है, जिसमें तापमान ${min}–${max}°C होता है। मौसम: ${season}।`
  },
  as: {
    // Heat Risk
    heatExtremeDanger: 'চৰম বিপদ',
    heatDanger: 'বিপদ',
    heatExtremeCaution: 'চৰম সাৱধানতা',
    heatCaution: 'সাৱধানতা',
    heatComfortable: 'আৰামদায়ক',
    heatAdvExtremeDanger: 'হিট ষ্ট্ৰোকৰ সম্ভাৱনা অতি বেছি। সকলো বাহিৰৰ কাম এৰক। লগে লগে এচি থকা আশ্ৰয় লওক।',
    heatAdvDanger: 'গৰমৰ ক্ৰেম্প আৰু ভাগৰ লগাৰ সম্ভাৱনা। পৰিশ্ৰম সীমিত কৰক। প্ৰতি ১৫ মিনিটত পানী খাওক।',
    heatAdvExtremeCaution: 'দীৰ্ঘসময় ধৰি থকাৰ ফলত ভাগৰ লাগিব পাৰে। কৃষকসকলে দুপৰীয়া পথাৰৰ কাম এৰিব লাগে।',
    heatAdvCaution: 'দীৰ্ঘদিনীয়া পৰিশ্ৰমৰ ফলত ভাগৰ লাগিব পাৰে। হাইড্ৰেটেড হৈ থাকক আৰু জিৰণি লওক।',
    heatAdvComfortable: 'আৰামদায়ক অৱস্থা। বাহিৰৰ কাম-কাজৰ বাবে উপযুক্ত।',

    // Farmer Advisory
    farmTitleStorm: 'পথাৰৰ সকলো কাম বন্ধ কৰক',
    farmAdvStorm: 'প্ৰবল ধুমুহা চলি আছে। লগে লগে মুকলি পথাৰ খালী কৰক। বাহিৰত যন্ত্ৰপাতি চলাব নালাগে।',
    farmTitleRain: 'পথাৰৰ কাম পিছুৱাই দিয়ক',
    farmAdvRain: (val) => `ধাৰাসাৰ বৰষুণ (${val})। সাৰ প্ৰয়োগ, ৰোপণ, আৰু শস্য চপোৱা পিছুৱাই দিয়ক। পানী জমা হোৱাৰ বাবে নলা পৰীক্ষা কৰক।`,
    farmAdvRainProb: (val) => `ধাৰাসাৰ বৰষুণৰ সম্ভাৱনা (${val}%)। শুকান দিনৰ বাবে পথাৰৰ কামৰ পৰিকল্পনা কৰক। নলা পৰীক্ষা কৰক।`,
    farmTitleSpray: 'কীটনাশক ছটিয়াই দিয়াৰ পৰা বিৰত থাকক',
    farmAdvSpray: (val) => `বৰষুণৰ সম্ভাৱনা (${val}%)। ৰাসায়নিক পদাৰ্থ উটি যাব — ৪ ঘণ্টাৰ শুকান বতৰলৈ অপেক্ষা কৰক।`,
    farmTitleUV: 'দুপৰীয়া পথাৰৰ কাম এৰক',
    farmAdvUV: (val) => `ইউভি ইনডেক্স ${val} অতি বেছি। ৰাতিপুৱা ১০ বজাৰ আগতে বা বিয়লি ৪ বজাৰ পিছত কাম কৰক। টুপী পিন্ধক আৰু সঘনাই পানী খাওক।`,
    farmTitleWind: 'প্ৰবল বতাহ — স্প্ৰে উৰি যোৱাৰ বিপদ',
    farmAdvWind: (val) => `বতাহৰ গতি ${val} কিমি/ঘণ্টাই স্প্ৰে লক্ষ্যভ্ৰষ্ট কৰিব। ছটিওৱাৰ আগতে বতাহ ১৫ কিমি/ঘণ্টাতকৈ কম হোৱালৈ অপেক্ষা কৰক।`,
    farmTitleFungal: 'ভেঁকুৰজনিত ৰোগৰ সতৰ্কবাণী',
    farmAdvFungal: (val) => `অধিক আৰ্দ্ৰতা (${val}%) + গৰম তাপমাত্ৰাই শস্যৰ ভেঁকুৰ ৰোগৰ বাবে আদৰ্শ পৰিৱেশ সৃষ্টি কৰে। শস্য পৰীক্ষা কৰক।`,
    farmTitleFog: 'ঘন কুঁৱলী — সীমিত দৃশ্যমানতা',
    farmAdvFog: 'কুঁৱলী আঁতৰি নোযোৱালৈকে ট্ৰেক্টৰ আৰু যন্ত্ৰপাতি চলোৱাৰ পৰা বিৰত থাকক। কুঁৱলীয়ে ভেঁকুৰ বিয়পাত সহায় কৰে।',
    farmTitleFrost: 'আজি ৰাতি বৰফৰ বিপদ',
    farmAdvFrost: (val) => `তাপমাত্ৰা ${val}°C লৈ হ্ৰাস পাইছে। বৰফৰ ক্ষতি ৰোধ কৰিবলৈ নিশা স্পৰ্শকাতৰ শস্যসমূহ মালচ বা পলিথিন শ্বিটেৰে ঢাকি ৰাখক।`,
    farmTitleIdeal: 'আজি আদৰ্শ পৰিৱেশ',
    farmAdvIdeal: (wind) => `ফৰকাল আকাশ, কম বতাহ (${wind || '--'} কিমি/ঘণ্টা), বৰষুণৰ কোনো আগজাননী নাই। ছটিওৱা, সাৰ প্ৰয়োগ, আৰু পথাৰৰ কামৰ বাবে ভাল দিন।`,
    farmTitleGood: 'উপযুক্ত কামৰ পৰিৱেশ',
    farmAdvGood: (uv) => `সাধাৰণ পথাৰৰ কামৰ বাবে গ্ৰহণযোগ্য পৰিৱেশ। ${uv >= 6 ? 'ইউভি মজলীয়া — ১১ বজাৰ পৰা ৩ বজাৰ ভিতৰত সূৰ্যৰ পৰা সুৰক্ষা ব্যৱহাৰ কৰক।' : 'বাহিৰৰ কাম-কাজৰ বাবে আৰামদায়ক দিন।'}`,

    // Health Impacts
    healthTitle: 'স্বাস্থ্য আৰু কাৰ্যকলাপৰ প্ৰভাৱ',
    healthAqiUnhealthy: (val) => `AQI ${val} অস্বাস্থ্যকৰ — উশাহ-নিশাহত অসুবিধা হোৱাৰ সম্ভাৱনা আছে। স্পৰ্শকাতৰ লোকসকল ঘৰৰ ভিতৰতে থাকিব লাগে।`,
    healthAqiMod: (val) => `AQI ${val} মজলীয়া — কিছুমান প্ৰদূষকে স্পৰ্শকাতৰ ব্যক্তিসকলৰ বাবে সামান্য অসুবিধা সৃষ্টি কৰিব পাৰে।`,
    healthUvVeryHigh: (val) => `ইউভি ইনডেক্স ${val} অতি বেছি — ১৫ মিনিটৰ সুৰক্ষাবিহীন সূৰ্যৰ পোহৰ ছালৰ ক্ষতি কৰিব পাৰে। SPF 50+ ব্যৱহাৰ কৰক।`,
    healthUvHigh: (val) => `ইউভি ইনডেক্স ${val} বেছি — ৰাতিপুৱা ১০ বজাৰ পৰা বিয়লি ৪ বজাৰ ভিতৰত ছানস্ক্ৰীণ আৰু সুৰক্ষামূলক কাপোৰ পিন্ধক।`,
    healthHumidity: (val) => `আৰ্দ্ৰতা ${val}% — ঘাম শুকোৱা মন্থৰ। শাৰীৰিক পৰিশ্ৰম তাপমাত্ৰাই সূচোৱাতকৈ বহুত বেছি ভাগৰুৱা যেন লাগে।`,
    healthGood: 'বায়ুৰ মানদণ্ড আৰু ইউভি পৰিস্থিতি নিৰাপদ সীমাৰ ভিতৰত আছে। বাহিৰৰ কাম-কাজৰ বাবে ভাল দিন।',

    // Marine Advisory
    marineTitleStorm: 'নাও নেমেলিব — ধুমুহাৰ বিপদ',
    marineAdvStorm: 'প্ৰবল ধুমুহাৰ পৰিস্থিতি। সাগৰ বা নদীলৈ নাযাব। যদি ইতিমধ্যে বাহিৰত আছে তেন্তে লগে লগে পাৰলৈ উভতি আহক।',
    marineTitleWind: 'প্ৰবল বতাহ — অস্থিৰ পানী',
    marineAdvWind: (val) => `বতাহৰ গতি ${val} কিমি/ঘণ্টা পানী অস্থিৰ আৰু সৰু নাওৰ বাবে বিপদজনক কৰি তোলে। আজি মাছ ধৰিবলৈ নাযাব।`,
    marineTitleFog: 'নিম্ন দৃশ্যমানতা — নেভিগেশ্যনৰ বিপদ',
    marineAdvFog: 'ঘন কুঁৱলীয়ে দৃশ্যমানতা যথেষ্ট হ্ৰাস কৰে। খুন্দা মৰাৰ অধিক বিপদ। কুঁৱলী আঁতৰি নোযোৱালৈকে যাত্ৰা পিছুৱাই দিয়ক।',
    marineTitleRain: 'ধাৰাসাৰ বৰষুণ — পিছল',
    marineAdvRain: (val) => `ধাৰাসাৰ বৰষুণ (${val})। পিছল পৰিস্থিতি আৰু দৃশ্যমানতা হ্ৰাস। বাহিৰলৈ গ'লে সাৱধানতা অৱলম্বন কৰক।`,
    marineTitleGood: 'মাছ ধৰাৰ বাবে সুৰক্ষিত',
    marineAdvGood: (wind) => `শান্ত বতাহ (${wind || '--'} কিমি/ঘণ্টা) আৰু পৰিষ্কাৰ পৰিস্থিতি। মাছ ধৰিবলৈ যোৱাৰ বাবে সুৰক্ষিত সময়।`,

    // Aviation Advisory
    aviationTitleStorm: 'উৰণৰ বিপদ — ধুমুহা',
    aviationAdvStorm: 'প্ৰবল সংবহনশীল কাৰ্যকলাপ। অস্থিৰতা আৰু বিজুলীৰ অধিক বিপদ। উৰণ পলম কৰক।',
    aviationTitleWind: 'প্ৰবল বতাহ — ক্ৰছউইণ্ডৰ বিপদ',
    aviationAdvWind: (val) => `বতাহৰ গতি ${val} কিমি/ঘণ্টা। উৰণ আৰু অৱতৰণৰ সময়ত সাৱধানতা অৱলম্বন কৰক।`,
    aviationTitleFog: 'নিম্ন দৃশ্যমানতা — VFR বিপদ',
    aviationAdvFog: 'ঘন কুঁৱলীয়ে দৃশ্যমানতা হ্ৰাস কৰিছে। উৰণ পলম হব পাৰে।',
    aviationTitleGood: 'VFR পৰিস্থিতি গ্ৰহণযোগ্য',
    aviationAdvGood: (wind) => `ফৰকাল আকাশ আৰু গ্ৰহণযোগ্য বতাহ (${wind || '--'} কিমি/ঘণ্টা)। সাধাৰণ উৰণৰ বাবে ভাল পৰিস্থিতি।`,

    // Urban Planning Advisory
    urbanTitleRain: 'বানপানীৰ বিপদ — নলাৰ ওপৰত চাপ',
    urbanAdvRain: (val) => `ধাৰাসাৰ বৰষুণৰ আগজাননী (${val})। পানী জমা হোৱাৰ অধিক বিপদ। পৌৰসভাই নলা পৰিষ্কাৰ কৰিব লাগে।`,
    urbanTitleHeat: 'হিটৱেভৰ প্ৰস্তুতি',
    urbanAdvHeat: (val) => `অধিক তাপমাত্ৰাৰ আশা (${val}°C)। কুলিং চেণ্টাৰ সক্ৰিয় কৰক আৰু পানীৰ উপলব্ধতা নিশ্চিত কৰক।`,
    urbanTitleGood: 'সাধাৰণ পৌৰসভাৰ কাম-কাজ',
    urbanAdvGood: 'বতৰৰ অৱস্থা স্থিৰ। চহৰৰ আন্তঃগাঁথনিৰ ওপৰত কোনো গুৰুত্বপূৰ্ণ চাপৰ আশা নাই।',

    // Seasonal Context
    seasonTitle: 'ঐতিহাসিক জলবায়ুৰ প্ৰসংগ',
    seasonNormalFor: (month, city) => `${city}ত ${month}ৰ বাবে স্বাভাৱিক`,
    seasonAvgRain: 'গড় বৰষুণ',
    seasonAvgTemp: 'গড় তাপমাত্ৰা',
    seasonSummary: (month, city, rain, min, max, season) => `${month} মাহত, ${city}ত সাধাৰণতে ~${rain} মিমি বৰষুণ হয়, তাপমাত্ৰা ${min}–${max}°C থাকে। ঋতু: ${season}।`
  },
  bn: {
    // Heat Risk
    heatExtremeDanger: 'চরম বিপদ',
    heatDanger: 'বিপদ',
    heatExtremeCaution: 'চরম সতর্কতা',
    heatCaution: 'সতর্কতা',
    heatComfortable: 'আরামদায়ক',
    heatAdvExtremeDanger: 'হিট স্ট্রোকের সম্ভাবনা খুব বেশি। বাইরের সব কাজ এড়িয়ে চলুন। অবিলম্বে শীতাতপ নিয়ন্ত্রিত আশ্রয়ে যান।',
    heatAdvDanger: 'গরমের কারণে পেশীতে টান ও ক্লান্তি আসতে পারে। পরিশ্রম কমান। প্রতি ১৫ মিনিট অন্তর জল পান করুন।',
    heatAdvExtremeCaution: 'দীর্ঘক্ষণ থাকলে ক্লান্তি আসতে পারে। কৃষকদের দুপুরে মাঠে কাজ করা এড়ানো উচিত।',
    heatAdvCaution: 'দীর্ঘক্ষণ পরিশ্রমে ক্লান্তি আসতে পারে। হাইড্রেটেড থাকুন এবং বিরতি নিন।',
    heatAdvComfortable: 'আরামদায়ক অবস্থা। বাইরের কাজ এবং ক্রিয়াকলাপের জন্য উপযুক্ত।',

    // Farmer Advisory
    farmTitleStorm: 'মাঠের সব কাজ বন্ধ করুন',
    farmAdvStorm: 'প্রবল বজ্রঝড় চলছে। অবিলম্বে খোলা মাঠ ছেড়ে যান। বাইরে যন্ত্রপাতি চালাবেন না।',
    farmTitleRain: 'মাঠের কাজ পিছিয়ে দিন',
    farmAdvRain: (val) => `ভারী বৃষ্টি (${val})। সার প্রয়োগ, রোপণ এবং ফসল কাটা পিছিয়ে দিন। জল জমার জন্য ড্রেনেজ চ্যানেল পরীক্ষা করুন।`,
    farmAdvRainProb: (val) => `ভারী বৃষ্টির সম্ভাবনা (${val}%)। শুকনো দিনের জন্য মাঠের কাজের পরিকল্পনা করুন। ড্রেনেজ পরীক্ষা করুন।`,
    farmTitleSpray: 'কীটনাশক স্প্রে করা এড়িয়ে চলুন',
    farmAdvSpray: (val) => `বৃষ্টির সম্ভাবনা (${val}%)। রাসায়নিক ধুয়ে যাবে — ৪ ঘণ্টার শুকনো আবহের জন্য অপেক্ষা করুন।`,
    farmTitleUV: 'দুপুরে মাঠে কাজ করা এড়িয়ে চলুন',
    farmAdvUV: (val) => `ইউভি সূচক ${val} খুব বেশি। সকাল ১০ টার আগে বা বিকাল ৪ টার পরে কাজ করুন। টুপি পরুন এবং ঘন ঘন জল পান করুন।`,
    farmTitleWind: 'প্রবল বাতাস — স্প্রে উড়ে যাওয়ার ঝুঁকি',
    farmAdvWind: (val) => `বাতাস ${val} কিমি/ঘন্টা বেগে স্প্রে লক্ষ্যভ্রষ্ট করবে। স্প্রে করার আগে বাতাস ১৫ কিমি/ঘন্টার কম হওয়ার জন্য অপেক্ষা করুন।`,
    farmTitleFungal: 'ছত্রাকজনিত রোগের সতর্কতা',
    farmAdvFungal: (val) => `উচ্চ আর্দ্রতা (${val}%) + উষ্ণ তাপমাত্রা ছত্রাকজনিত ফসলের রোগের জন্য আদর্শ পরিস্থিতি তৈরি করে। ফসল পরীক্ষা করুন।`,
    farmTitleFog: 'ঘন কুয়াশা — সীমিত দৃশ্যমানতা',
    farmAdvFog: 'কুয়াশা পরিষ্কার না হওয়া পর্যন্ত ট্রাক্টর এবং যন্ত্রপাতি চালানো এড়িয়ে চলুন। কুয়াশা ছত্রাক ছড়াতে সাহায্য করে।',
    farmTitleFrost: 'আজ রাতে তুষারপাতের ঝুঁকি',
    farmAdvFrost: (val) => `তাপমাত্রা ${val}°C এ নেমে যাচ্ছে। তুষারপাতের ক্ষতি রোধ করতে রাতে সংবেদনশীল ফসল মালচ বা পলিথিন দিয়ে ঢেকে রাখুন।`,
    farmTitleIdeal: 'আজ আদর্শ পরিস্থিতি',
    farmAdvIdeal: (wind) => `পরিষ্কার আকাশ, কম বাতাস (${wind || '--'} কিমি/ঘন্টা), বৃষ্টির পূর্বাভাস নেই। সার প্রয়োগ এবং মাঠের কাজের জন্য ভালো দিন।`,
    farmTitleGood: 'উপযুক্ত কাজের পরিস্থিতি',
    farmAdvGood: (uv) => `সাধারণ মাঠের কাজের জন্য গ্রহণযোগ্য পরিস্থিতি। ${uv >= 6 ? 'ইউভি মাঝারি — সকাল ১১ টা থেকে বিকেল ৩ টার মধ্যে রোদ থেকে সুরক্ষা নিন।' : 'বাইরের কাজের জন্য আরামদায়ক দিন।'}`,

    // Health Impacts
    healthTitle: 'স্বাস্থ্য ও কার্যকলাপের প্রভাব',
    healthAqiUnhealthy: (val) => `AQI ${val} অস্বাস্থ্যকর — শ্বাসকষ্ট হওয়ার সম্ভাবনা। সংবেদনশীল গোষ্ঠীর (শিশু, বয়স্ক, হাঁপানি রোগী) বাড়ির ভেতরে থাকা উচিত।`,
    healthAqiMod: (val) => `AQI ${val} মাঝারি — কিছু দূষক সংবেদনশীল ব্যক্তিদের জন্য হালকা অস্বস্তি সৃষ্টি করতে পারে।`,
    healthUvVeryHigh: (val) => `ইউভি সূচক ${val} খুব বেশি — ১৫ মিনিটের অরক্ষিত রোদ ত্বকের ক্ষতি করতে পারে। SPF 50+ ব্যবহার করুন।`,
    healthUvHigh: (val) => `ইউভি সূচক ${val} বেশি — সকাল ১০ টা থেকে বিকাল ৪ টার মধ্যে সানস্ক্রিন এবং সুরক্ষামূলক পোশাক পরুন।`,
    healthHumidity: (val) => `আর্দ্রতা ${val}% — ঘাম শুকানো ধীর। শারীরিক পরিশ্রম তাপমাত্রার চেয়ে অনেক বেশি ক্লান্তিকর মনে হয়।`,
    healthGood: 'বায়ুর মান এবং ইউভি পরিস্থিতি নিরাপদ সীমার মধ্যে। বাইরের কাজের জন্য ভালো দিন।',

    // Marine Advisory
    marineTitleStorm: 'নৌকা বের করবেন না — ঝড়ের ঝুঁকি',
    marineAdvStorm: 'প্রবল বজ্রঝড়ের পরিস্থিতি। সমুদ্র বা নদীতে যাবেন না। যদি ইতিমধ্যে বাইরে থাকেন তবে অবিলম্বে তীরে ফিরে আসুন।',
    marineTitleWind: 'প্রবল বাতাস — উত্তাল জল',
    marineAdvWind: (val) => `বাতাসের গতি ${val} কিমি/ঘন্টা জলকে উত্তাল এবং ছোট নৌকার জন্য বিপজ্জনক করে তোলে। আজ মাছ ধরা এড়িয়ে চলুন।`,
    marineTitleFog: 'কম দৃশ্যমানতা — নেভিগেশনের ঝুঁকি',
    marineAdvFog: 'ঘন কুয়াশা দৃশ্যমানতা উল্লেখযোগ্যভাবে হ্রাস করে। সংঘর্ষের উচ্চ ঝুঁকি। কুয়াশা পরিষ্কার না হওয়া পর্যন্ত যাত্রা পিছিয়ে দিন।',
    marineTitleRain: 'ভারী বৃষ্টি — পিচ্ছিল',
    marineAdvRain: (val) => `ভারী বৃষ্টি (${val})। পিচ্ছিল পরিস্থিতি এবং কম দৃশ্যমানতা। বাইরে গেলে সতর্কতা অবলম্বন করুন।`,
    marineTitleGood: 'মাছ ধরার জন্য নিরাপদ',
    marineAdvGood: (wind) => `শান্ত বাতাস (${wind || '--'} কিমি/ঘন্টা) এবং পরিষ্কার পরিস্থিতি। মাছ ধরতে যাওয়ার জন্য নিরাপদ সময়।`,

    // Aviation Advisory
    aviationTitleStorm: 'উড়ানের ঝুঁকি — বজ্রঝড়',
    aviationAdvStorm: 'প্রবল সংবহনশীল কার্যকলাপ। অশান্তি এবং বজ্রপাতের উচ্চ ঝুঁকি। উড়ান বিলম্বিত করুন।',
    aviationTitleWind: 'প্রবল বাতাস — ক্রসউইন্ড ঝুঁকি',
    aviationAdvWind: (val) => `বাতাসের গতি ${val} কিমি/ঘন্টা। উড্ডয়ন এবং অবতরণের সময় সতর্কতা অবলম্বন করুন।`,
    aviationTitleFog: 'কম দৃশ্যমানতা — VFR বিপদ',
    aviationAdvFog: 'ঘন কুয়াশা দৃশ্যমানতা হ্রাস করছে। উড়ান বিলম্বিত হতে পারে।',
    aviationTitleGood: 'VFR পরিস্থিতি গ্রহণযোগ্য',
    aviationAdvGood: (wind) => `পরিষ্কার আকাশ এবং গ্রহণযোগ্য বাতাস (${wind || '--'} কিমি/ঘন্টা)। সাধারণ বিমান চলাচলের জন্য ভালো পরিস্থিতি।`,

    // Urban Planning Advisory
    urbanTitleRain: 'বন্যার ঝুঁকি — জল নিকাশি চাপ',
    urbanAdvRain: (val) => `ভারী বৃষ্টির পূর্বাভাস (${val})। জল জমার উচ্চ ঝুঁকি। পৌরসভার নালা পরিষ্কার করা উচিত।`,
    urbanTitleHeat: 'হিটওয়েভ প্রস্তুতি',
    urbanAdvHeat: (val) => `উচ্চ তাপমাত্রার আশা (${val}°C)। কুলিং সেন্টার সক্রিয় করুন এবং জলের প্রাপ্যতা নিশ্চিত করুন।`,
    urbanTitleGood: 'সাধারণ পৌরসভা কার্যক্রম',
    urbanAdvGood: 'আবহাওয়া পরিস্থিতি স্থিতিশীল। শহরের অবকাঠামোর ওপর কোনো উল্লেখযোগ্য চাপের আশা নেই।',

    // Seasonal Context
    seasonTitle: 'ঐতিহাসিক জলবায়ু প্রসঙ্গ',
    seasonNormalFor: (month, city) => `${city}-তে ${month} এর জন্য স্বাভাবিক`,
    seasonAvgRain: 'গড় বৃষ্টি',
    seasonAvgTemp: 'গড় তাপমাত্রা',
    seasonSummary: (month, city, rain, min, max, season) => `${month} মাসে, ${city}-তে সাধারণত ~${rain} মিমি বৃষ্টি হয়, তাপমাত্রা থাকে ${min}–${max}°C। ঋতু: ${season}।`
  },
  sa: {
    // Heat Risk
    heatExtremeDanger: 'अत्यन्त-सङ्कटः',
    heatDanger: 'सङ्कटः',
    heatExtremeCaution: 'अति-सावधानी',
    heatCaution: 'सावधानी',
    heatComfortable: 'सुखकरम्',
    heatAdvExtremeDanger: 'उष्णघातस्य महती सम्भावना। बहिः कार्यं त्यजतु। झटिति शीतलं स्थानं गच्छतु।',
    heatAdvDanger: 'उष्णताजन्या क्लान्तिः सम्भवति। जलं बहुशः पिबतु।',
    heatAdvExtremeCaution: 'दीर्घकाल-सम्पर्केण क्लान्तिः सम्भवति। मध्याह्ने क्षेत्रकार्यं परिहरतु।',
    heatAdvCaution: 'सन्ततं जलग्रहणं कुर्वन्तु। विश्रामं स्वीकुर्वन्तु।',
    heatAdvComfortable: 'ऋतुः सुखकरः वर्तते। बहिः कार्यार्थम् अनुकूलः समयः।',

    // Farmer Advisory
    farmTitleStorm: 'क्षेत्रकार्यं स्थगयतु',
    farmAdvStorm: 'तीव्रः आंधी-तूफानः सम्भाव्यते। त्वरितम् उद्घाटित-क्षेत्राणि त्यजतु।',
    farmTitleRain: 'क्षेत्रकार्यं विलम्बयतु',
    farmAdvRain: (val) => `प्रबलवृष्टिः (${val})। बीजारोपणं सस्यसङ्ग्रहणं वा विलम्बयतु। जलनिर्गमव्यवस्थां पश्यतु।`,
    farmAdvRainProb: (val) => `प्रबलवृष्टिसम्भावना (${val}%)। शुष्कदिने कार्यं कल्पयतु।`,
    farmTitleSpray: 'कीटनाशक-सेचनं परिहरतु',
    farmAdvSpray: (val) => `वृष्टिसम्भावना (${val}%)। रसायनानि क्षालितानि भविष्यन्ति।`,
    farmTitleUV: 'मध्याह्ने क्षेत्रकार्यं मा कुरुत',
    farmAdvUV: (val) => `अति-उच्चः UV सूचकाङ्कः (${val})। प्रातः १० वादनतः पूर्वं सायङ्काले वा कार्यं कुर्वन्तु।`,
    farmTitleWind: 'तीव्रवायुः — सेचन-विचालन-भयम्',
    farmAdvWind: (val) => `वायुगतिः ${val} किमी/होरा। सेचनं विचलितं भविष्यति। १५ किमी/होरा तः न्यूनायां गतौ सेचनं कुर्वन्तु।`,
    farmTitleFungal: 'कवक-रोग-चेतावनी',
    farmAdvFungal: (val) => `अत्यधिक-आर्द्रता (${val}%) कवक-रोगस्य कारणं भवितुम् अर्हति। सस्यानि निरीक्षताम्।`,
    farmTitleFog: 'सघनकुहेलिका — सीमितदृश्यता',
    farmAdvFog: 'कुहेलिकायाम् यन्त्रसञ्चालनं परिहरतु।',
    farmTitleFrost: 'तुषारपाताशङ्का',
    farmAdvFrost: (val) => `तापमानं ${val}°C यावत् पतति। कोमलसस्यानि आव्रियताम्।`,
    farmTitleIdeal: 'अद्य उत्तमः ऋतुः',
    farmAdvIdeal: (wind) => `निर्मलाकाशः, मन्दवायुः (${wind || '--'} किमी/होरा), वृष्टिः नास्ति। क्षेत्रकार्यार्थम् उत्तमं दिनम्।`,
    farmTitleGood: 'अनुकूलं कार्यवातावरणम्',
    farmAdvGood: (uv) => `सामान्य-कृषिकार्यार्थम् अनुकूलः समयः।`,

    // Health Impacts
    healthTitle: 'स्वास्थ्ये प्रभावः',
    healthAqiUnhealthy: (val) => `वायुगुणवत्ता ${val} अस्वास्थ्यकरा अस्ति — श्वासकष्टं सम्भवति। बालकाः वृद्धाश्च गृहे एव तिष्ठन्तु।`,
    healthAqiMod: 'वायुगुणवत्ता मध्यमा अस्ति। संवेदनशीलजनाः सावधानाः भवन्तु।',
    healthAqiGood: 'वायुगुणवत्ता उत्तमा अस्ति। बहिः कार्यार्थम् अनुकूला।',
    healthHeatWarning: 'उच्च-उष्णता — पर्याप्तं जलं पिबन्तु।',
    healthColdWarning: 'शीतलवातावरणम् — उष्णवस्त्राणि धरन्तु।',

    // Urban Advisory
    urbanTitleRain: 'नगरे जलभराव-सङ्कटः',
    urbanAdvRain: (val) => `सघना वृष्टिः (${val})। निम्नप्रदेशेषु जलभरावः सम्भवति। सतर्कतया वाहनं चालयतु।`,
    urbanTitleHeat: 'नगरीय-उष्णता-प्रभावः',
    urbanAdvHeat: (val) => `अत्युष्णता (${val}°C)। छायायुक्ते स्थाने तिष्ठन्तु।`,
    urbanTitleGood: 'सामान्य-नगरीय-स्थितिः',
    urbanAdvGood: 'ऋतुः स्थिरः अस्ति। नगरे सामान्यसञ्चारः सम्भवति।',

    // Seasonal Context
    seasonTitle: 'ऐतिहासिक-ऋतुप्रसङ्गः',
    seasonNormalFor: (month, city) => `${city} मध्ये ${month} मासार्थं सामान्यम्`,
    seasonAvgRain: 'औसतवृष्टिः',
    seasonAvgTemp: 'औसततापमानम्',
    seasonSummary: (month, city, rain, min, max, season) => `${month} मासे ${city} मध्ये सामान्यतः ~${rain} मिमी वृष्टिः भवति, तापमानं ${min}–${max}°C तिष्ठति। ऋतुः: ${season}।`
  }
};

export const FEATURE_I18N = createTranslationProxy(rawFeatureI18n);
