import React, { useState, useEffect, useRef } from 'react';

// ---------------------------------------------------------------------------
// Hindi numbers (0-100) to spoken words converter
// Guarantees that speech engines say "सत्ताईस डिग्री", "चौदह किमी/घंटा" instead of raw numbers
// ---------------------------------------------------------------------------
const HINDI_NUMBER_WORDS = [
  'शून्य', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ', 'दस',
  'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस', 'बीस',
  'इक्कीस', 'बाईस', 'तेईस', 'चौबीस', 'पच्चीस', 'छब्बीस', 'सत्ताईस', 'अट्ठाईस', 'उनतीस', 'तीस',
  'इकतीस', 'बत्तीस', 'तैंतीस', 'चौंतीस', 'पैंतीस', 'छत्तीस', 'सैंतीस', 'अड़तीस', 'उनतालीस', 'चालीस',
  'इकतालीस', 'बयालीस', 'तैंतालीस', 'चवालीस', 'पैंतालीस', 'छियालीस', 'सैंतालीस', 'अड़तालीस', 'उनचास', 'पचास',
  'इक्यावन', 'बावन', 'तिरेपन', 'चौवन', 'पचपन', 'छप्पन', 'सत्तावन', 'अट्ठावन', 'उनसठ', 'साठ',
  'इकसठ', 'बासठ', 'तिरसठ', 'चौंसठ', 'पैंसठ', 'छियासठ', 'सरसठ', 'अड़सठ', 'उनहत्तर', 'सत्तर',
  'इकहत्तर', 'बहत्तर', 'तिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छिहत्तर', 'सतहत्तर', 'अठहत्तर', 'उन्नासी', 'अस्सी',
  'इक्यासी', 'बयासी', 'तिरासी', 'चौरासी', 'पचासी', 'छियासी', 'सत्तासी', 'अट्ठासी', 'नवासी', 'नब्बे',
  'इक्यानवे', 'बानवे', 'तिरानवे', 'चौरानवे', 'पंचानवे', 'छियानवे', 'सत्तानवे', 'अट्ठानवे', 'निन्यानवे', 'सौ'
];

export function toHindiWords(n) {
  const num = Math.round(Number(n));
  if (isNaN(num)) return String(n);
  if (num >= 0 && num <= 100) return HINDI_NUMBER_WORDS[num];
  return String(num);
}

