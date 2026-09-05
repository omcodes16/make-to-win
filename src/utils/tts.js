// Global state for custom TTS player
let currentSpeakingId = null;
let currentAudioElement = null;
let currentAudioQueue = [];
let isPlaying = false;

const listeners = new Set();
export const subscribeToTts = (callback) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

const notifyListeners = (speakingId) => {
  currentSpeakingId = speakingId;
  listeners.forEach(cb => cb(speakingId));
};

export const stopSpeech = () => {
  if (currentAudioElement) {
    try {
      currentAudioElement.pause();
      currentAudioElement.currentTime = 0;
    } catch (e) {}
    currentAudioElement = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
  currentAudioQueue = [];
  isPlaying = false;
  notifyListeners(null);
};

function playNextChunk(id) {
  if (!isPlaying || currentSpeakingId !== id || currentAudioQueue.length === 0) {
    stopSpeech();
    return;
  }

  const base64Audio = currentAudioQueue.shift();
  try {
    const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
    currentAudioElement = audio;

    audio.onended = () => {
      if (isPlaying && currentSpeakingId === id) {
        playNextChunk(id);
      }
    };

    audio.onerror = (e) => {
      console.warn('TTS chunk audio error, playing next...', e);
      if (isPlaying && currentSpeakingId === id) {
        playNextChunk(id);
      }
    };

    audio.play().catch(err => {
      console.warn('Audio play prevented or failed:', err);
      stopSpeech();
    });
  } catch (err) {
    console.error('Error creating audio element:', err);
    if (isPlaying && currentSpeakingId === id) {
      playNextChunk(id);
    }
  }
}

function fallbackWebSpeech(text, targetLangCode, id) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    stopSpeech();
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const langTagMap = {
      hi: 'hi-IN',
      en: 'en-IN',
      bn: 'bn-IN',
      as: 'bn-IN',
      mr: 'mr-IN',
      ta: 'ta-IN',
      te: 'te-IN',
      gu: 'gu-IN',
      kn: 'kn-IN',
      ml: 'ml-IN',
      pa: 'pa-IN',
      ur: 'ur-IN'
    };
    utterance.lang = langTagMap[targetLangCode] || 'hi-IN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      if (currentSpeakingId === id) stopSpeech();
    };
    utterance.onerror = () => {
      if (currentSpeakingId === id) stopSpeech();
    };

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    stopSpeech();
  }
}

export const speakText = async (id, text, currentLang, onFallbackMessage) => {
  stopSpeech();
  if (!text || typeof text !== 'string' || !text.trim()) return;

  notifyListeners(id);
  isPlaying = true;

  // Map standard language codes to TTS voice codes
  const TTS_LANG_MAP = {
    en: 'en',
    hi: 'hi',
    bn: 'bn',
    as: 'bn', // Assamese voice fallback to Bengali phonetics
    mr: 'mr',
    ta: 'ta',
    te: 'te',
    gu: 'gu',
    kn: 'kn',
    ml: 'ml',
    pa: 'pa',
    or: 'or',
    ur: 'ur',
    sa: 'hi', // Sanskrit fallback to Hindi phonetics
    mai: 'hi', // Maithili fallback to Hindi phonetics
    ne: 'ne',
    kok: 'mr', // Konkani fallback to Marathi phonetics
  };
  const targetLangCode = TTS_LANG_MAP[currentLang] || (text.match(/[\u0900-\u097F]/) ? 'hi' : 'en');

  try {
    const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
    const response = await fetch(`${baseUrl}/api/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        lang: targetLangCode
      }),
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      throw new Error('TTS Backend failed with status ' + response.status);
    }

    const data = await response.json();
    const chunks = data.chunks || data.audioChunks;
    if (chunks && Array.isArray(chunks) && chunks.length > 0) {
      if (isPlaying && currentSpeakingId === id) {
        currentAudioQueue = [...chunks];
        playNextChunk(id);
      }
    } else {
      fallbackWebSpeech(text, targetLangCode, id);
    }
  } catch (err) {
    console.warn('TTS Backend failed, switching to native SpeechSynthesis fallback:', err.message);
    if (isPlaying && currentSpeakingId === id) {
      fallbackWebSpeech(text, targetLangCode, id);
    }
  }
};

export const getCurrentSpeakingId = () => currentSpeakingId;
