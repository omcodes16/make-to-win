import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { safeLoad, safeSave } from '../utils/cache';

// ─────────────────────────────────────────────────────────────────────────────
// HOW THE CACHE WORKS:
//   Every item saved to localStorage is tagged with a version number (in cache.js).
//   On startup, if the stored version doesn't match → data is discarded automatically.
//
//   TO FIX FUTURE CRASHES FROM DATA STRUCTURE CHANGES:
//   Just open src/utils/cache.js and bump CACHE_VERSION by 1. That's it.
// ─────────────────────────────────────────────────────────────────────────────

const AppContext = createContext();

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL STATE
// ─────────────────────────────────────────────────────────────────────────────
const initialState = {
  activeTab: 'chat',
  weatherStageData: safeLoad('weathergpt-stage-cache', null),
  language: localStorage.getItem('weathergpt-lang') || 'en',
  messages: [],
  isLoading: false,
  currentWeather: null,
  governmentAlerts: [],
  weatherCondition: 'clear',
  severeAlert: null,
  isOnboarded: localStorage.getItem('weathergpt-onboarded') === 'true',
  isOnline: navigator.onLine,
  isLargeText: localStorage.getItem('weathergpt-largetext') === 'true',
  isHighContrast: localStorage.getItem('weathergpt-highcontrast') === 'true',
  lastCachedResponse: safeLoad('weathergpt-cache', null),
  savedLocations: safeLoad('weathergpt-saved-locations', []),
  userProfile: localStorage.getItem('weathergpt-profile') || 'general',
  uiTheme: localStorage.getItem('weathergpt-theme') || 'dark',
};

// ─────────────────────────────────────────────────────────────────────────────
// REDUCER
// ─────────────────────────────────────────────────────────────────────────────
function appReducer(state, action) {
  switch (action.type) {

    case 'SET_UI_THEME':
      localStorage.setItem('weathergpt-theme', action.payload);
      return { ...state, uiTheme: action.payload };

    case 'SET_GOVERNMENT_ALERTS':
      return { ...state, governmentAlerts: action.payload };

    case 'SET_PROFILE':
      localStorage.setItem('weathergpt-profile', action.payload);
      return { ...state, userProfile: action.payload };

    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };

    case 'SET_WEATHER_STAGE_DATA':
      safeSave('weathergpt-stage-cache', action.payload);
      return { ...state, weatherStageData: action.payload };

    case 'SET_LANGUAGE':
      localStorage.setItem('weathergpt-lang', action.payload);
      return { ...state, language: action.payload };

    case 'SET_ONBOARDED':
      localStorage.setItem('weathergpt-onboarded', 'true');
      return { ...state, isOnboarded: true };

    case 'ADD_USER_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, {
          id: action.payload.id || Date.now(),
          role: 'user',
          text: action.payload.text || action.payload,
          wasVoice: action.payload.wasVoice || false,
          timestamp: new Date().toISOString(),
        }],
      };

    case 'ADD_ASSISTANT_MESSAGE': {
      const { id, answer, followUp, relevantStat, advisory, severity, weatherData, suggestedQuestions, autoSpeak } = action.payload;
      const newMsg = {
        id: id || Date.now(),
        role: 'assistant',
        text: answer,
        followUp: followUp || '',
        relevantStat: relevantStat || '',
        advisory: advisory || '',
        severity: severity || 'none',
        data: weatherData || null,
        autoSpeak: autoSpeak || false,
        suggestedQuestions: Array.isArray(suggestedQuestions) ? suggestedQuestions : [],
        timestamp: new Date().toISOString(),
      };
      const cache = { ...newMsg, cachedAt: new Date().toISOString() };
      safeSave('weathergpt-cache', cache);
      return {
        ...state,
        messages: [...state.messages, newMsg],
        lastCachedResponse: cache,
      };
    }

    case 'ADD_ERROR_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, {
          id: Date.now(),
          role: 'error',
          text: action.payload,
          timestamp: new Date().toISOString(),
        }],
      };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_CURRENT_WEATHER':
      return { ...state, currentWeather: action.payload };

    case 'SET_WEATHER_CONDITION':
      return { ...state, weatherCondition: action.payload };

    case 'SET_SEVERE_ALERT':
      return { ...state, severeAlert: action.payload };

    case 'DISMISS_ALERT':
      return { ...state, severeAlert: null };

    case 'SET_ONLINE':
      return { ...state, isOnline: action.payload };

    case 'TOGGLE_LARGE_TEXT': {
      const newVal = !state.isLargeText;
      localStorage.setItem('weathergpt-largetext', String(newVal));
      return { ...state, isLargeText: newVal };
    }

    case 'TOGGLE_HIGH_CONTRAST': {
      const newVal = !state.isHighContrast;
      localStorage.setItem('weathergpt-highcontrast', String(newVal));
      return { ...state, isHighContrast: newVal };
    }

    case 'SAVE_LOCATION': {
      const loc = action.payload;
      const filtered = state.savedLocations.filter(l => l.name !== loc.name);
      const updated = [loc, ...filtered].slice(0, 5);
      safeSave('weathergpt-saved-locations', updated);
      return { ...state, savedLocations: updated };
    }

    case 'REMOVE_LOCATION': {
      const name = action.payload;
      const remaining = state.savedLocations.filter(l => l.name !== name);
      safeSave('weathergpt-saved-locations', remaining);
      return { ...state, savedLocations: remaining };
    }

    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const handleOnline  = () => dispatch({ type: 'SET_ONLINE', payload: true });
    const handleOffline = () => dispatch({ type: 'SET_ONLINE', payload: false });
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('large-text',    state.isLargeText);
    document.body.classList.toggle('high-contrast', state.isHighContrast);
  }, [state.isLargeText, state.isHighContrast]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

export default AppContext;
