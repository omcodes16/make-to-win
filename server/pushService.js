import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import webpush from 'web-push';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VAPID_FILE = path.join(__dirname, '..', 'vapid_keys.json');
const SUBS_FILE = path.join(__dirname, '..', 'push_subscriptions.json');

let vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || ''
};

// 1. Initialize or generate VAPID keys
function initVapidKeys() {
  if (vapidKeys.publicKey && vapidKeys.privateKey) {
    return;
  }

  if (fs.existsSync(VAPID_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf-8'));
      if (data.publicKey && data.privateKey) {
        vapidKeys = data;
        return;
      }
    } catch (e) {
      console.warn('[Push Service] Error reading vapid_keys.json:', e.message);
    }
  }

  // Generate new keys
  try {
    const generated = webpush.generateVAPIDKeys();
    vapidKeys = {
      publicKey: generated.publicKey,
      privateKey: generated.privateKey
    };
    fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2), 'utf-8');
    console.log('🔑 [Push Service] New VAPID keys generated and stored in vapid_keys.json');
  } catch (err) {
    console.error('[Push Service] Failed to generate VAPID keys:', err);
  }
}

// 2. Load stored subscriptions
let subscriptions = [];
function loadSubscriptions() {
  if (fs.existsSync(SUBS_FILE)) {
    try {
      const content = fs.readFileSync(SUBS_FILE, 'utf-8');
      subscriptions = JSON.parse(content || '[]');
    } catch (e) {
      console.warn('[Push Service] Error loading subscriptions, initializing empty list:', e.message);
      subscriptions = [];
    }
  } else {
    subscriptions = [];
  }
}

function saveSubscriptions() {
  try {
    fs.writeFileSync(SUBS_FILE, JSON.stringify(subscriptions, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Push Service] Failed to save subscriptions:', e);
  }
}

// Initialize on module load
initVapidKeys();
loadSubscriptions();

if (vapidKeys.publicKey && vapidKeys.privateKey) {
  try {
    webpush.setVapidDetails(
      'mailto:disaster-desk@weathergpt.local',
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );
    console.log('📡 [Push Service] Web Push VAPID details registered successfully.');
  } catch (err) {
    console.error('[Push Service] Failed to set VAPID details:', err);
  }
}

/**
 * Returns the VAPID public key needed by frontend browsers to subscribe
 */
export function getVapidPublicKey() {
  return vapidKeys.publicKey;
}

/**
 * Register or update a mobile/browser push subscription
 */
export function addSubscription(sub) {
  if (!sub || !sub.endpoint) return false;
  
  const existingIndex = subscriptions.findIndex(s => s.endpoint === sub.endpoint);
  const enrichedSub = {
    ...sub,
    updatedAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    subscriptions[existingIndex] = enrichedSub;
  } else {
    subscriptions.push(enrichedSub);
    console.log(`📱 [Push Service] New device subscribed! Total active devices: ${subscriptions.length}`);
  }
  
  saveSubscriptions();
  return true;
}

/**
 * Unsubscribe a device by its endpoint
 */
export function removeSubscription(endpoint) {
  if (!endpoint) return false;
  const prevCount = subscriptions.length;
  subscriptions = subscriptions.filter(s => s.endpoint !== endpoint);
  if (subscriptions.length !== prevCount) {
    saveSubscriptions();
    console.log(`🔕 [Push Service] Device unsubscribed. Remaining devices: ${subscriptions.length}`);
    return true;
  }
  return false;
}

/**
 * Get total number of registered devices
 */
export function getSubscriptionsCount() {
  return subscriptions.length;
}

/**
 * Send a notification to a specific subscription
 */
export async function sendNotificationToSub(sub, payload) {
  try {
    const dataString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    await webpush.sendNotification(sub, dataString, {
      TTL: 60 * 60 * 24 // 24 hours TTL for emergency alerts
    });
    return { success: true };
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 410) {
      // Endpoint is invalid or has expired — clean it up automatically
      removeSubscription(sub.endpoint);
    }
    return { success: false, error: err.message, statusCode: err.statusCode };
  }
}

/**
 * Broadcast an alert to all registered mobile & desktop devices
 */
export async function broadcastPushNotification(alert) {
  if (subscriptions.length === 0) {
    console.log('ℹ️ [Push Service] No devices currently subscribed for push alerts.');
    return { sent: 0, total: 0 };
  }

  const payload = {
    title: alert.title || '🚨 Severe Weather Alert',
    message: alert.description || alert.message || 'Severe weather warning issued for your region.',
    severity: alert.severity || 'severe',
    url: '/alerts',
    issuedAt: alert.issuedAt || new Date().toISOString(),
    tag: alert.id || 'weather-alert',
    vibrate: [300, 100, 300, 100, 300]
  };

  const payloadString = JSON.stringify(payload);
  let sentCount = 0;
  const expiredEndpoints = [];

  const promises = subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(sub, payloadString, {
        TTL: 60 * 60 * 24
      });
      sentCount++;
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        expiredEndpoints.push(sub.endpoint);
      } else {
        console.warn(`[Push Service] Push dispatch error (${sub.endpoint.slice(0, 35)}...):`, err.message);
      }
    }
  });

  await Promise.allSettled(promises);

  // Clean up any dead subscriptions
  if (expiredEndpoints.length > 0) {
    subscriptions = subscriptions.filter(s => !expiredEndpoints.includes(s.endpoint));
    saveSubscriptions();
    console.log(`🧹 [Push Service] Cleaned up ${expiredEndpoints.length} expired device subscriptions.`);
  }

  console.log(`📲 [Push Service] Broadcast "${payload.title}" delivered to ${sentCount}/${subscriptions.length} devices.`);
  return { sent: sentCount, total: subscriptions.length };
}
