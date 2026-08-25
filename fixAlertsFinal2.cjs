const fs = require('fs');

let lines = fs.readFileSync('src/components/AlertsScreen.jsx', 'utf8').split('\n');
let fixedLines = [];

const blockToInsert = `    const wind = weather.windSpeed || 0;
    
    return {
      flood: maxRain > 50 ? 'Severe' : maxRain > 20 ? 'High' : maxRain > 5 ? 'Moderate' : 'Low',
      road: maxRain > 40 || weather.visibility < 1000 ? 'High' : maxRain > 15 ? 'Moderate' : 'Low',
      crop: maxRain > 60 || wind > 50 ? 'Severe' : maxRain > 30 ? 'High' : 'Low',
      power: wind > 60 ? 'Severe' : wind > 40 ? 'High' : wind > 20 ? 'Moderate' : 'Low'
    };
  };

  const liveAlerts = computeAlerts();
  const impactStats = getDynamicImpacts();

  const filteredNews = news.filter(item => {
    if (newsFilter === 'all') return true;
    const title = item.title.toLowerCase();
    if (newsFilter === 'alerts') return title.includes('alert') || title.includes('warn') || title.includes('severe');
    if (newsFilter === 'news') return !title.includes('alert') && !title.includes('warn');
    if (newsFilter === 'updates') return title.includes('update') || title.includes('live') || title.includes('today');
    if (newsFilter === 'research') return title.includes('study') || title.includes('climate') || title.includes('report') || title.includes('data');
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0a0c1a] text-white overflow-y-auto pb-24 md:pb-20 relative font-body transition-colors duration-1000">
      {/* Fixed Background Image (Hardware Accelerated) */}
      <div className="fixed inset-0 z-0 bg-cover bg-center transition-opacity duration-1000" style={{ backgroundImage: \`url(\${theme.bgImage})\` }}></div>

      {/* Overlays */}
      <div className={\`fixed inset-0 z-0 bg-gradient-to-b \${theme.overlay} pointer-events-none transition-colors duration-1000 opacity-90\`}></div>
      <div className={\`fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] \${theme.accent} via-transparent to-transparent pointer-events-none transition-colors duration-1000\`}></div>
`;

for (let i = 0; i < lines.length; i++) {
  fixedLines.push(lines[i]);
  
  if (lines[i].includes("const maxRain = Math.max(...precipArr.slice(0, 3));")) {
    fixedLines.push(blockToInsert);
  }
}

fs.writeFileSync('src/components/AlertsScreen.jsx', fixedLines.join('\n'));
