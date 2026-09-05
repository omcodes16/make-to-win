import { NER_CITIES } from './weatherApi.js';

/**
 * Hindi/Devanagari transliterations of NER city names.
 * Maps Hindi name → English canonical name used in NER_CITIES / geocoding.
 */
const HINDI_CITY_NAMES = {
  'गुवाहाटी': 'Guwahati', 'गुहाटी': 'Guwahati',
  'शिलांग': 'Shillong', 'शिलौंग': 'Shillong',
  'इंफाल': 'Imphal', 'इम्फाल': 'Imphal',
  'अगरतला': 'Agartala',
  'कोहिमा': 'Kohima',
  'आइजोल': 'Aizawl', 'आइज़ोल': 'Aizawl',
  'ईटानगर': 'Itanagar',
  'गंगटोक': 'Gangtok', 'गैंगटॉक': 'Gangtok',
  'डिब्रूगढ़': 'Dibrugarh', 'डिब्रूगढ': 'Dibrugarh',
  'जोरहाट': 'Jorhat',
  'सिलचर': 'Silchar',
  'तेजपुर': 'Tezpur',
  'नागांव': 'Nagaon', 'नगांव': 'Nagaon',
  'दीमापुर': 'Dimapur',
  'तूरा': 'Tura',
  'तिनसुकिया': 'Tinsukia',
  'नलबाड़ी': 'Nalbari',
  'बोंगाईगांव': 'Bongaigaon',
  'चेरापूंजी': 'Cherrapunji', 'चेरापुंजी': 'Cherrapunji',
  'डॉकी': 'Dawki',
  'मौसिनराम': 'Mawsynram',
  'पासीघाट': 'Pasighat',
  'तवांग': 'Tawang',
  'लुंगलेई': 'Lunglei',
  'नामची': 'Namchi',
};

/**
 * Assamese transliterations of NER city names.
 */
const ASSAMESE_CITY_NAMES = {
  'গুৱাহাটী': 'Guwahati',
  'শ্বিলং': 'Shillong', 'শিলং': 'Shillong',
  'ইম্ফল': 'Imphal',
  'আগৰতলা': 'Agartala',
  'কোহিমা': 'Kohima',
  'আইজল': 'Aizawl',
  'ইটানগৰ': 'Itanagar',
  'গেংটক': 'Gangtok',
  'ডিব্ৰুগড়': 'Dibrugarh',
  'যোৰহাট': 'Jorhat',
  'শিলচৰ': 'Silchar',
  'তেজপুৰ': 'Tezpur',
  'নগাঁও': 'Nagaon',
  'ডিমাপুৰ': 'Dimapur',
  'তুৰা': 'Tura',
  'তিনচুকীয়া': 'Tinsukia',
  'চেৰাপুঞ্জী': 'Cherrapunji',
  'তাৱাং': 'Tawang',
};

/**
 * Bengali transliterations of NER city names.
 */
const BENGALI_CITY_NAMES = {
  'গুয়াহাটি': 'Guwahati',
  'শিলং': 'Shillong',
  'ইম্ফল': 'Imphal',
  'আগরতলা': 'Agartala',
  'কোহিমা': 'Kohima',
  'আইজল': 'Aizawl',
  'ইটানগর': 'Itanagar',
  'গ্যাংটক': 'Gangtok',
  'ডিব্রুগড়': 'Dibrugarh',
  'যোরহাট': 'Jorhat',
  'শিলচর': 'Silchar',
  'তেজপুর': 'Tezpur',
  'নাগাঁও': 'Nagaon',
  'দিমাপুর': 'Dimapur',
  'তুরা': 'Tura',
  'তিনসুকিয়া': 'Tinsukia',
  'চেরাপুঞ্জি': 'Cherrapunji',
  'তাওয়াং': 'Tawang',
};

// Common non-location words to skip (English, Hindi, Assamese, Bengali)
// Common greetings and non-location words to skip
const GREETINGS = new Set(['hi', 'hy', 'hyy', 'hey', 'hello', 'namaste', 'kaise', 'kya', 'good', 'morning', 'evening', 'night', 'bye', 'ok', 'okay', 'thanks', 'thank', 'help', 'weather', 'hai', 'ho']);
const SKIP_WORDS = new Set([
  // English
  'will', 'is', 'what', 'how', 'can', 'should', 'does', 'the', 'today',
  'tomorrow', 'weather', 'rain', 'safe', 'travel', 'week', 'tell', 'give',
  'show', 'any', 'heavy', 'it', 'be', 'there', 'this', 'that', 'and',
  'for', 'are', 'was', 'not', 'but', 'have', 'has', 'had', 'with', 'from',
  'like', 'cold', 'hot', 'warm', 'good', 'bad', 'now', 'right',
  // Hindi common words
  'क्या', 'आज', 'कल', 'में', 'है', 'हैं', 'का', 'की', 'के', 'से', 'पर',
  'को', 'ने', 'और', 'या', 'मौसम', 'बारिश', 'होगी', 'होगा', 'कैसा', 'कैसी',
  'कितना', 'कितनी', 'यात्रा', 'सुरक्षित', 'हफ्ते', 'सप्ताह', 'अभी', 'बताओ',
  'बताइए', 'ठंड', 'गर्मी', 'धूप', 'हवा', 'आप', 'किस', 'शहर', 'जिले',
  'बारे', 'पूछ', 'रहे', 'रही', 'रहेगा', 'रहेंगे', 'रहेंगी', 'कैसा', 'कैसी',
  // Assamese common words
  'আজি', 'কালি', 'বতৰ', 'বৰষুণ', 'হ\'ব', 'কেনে', 'কিমান', 'নে',
  // Bengali common words
  'আজ', 'কাল', 'আবহাওয়া', 'বৃষ্টি', 'হবে', 'কেমন', 'কতটা',
]);

