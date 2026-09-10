import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { safeLoad, safeSave } from '../utils/cache';
import { 
  getSavedSessions, 
  saveSession, 
  deleteSession, 
  clearAllSessions, 
  formatIstTimestamp, 
  generateSessionTitle 
} from '../utils/chatSessionManager';

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
  isSettingsLoaded: false,
  activeTab: 'chat',
  weatherStageData: safeLoad('weathergpt-stage-cache', null),
  language: 'en',
  messages: [],
  isLoading: false,
  currentWeather: null,
  governmentAlerts: [],
  activeSosStatus: null,
  weatherCondition: 'clear',
  severeAlert: null,
  isOnboarded: false,
  isOnline: navigator.onLine,
  isLargeText: false,
  isHighContrast: false,
  lastCachedResponse: safeLoad('weathergpt-cache', null),
  savedLocations: safeLoad('weathergpt-saved-locations', []),
  savedSessions: getSavedSessions(),
  currentSessionId: null,
  userProfile: 'general',
  uiTheme: 'dark',
};

// ─────────────────────────────────────────────────────────────────────────────
// REDUCER
// ─────────────────────────────────────────────────────────────────────────────
function appReducer(state, action) {
  switch (action.type) {

    case 'SET_SETTINGS_LOADED':
      return { ...state, isSettingsLoaded: true };

    case 'SET_UI_THEME':
      return { ...state, uiTheme: action.payload };

    case 'SET_GOVERNMENT_ALERTS':
      return { ...state, governmentAlerts: action.payload };

    case 'PUSH_LIVE_ALERT': {
      const newAlert = action.payload;
      if (!newAlert) return state;
      const existing = state.governmentAlerts || [];
      const alreadyPresent = existing.some(
        a => (a.id && a.id === newAlert.id) ||
             (a.title === newAlert.title && a.description === newAlert.description)
      );
      if (alreadyPresent) return state;
      return { ...state, governmentAlerts: [newAlert, ...existing] };
    }

    case 'DISMISS_LIVE_ALERT': {
      const alertId = action.payload;
      return {
        ...state,
        governmentAlerts: (state.governmentAlerts || []).filter(a => a.id !== alertId)
      };
    }

    case 'UPDATE_SOS_STATUS':
      return { ...state, activeSosStatus: action.payload };

    case 'SET_PROFILE':
      return { ...state, userProfile: action.payload };

    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };

    case 'SET_WEATHER_STAGE_DATA':
      safeSave('weathergpt-stage-cache', action.payload);
      return { ...state, weatherStageData: action.payload };

    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };

    case 'SET_ONBOARDED':
      return { ...state, isOnboarded: true };

    case 'RESET_ONBOARDING':
      return { ...state, isOnboarded: false };

    case 'ADD_USER_MESSAGE': {
      const userMsg = {
        id: action.payload.id || Date.now(),
        role: 'user',
        text: action.payload.text || action.payload,
        wasVoice: action.payload.wasVoice || false,
        timestamp: new Date().toISOString(),
        istTimestamp: action.payload.istTimestamp || new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date()) + ' IST',
      };
      const newMessages = [...state.messages, userMsg];

      // Auto-save: establish or update active session
      const sessionId = state.currentSessionId || `sess_${Date.now()}`;
      const sessionLocation = state.weatherStageData?.locationName || state.currentWeather?.locationName || '';
      const existingSession = state.savedSessions.find(s => s.id === sessionId);
      const sessionTitle = existingSession?.title || generateSessionTitle(userMsg.text);

      const updatedSession = {
        id: sessionId,
        title: sessionTitle,
        createdAt: existingSession?.createdAt || Date.now(),
        createdAtFormatted: existingSession?.createdAtFormatted || formatIstTimestamp(),
        location: sessionLocation,
        messages: newMessages,
        preview: userMsg.text,
      };

      const updatedSessions = saveSession(updatedSession);

      return {
        ...state,
        messages: newMessages,
        currentSessionId: sessionId,
        savedSessions: updatedSessions,
      };
    }

    case 'CLEAR_MESSAGES':
    case 'START_NEW_SESSION':
      return {
        ...state,
        messages: [],
        currentSessionId: null,
        savedSessions: getSavedSessions(),
      };

    case 'LOAD_SESSION': {
      const sessionPayload = action.payload;
      const session = typeof sessionPayload === 'string'
        ? state.savedSessions.find(s => s.id === sessionPayload)
        : sessionPayload;

      if (!session) return state;

      return {
        ...state,
        messages: Array.isArray(session.messages) ? session.messages : [],
        currentSessionId: session.id,
      };
    }

    case 'DELETE_SESSION': {
      const sessionId = action.payload;
      const updatedSessions = deleteSession(sessionId);
      const isCurrent = state.currentSessionId === sessionId;
      return {
        ...state,
        savedSessions: updatedSessions,
        messages: isCurrent ? [] : state.messages,
        currentSessionId: isCurrent ? null : state.currentSessionId,
      };
    }

    case 'CLEAR_ALL_SESSIONS': {
      clearAllSessions();
      return {
        ...state,
        savedSessions: [],
        messages: [],
        currentSessionId: null,
      };
    }

    case 'ADD_ASSISTANT_MESSAGE': {
      const { id, answer, followUp, relevantStat, advisory, severity, weatherData, suggestedQuestions, autoSpeak, timestamp, istDate, dayPhase, location: msgLocation } = action.payload;
      const istFormattedTime = timestamp || (new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(new Date()) + ' IST');

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
        timestamp: istFormattedTime,
        istDate: istDate || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()),
        dayPhase: dayPhase || '',
      };
      const cache = { ...newMsg, cachedAt: new Date().toISOString() };
      safeSave('weathergpt-cache', cache);

      const newMessages = [...state.messages, newMsg];

      // Auto-save updated consultation session
      const sessionId = state.currentSessionId || `sess_${Date.now()}`;
      const sessionLocation = msgLocation || state.weatherStageData?.locationName || state.currentWeather?.locationName || '';
      const existingSession = state.savedSessions.find(s => s.id === sessionId);
      const firstUserMsg = newMessages.find(m => m.role === 'user');
      const sessionTitle = existingSession?.title || generateSessionTitle(firstUserMsg?.text || 'Weather Consultation');

      const updatedSession = {
        id: sessionId,
        title: sessionTitle,
        createdAt: existingSession?.createdAt || Date.now(),
        createdAtFormatted: existingSession?.createdAtFormatted || formatIstTimestamp(),
        location: sessionLocation || existingSession?.location || '',
        messages: newMessages,
        preview: answer || '',
      };

      const updatedSessions = saveSession(updatedSession);

      return {
        ...state,
        messages: newMessages,
        lastCachedResponse: cache,
        currentSessionId: sessionId,
        savedSessions: updatedSessions,
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
      return { ...state, isLargeText: newVal };
    }

    case 'TOGGLE_HIGH_CONTRAST': {
      const newVal = !state.isHighContrast;
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
  const isFirstRender = React.useRef(true);
  const settingsLoaded = React.useRef(false);

  // 1. Fetch settings from backend on mount
  useEffect(() => {
    fetch('/api/settings/demo_user')
      .then(res => res.json())
      .then(data => {
        if (data && Object.keys(data).length > 0) {
           if (data.theme) dispatch({ type: 'SET_UI_THEME', payload: data.theme });
           if (data.language) dispatch({ type: 'SET_LANGUAGE', payload: data.language });
           if (data.userProfile) dispatch({ type: 'SET_PROFILE', payload: data.userProfile });
           if (data.isOnboarded) dispatch({ type: 'SET_ONBOARDED' });

           // Determine activeTab: prioritize specific URL path if present, otherwise restore saved tab from backend
           const path = window.location.pathname.replace(/^\//, '');
           if (path === 'manager' || path === 'alerts' || path === 'stage' || path === 'reviews' || path === 'chat') {
             dispatch({ type: 'SET_ACTIVE_TAB', payload: path });
           } else if (path === '') {
             dispatch({ type: 'SET_ACTIVE_TAB', payload: 'chat' });
           } else if (data.activeTab && data.activeTab !== 'manager') {
             dispatch({ type: 'SET_ACTIVE_TAB', payload: data.activeTab });
           } else {
             dispatch({ type: 'SET_ACTIVE_TAB', payload: 'chat' });
           }

           if (data.isLargeText !== state.isLargeText) dispatch({ type: 'TOGGLE_LARGE_TEXT' });
           if (data.isHighContrast !== state.isHighContrast) dispatch({ type: 'TOGGLE_HIGH_CONTRAST' });
        } else {
           const path = window.location.pathname.replace(/^\//, '');
           if (path === 'manager' || path === 'alerts' || path === 'stage' || path === 'reviews') {
             dispatch({ type: 'SET_ACTIVE_TAB', payload: path });
           } else {
             dispatch({ type: 'SET_ACTIVE_TAB', payload: 'chat' });
           }
        }
        dispatch({ type: 'SET_SETTINGS_LOADED' });
        settingsLoaded.current = true;
      })
      .catch(err => {
        console.error('Failed to load settings from backend:', err);
        const path = window.location.pathname.replace(/^\//, '');
        if (path === 'manager' || path === 'alerts' || path === 'stage' || path === 'reviews') {
          dispatch({ type: 'SET_ACTIVE_TAB', payload: path });
        }
        dispatch({ type: 'SET_SETTINGS_LOADED' });
        settingsLoaded.current = true;
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Sync settings back to backend when they change
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!settingsLoaded.current) return;

    fetch('/api/settings/demo_user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        theme: state.uiTheme,
        language: state.language,
        isOnboarded: state.isOnboarded,
        isLargeText: state.isLargeText,
        isHighContrast: state.isHighContrast,
        userProfile: state.userProfile,
        activeTab: state.activeTab,
      })
    }).catch(e => console.error('Failed to sync settings to backend', e));
  }, [state.uiTheme, state.language, state.isOnboarded, state.isLargeText, state.isHighContrast, state.userProfile, state.activeTab]);

  // 3. Listen to browser Back/Forward (popstate) to return to previous window without reload
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.tab) {
        dispatch({ type: 'SET_ACTIVE_TAB', payload: event.state.tab });
      } else {
        const path = window.location.pathname.replace(/^\//, '');
        if (path === 'manager' || path === 'alerts' || path === 'stage' || path === 'reviews') {
          dispatch({ type: 'SET_ACTIVE_TAB', payload: path });
        } else {
          dispatch({ type: 'SET_ACTIVE_TAB', payload: 'chat' });
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.uiTheme || 'dark');
  }, [state.uiTheme]);

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
