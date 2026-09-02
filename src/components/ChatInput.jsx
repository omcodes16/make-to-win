import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PLACEHOLDERS, SPEECH_LANG_CODES } from '../utils/constants';
import { extractLocation, getLocationPrompt } from '../services/locationExtractor';
import { geocodeLocation, getWeather } from '../services/weatherApi';
import { sendMessage as sendChatMessage } from '../services/chatApi';
import { getWeatherInfo, checkSeverity } from '../utils/weatherConditions';
import { speakText, stopSpeech, subscribeToTts, getCurrentSpeakingId } from '../utils/tts';

export default function ChatInput() {
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
  };

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
    
    dispatch({ 
      type: 'ADD_USER_MESSAGE', 
      payload: { text, wasVoice: isVoice } 
    });
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const locationName = extractLocation(text);

      let location = null;
      let weatherData = null;
      let weatherInfo = null;
      let severityCheck = null;
      
      if (locationName) {
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

      const aiResponse = await sendChatMessage(text, state.language, weatherData ? {
        location: location.name,
        state: location.state,
        ...weatherData,
        conditionLabel: weatherInfo.label,
      } : null, recentHistory, state.userProfile);

      let weatherCache = undefined;
      if (weatherData) {
        weatherCache = {
          locationName: location.name,
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
          weatherData: aiResponse.showWeatherWidget === false ? null : (aiResponse.weatherData || weatherCache),
          suggestedQuestions: aiResponse.suggestedQuestions,
          autoSpeak: isVoice
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
  }, [state.language, state.isLoading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getMicIcon = () => {
    if (isSpeaking) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="6" y="6" width="12" height="12" />
        </svg>
      );
    }
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" />
        <path d="M19 10v2a7 7 0 01-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="22" />
      </svg>
    );
  };

  return (
    <div className="bg-transparent border-t-0 px-2 py-1">
      <div className="max-w-lg mx-auto relative">
        {/* UI States */}
        <div className="absolute -top-6 left-2 text-xs text-theme-muted font-medium">
          {ttsMessage ? <span className="text-amber-400">{ttsMessage}</span> :
           isSpeaking ? VOICE_STATES[state.language]?.speaking :
           state.isLoading ? VOICE_STATES[state.language]?.thinking :
           isListening ? <span className="text-red-500 dark:text-red-400 animate-pulse">{VOICE_STATES[state.language]?.listening}</span> : 
           (isVoiceModeRef.current && input === '') ? VOICE_STATES[state.language]?.ready : ''}
        </div>
        <form 
          onSubmit={handleSend}
          className="relative glass-input rounded-full p-1.5 pl-3 flex items-center shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_32px_rgba(129,140,248,0.1)] transition-all duration-500 glow-focus"
        >
          <button
            type="button"
            onClick={handleVoiceInput}
            disabled={state.isLoading}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${
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
            className="flex-1 bg-transparent px-3 py-2 text-theme-primary placeholder-theme-muted/50 focus:outline-none text-sm md:text-base focus:ring-0"
          />

          <button
            type="submit"
            disabled={!input.trim() || state.isLoading}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:bg-slate-200 dark:disabled:bg-white/10 disabled:text-slate-500 dark:disabled:text-white/40 transition-all shadow-md active:scale-95 flex-shrink-0 ml-1"
          >
            {state.isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
