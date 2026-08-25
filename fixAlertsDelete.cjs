const fs = require('fs');

let lines = fs.readFileSync('src/components/AlertsScreen.jsx', 'utf8').split('\n');
let fixedLines = [];

let deleting = false;
let deleted = false;

for (let i = 0; i < lines.length; i++) {
  if (!deleted && lines[i].includes("const wind = weather.windSpeed || 0;") && lines[i+2].includes("return {")) {
    deleting = true;
  }
  
  if (deleting) {
    if (lines[i].includes("const isProb = !weather.daily.precipitationSum;")) {
      deleting = false;
      deleted = true;
      fixedLines.push(lines[i]);
    }
    continue;
  }
  
  fixedLines.push(lines[i]);
}

fs.writeFileSync('src/components/AlertsScreen.jsx', fixedLines.join('\n'));
