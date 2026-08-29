/**
 * WeatherGPT — Browser Push Notification System
 * Requests permission, subscribes, and sends alerts when severe weather triggers.
 */

export function requestPushPermission() {
  if (!('Notification' in window)) return Promise.resolve('unsupported');
  if (Notification.permission === 'granted') return Promise.resolve('granted');
  return Notification.requestPermission();
}

export function sendWeatherPush(title, body, icon = '/favicon.ico', tag = 'weather-alert') {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const n = new Notification(title, {
      body,
      icon,
      tag,                // same tag = replaces old notification instead of stacking
      badge: '/favicon.ico',
      requireInteraction: true, // stays on screen until user taps it
    });
    // Auto-close after 10 seconds on desktop
    setTimeout(() => n.close(), 10000);
    // Play siren sound via Web Audio for severe alerts
    if (body.toLowerCase().includes('severe') || body.toLowerCase().includes('heatwave') || body.toLowerCase().includes('cyclone')) {
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
 * Only fires a push for SEVERE alerts to avoid spamming.
 */
export function notifyIfSevere(alerts, locationName) {
  const severeAlert = alerts.find(a => a.level === 'Severe' && a.id !== 'all-clear');
  if (!severeAlert) return;

  // Use sessionStorage to avoid re-notifying same alert in same session
  const key = `push_sent_${severeAlert.id}_${locationName}`;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, '1');

  sendWeatherPush(
    `⚠️ ${severeAlert.title}`,
    severeAlert.desc,
    '/favicon.ico',
    severeAlert.id
  );
}
