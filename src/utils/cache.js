// Cache version — bump this number whenever the weather data shape changes.
// All stale localStorage data is automatically cleared on startup. No crashes, ever.
export const CACHE_VERSION = 3;

/** Save data to localStorage with the current version stamp */
export function safeSave(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ __v: CACHE_VERSION, data }));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

/** Load data from localStorage — returns fallback if missing, outdated, or corrupted */
export function safeLoad(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed?.__v !== CACHE_VERSION) {
      localStorage.removeItem(key);
      return fallback;
    }
    return parsed.data ?? fallback;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

/** Clear all versioned weather cache keys (used by Error Boundary on reload) */
export function clearAllCache() {
  ['weathergpt-stage-cache', 'weathergpt-cache', 'weathergpt-saved-locations'].forEach(k =>
    localStorage.removeItem(k)
  );
}