// ---------------------------------------------------------------------------
// Language-specific radio bulletin UI strings
// ---------------------------------------------------------------------------
const BULLETIN_STRINGS = {
  hi: {
    stationName: 'आवाज़-ए-मौसम',
    frequency: 'ग्रामीण मौसम वाणी • 104.2 FM',
    liveBadge: 'सजीव रेडियो बुलेटिन',
    listenBtn: '🎙️ आवाज़-ए-मौसम सुनें',
    playing: 'रेडियो प्रसारण जारी है...',
    paused: 'प्रसारण रुका हुआ है',
    ready: '1 मिनट का लाइव बुलेटिन सुनें',
    speed: 'गति',
    transcript: 'लिखित विवरण व आंकड़े',
    hideTranscript: 'विवरण छिपाएं',
    stop: 'रोकें',
    play: 'शुरू करें',
    pause: 'रोकें',
    close: 'बंद करें',
    hdVoice: 'HD रेडियो आवाज़',
    downloadBtn: 'रेडियो बुलेटिन डाउनलोड करें',
    downloading: 'MP3 तैयार हो रहा है...',
    downloadDone: 'डाउनलोड पूरा हुआ!',
  },
  en: {
    stationName: 'Aawaz-e-Mausam',
    frequency: 'Rural Weather Radio • 104.2 FM',
    liveBadge: 'LIVE RADIO BULLETIN',
    listenBtn: '🎙️ Listen to Aawaz-e-Mausam',
    playing: 'Broadcasting live bulletin...',
    paused: 'Broadcast paused',
    ready: 'Listen to 1-minute live audio bulletin',
    speed: 'Speed',
    transcript: 'View Script & Details',
    hideTranscript: 'Hide Script',
    stop: 'Stop',
    play: 'Play',
    pause: 'Pause',
    close: 'Close',
    hdVoice: 'HD Radio Voice',
    downloadBtn: 'Download Audio Bulletin',
    downloading: 'Preparing MP3...',
    downloadDone: 'Download Complete!',
  },
  bn: {
    stationName: 'আওয়াজ-এ-মৌসুম',
    frequency: 'গ্রামীণ আবহাওয়া রেডিও • ১০৪.২ এফএম',
    liveBadge: 'সরাসরি রেডিও বুলেটিন',
    listenBtn: '🎙️ আওয়াজ-এ-মৌসুম শুনুন',
    playing: 'রেডিও সম্প্রচার চলছে...',
    paused: 'সম্প্রচার স্থগিত',
    ready: '১ মিনিটের সরাসরি বুলেটিন শুনুন',
    speed: 'গতি',
    transcript: 'অনুলিপি ও তথ্য',
    hideTranscript: 'অনুলিপি লুকান',
    stop: 'থামুন',
    play: 'চালান',
    pause: 'বিরতি',
    close: 'বন্ধ করুন',
    hdVoice: 'এইচডি রেডিও ভয়েস',
    downloadBtn: 'অডিও বুলেটিন ডাউনলোড করুন',
    downloading: 'MP3 প্রস্তুত হচ্ছে...',
    downloadDone: 'ডাউনলোড সফল হয়েছে!',
  },
  as: {
    stationName: 'আৱাজ-এ-মৌচম',
    frequency: 'গ্ৰাম্য বতৰ ৰেডিঅ\' • ১০৪.২ এফএম',
    liveBadge: 'লাইভ ৰেডিঅ\' বুলেটিন',
    listenBtn: '🎙️ আৱাজ-এ-মৌচম শুনক',
    playing: 'ৰেডিঅ\' সম্প্ৰচাৰ চলি আছে...',
    paused: 'সম্প্ৰচাৰ স্থগিত',
    ready: '১ মিনিটৰ লাইভ বুলেটিন শুনক',
    speed: 'গতি',
    transcript: 'বিৱৰণ আৰু তথ্য',
    hideTranscript: 'বিৱৰণ লুকুৱাওক',
    stop: 'বন্ধ কৰক',
    play: 'বজাওক',
    pause: 'ৰখা হওক',
    close: 'বন্ধ কৰক',
    hdVoice: 'এইচডি ৰেডিঅ\' ভইচ',
    downloadBtn: 'অডিঅ\' বুলেটিন ডাউনলোড কৰক',
    downloading: 'MP3 প্ৰস্তুত হৈ আছে...',
    downloadDone: 'ডাউনলোড সম্পূৰ্ণ হ\'ল!',
  },
};

/**
 * Builds a natural, realistic 45-60 second community radio weather broadcast script.
 * Uses exact spoken phrasing requested:
 * "आज [स्थान] का तापमान 27 डिग्री है, हवा 14 किलोमीटर प्रति घंटे की रफ़्तार से चल रही है..."
 */
