import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { PLACEHOLDERS, SPEECH_LANG_CODES } from '../utils/constants';
import { extractLocation, getLocationPrompt } from '../services/locationExtractor';
import { geocodeLocation, getWeather } from '../services/weatherApi';
import { sendMessage as sendChatMessage } from '../services/chatApi';
import { getWeatherInfo, checkSeverity } from '../utils/weatherConditions';

export default function ChatInput() {
  const { state, dispatch } = useApp();
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  const placeholder = PLACEHOLDERS[state.language] || PLACEHOLDERS.en;

  // Handle sending a message
  const handleSend = async (eOrMessageText) => {
    let text = input;
    
    // If called from form submission, prevent page reload
    if (eOrMessageText && typeof eOrMessageText.preventDefault === 'function') {
      eOrMessageText.preventDefault();
    } 
    // If called directly with a string (e.g. from suggestions)
    else if (typeof eOrMessageText === 'string') {
      text = eOrMessageText;
    }

    text = text.trim();
    if (!text || state.isLoading) return;

    setInput('');
    dispatch({ type: 'ADD_USER_MESSAGE', payload: text });
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // 1. Extract location from the message
      const locationName = extractLocation(text);

      let location = null;
        let weatherData = null;
        let weatherInfo = null;
        let severityCheck = null;
        
        // Always try to fetch weather if we think it's a location, but don't block if we can't
        if (locationName) {
          location = await geocodeLocation(locationName, state.language);
          if (location) {
            weatherData = await getWeather(location.lat, location.lng);
            weatherInfo = getWeatherInfo(weatherData.weatherCode);
            severityCheck = checkSeverity(weatherData, location.name);
            if (severityCheck && severityCheck.isSevere) {
              dispatch({ type: 'SET_SEVERE_ALERT', payload: severityCheck });
            }
          }
        }

        // Send to AI via proxy - pass full weather context if available
        const aiResponse = await sendChatMessage(text, state.language, weatherData ? {
          location: location.name,
          state: location.state,
          ...weatherData,
          conditionLabel: weatherInfo.label,
        } : null);

        // Cache raw weather data for offline use
        let weatherCache = undefined;
        if (weatherData) {
          weatherCache = {
            locationName: location.name,
            ...weatherData,
          };
          localStorage.setItem('weathergpt-weather-cache', JSON.stringify(weatherCache));
        }

      // 7. Add assistant response
      dispatch({
        type: 'ADD_ASSISTANT_MESSAGE',
        payload: {
          answer: aiResponse.answer,
          followUp: aiResponse.followUp,
          relevantStat: aiResponse.relevantStat || '',
          advisory: aiResponse.advisory || (severityCheck ? severityCheck.summary : ''),
          severity: aiResponse.severity || (severityCheck?.isSevere ? 'severe' : 'none'),
          weatherData: {
            temperature: weatherData.temperature,
            feelsLike: weatherData.feelsLike,
            humidity: weatherData.humidity,
            windSpeed: weatherData.windSpeed,
            precipitation: weatherData.precipitation,
            weatherCode: weatherData.weatherCode,
            uvIndex: weatherData.uvIndex,
            visibility: weatherData.visibility,
            locationName: location.name,
          },
        },
      });
    } catch (err) {
      console.error('Chat error:', err);

      // Check if offline
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
      alert('Voice input is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = SPEECH_LANG_CODES[state.language] || 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  // Listen for EmptyState example question taps
  useEffect(() => {
    const handler = (e) => handleSend(e.detail);
    window.addEventListener('weathergpt-send', handler);
    return () => window.removeEventListener('weathergpt-send', handler);
  }, [state.language, state.isLoading]); // re-bind when these change

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-transparent border-t-0 p-4">
      <div className="max-w-lg mx-auto">
        <form 
          onSubmit={handleSend}
          className="relative bg-white/5 backdrop-blur-xl border border-white/15 rounded-3xl p-1.5 flex items-center shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-all focus-within:bg-white/10 focus-within:border-white/30"
        >
          <button
            type="button"
            onClick={handleVoiceInput}
            disabled={state.isLoading}
            className={`w-10 h-10 flex items-center justify-center transition-colors ${
              isListening ? 'text-red-400 animate-pulse' : 'text-white/50 hover:text-white'
            }`}
            aria-label={isListening ? 'Stop listening' : 'Voice input'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" />
              <path d="M19 10v2a7 7 0 01-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={state.isLoading}
            className="flex-1 bg-transparent px-3 py-2 text-white placeholder-white/40 focus:outline-none text-sm md:text-base"
          />

          <button
            type="submit"
            disabled={!input.trim() || state.isLoading}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 text-white disabled:opacity-50 disabled:bg-white/10 hover:bg-blue-500 transition-colors shadow-lg"
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
