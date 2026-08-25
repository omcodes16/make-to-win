const fs = require('fs');

let code = fs.readFileSync('src/components/ChatInput.jsx', 'utf8');

// Replace the crash-prone weatherData block
const regex = /weatherData: \{\s*temperature: weatherData\.temperature,[\s\S]*?locationName: location\.name,\s*\}/;

const newBlock = `weatherData: weatherCache`;

if (code.match(regex)) {
  code = code.replace(regex, newBlock);
  fs.writeFileSync('src/components/ChatInput.jsx', code);
  console.log('Patched ChatInput.jsx again to fix the crash');
} else {
  console.log('Could not find the block. Let me try a broader regex.');
  const regex2 = /severity: aiResponse\.severity \|\| \(severityCheck\?\.isSevere \? 'severe' : 'none'\),\s*weatherData: \{[\s\S]*?locationName: location\.name,\s*\}/;
  if (code.match(regex2)) {
    code = code.replace(regex2, "severity: aiResponse.severity || (severityCheck?.isSevere ? 'severe' : 'none'),\n            weatherData: weatherCache");
    fs.writeFileSync('src/components/ChatInput.jsx', code);
    console.log('Patched ChatInput.jsx using fallback regex');
  } else {
    console.log('Still could not find it. Here is the file snippet:');
    console.log(code.substring(code.indexOf('ADD_ASSISTANT_MESSAGE') - 50, code.indexOf('ADD_ASSISTANT_MESSAGE') + 300));
  }
}
