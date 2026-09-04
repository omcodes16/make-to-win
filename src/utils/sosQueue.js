/**
 * Offline-First IndexedDB SOS Vault & Auto-Sync Engine
 * Zero-cost, browser-native persistence for emergency alerts during complete cellular/internet outages.
 */

const DB_NAME = "WeatherGPT_SOS_Vault";
const DB_VERSION = 1;
const STORE_NAME = "offline_sos_queue";

/**
 * Open or upgrade the IndexedDB database
 */
function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not supported in this environment"));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save an SOS alert locally into the offline vault
 */
export async function saveSosOffline(sosPayload) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const record = {
        ...sosPayload,
        queuedAt: new Date().toISOString(),
        status: "queued"
      };
      const req = store.add(record);

      req.onsuccess = () => {
        window.dispatchEvent(new CustomEvent("weathergpt-sos-queue-changed"));
        resolve(req.result);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error("Failed to save SOS in IndexedDB vault:", err);
    // Fallback to localStorage if IndexedDB fails
    try {
      const existing = JSON.parse(localStorage.getItem("weathergpt_offline_sos") || "[]");
      existing.push({ ...sosPayload, queuedAt: new Date().toISOString(), status: "queued", id: Date.now() });
      localStorage.setItem("weathergpt_offline_sos", JSON.stringify(existing));
      window.dispatchEvent(new CustomEvent("weathergpt-sos-queue-changed"));
      return Date.now();
    } catch (e) {
      console.error("Critical: LocalStorage fallback also failed:", e);
      throw err;
    }
  }
}

/**
 * Retrieve all pending SOS records from the vault
 */
export async function getQueuedSos() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    // Check fallback in localStorage
    try {
      return JSON.parse(localStorage.getItem("weathergpt_offline_sos") || "[]");
    } catch {
      return [];
    }
  }
}

/**
 * Get total number of pending offline SOS alerts
 */
export async function getSosQueueCount() {
  const items = await getQueuedSos();
  return items.length;
}

/**
 * Delete a transmitted SOS alert from the vault
 */
export async function removeSosFromQueue(id) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => {
        window.dispatchEvent(new CustomEvent("weathergpt-sos-queue-changed"));
        resolve(true);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    try {
      let existing = JSON.parse(localStorage.getItem("weathergpt_offline_sos") || "[]");
      existing = existing.filter((item) => item.id !== id);
      localStorage.setItem("weathergpt_offline_sos", JSON.stringify(existing));
      window.dispatchEvent(new CustomEvent("weathergpt-sos-queue-changed"));
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Auto-Flush Engine:
 * Attempts to transmit all pending SOS alerts to the server when connection is restored
 */
export async function flushSosQueue(apiUrl = "") {
  const items = await getQueuedSos();
  if (!items || items.length === 0) {
    return { flushed: 0, remaining: 0 };
  }

  let successCount = 0;
  const baseUrl = (apiUrl || "").replace(/\/+$/, "");

  for (const item of items) {
    try {
      const { id, queuedAt, status, ...payload } = item;
      const res = await fetch(`${baseUrl}/api/sos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          message: payload.message 
            ? `[Offline Vault Alert — ${payload.locationNote || 'Queued at ' + new Date(queuedAt).toLocaleTimeString()}] ${payload.message}`
            : `[Offline Vault Alert — ${payload.locationNote || 'Queued at ' + new Date(queuedAt).toLocaleTimeString()}]`,
        }),
      });

      if (res.ok) {
        await removeSosFromQueue(item.id);
        successCount++;
      } else {
        console.warn(`Server responded with ${res.status} for SOS ${item.id}`);
        break;
      }
    } catch (err) {
      console.warn("Network error during SOS queue flush:", err.message);
      break;
    }
  }

  const remaining = (await getQueuedSos()).length;
  if (successCount > 0) {
    window.dispatchEvent(
      new CustomEvent("weathergpt-sos-flushed", {
        detail: { flushed: successCount, remaining },
      })
    );
  }
  return { flushed: successCount, remaining };
}