/**
 * Extract a location name from a user's message.
 *
 * Strategy (in order):
 * 1. Check for Hindi/Assamese/Bengali transliterated city names
 * 2. Check for English NER city names (case-insensitive)
 * 3. If the message is 1-2 words, treat the whole thing as a potential location
 * 4. Extract non-skip-word candidates and return the best match
 *
 * Returns the location string or null.
 */
export function extractLocation(message) {
  if (!message || typeof message !== 'string') return null;
  // Strip emojis and excessive punctuation
  const trimmed = message.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').replace(/[\u{2600}-\u{27BF}]/gu, '').trim();
  if (!trimmed) return null;

  // 1. Check Hindi transliterations
  for (const [hindiName, englishName] of Object.entries(HINDI_CITY_NAMES)) {
    if (trimmed.includes(hindiName)) return englishName;
  }

  // 2. Check Assamese transliterations
  for (const [asmName, englishName] of Object.entries(ASSAMESE_CITY_NAMES)) {
    if (trimmed.includes(asmName)) return englishName;
  }

  // 3. Check Bengali transliterations
  for (const [bnName, englishName] of Object.entries(BENGALI_CITY_NAMES)) {
    if (trimmed.includes(bnName)) return englishName;
  }

  const lower = trimmed.toLowerCase();

  // 4. Check English NER cities (case-insensitive, longest matches first e.g. "Loktak Lake" before "Loktak")
  const sortedKeys = Object.keys(NER_CITIES).sort((a, b) => b.length - a.length);
  for (const cityKey of sortedKeys) {
    if (lower.includes(cityKey)) {
      return NER_CITIES[cityKey].name;
    }
  }

  // 4b. Preposition extraction (e.g. "in Loktak Lake", "at Loktak Lake", "for Bhopal")
  const prepMatch = trimmed.match(/\b(?:in|at|for|around|near)\s+([A-Za-z0-9\s\-']{2,30}?)(?:\s+today|\s+tomorrow|\s+now|[?,!.।॥]|$)/i);
  if (prepMatch && prepMatch[1]) {
    const cand = prepMatch[1].trim();
    const candLower = cand.toLowerCase();
    if (!SKIP_WORDS.has(candLower) && !GREETINGS.has(candLower)) {
      if (NER_CITIES[candLower]) {
        return NER_CITIES[candLower].name;
      }
      return cand;
    }
  }

  // 5. If the message is very short (1-2 words), treat the whole thing
  //    as a potential location name — the user is likely just typing a city
  const words = trimmed.split(/\s+/);
  
  // 5. If the message is very short (1-2 words), check if it's just a greeting
  if (words.length <= 2) {
    const cleaned = trimmed.replace(/[?,!.।॥]/g, '').trim().toLowerCase();
    
    // If it's a known greeting or a skip word, DO NOT treat it as a location
    let isGreeting = true;
    for (const w of words) {
        const wLower = w.replace(/[?,!.।॥]/g, '').toLowerCase();
        if (!GREETINGS.has(wLower) && !SKIP_WORDS.has(wLower)) {
            isGreeting = false;
            break;
        }
    }
    
    if (isGreeting) {
        return null; // It's just a greeting, not a location
    }
    
    // Otherwise, assume it's a city name they typed directly
    if (cleaned.length >= 2) return trimmed.replace(/[?,!.।॥]/g, '').trim();
  }

  // 6. For longer messages, find candidate words that aren't common/skip words
  const candidates = [];
  for (const word of words) {
    const cleaned = word.replace(/[?,!.।॥'"]/g, '');
    if (cleaned.length < 2) continue;

    const cleanedLower = cleaned.toLowerCase();
    if (SKIP_WORDS.has(cleanedLower)) continue;

    // Check if the word is in a non-Latin script (Hindi/Assamese/Bengali)
    // If so and it's not in skip words, it could be a location
    if (/[^\x00-\x7F]/.test(cleaned) && !SKIP_WORDS.has(cleaned)) {
      candidates.push(cleaned);
      continue;
    }

    // For English words: keep those that start with uppercase,
    // or any word 3+ chars that isn't a known skip word
    if (/^[A-Z]/.test(cleaned) && cleaned.length >= 3) {
      candidates.push(cleaned);
    } else if (cleaned.length >= 3 && !SKIP_WORDS.has(cleanedLower)) {
      candidates.push(cleaned);
    }
  }

  // Return the first candidate (most likely the location in natural sentence order)
  if (candidates.length > 0) return candidates[0];

  return null;
}

/**
 * Generate a follow-up prompt asking the user for a location.
 * Returns localized text based on the current language.
 */
export function getLocationPrompt(language) {
  const prompts = {
    en: 'Which city or district are you asking about?',
    hi: 'आप किस शहर या जिले के बारे में पूछ रहे हैं?',
    as: 'আপুনি কোন চহৰ বা জিলাৰ বিষয়ে সুধিছে?',
    bn: 'আপনি কোন শহর বা জেলার বিষয়ে জিজ্ঞাসা করছেন?',
  };
  return prompts[language] || prompts.en;
}
