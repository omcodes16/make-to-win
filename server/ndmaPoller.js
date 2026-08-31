import { XMLParser } from 'fast-xml-parser';
import { SmsRecipient, SmsLog } from './models.js';
import { USE_MONGODB, smsLogsFallback, smsRecipientsFallback } from '../server.js';

// Track processed alerts so we don't spam users
const processedAlerts = new Set(); 

const templates = {
  'English': (title, desc) => `NDMA EMERGENCY: ${title}. ${desc.substring(0, 80)}... Seek safety immediately.`,
  'Hindi': (title, desc) => `NDMA आपातकाल: ${title}. ${desc.substring(0, 60)}... तुरंत सुरक्षित स्थान पर जाएं।`,
  'Bengali': (title, desc) => `NDMA জরুরি: ${title}. ${desc.substring(0, 60)}... অবিলম্বে নিরাপদে যান।`,
  'Assamese': (title, desc) => `NDMA জৰুৰী: ${title}. ${desc.substring(0, 60)}... ততাতৈয়াকৈ নিৰাপদ স্থানলৈ যাওক।`
};

export async function pollNdmaAndBroadcast() {
  console.log('[NDMA Poller] Checking for new extreme government alerts...');
  try {
    const sachetUrl = "https://sachet.ndma.gov.in/cap_public_website/FetchAllCapAlerts";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(sachetUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[NDMA Poller] Feed unreachable, status: ${response.status}`);
      return;
    }

    const xmlText = await response.text();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    let parsed;
    try {
      parsed = parser.parse(xmlText);
    } catch(e) { return; }
    
    const root = parsed.alerts || parsed.feed || parsed;
    const alertNode = root?.alert;
    let rawAlerts = Array.isArray(alertNode) ? alertNode : (alertNode ? [alertNode] : []);

    for (const a of rawAlerts) {
      const identifier = a.identifier || Math.random().toString();
      
      // Skip if we already broadcasted this
      if (processedAlerts.has(identifier)) continue;
      
      const info = Array.isArray(a.info) ? a.info[0] : (a.info || {});
      const severity = (info.severity || '').toLowerCase();
      
      // ONLY broadcast Severe or Extreme alerts
      if (severity === 'extreme' || severity === 'severe') {
        const title = info.headline || info.event || 'Weather Alert';
        const description = info.description || info.instruction || '';
        const area = Array.isArray(info.area) ? info.area[0] : (info.area || {});
        const areaDesc = (area.areaDesc || info.area?.areaDesc || 'India').toLowerCase();

        console.log(`[NDMA Poller] 🚨 SEVERE ALERT DETECTED: ${title} in ${areaDesc}`);

        // 1. Fetch registered citizens
        let recipients = [];
        if (USE_MONGODB) {
          recipients = await SmsRecipient.find();
        } else {
          recipients = smsRecipientsFallback;
        }

        if (recipients.length === 0) {
          processedAlerts.add(identifier);
          continue;
        }

        // 2. Filter victims in the affected area
        const victims = recipients.filter(r => {
          if (!r.state && !r.district) return false;
          const matchState = r.state && areaDesc.includes(r.state.toLowerCase());
          const matchDist = r.district && areaDesc.includes(r.district.toLowerCase());
          return matchState || matchDist;
        });

        if (victims.length > 0) {
          console.log(`[NDMA Poller] Found ${victims.length} citizens in danger zone. Dispatching SMS...`);
          
          // 3. Generate translated SMS Logs
          const logs = victims.map(r => {
            const lang = r.language || 'English';
            const templateFn = templates[lang] || templates['English'];
            return {
              id: Math.random().toString(36).substring(7),
              alertId: identifier,
              phone: r.phone,
              name: r.name,
              message: templateFn(title, description),
              language: lang,
              status: 'delivered',
              sentAt: new Date()
            };
          });

          // 4. Save to DB (simulating SMS gateway)
          if (USE_MONGODB) {
            await SmsLog.insertMany(logs);
          } else {
            smsLogsFallback.push(...logs);
          }
          console.log(`[NDMA Poller] ✅ Broadcasted ${logs.length} emergency SMS messages.`);
        }
        
        // Mark as processed
        processedAlerts.add(identifier);
      }
    }

  } catch (err) {
    console.error("[NDMA Poller] Error polling alerts:", err.message);
  }
}

export function startNdmaPoller() {
  pollNdmaAndBroadcast();
  // Run every 5 minutes
  setInterval(pollNdmaAndBroadcast, 5 * 60 * 1000);
}
