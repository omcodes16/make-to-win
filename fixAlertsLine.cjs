const fs = require('fs');

// Fetch clean state from before the replace_file_content corruption if possible, or just parse carefully.
let lines = fs.readFileSync('src/components/AlertsScreen.jsx', 'utf8').split('\n');
let fixedLines = [];

for (let i = 0; i < lines.length; i++) {
  fixedLines.push(lines[i]);
  
  if (lines[i].includes("power: wind > 60 ? 'Severe' : wind > 40 ? 'High' : wind > 20 ? 'Moderate' : 'Low'")) {
    // Inject the missing lines!
    fixedLines.push("    };");
    fixedLines.push("  };");
    fixedLines.push("");
    fixedLines.push("  const liveAlerts = computeAlerts();");
    fixedLines.push("  const impactStats = getDynamicImpacts();");
    fixedLines.push("");
    fixedLines.push("  const filteredNews = news.filter(item => {");
    fixedLines.push("    if (newsFilter === 'all') return true;");
    fixedLines.push("    const title = item.title.toLowerCase();");
    fixedLines.push("    if (newsFilter === 'alerts') return title.includes('alert') || title.includes('warn') || title.includes('severe');");
    fixedLines.push("    if (newsFilter === 'news') return !title.includes('alert') && !title.includes('warn');");
    fixedLines.push("    if (newsFilter === 'updates') return title.includes('update') || title.includes('live') || title.includes('today');");
    fixedLines.push("    if (newsFilter === 'research') return title.includes('study') || title.includes('climate') || title.includes('report') || title.includes('data');");
    fixedLines.push("    return true;");
    fixedLines.push("  });");
    fixedLines.push("");
    fixedLines.push("  return (");
    fixedLines.push("    <div className=\"min-h-screen bg-[#0a0c1a] text-white overflow-y-auto pb-24 md:pb-20 relative font-body transition-colors duration-1000\">");
    fixedLines.push("      {/* Fixed Background Image (Hardware Accelerated) */}");
    fixedLines.push("      <div className=\"fixed inset-0 z-0 bg-cover bg-center transition-opacity duration-1000\" style={{ backgroundImage: `url(${theme.bgImage})` }}></div>");
    
    // Check if the next line is the buggy `<div className="fixed inset-0 ...` or `      <Header />`
    while (i + 1 < lines.length && (lines[i+1].includes("fixed inset-0 z-0") || lines[i+1].includes("Overlays") || lines[i+1].trim() === "")) {
       // Only skip the exact overlapping ones if any. Let's just be precise.
       // The previous replace_file_content DELETED everything between `const wind = ...` and `<Header />`!
       // Let me check what is actually in the file now.
       break;
    }
  }
}

fs.writeFileSync('src/components/AlertsScreen.jsx.tmp', fixedLines.join('\n'));
