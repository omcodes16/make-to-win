// Global state for custom TTS player
let currentSpeakingId = null;
let currentAudioContext = null;
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
  if (currentAudioContext) {
    currentAudioContext.close().catch(console.error);
    currentAudioContext = null;
  }
  currentAudioQueue = [];
  isPlaying = false;
  notifyListeners(null);
};

async function playNextChunk() {
  if (currentAudioQueue.length === 0) {
    stopSpeech();
    return;
  }
  
  if (!currentAudioContext) {
    currentAudioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  
  const base64Audio = currentAudioQueue.shift();
  
  try {
    const binaryString = window.atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    const audioBuffer = await currentAudioContext.decodeAudioData(bytes.buffer);
    const source = currentAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(currentAudioContext.destination);
    
    source.onended = () => {
      playNextChunk(); // Play the next chunk in the queue
    };
    
    source.start(0);
  } catch (err) {
    console.error('Error playing audio chunk:', err);
    playNextChunk(); // skip to next on error
  }
}

export const speakText = async (id, text, currentLang, onFallbackMessage) => {
  // Always stop current speech first
  stopSpeech();
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
  const targetLangCode = TTS_LANG_MAP[currentLang] || 'en';
  
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
      })
    });
    
    if (!response.ok) {
      throw new Error('TTS Backend failed');
    }
    
    const data = await response.json();
    if (data.chunks && data.chunks.length > 0) {
      // If we are still supposed to be playing this message
      if (isPlaying && currentSpeakingId === id) {
         currentAudioQueue = data.chunks;
         playNextChunk();
      }
    } else {
       stopSpeech();
       if (onFallbackMessage) onFallbackMessage('🔇 Could not generate voice');
    }
    
  } catch (err) {
    console.error('TTS Fetch Error:', err);
    stopSpeech();
    if (onFallbackMessage) onFallbackMessage('🔇 Network error loading voice');
  }
};

export const getCurrentSpeakingId = () => currentSpeakingId;
