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
    'Checking today\'s forecast…',
    'Looking up conditions…',
    'Reading the sky…',
    'Almost ready…',
  ],
  hi: [
    'आज का पूर्वानुमान देख रहे हैं…',
    'मौसम की जानकारी ले रहे हैं…',
    'आसमान पढ़ रहे हैं…',
    'लगभग तैयार…',
  ],
  as: [
    'আজিৰ পূৰ্বানুমান চাই আছো…',
    'বতৰৰ তথ্য চাই আছো…',
    'আকাশ পঢ়ি আছো…',
    'প্ৰায় সাজু…',
  ],
  bn: [
    'আজকের পূর্বাভাস দেখছি…',
    'আবহাওয়ার তথ্য খুঁজছি…',
    'আকাশ পড়ছি…',
    'প্রায় তৈয়ার…',
  ],
};

export const PLACEHOLDERS = {
  en: 'Ask about the weather…',
  hi: 'मौसम के बारे में पूछें…',
  as: 'বতৰৰ বিষয়ে সুধক…',
  bn: 'আবহাওয়া সম্পর্কে জিজ্ঞাসা করুন…',
};

// Web Speech API language codes
export const SPEECH_LANG_CODES = {
  en: 'en-IN',
  hi: 'hi-IN',
  as: 'as-IN',
  bn: 'bn-IN',
};