export function generateBulletinScript({ locationName, district, stateName, weather, weatherInfo, language }) {
  const loc = locationName || 'आपके क्षेत्र';
  const fullLoc = [district, stateName].filter(Boolean).join(', ') || loc;
  const temp = Math.round(weather?.temperature ?? 27);
  const feelsLike = Math.round(weather?.feelsLike ?? temp);
  const condition = weatherInfo?.label || 'साफ़ मौसम';
  const humidity = Math.round(weather?.humidity ?? 70);
  const windSpeed = Math.round(weather?.windSpeed ?? 14);
  const maxTemp = Math.round(weather?.daily?.maxTemp?.[0] ?? (temp + 3));
  const minTemp = Math.round(weather?.daily?.minTemp?.[0] ?? (temp - 5));
  const rainProb = Math.round(weather?.daily?.precipProbMax?.[0] ?? weather?.precipitation ?? 0);

  if (language === 'hi') {
    const tempWord = toHindiWords(temp);
    const feelsWord = toHindiWords(feelsLike);
    const windWord = toHindiWords(windSpeed);
    const humWord = toHindiWords(humidity);
    const maxWord = toHindiWords(maxTemp);
    const minWord = toHindiWords(minTemp);

    let advisory = 'मौसम खेती-किसानी और रोज़मर्रा के कामों के लिए बिल्कुल सामान्य और अनुकूल है।';
    if (rainProb > 40 || condition.includes('बारिश') || condition.includes('बूंदाबांदी')) {
      advisory = 'बारिश की संभावना को देखते हुए किसान भाई फसलों पर कीटनाशक या रासायनिक खाद का छिड़काव कुछ समय के लिए टाल दें, और घर से बाहर निकलते समय छाता साथ रखें।';
    } else if (temp >= 38) {
      advisory = 'तीखी धूप और लू के प्रकोप से बचने के लिए भरपूर पानी पिएं। दोपहर 12 से 3 बजे के बीच धूप में निकलने से बचें और पशुओं को छायादार स्थान पर रखें।';
    } else if (temp <= 12) {
      advisory = 'सर्द हवाओं से बचाव के लिए गर्म कपड़ों का प्रयोग करें और रात के समय फसलों को पाले के प्रभाव से सुरक्षित रखें।';
    }

    return (
      `नमस्ते! यह है आवाज़-ए-मौसम, 104.2 FM, आपका अपना ग्रामीण मौसम रेडियो बुलेटिन। ` +
      `आज ${loc} का मौसम समाचार सुनिए। ` +
      `आज ${loc} का वर्तमान तापमान ${tempWord} डिग्री सेल्सियस है, जो हवा में नमी के कारण लगभग ${feelsWord} डिग्री जैसा महसूस हो रहा है। ` +
      `आसमान में ${condition} की स्थिति बनी हुई है। ` +
      `हवा ${windWord} किलोमीटर प्रति घंटे की रफ़्तार से चल रही है, और हवा में नमी ${humWord} प्रतिशत दर्ज की गई है। ` +
      `आज दिन का अधिकतम तापमान ${maxWord} डिग्री और रात का न्यूनतम तापमान ${minWord} डिग्री रहने का अनुमान है। ` +
      `मौसम परामर्श: ${advisory} ` +
      `सुरक्षित रहें और सटीक मौसम जानकारी के लिए सुनते रहें आवाज़-ए-मौसम। धन्यवाद!`
    );
  }

  if (language === 'bn') {
    let advisory = 'আবহাওয়া চাষাবাদের জন্য স্বাভাবিক ও অনুকূল রয়েছে।';
    if (rainProb > 40 || condition.includes('বৃষ্টি')) {
      advisory = 'বৃষ্টির সম্ভাবনার কারণে জমিতে সার বা কীটনাশক প্রয়োগ আপাতত স্থগিত রাখুন এবং বাইরে বের হলে ছাতা সঙ্গে রাখুন।';
    } else if (temp >= 38) {
      advisory = 'তীব্র তাপপ্রবাহ থেকে বাঁচতে প্রচুর জল পান করুন এবং দুপুরের রোদ এড়িয়ে চলুন।';
    } else if (temp <= 12) {
      advisory = 'শীতের প্রকোপ থেকে বাঁচতে সতর্ক থাকুন এবং রাতে ফসলে শিশিরের প্রভাব থেকে রক্ষা করার ব্যবস্থা নিন।';
    }

    return (
      `নমস্কার! এটি আওয়াজ-এ-মৌসুম, গ্রামীণ আবহাওয়া রেডিও ১০৪.২ এফএম। ` +
      `আজ ${loc}-এর আবহাওয়া বুলেটিন শুনুন। ` +
      `আজ ${loc}-এর বর্তমান তাপমাত্রা ${temp} ডিগ্রি সেলসিয়াস, যা আর্দ্রতার কারণে প্রায় ${feelsLike} ডিগ্রির মতো অনুভূত হচ্ছে। ` +
      `আকাশে বর্তমানে ${condition} পরিলক্ষিত হচ্ছে। ` +
      `বাতাস ঘণ্টায় ${windSpeed} কিলোমিটার গতিতে বইছে, এবং বাতাসে আর্দ্রতা ${humidity} শতাংশ। ` +
      `আজ সর্বোচ্চ তাপমাত্রা প্রায় ${maxTemp} ডিগ্রি এবং সর্বনিম্ন ${minTemp} ডিগ্রি সেলসিয়াস হতে পারে। ` +
      `আবহাওয়া পরামর্শ: ${advisory} ` +
      `নিরাপদে থাকুন, শুনতে থাকুন আওয়াজ-এ-মৌসুম। ধন্যবাদ!`
    );
  }

  if (language === 'as') {
    let advisory = 'বতৰ কৃষিকাৰ্যৰ বাবে স্বাভাৱিক আৰু অনুকূল আছে।';
    if (rainProb > 40 || condition.includes('বৰষুণ')) {
      advisory = 'বৰষুণৰ সম্ভাৱনা থকা বাবে শস্যত ঔষধ বা সাৰ ছটিওৱা কিছু সময় স্থগিত ৰাখক আৰু ছাতি লগত ৰাখক।';
    } else if (temp >= 38) {
      advisory = 'প্ৰখৰ ৰ\'দ আৰু গৰমৰ পৰা ৰক্ষা পাবলৈ প্ৰচুৰ পানী খাওক।';
    }

    return (
      `নমস্কাৰ! এইটো আৱাজ-এ-মৌচম, গ্ৰাম্য বতৰ ৰেডিঅ' ১০৪.২ এফএম। ` +
      `আজি ${loc}ৰ বতৰৰ বিশেষ সংবাদ শুনক। ` +
      `আজি ${loc}ত বৰ্তমান উত্তাপ ${temp} ডিগ্ৰী চেলচিয়াছ, যিটো আৰ্দ্ৰতাৰ বাবে প্ৰায় ${feelsLike} ডিগ্ৰীৰ দৰে অনুভৱ হৈছে। ` +
      `আকাশত এতিয়া ${condition} চলি আছে। ` +
      `বতাহ প্ৰতি ঘণ্টাত ${windSpeed} কিলোমিটাৰ গতিত চলি আছে আৰু বতাহত আৰ্দ্ৰতা ${humidity} শতাংশ। ` +
      `আজি দিনৰ সৰ্বোচ্চ উত্তাপ প্ৰায় ${maxTemp} ডিগ্ৰী আৰু সৰ্বনিম্ন ${minTemp} ডিগ্ৰী হ'ব পাৰে। ` +
      `বতৰৰ পৰামৰ্শ: ${advisory} ` +
      `সজাগ থাকক, শুনি থাকক আৱাজ-এ-মৌচম। ধন্যবাদ!`
    );
  }

  // English radio bulletin format
  let advisory = 'Weather conditions remain stable and conducive for agricultural and daily outdoor activities.';
  if (rainProb > 40 || condition.toLowerCase().includes('rain') || condition.toLowerCase().includes('drizzle')) {
    advisory = 'Keep an umbrella handy due to expected rain. Farmers are advised to postpone spraying pesticides or fertilizers.';
  } else if (temp >= 38) {
    advisory = 'Drink plenty of water to prevent heat stroke, avoid direct sun between noon and 3 PM, and keep cattle shaded.';
  } else if (temp <= 12) {
    advisory = 'Wear warm clothing to guard against cold drafts, and protect young crops from night frost.';
  }

  return (
    `Hello and welcome to Aawaz-e-Mausam, 104.2 FM, your community weather radio bulletin. ` +
    `Here is today's live weather update for ${loc}, ${fullLoc}. ` +
    `Today's current temperature in ${loc} is ${temp} degrees Celsius, feeling like ${feelsLike} degrees due to atmospheric humidity. ` +
    `Current sky conditions show ${condition}. ` +
    `Winds are blowing at a speed of ${windSpeed} kilometers per hour, with relative humidity recorded at ${humidity} percent. ` +
    `Today's maximum temperature is forecasted to reach ${maxTemp} degrees, dropping to a minimum of ${minTemp} degrees tonight. ` +
    `Weather Advisory: ${advisory} ` +
    `Stay safe, stay informed, and keep tuned to Aawaz-e-Mausam. Thank you!`
  );
}

