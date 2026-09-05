// WeatherGPT constants

export const COLORS = {
  base: '#F7F8FA',
  dusk: '#1B2A4A',
  teal: '#2F6F6D',
  amber: '#E8A33D',
  clay: '#C1443C',
  cloud: '#E8ECF1',
};

export const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'as', label: 'Assamese', nativeLabel: 'অসমীয়া' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം' },
  { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
  { code: 'or', label: 'Odia', nativeLabel: 'ଓଡ଼ିଆ' },
  { code: 'ur', label: 'Urdu', nativeLabel: 'اردو' },
  { code: 'sa', label: 'Sanskrit', nativeLabel: 'संस्कृतम्' },
  { code: 'mai', label: 'Maithili', nativeLabel: 'मैथिली' },
  { code: 'ne', label: 'Nepali', nativeLabel: 'नेपाली' },
  { code: 'kok', label: 'Konkani', nativeLabel: 'कोंकणी' },
];

export const EXAMPLE_QUESTIONS = {
  en: [
    '🌾 Should I spray crops in Guwahati today?',
    '✈️ Give me an aviation weather briefing for Shillong.',
    '🌊 Are there any flood warnings for Silchar?',
    '🛥️ What are the marine and wind conditions near Loktak Lake?',
  ],
  hi: [
    '🌾 क्या मुझे आज गुवाहाटी में फसलों पर कीटनाशक का छिड़काव करना चाहिए?',
    '✈️ शिलांग के लिए विमानन मौसम की जानकारी दें।',
    '🌊 क्या सिलचर के लिए कोई बाढ़ की चेतावनी है?',
    '🛥️ लोकतक झील के पास समुद्री और हवा की स्थिति क्या है?',
  ],
  as: [
    '🌾 মই আজি গুৱাহাটীত খেতিত ঔষধ ছটিয়াব পাৰিম নে?',
    '✈️ শ্বিলঙৰ বাবে বিমান চলাচলৰ বতৰৰ তথ্য দিয়ক।',
    '🌊 শিলচৰৰ বাবে বানপানীৰ কোনো সতৰ্কবাণী আছে নেকি?',
    '🛥️ লোকতক হ্ৰদৰ ওচৰত জল আৰু বতাহৰ অৱস্থা কেনে?',
  ],
  bn: [
    '🌾 আমি কি আজ গুয়াহাটিতে ফসলে কীটনাশক দিতে পারি?',
    '✈️ শিলং এর জন্য এভিয়েশন আবহাওয়ার তথ্য দিন।',
    '🌊 শিলচরের জন্য কি কোনো বন্যার সতর্কতা আছে?',
    '🛥️ লোকতাক লেকের কাছাকাছি নৌ এবং বাতাসের পরিস্থিতি কেমন?',
  ],
};

export const LOADING_TEXTS = {
  en: [
    'Connecting to live weather sensors…',
    'Analyzing NWP multi-model forecast…',
    'Checking radar & severe alerts…',
    'Synthesizing personalized advisory…',
    'Almost ready…',
  ],
  hi: [
    'मौसम सेंसर से लाइव डेटा ले रहे हैं…',
    'पूर्वानुमान मॉडल का विश्लेषण कर रहे हैं…',
    'रडार और चेतावनी की जाँच हो रही है…',
    'आपकी सलाह तैयार कर रहे हैं…',
    'लगभग तैयार…',
  ],
  as: [
    'বতৰৰ লাইভ চেন্সৰ পৰীক্ষা কৰি থকা হৈছে…',
    'পূৰ্বানুমান মডেল বিশ্লেষণ কৰি থকা হৈছে…',
    'ৰাডাৰ আৰু সতৰ্কবাণী পৰীক্ষা কৰি থকা হৈছে…',
    'পৰামৰ্শ প্ৰস্তুত কৰি থকা হৈছে…',
    'প্ৰায় সাজু…',
  ],
  bn: [
    'আবহাওয়া সেন্সর থেকে তথ্য নেওয়া হচ্ছে…',
    'পূর্বাভাস মডেল বিশ্লেষণ করা হচ্ছে…',
    'রাডার ও সতর্কতা পরীক্ষা করা হচ্ছে…',
    'পরামর্শ প্রস্তুত করা হচ্ছে…',
    'প্রায় প্রস্তুত…',
  ],
};

export const PLACEHOLDERS = {
  en: 'Ask about the weather…',
  hi: 'मौसम के बारे में पूछें…',
  as: 'বতৰৰ বিষয়ে সুধক…',
  bn: 'আবহাওয়া সম্পর্কে জিজ্ঞাসা করুন…',
  mr: 'हवामानाबद्दल विचारा…',
  ta: 'வானிலை பற்றி கேளுங்கள்…',
  te: 'వాతావరణం గురించి అడగండి…',
  gu: 'હવામાન વિશે પૂછો…',
  kn: 'ಹವಾಮಾನದ ಬಗ್ಗೆ ಕೇಳಿ…',
  ml: 'കാലാവസ്ഥയെക്കുറിച്ച് ചോദിക്കുക…',
  pa: 'ਮੌਸਮ ਬਾਰੇ ਪੁੱਛੋ…',
  or: 'ପାଣିପାଗ ବିଷୟରେ ପଚାରନ୍ତୁ…',
  ur: 'موسم کے بارے میں پوچھیں…',
  sa: 'ऋतुविषये पृच्छतु…',
  mai: 'मौसम के बारे में पूछू…',
  ne: 'मौसमको बारेमा सोध्नुहोस्…',
  kok: 'हवामाना विशीं विचारात…',
};

// Web Speech API language codes
export const SPEECH_LANG_CODES = {
  en: 'en-IN',
  hi: 'hi-IN',
  as: 'as-IN',
  bn: 'bn-IN',
  mr: 'mr-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  gu: 'gu-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  pa: 'pa-IN',
  or: 'or-IN',
  ur: 'ur-IN',
  sa: 'sa-IN',
  mai: 'hi-IN', // Maithili speech fallback
  ne: 'ne-NP',
  kok: 'kok-IN',
};
