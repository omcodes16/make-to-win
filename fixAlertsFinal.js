import fs from 'fs';

let c = fs.readFileSync('src/components/AlertsScreen.jsx', 'utf8');

c = c.replace(
  "power: wind > 60 ? 'Severe' : wind > 40 ? 'High' : wind > 20 ? 'Moderate' : 'Low'\n      <div className=\"fixed inset-0 z-0 bg-cover bg-center transition-opacity duration-1000\" style={{ backgroundImage: `url(${theme.bgImage})` }}></div>",
  `power: wind > 60 ? 'Severe' : wind > 40 ? 'High' : wind > 20 ? 'Moderate' : 'Low'
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
      <div className="fixed inset-0 z-0 bg-cover bg-center transition-opacity duration-1000" style={{ backgroundImage: \`url(\${theme.bgImage})\` }}></div>`
);

fs.writeFileSync('src/components/AlertsScreen.jsx', c);
