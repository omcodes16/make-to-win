/**
 * WeatherGPT — Browser & Mobile Push Notification System
 * Uses standard W3C Web Push (VAPID) protocol for free background notifications on mobile & desktop.
 */

// Helper to convert VAPID base64 public key to Uint8Array for PushManager
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushDisabled() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('weathergpt_alerts_disabled') === 'true';
}

export function setPushDisabled(disabled) {
  if (typeof window === 'undefined') return;
  if (disabled) {
    localStorage.setItem('weathergpt_alerts_disabled', 'true');
  } else {
    localStorage.removeItem('weathergpt_alerts_disabled');
  }
}

export async function requestPushPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  return await Notification.requestPermission();
}

function getApiBaseUrl() {
  if (typeof window === 'undefined') return '';
  return (import.meta.env?.VITE_API_URL || '').replace(/\/+$/, '');
}

/**
 * Fetch VAPID Public Key from backend server
 */
export async function fetchVapidPublicKey() {
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/push/vapid-public-key`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.publicKey || null;
  } catch (e) {
    console.warn('[Push] Failed to fetch VAPID key:', e.message);
    return null;
  }
}

/**
 * Check if current browser / mobile device is currently registered for Web Push
 */
export async function checkMobilePushSubscription() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}

/**
 * Full Mobile & Desktop Web Push Subscription Flow:
 * 1. Requests Notification permission from user
 * 2. Fetches server VAPID key
 * 3. Registers device in ServiceWorker PushManager (Google FCM for Android / Apple APNs for iOS 16.4+)
 * 4. Stores endpoint on backend for zero-cost alert broadcasts
 */
export async function subscribeToMobilePush() {
  if (typeof window === 'undefined') return { success: false, reason: 'no-window' };
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { success: false, reason: 'unsupported' };
  }

  const permission = await requestPushPermission();
  if (permission !== 'granted') {
    return { success: false, reason: permission };
  }

  try {
    const vapidKey = await fetchVapidPublicKey();
    if (!vapidKey) {
      return { success: false, reason: 'no-vapid-key' };
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const convertedKey = urlBase64ToUint8Array(vapidKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });
    }

    // Register subscription on backend
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    setPushDisabled(false);
    console.log('[Push] Device registered successfully for mobile push alerts.');
    return { success: true, subscription };
  } catch (err) {
    console.error('[Push] Subscription failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Unsubscribe current device from Web Push
 */
export async function unsubscribeFromMobilePush() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    setPushDisabled(true);
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      // Notify backend
      const baseUrl = getApiBaseUrl();
      await fetch(`${baseUrl}/api/push/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint })
      }).catch(() => {});
    }
    setPushDisabled(true);
    return true;
  } catch (e) {
    console.warn('[Push] Unsubscribe error:', e);
    setPushDisabled(true);
    return false;
  }
}

/**
 * Send a direct test push notification to this device
 */
export async function triggerTestMobilePush() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { success: false, reason: 'unsupported' };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const subResult = await subscribeToMobilePush();
      if (!subResult.success) return subResult;
      subscription = subResult.subscription;
    }

    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/push/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription,
        title: '🚨 WeatherGPT Mobile Test',
        message: 'Mobile push is working! Severe weather advisories will alert you here even when closed.'
      })
    });

    const data = await res.json();
    return { success: res.ok, ...data };
  } catch (err) {
    console.error('[Push] Test push error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Local Notification Fallback (Foreground or Desktop)
 */
export function sendWeatherPush(title, body, icon = '/logo_new.jpg', tag = 'weather-alert') {
  if (isPushDisabled()) return;
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        message: body
      });
    } else {
      const n = new Notification(title, {
        body,
        icon,
        tag,
        badge: '/favicon.svg',
        requireInteraction: true
      });
      setTimeout(() => n.close(), 10000);
    }

    if (
      body.toLowerCase().includes('severe') ||
      body.toLowerCase().includes('heatwave') ||
      body.toLowerCase().includes('cyclone')
    ) {
      playSoftAlertSound();
    }
  } catch (e) {
    console.warn('[Push] Notification failed:', e);
  }
}

export function playSoftAlertSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
  } catch (e) {}
}

/**
 * Called from AlertsScreen whenever alerts are computed.
 */
export function notifyIfSevere(alerts, locationName) {
  const severeAlert = alerts.find(a => a.level === 'Severe' && a.id !== 'all-clear');
  if (!severeAlert) return;

  const key = `push_sent_${severeAlert.id}_${locationName}`;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, '1');

  sendWeatherPush(
    `⚠️ ${severeAlert.title}`,
    severeAlert.desc,
    '/logo_new.jpg',
    severeAlert.id
  );
}
