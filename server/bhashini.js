/**
 * Bhashini (National Language Translation Mission, MeitY) NMT Translation Service
 * Provides bidirectional translation between English and Indian languages.
 */

import dotenv from 'dotenv';
dotenv.config();

// Mapping of language codes to Bhashini standard codes
export const BHASHINI_LANG_CODES = {
  en: 'en',
  hi: 'hi', // Hindi
  as: 'as', // Assamese
  bn: 'bn', // Bengali
  mr: 'mr', // Marathi
  ta: 'ta', // Tamil
  te: 'te', // Telugu
  gu: 'gu', // Gujarati
  kn: 'kn', // Kannada
  ml: 'ml', // Malayalam
  pa: 'pa', // Punjabi
  or: 'or', // Odia
  ur: 'ur', // Urdu
};

/**
 * 0ms Offline Indian Script Detector using Unicode code points.
 * Detects the native script of the typed text without network latency.
 */
export function detectIndianLanguage(text, defaultLang = 'en') {
  if (!text || typeof text !== 'string') return defaultLang;

  const scriptPatterns = [
    { lang: 'ta', regex: /[\u0B80-\u0BFF]/ }, // Tamil
    { lang: 'te', regex: /[\u0C00-\u0C7F]/ }, // Telugu
    { lang: 'kn', regex: /[\u0C80-\u0CFF]/ }, // Kannada
    { lang: 'ml', regex: /[\u0D00-\u0D7F]/ }, // Malayalam
    { lang: 'gu', regex: /[\u0A80-\u0AFF]/ }, // Gujarati
    { lang: 'pa', regex: /[\u0A00-\u0A7F]/ }, // Gurmukhi / Punjabi
    { lang: 'or', regex: /[\u0B00-\u0B7F]/ }, // Odia
    { lang: 'bn', regex: /[\u0980-\u09FF]/ }, // Bengali / Assamese
    { lang: 'hi', regex: /[\u0900-\u097F]/ }, // Devanagari (Hindi / Marathi)
  ];

  for (const { lang, regex } of scriptPatterns) {
    if (regex.test(text)) {
      // If Devanagari is detected and user has Marathi selected, respect Marathi
      if (lang === 'hi' && defaultLang === 'mr') return 'mr';
      // If Bengali script detected and user has Assamese selected, respect Assamese
      if (lang === 'bn' && defaultLang === 'as') return 'as';
      return lang;
    }
  }

  return defaultLang;
}

/**
 * Calls Bhashini Dhruva / ULCA NMT inference endpoint.
 */
async function callBhashiniNmt(texts, sourceLang, targetLang) {
  const inferenceKey = process.env.BHASHINI_INFERENCE_KEY || process.env.BHASHINI_API_KEY;
  const userId = process.env.BHASHINI_USER_ID;

  if (!inferenceKey) {
    return null; // Fallback to secondary translation provider
  }

  try {
    const endpoint = 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline';
    const body = {
      pipelineTasks: [
        {
          taskType: 'translation',
          config: {
            language: {
              sourceLanguage: sourceLang,
              targetLanguage: targetLang
            }
          }
        }
      ],
      inputData: {
        input: texts.map(t => ({ source: t }))
      }
    };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': inferenceKey
    };
    if (userId) headers['userId'] = userId;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(4000)
    });

    if (res.ok) {
      const data = await res.json();
      const outputs = data?.pipelineResponse?.[0]?.output;
      if (Array.isArray(outputs) && outputs.length > 0) {
        return outputs.map(item => item.target || item.source);
      }
    }
  } catch (err) {
    console.warn('[BHASHINI API NOTICE] Bhashini NMT call failed:', err.message);
  }

  return null;
}

/**
 * High-fidelity AI fallback translation using Gemini Flash if Bhashini credentials
 * are not yet provided or if Bhashini is unreachable.
 */
async function fallbackAiTranslate(texts, sourceLang, targetLang) {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || !texts || texts.length === 0) return null;

  try {
    const langNames = {
      en: 'English', hi: 'Hindi', mr: 'Marathi', ta: 'Tamil',
      te: 'Telugu', bn: 'Bengali', as: 'Assamese', gu: 'Gujarati',
      kn: 'Kannada', ml: 'Malayalam', pa: 'Punjabi', or: 'Odia', ur: 'Urdu'
    };
    const targetName = langNames[targetLang] || targetLang;
    const sourceName = langNames[sourceLang] || sourceLang;

    const prompt = `You are an expert Indian language translator for the National Language Translation Mission.
Translate the following JSON array of strings accurately from ${sourceName} into natural, grammatically correct ${targetName}.
Return ONLY a valid JSON array of translated strings with the exact same length. No explanations, no markdown formatting.

Input:
${JSON.stringify(texts)}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${geminiKey}`
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
      }),
      signal: AbortSignal.timeout(6000)
    });

    if (res.ok) {
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content?.trim();
      if (content) {
        const cleaned = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length === texts.length) {
          return parsed;
        }
      }
    } else {
      const errText = await res.text().catch(() => '');
      console.warn(`[TRANSLATION FALLBACK ERROR] Status ${res.status}:`, errText.slice(0, 150));
    }
  } catch (e) {
    console.warn('[TRANSLATION FALLBACK NOTICE]', e.message);
  }

  return null;
}

/**
 * Translates a single text from an Indian language to English.
 */
export async function translateToEnglish(text, sourceLang) {
  if (!text || typeof text !== 'string') return text;
  const sLang = (sourceLang || 'en').toLowerCase();
  if (sLang === 'en') return text;

  // 1. Try Bhashini NMT
  const bhashiniResult = await callBhashiniNmt([text], sLang, 'en');
  if (bhashiniResult && bhashiniResult[0]) {
    return bhashiniResult[0];
  }

  // 2. Try High-Fidelity Fallback
  const fallbackResult = await fallbackAiTranslate([text], sLang, 'en');
  if (fallbackResult && fallbackResult[0]) {
    return fallbackResult[0];
  }

  return text; // Fail-safe: return original text
}

/**
 * Translates an array of texts from English to a target Indian language.
 */
export async function batchTranslateFromEnglish(texts, targetLang) {
  if (!texts || !Array.isArray(texts) || texts.length === 0) return texts;
  const tLang = (targetLang || 'en').toLowerCase();
  if (tLang === 'en') return texts;

  // Filter non-empty strings
  const validIndices = [];
  const validTexts = [];
  texts.forEach((t, idx) => {
    if (typeof t === 'string' && t.trim().length > 0) {
      validIndices.push(idx);
      validTexts.push(t);
    }
  });

  if (validTexts.length === 0) return texts;

  // 1. Try Bhashini NMT
  let translatedList = await callBhashiniNmt(validTexts, 'en', tLang);

  // 2. Try High-Fidelity Fallback
  if (!translatedList) {
    translatedList = await fallbackAiTranslate(validTexts, 'en', tLang);
  }

  if (translatedList && translatedList.length === validTexts.length) {
    const result = [...texts];
    validIndices.forEach((origIdx, i) => {
      result[origIdx] = translatedList[i];
    });
    return result;
  }

  return texts; // Fail-safe: return original texts
}