export default function AawazEMausam({ stageData, weatherInfo, language = 'hi' }) {
  const langKey = BULLETIN_STRINGS[language] ? language : 'en';
  const s = BULLETIN_STRINGS[langKey];

  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [speechScript, setSpeechScript] = useState('');
  const [audioChunks, setAudioChunks] = useState([]);
  const [activeChunkIndex, setActiveChunkIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const audioRef = useRef(null);
  const utteranceRef = useRef(null);

  // Generate bulletin script whenever location, weather, or language changes
  useEffect(() => {
    if (!stageData?.weather) return;
    const script = generateBulletinScript({
      locationName: stageData.locationName,
      district: stageData.district,
      stateName: stageData.state,
      weather: stageData.weather,
      weatherInfo,
      language: langKey,
    });
    setSpeechScript(script);
    // Reset any cached audio chunks when location/weather changes
    setAudioChunks([]);
  }, [stageData, weatherInfo, langKey]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  const stopAllAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setIsLoadingAudio(false);
  };

  /**
   * Primary Engine: Google TTS HD Audio playback
   * Plays sequential base64 chunks seamlessly
   */
  const playAudioChunks = (chunks, index = 0, playbackRate = rate) => {
    if (!chunks || index >= chunks.length) {
      setIsPlaying(false);
      setIsPaused(false);
      setActiveChunkIndex(0);
      return;
    }

    setActiveChunkIndex(index);
    const audio = new Audio(`data:audio/mp3;base64,${chunks[index]}`);
    audio.playbackRate = playbackRate;
    audioRef.current = audio;

    audio.onplay = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setIsLoadingAudio(false);
    };

    audio.onended = () => {
      playAudioChunks(chunks, index + 1, playbackRate);
    };

    audio.onerror = (e) => {
      console.warn("HD Audio chunk error, falling back to Web Speech:", e);
      fallbackWebSpeech(speechScript, playbackRate);
    };

    audio.play().catch(err => {
      console.warn("Audio autoplay blocked or error:", err);
      fallbackWebSpeech(speechScript, playbackRate);
    });
  };

  /**
   * Fallback Engine: Web Speech API synthesis
   */
  const fallbackWebSpeech = (script, playbackRate = rate) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(script);
    u.rate = playbackRate;
    u.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const targetPrefix = langKey === 'hi' ? 'hi' : langKey === 'bn' ? 'bn' : langKey === 'as' ? 'as' : 'en-IN';
    const voice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(targetPrefix)) ||
                  voices.find(v => v.name.toLowerCase().includes('india') || v.lang.includes('IN'));
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    } else {
      u.lang = langKey === 'hi' ? 'hi-IN' : langKey === 'bn' ? 'bn-IN' : 'en-IN';
    }

    u.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setIsLoadingAudio(false);
    };
    u.onpause = () => setIsPaused(true);
    u.onresume = () => setIsPaused(false);
    u.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    u.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setIsLoadingAudio(false);
    };

    utteranceRef.current = u;
    window.speechSynthesis.speak(u);
  };

  /**
   * Starts or resumes broadcast
   */
  const startBroadcast = async () => {
    if (!speechScript) return;

    // If we already have audio chunks cached in state
    if (audioChunks.length > 0) {
      playAudioChunks(audioChunks, 0, rate);
      return;
    }

    setIsLoadingAudio(true);
    try {
      // Call our backend /api/tts endpoint
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: speechScript,
          lang: langKey
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.audioChunks) && data.audioChunks.length > 0) {
          setAudioChunks(data.audioChunks);
          playAudioChunks(data.audioChunks, 0, rate);
          return;
        }
      }
    } catch (err) {
      console.warn("Backend TTS fetch notice:", err.message);
    }

    // Secondary fallback to Web Speech
    fallbackWebSpeech(speechScript, rate);
  };

  const handleTogglePlay = () => {
    if (isLoadingAudio) return;

    if (!isPlaying) {
      startBroadcast();
    } else if (isPaused) {
      // Resume
      if (audioRef.current) {
        audioRef.current.play();
      } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.resume();
      }
      setIsPaused(false);
    } else {
      // Pause
      if (audioRef.current) {
        audioRef.current.pause();
      } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.pause();
      }
      setIsPaused(true);
    }
  };

  const handleChangeRate = (newRate) => {
    setRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
    if (isPlaying && utteranceRef.current && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      fallbackWebSpeech(speechScript, newRate);
    }
  };

  // Download complete bulletin as MP3 (Concatenates all audio chunks)
  const handleDownload = async () => {
    if (isDownloading) return;

    let chunksToSave = audioChunks;

    // If audio chunks not generated yet, fetch them on demand
    if (!chunksToSave || chunksToSave.length === 0) {
      setIsDownloading(true);
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: speechScript,
            lang: langKey
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.audioChunks) && data.audioChunks.length > 0) {
            chunksToSave = data.audioChunks;
            setAudioChunks(data.audioChunks);
          }
        }
      } catch (err) {
        console.error("Failed to generate MP3 for download:", err);
      } finally {
        setIsDownloading(false);
      }
    }

    if (!chunksToSave || chunksToSave.length === 0) {
      alert("ऑडियो बुलेटिन तैयार नहीं हो सका, कृपया दोबारा प्रयास करें।");
      return;
    }

    try {
      // Concatenate all chunks into a continuous MP3 file
      const byteArrays = [];
      for (const b64 of chunksToSave) {
        const binaryString = atob(b64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        byteArrays.push(bytes);
      }

      const blob = new Blob(byteArrays, { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeLoc = (stageData?.locationName || 'Bulletin').replace(/[^a-zA-Z0-9_\u0900-\u097F]/g, '_');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `Aawaz-e-Mausam_${safeLoc}_${dateStr}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (e) {
      console.error("Error creating MP3 blob:", e);
    }
  };

  const temp = Math.round(stageData?.weather?.temperature ?? 27);
  const feelsLike = Math.round(stageData?.weather?.feelsLike ?? temp);
  const windSpeed = Math.round(stageData?.weather?.windSpeed ?? 14);
  const humidity = Math.round(stageData?.weather?.humidity ?? 70);
  const condition = weatherInfo?.label || 'साफ़ मौसम';

  return (
    <div className="relative inline-flex flex-col items-start z-30">
      {/* ── Main Hero Trigger Button with Zoom & Pulsing Soundwave ── */}
      <button
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          if (next && !isPlaying) {
            startBroadcast();
          }
        }}
        title="1-Click Rural Weather Audio Bulletin"
        className="group relative flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-500/25 via-orange-500/20 to-amber-500/25 hover:from-amber-500/35 hover:via-orange-500/30 hover:to-amber-500/35 border border-amber-400/40 hover:border-amber-400/80 text-white shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.45)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer select-none"
      >
        {/* Animated Radio Mic / Tower Icon */}
        <div className="relative flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black shrink-0 shadow-inner">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="22"/>
          </svg>
          {isPlaying && !isPaused && (
            <span className="absolute -inset-1 rounded-full border-2 border-amber-400 animate-ping opacity-75 pointer-events-none"/>
          )}
        </div>

        {/* Text */}
        <div className="flex items-center gap-1.5">
          <span className="font-heading font-black text-xs sm:text-sm tracking-wide text-amber-300 drop-shadow-sm whitespace-nowrap">
            {s.stationName}
          </span>
          <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-sm animate-pulse">
            LIVE
          </span>
        </div>

        {/* Equalizer Frequency Bars */}
        <div className="flex items-end gap-0.5 h-3.5 ml-0.5">
          <span className={`w-0.5 sm:w-1 bg-amber-400 rounded-full transition-all duration-150 ${isPlaying && !isPaused ? 'h-3.5 animate-bounce' : 'h-1 opacity-40'}`} style={{ animationDelay: '0ms' }}/>
          <span className={`w-0.5 sm:w-1 bg-amber-300 rounded-full transition-all duration-150 ${isPlaying && !isPaused ? 'h-2.5 animate-bounce' : 'h-1.5 opacity-50'}`} style={{ animationDelay: '150ms' }}/>
          <span className={`w-0.5 sm:w-1 bg-rose-400 rounded-full transition-all duration-150 ${isPlaying && !isPaused ? 'h-4 animate-bounce' : 'h-1 opacity-40'}`} style={{ animationDelay: '75ms' }}/>
          <span className={`w-0.5 sm:w-1 bg-amber-400 rounded-full transition-all duration-150 ${isPlaying && !isPaused ? 'h-2 animate-bounce' : 'h-1.5 opacity-60'}`} style={{ animationDelay: '200ms' }}/>
        </div>
      </button>

      {/* ── Expanded Community Radio Player Modal Console ── */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-3 w-[310px] sm:w-[380px] p-4 rounded-3xl glass-panel bg-slate-950/95 border border-amber-400/40 text-white shadow-[0_10px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl z-50 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-inner">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/>
                  <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/>
                  <circle cx="12" cy="12" r="2"/>
                  <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/>
                  <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/>
                </svg>
              </div>
              <div>
                <h4 className="font-heading font-black text-sm text-amber-300 tracking-wide flex items-center gap-2">
                  {s.stationName}
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    104.2 FM
                  </span>
                </h4>
                <p className="text-[10px] text-white/50 font-medium">{s.frequency}</p>
              </div>
            </div>

            <button
              onClick={() => {
                stopAllAudio();
                setIsOpen(false);
              }}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors cursor-pointer"
              title={s.close}
            >
              ✕
            </button>
          </div>

          {/* Radio Status & HD Soundwave Display */}
          <div className="my-3 p-2.5 rounded-2xl bg-black/50 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isLoadingAudio ? 'bg-amber-400 animate-spin' : isPlaying && !isPaused ? 'bg-emerald-400 animate-pulse' : isPaused ? 'bg-amber-400' : 'bg-rose-500'}`}/>
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-white/80">
                {isLoadingAudio ? 'TUNING IN...' : isPlaying ? (isPaused ? 'PAUSED' : 'BROADCASTING') : 'READY'}
              </span>
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                HD Voice
              </span>
            </div>

            {/* Sound Wave Frequency Visualizer */}
            <div className="flex items-center gap-1">
              {[40, 70, 100, 60, 85, 45, 95, 55, 30].map((h, i) => (
                <span
                  key={i}
                  className="w-1 rounded-full bg-gradient-to-t from-amber-500 to-rose-400 transition-all duration-200"
                  style={{
                    height: isPlaying && !isPaused ? `${Math.max(4, Math.round(h * 0.22))}px` : '4px',
                    opacity: isPlaying && !isPaused ? 1 : 0.3,
                    transitionDelay: `${i * 30}ms`
                  }}
                />
              ))}
            </div>
          </div>

          {/* Quick Weather Highlights Row inside Radio Console */}
          <div className="grid grid-cols-3 gap-1.5 mb-3 p-2 rounded-xl bg-white/5 border border-white/5 text-center">
            <div>
              <div className="text-[10px] text-white/50">तापमान</div>
              <div className="text-xs font-bold text-amber-300">{temp}°C</div>
            </div>
            <div>
              <div className="text-[10px] text-white/50">हवा रफ़्तार</div>
              <div className="text-xs font-bold text-sky-300">{windSpeed} km/h</div>
            </div>
            <div>
              <div className="text-[10px] text-white/50">हवा में नमी</div>
              <div className="text-xs font-bold text-emerald-300">{humidity}%</div>
            </div>
          </div>

          {/* Main Controls: Play / Pause, Stop, Speed, Download */}
          <div className="flex items-center justify-between gap-2 pt-1">
            {/* Play/Pause Button */}
            <button
              onClick={handleTogglePlay}
              disabled={isLoadingAudio}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoadingAudio ? (
                <span>ट्यूनिंग हो रही है...</span>
              ) : isPlaying && !isPaused ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  <span>{s.pause}</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  <span>{isPaused ? s.play : s.play}</span>
                </>
              )}
            </button>

            {/* Stop Button */}
            <button
              onClick={stopAllAudio}
              disabled={!isPlaying && !isPaused}
              className="px-2.5 py-2 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/15 border border-white/10 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all cursor-pointer text-white/90"
              title={s.stop}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16"/></svg>
            </button>

            {/* Speed Selector */}
            <div className="flex items-center rounded-xl bg-white/5 border border-white/10 p-0.5">
              {[
                { label: '0.8x', val: 0.8 },
                { label: '1.0x', val: 1.0 },
                { label: '1.25x', val: 1.25 }
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => handleChangeRate(opt.val)}
                  className={`px-1.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    rate === opt.val
                      ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

          </div>

          {/* Dedicated 1-Click MP3 Download Action Bar (Always Available) */}
          <div className="mt-3 pt-2.5 border-t border-white/10">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-emerald-500/20 hover:from-emerald-500/30 hover:via-teal-500/25 hover:to-emerald-500/30 border border-emerald-400/40 hover:border-emerald-400/80 text-white shadow-md active:scale-98 transition-all cursor-pointer group disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  {isDownloading ? (
                    <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                  ) : downloadSuccess ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  )}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-emerald-300">
                    {isDownloading ? s.downloading : downloadSuccess ? s.downloadDone : s.downloadBtn}
                  </div>
                  <div className="text-[9px] text-white/50 font-mono">
                    Rural Radio Audio • 104.2 FM
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/25 text-emerald-200 border border-emerald-400/30">
                .MP3
              </span>
            </button>
          </div>

          {/* Transcript / Spoken Script Toggle */}
          <div className="mt-3 pt-2 border-t border-white/10">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="w-full flex items-center justify-between text-[11px] font-semibold text-amber-300/90 hover:text-amber-300 transition-colors cursor-pointer"
            >
              <span>{showTranscript ? s.hideTranscript : s.transcript}</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                className={`transition-transform duration-200 ${showTranscript ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {showTranscript && (
              <div className="mt-2 p-3 rounded-xl bg-black/50 border border-white/10 text-xs text-white/85 leading-relaxed font-sans max-h-48 overflow-y-auto custom-scrollbar space-y-2">
                <div className="font-semibold text-amber-300/90 flex items-center gap-1.5">
                  <span>🎙️ लाइव रेडियो बुलेटिन स्क्रिप्ट:</span>
                </div>
                <p className="text-white/80 whitespace-pre-wrap">{speechScript}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
