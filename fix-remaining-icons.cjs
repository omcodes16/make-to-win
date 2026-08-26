const fs = require('fs');

// 1. Fix HistoricalAnalytics.jsx
let histCode = fs.readFileSync('src/components/HistoricalAnalytics.jsx', 'utf8');
histCode = histCode.replace(
  /<svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9\.5a3\.5 3\.5 0 0 0 0 7h5a3\.5 3\.5 0 0 1 0 7H6"\/><\/svg>/g,
  `<svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>`
);
fs.writeFileSync('src/components/HistoricalAnalytics.jsx', histCode);

// 2. Fix WeatherCharts.jsx
let chartCode = fs.readFileSync('src/components/WeatherCharts.jsx', 'utf8');
chartCode = chartCode.replace(
  /<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9\.5a3\.5 3\.5 0 0 0 0 7h5a3\.5 3\.5 0 0 1 0 7H6"\/><\/svg>/g,
  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>`
);
fs.writeFileSync('src/components/WeatherCharts.jsx', chartCode);

console.log('Fixed remaining dollar sign icons in HistoricalAnalytics and WeatherCharts');
