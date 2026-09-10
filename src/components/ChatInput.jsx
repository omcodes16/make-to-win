import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PLACEHOLDERS, SPEECH_LANG_CODES } from '../utils/constants';
import { extractLocation, getLocationPrompt } from '../services/locationExtractor';
import { geocodeLocation, getWeather } from '../services/weatherApi';
import { sendMessage as sendChatMessage } from '../services/chatApi';
import { getWeatherInfo, checkSeverity } from '../utils/weatherConditions';
import { speakText, stopSpeech, subscribeToTts, getCurrentSpeakingId } from '../utils/tts';

const MULTILINGUAL_QUICK_CHIPS = {
  farmer: {
    hi: ["🌾 क्या आज स्प्रे करना सुरक्षित है?", "💧 क्या कल बारिश होगी, सिंचाई रोकें?", "🌿 पत्ती पर फंगस रोग की जांच", "🌦️ आज रात पाले का जोखिम?"],
    bn: ["🌾 আজ স্প্রে করা কি নিরাপদ?", "💧 কাল কি বৃষ্টি হবে, সেচ থামাব?", "🌿 পাতায় ছত্রাক পরীক্ষা", "🌦️ আজ রাতে তুষারপাতের বিপদ?"],
    as: ["🌾 আজি স্প্ৰে' কৰা নিৰাপদ নে?", "💧 কাইলৈ বৰষুণ হ'ব নে, জলসিঞ্চন বন্ধ কৰিম?", "🌿 পাতত ফাংগাল পৰীক্ষা", "🌦️ আজি ৰাতি পাল পৰাৰ বিপদ?"],
    en: ["🌾 Safe to spray pesticides today?", "💧 Will it rain tomorrow, delay irrigation?", "🌿 Check leaf fungal disease risk", "🌦️ Frost risk tonight for crops?"]
  },
  fisherman: {
    hi: ["🌊 क्या आज समुद्र में जाना सुरक्षित है?", "⚓ लहरों की ऊंचाई और कल्लाकडाल?", "🚨 IMBL अंतरराष्ट्रीय सीमा कितनी दूर है?", "🌀 क्या आसपास कोई चक्रवात चेतावनी है?"],
    bn: ["🌊 আজ সমুদ্রে যাওয়া কি নিরাপদ?", "⚓ ঢেউয়ের উচ্চতা ও কাল্লাক্কাদাল?", "🚨 IMBL আন্তর্জাতিক সীমান্ত কত দূরে?", "🌀 আশেপাশে কি কোনো ঘূর্ণিঝড় আছে?"],
    as: ["🌊 আজি সমুদ্ৰলৈ যোৱা নিৰাপদ নে?", "⚓ ঢৌৰ উচ্চতা আৰু কাল্লাক্কাদাল?", "🚨 IMBL সীমা কিমান দূৰ?", "🌀 ওচৰত কিবা ঘূৰ্ণীবতাহ আছে নেকি?"],
    en: ["🌊 Safe to venture into sea today?", "⚓ Wave height & Kallakkadal swell?", "🚨 Distance to IMBL border radar?", "🌀 Any active cyclone in Bay of Bengal?"]
  },
  aviation: {
    hi: ["✈️ आज VFR दृश्यता और बादलों की छत?", "🌪️ क्या विंड शियर या टर्बुलेंस का खतरा है?", "🛸 ड्रोन उड़ान हेतु हवा की गति सीमा?", "👁️ रनवे पर दृश्यता स्तर क्या है?"],
    bn: ["✈️ আজ VFR দৃশ্যমানতা এবং মেঘের উচ্চতা?", "🌪️ উইন্ড শিয়ার বা টার্বুলেন্সের ঝুঁকি?", "🛸 ড্রোন ওড়ানোর বাতাসের গতি?", "👁️ রানওয়েতে দৃশ্যমানতা কত?"],
    as: ["✈️ আজি VFR দৃশ্যমানতা আৰু ডাৱৰৰ সীমা?", "🌪️ বতাহ কতৰনি বা টাৰ্বুলেন্সৰ বিপদ?", "🛸 ড্ৰোন উৰণৰ বতাহৰ গতি?", "👁️ ৰাণৱেত দৃশ্যমানতা কিমান?"],
    en: ["✈️ VFR visibility & cloud ceiling?", "🌪️ Wind shear or turbulence risk?", "🛸 Drone pilot VLOS wind limits?", "👁️ Current runway visual range?"]
  },
  urbanPlanning: {
    hi: ["🏙️ आज का AQI और वायु गुणवत्ता?", "🌡️ आज हीटवेव और लू का खतरा?", "🌧️ क्या जल निकासी ओवरफ्लो व बाढ़ जोखिम है?", "🌬️ बाहरी मजदूरों हेतु सुरक्षा सलाह?"],
    bn: ["🏙️ আজকের AQI এবং বায়ুর মান?", "🌡️ আজ কি তাপপ্রবাহের ঝুঁকি আছে?", "🌧️ নিষ্কাশন উপচে পড়া ও বন্যার ঝুঁকি?", "🌬️ বহিরাঙ্গন শ্রমিকদের জন্য পরামর্শ?"],
    as: ["🏙️ আজিৰ AQI আৰু বায়ুৰ গুণমান?", "🌡️ আজি তাপপ্ৰবাহৰ বিপদ আছে নেকি?", "🌧️ নলা উপচি পৰা আৰু বানপানীৰ আশংকা?", "🌬️ শ্ৰমিকসকলৰ সুৰক্ষা পৰামৰ্শ?"],
    en: ["🏙️ Today's AQI & air quality?", "🌡️ Urban heat island & heatwave risk?", "🌧️ Drainage waterlogging & flood risk?", "🌬️ Outdoor worker safety index?"]
  },
  general: {
    hi: ["🌧️ क्या आज मेरे शहर में बारिश होगी?", "☔ क्या आज बाहर जाते समय छाता चाहिए?", "🌀 क्या पास में कोई चक्रवात या आपदा है?", "🌡️ आज अधिकतम तापमान कितना रहेगा?"],
    bn: ["🌧️ আজ আমার শহরে বৃষ্টি হবে কি?", "☔ বাইরে বেরোনোর সময় ছাতা লাগবে?", "🌀 আশেপাশে কি কোনো দুর্যোগ আছে?", "🌡️ আজকের সর্বোচ্চ তাপমাত্রা কত?"],
    as: ["🌧️ আজি মোৰ চহৰত বৰষুণ হ'ব নেকি?", "☔ বাহিৰলৈ ওলাওঁতে ছাতি লাগিবনে?", "🌀 ওচৰত কিবা দুৰ্যোগ আছে নেকি?", "🌡️ আজি সৰ্বোচ্চ তাপমাত্ৰা কিমান?"],
    en: ["🌧️ Will it rain in my city today?", "☔ Do I need to carry an umbrella?", "🌀 Any active severe cyclone nearby?", "🌡️ What will be today's maximum temperature?"]
  }
};

