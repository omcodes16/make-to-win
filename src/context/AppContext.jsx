import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AppContext = createContext();

const initialState = {
  activeTab: 'chat', // 'chat' or 'stage'
  weatherStageData: JSON.parse(localStorage.getItem('weathergpt-stage-cache') || 'null'),
  language: localStorage.getItem('weathergpt-lang') || 'en',
  messages: [],   // { id, role: 'user'|'assistant'|'error', text, data?, advisory?, severity?, timestamp }
  isLoading: false,
  currentWeather: null,    // { condition, temperature, humidity, windSpeed, rainChance, icon, locationName }
  weatherCondition: 'clear', // drives Sky Band: 'clear'|'cloudy'|'rain'|'storm'|'severe'
  severeAlert: null,   // { summary, detail, action } or null
  isOnboarded: localStorage.getItem('weathergpt-onboarded') === 'true',
  isOnline: navigator.onLine,
  isLargeText: localStorage.getItem('weathergpt-largetext') === 'true',
  isHighContrast: localStorage.getItem('weathergpt-highcontrast') === 'true',
  lastCachedResponse: JSON.parse(localStorage.getItem('weathergpt-cache') || 'null'),
  savedLocations: JSON.parse(localStorage.getItem('weathergpt-saved-locations') || '[]'), // [{ name, lat, lng }]
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };

    case 'SET_WEATHER_STAGE_DATA':
      localStorage.setItem('weathergpt-stage-cache', JSON.stringify(action.payload));
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
          id: Date.now(),
          role: 'user',
          text: action.payload,
          timestamp: new Date().toISOString(),
        }],
      };

    case 'ADD_ASSISTANT_MESSAGE': {
      const { answer, followUp, relevantStat, advisory, severity, weatherData } = action.payload;
      const newMsg = {
        id: Date.now(),
        role: 'assistant',
        text: answer,
        followUp: followUp || '',
        relevantStat: relevantStat || '',
        advisory: advisory || '',
        severity: severity || 'none',
        data: weatherData || null,
        timestamp: new Date().toISOString(),
      };
      // Cache last successful response
      const cache = { ...newMsg, cachedAt: new Date().toISOString() };
      localStorage.setItem('weathergpt-cache', JSON.stringify(cache));
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
      const loc = action.payload; // { name, lat, lng }
      // Remove duplicate if exists, then prepend, cap at 5
      const filtered = state.savedLocations.filter(l => l.name !== loc.name);
      const updated = [loc, ...filtered].slice(0, 5);
      localStorage.setItem('weathergpt-saved-locations', JSON.stringify(updated));
      return { ...state, savedLocations: updated };
    }

    case 'REMOVE_LOCATION': {
      const name = action.payload; // location name string
      const remaining = state.savedLocations.filter(l => l.name !== name);
      localStorage.setItem('weathergpt-saved-locations', JSON.stringify(remaining));
      return { ...state, savedLocations: remaining };
    }

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_ONLINE', payload: true });
    const handleOffline = () => dispatch({ type: 'SET_ONLINE', payload: false });
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Apply body classes for accessibility
  useEffect(() => {
    document.body.classList.toggle('large-text', state.isLargeText);
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
