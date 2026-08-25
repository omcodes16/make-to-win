const fs = require('fs');
let code = fs.readFileSync('src/services/locationExtractor.js', 'utf8');

// We will add greetings to SKIP_WORDS
const newSkipWords = `// Common greetings and non-location words to skip
const GREETINGS = new Set(['hi', 'hy', 'hyy', 'hey', 'hello', 'namaste', 'kaise', 'kya', 'good', 'morning', 'evening', 'night', 'bye', 'ok', 'okay', 'thanks', 'thank', 'help', 'weather', 'hai', 'ho']);
const SKIP_WORDS = new Set([`;

code = code.replace('const SKIP_WORDS = new Set([', newSkipWords);

// We will update the 1-2 word logic
const regex = /const words = trimmed\.split\(\/\\s\+\/\);\s*if \(words\.length <= 2\) \{[\s\S]*?if \(cleaned\.length >= 2\) return cleaned;\s*\}/;

const newLogic = `const words = trimmed.split(/\\s+/);
  
  // 5. If the message is very short (1-2 words), check if it's just a greeting
  if (words.length <= 2) {
    const cleaned = trimmed.replace(/[?,!.।॥]/g, '').trim().toLowerCase();
    
    // If it's a known greeting or a skip word, DO NOT treat it as a location
    let isGreeting = true;
    for (const w of words) {
        const wLower = w.replace(/[?,!.।॥]/g, '').toLowerCase();
        if (!GREETINGS.has(wLower) && !SKIP_WORDS.has(wLower)) {
            isGreeting = false;
            break;
        }
    }
    
    if (isGreeting) {
        return null; // It's just a greeting, not a location
    }
    
    // Otherwise, assume it's a city name they typed directly
    if (cleaned.length >= 2) return trimmed.replace(/[?,!.।॥]/g, '').trim();
  }`;

if (code.match(regex)) {
  code = code.replace(regex, newLogic);
  fs.writeFileSync('src/services/locationExtractor.js', code);
  console.log('Patched locationExtractor.js');
} else {
  console.log('Regex not matched');
}