export default function ChatInput({ isHero = false }) {
  const { state, dispatch } = useApp();
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsMessage, setTtsMessage] = useState('');
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const isVoiceModeRef = useRef(false);
  const skipNextAutoSendRef = useRef(false);

  const placeholder = PLACEHOLDERS[state.language] || PLACEHOLDERS.en;

  const VOICE_STATES = {
    en: { listening: '🎤 Listening...', thinking: '🤔 Thinking...', speaking: '🔊 Speaking...', ready: '✅ Ready' },
    hi: { listening: '🎤 सुन रहा हूं...', thinking: '🤔 सोच रहा हूं...', speaking: '🔊 बोल रहा हूं...', ready: '✅ तैयार' },
    as: { listening: '🎤 শুনি আছো...', thinking: '🤔 ভাবি আছো...', speaking: '🔊 কৈ আছো...', ready: '✅ সাজু' },
    bn: { listening: '🎤 শুনছি...', thinking: '🤔 ভাবছি...', speaking: '🔊 বলছি...', ready: '✅ প্রস্তুত' },
    mr: { listening: '🎤 ऐकत आहे...', thinking: '🤔 विचार करत आहे...', speaking: '🔊 बोलत आहे...', ready: '✅ तयार' },
    ta: { listening: '🎤 கேட்கிறது...', thinking: '🤔 சிந்திக்கிறது...', speaking: '🔊 பேசுகிறது...', ready: '✅ தயார்' },
    te: { listening: '🎤 వింటున్నాను...', thinking: '🤔 ఆలోచిస్తున్నాను...', speaking: '🔊 మాట్లాడుతున్నాను...', ready: '✅ సిద్ధం' },
    gu: { listening: '🎤 સાંભળી રહ્યો છું...', thinking: '🤔 વિચારી રહ્યો છું...', speaking: '🔊 બોલી રહ્યો છું...', ready: '✅ તૈયાર' },
    kn: { listening: '🎤 ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದ್ದೇನೆ...', thinking: '🤔 ಯೋಚಿಸುತ್ತಿದ್ದೇನೆ...', speaking: '🔊 ಮಾತನಾಡುತ್ತಿದ್ದೇನೆ...', ready: '✅ ಸಿದ್ಧ' },
    ml: { listening: '🎤 കേൾക്കുന്നു...', thinking: '🤔 ചിന്തിക്കുന്നു...', speaking: '🔊 സംസാരിക്കുന്നു...', ready: '✅ തയ്യാറാണ്' },
    pa: { listening: '🎤 ਸੁਣ ਰਿਹਾ ਹਾਂ...', thinking: '🤔 ਸੋਚ ਰਿਹਾ ਹਾਂ...', speaking: '🔊 ਬੋਲ ਰਿਹਾ ਹਾਂ...', ready: '✅ ਤਿਆਰ' },
    or: { listening: '🎤 ଶୁଣୁଛି...', thinking: '🤔 ଭାବୁଛି...', speaking: '🔊 କହୁଛି...', ready: '✅ ପ୍ରସ୍ତୁତ' },
    ur: { listening: '🎤 سن رہا ہوں...', thinking: '🤔 سوچ رہا ہوں...', speaking: '🔊 بول رہا ہوں...', ready: '✅ تیار' },
  };
  const activeVoiceState = VOICE_STATES[state.language] || VOICE_STATES.en;

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToTts((speakingId) => {
      setIsSpeaking(speakingId !== null);
    });
    return unsubscribe;
  }, []);

  // Handle sending a message
  const handleSend = async (eOrMessageText) => {
    let text = input;
    
    if (eOrMessageText && typeof eOrMessageText.preventDefault === 'function') {
      eOrMessageText.preventDefault();
    } else if (typeof eOrMessageText === 'string') {
      text = eOrMessageText;
    }

    text = text.trim();
    if (!text || state.isLoading) return;

    if (isListening) {
      skipNextAutoSendRef.current = true;
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    setInput('');
    const isVoice = isVoiceModeRef.current;
    
    const now = new Date();
    const userIstTime = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(now) + ' IST';

    dispatch({ 
      type: 'ADD_USER_MESSAGE', 
      payload: { text, wasVoice: isVoice, istTimestamp: userIstTime } 
    });
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const explicitLocationName = extractLocation(text);
      let locationName = explicitLocationName;
      if (!locationName) {
        // Fall back to conversation history first (most recent message with location), then dashboard
        const lastMsgWithLoc = [...state.messages].reverse().find(m => m.location || m.data?.location || m.data?.locationName || m.weatherData?.locationName);
        locationName = lastMsgWithLoc?.location || lastMsgWithLoc?.data?.location || lastMsgWithLoc?.data?.locationName || lastMsgWithLoc?.weatherData?.locationName || null;
        if (!locationName) {
          locationName = state.weatherStageData?.locationName || state.currentWeather?.locationName;
        }
      }

      let location = null;
      let weatherData = null;
      let weatherInfo = null;
      let severityCheck = null;

      // 1. If user did NOT explicitly specify a different city, use active dashboard location and weather directly!
      const activeStage = state.weatherStageData || {};
      const activeCurrent = state.currentWeather || {};
      const activeLocName = activeStage.locationName || activeCurrent.locationName;
      const activeLat = activeStage.lat || activeCurrent.lat;
      const activeLng = activeStage.lng || activeCurrent.lng;
      const activeDist = activeStage.district || activeCurrent.district || '';
      const activeState = activeStage.state || activeCurrent.state || '';
      const existingWeather = activeStage.weather || (activeCurrent.temperature != null ? activeCurrent : null);

      if (!explicitLocationName && activeLocName) {
        location = {
          name: activeLocName,
          state: activeState,
          district: activeDist,
          lat: activeLat,
          lng: activeLng,
        };

        if (existingWeather && existingWeather.temperature != null) {
          weatherData = existingWeather;
          weatherInfo = getWeatherInfo(weatherData.weatherCode);
          severityCheck = checkSeverity(weatherData, activeLocName);
        } else if (activeLat && activeLng) {
          try {
            weatherData = await getWeather(activeLat, activeLng);
            weatherInfo = getWeatherInfo(weatherData.weatherCode);
            severityCheck = checkSeverity(weatherData, activeLocName);
          } catch (e) {
            console.warn("Direct weather fetch error:", e);
          }
        }
      }

      // 2. If user asked about a different location or no active weather was found, geocode the requested city
      if (!location && locationName) {
        location = await geocodeLocation(locationName, state.language);
        if (location) {
          weatherData = await getWeather(location.lat, location.lng);
          weatherInfo = getWeatherInfo(weatherData.weatherCode);
          severityCheck = checkSeverity(weatherData, location.name);
        }
      }

      const recentHistory = state.messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .slice(-2)
        .map(m => ({ role: m.role, content: m.text }));

      const effectiveLocationName = location ? location.name : (locationName || activeLocName);

      const aiResponse = await sendChatMessage(text, state.language, weatherData ? {
        location: effectiveLocationName,
        state: location?.state || activeState,
        district: location?.district || activeDist,
        lat: location?.lat || activeLat,
        lng: location?.lng || activeLng,
        ...weatherData,
        conditionLabel: weatherInfo?.label || '',
      } : (effectiveLocationName ? {
        location: effectiveLocationName,
        state: location?.state || activeState,
        district: location?.district || activeDist,
        lat: location?.lat || activeLat,
        lng: location?.lng || activeLng,
      } : null), recentHistory, state.userProfile);

      const resolvedLocationName = aiResponse.location || (location ? location.name : null) || locationName;

      let weatherCache = undefined;
      if (weatherData) {
        weatherCache = {
          locationName: location.name,
          location: location.name,
          ...weatherData,
        };
        localStorage.setItem('weathergpt-weather-cache', JSON.stringify(weatherCache));
      }

      const msgId = Date.now();

      dispatch({
        type: 'ADD_ASSISTANT_MESSAGE',
        payload: {
          id: msgId,
          answer: aiResponse.answer,
          followUp: aiResponse.followUp,
          relevantStat: aiResponse.relevantStat || '',
          advisory: aiResponse.advisory || (severityCheck ? severityCheck.summary : ''),
          severity: aiResponse.severity || (severityCheck?.isSevere ? 'severe' : 'none'),
          weatherData: aiResponse.showWeatherWidget === false 
            ? (resolvedLocationName ? { location: resolvedLocationName, locationName: resolvedLocationName } : null) 
            : (aiResponse.weatherData || weatherCache || (resolvedLocationName ? { location: resolvedLocationName, locationName: resolvedLocationName } : null)),
          location: resolvedLocationName,
          suggestedQuestions: aiResponse.suggestedQuestions,
          autoSpeak: isVoice,
          timestamp: aiResponse.timestamp,
          istDate: aiResponse.istDate,
          dayPhase: aiResponse.dayPhase
        },
      });
      
      // Auto-play only if the user's message was voice-initiated
      if (isVoice) {
        speakText(msgId, aiResponse.answer, state.language, (fallbackMsg) => {
          setTtsMessage(fallbackMsg);
          setTimeout(() => setTtsMessage(''), 4000);
        });
      }
    } catch (err) {
      console.error('Chat error:', err);

      if (!navigator.onLine) {
        dispatch({
          type: 'ADD_ERROR_MESSAGE',
          payload: state.language === 'en'
            ? 'You\'re offline. Check your connection and try again.'
            : 'आप ऑफलाइन हैं। कनेक्शन जांचें और पुनः प्रयास करें।',
        });
      } else {
        dispatch({
          type: 'ADD_ERROR_MESSAGE',
          payload: err.message || 'Something went wrong. Try again.',
        });
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Voice input using Web Speech API
  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input is not supported in this browser. Try Chrome (on Android/Desktop) or Safari (on iOS).');
      return;
    }

    if (isSpeaking) {
      stopSpeech();
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    isVoiceModeRef.current = true;
    skipNextAutoSendRef.current = false;
    setInput('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = false;
    recognition.lang = SPEECH_LANG_CODES[state.language] || 'en-IN';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let sessionTranscript = '';

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      sessionTranscript = transcript;
      setInput(transcript);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        alert('Microphone access was denied. Please allow microphone permissions in your browser settings.');
      } else if (event.error === 'no-speech') {
        // Just quietly stop if they didn't say anything
      } else {
        alert(`Microphone error: ${event.error}`);
      }
    };
    
    recognition.onend = () => {
      setIsListening(false);
      if (!skipNextAutoSendRef.current && sessionTranscript.trim()) {
        handleSend(sessionTranscript);
      }
    };

    try { recognition.start(); } catch (err) { console.error('Speech start error:', err); setIsListening(false); }
  };

  // Listen for EmptyState example question taps
  useEffect(() => {
    const handler = (e) => handleSend(e.detail);
    window.addEventListener('weathergpt-send', handler);
    return () => window.removeEventListener('weathergpt-send', handler);
  }, [state.language, state.isLoading, state.weatherStageData, state.currentWeather, state.messages, state.userProfile]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getMicIcon = () => {
    if (isSpeaking) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-5 sm:h-5">
          <rect x="6" y="6" width="12" height="12" />
        </svg>
      );
    }
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5">
        <path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" />
        <path d="M19 10v2a7 7 0 01-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="22" />
      </svg>
    );
  };

  return (
    <div className={`bg-transparent border-t-0 px-2 py-1 ${isHero ? 'w-full' : ''}`}>
      <div className={`mx-auto relative ${isHero ? 'w-full max-w-xl' : 'w-full max-w-3xl lg:max-w-4xl'}`}>

        {/* UI States */}
        <div className="absolute -top-6 left-2 text-xs text-theme-muted font-medium pointer-events-none">
          {ttsMessage ? <span className="text-amber-400">{ttsMessage}</span> :
           isSpeaking ? activeVoiceState.speaking :
           state.isLoading ? activeVoiceState.thinking :
           isListening ? <span className="text-red-500 dark:text-red-400 animate-pulse">{activeVoiceState.listening}</span> : 
           (isVoiceModeRef.current && input === '') ? activeVoiceState.ready : ''}
        </div>
        <form 
          onSubmit={handleSend}
          className={`relative glass-input rounded-2xl sm:rounded-full flex items-center border border-[var(--theme-border)] hover:border-sky-500/40 focus-within:border-sky-500/60 shadow-md transition-all duration-300 ${
            isHero ? 'p-1 sm:p-2 pl-2.5 sm:pl-5 border border-white/20' : 'p-1 sm:p-1.5 pl-2 sm:pl-4'
          }`}
        >
          <button
            type="button"
            onClick={handleVoiceInput}
            disabled={state.isLoading}
            className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-all shrink-0 ${
              isListening ? 'text-red-500 dark:text-red-400 animate-pulse bg-red-500/10' : 
              isSpeaking ? 'text-amber-500 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 bg-amber-500/10' : 'text-theme-muted hover:text-theme-primary hover:bg-white/10'
            }`}
            aria-label={isListening ? 'Stop listening' : isSpeaking ? 'Stop speaking' : 'Voice input'}
          >
            {getMicIcon()}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              isVoiceModeRef.current = false;
            }}
            placeholder={placeholder}
            disabled={state.isLoading}
            className={`flex-1 bg-transparent px-2 sm:px-3 py-1.5 sm:py-2 text-theme-primary placeholder-theme-muted/50 focus:outline-none focus:ring-0 ${
              isHero ? 'text-xs sm:text-base' : 'text-xs sm:text-sm md:text-base'
            }`}
          />

          <button
            type="submit"
            disabled={!input.trim() || state.isLoading}
            className={`flex items-center justify-center rounded-xl sm:rounded-full bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-40 disabled:bg-slate-200 dark:disabled:bg-white/10 disabled:text-slate-500 dark:disabled:text-white/40 transition-all shadow-md active:scale-95 flex-shrink-0 ml-1 ${
              isHero ? 'w-8 h-8 sm:w-11 sm:h-11' : 'w-8 h-8 sm:w-10 sm:h-10'
            }`}
          >
            {state.isLoading ? (
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-4 sm:h-4">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
