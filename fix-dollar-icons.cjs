const fs = require('fs');

let code = fs.readFileSync('src/components/AlertsScreen.jsx', 'utf8');

// 1. Replace Expected $ with a Bar Chart icon
code = code.replace(
  /<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9\.5a3\.5 3\.5 0 0 0 0 7h5a3\.5 3\.5 0 0 1 0 7H6"\/><\/svg>\s*Expected/g,
  `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                        Expected`
);

// 2. Replace Impact Level $ with a Pulse icon
code = code.replace(
  /<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9\.5a3\.5 3\.5 0 0 0 0 7h5a3\.5 3\.5 0 0 1 0 7H6"\/><\/svg>\s*Impact Level/g,
  `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                        Impact Level`
);

// 3. Replace Cyclone Safety $ with a Wind icon
code = code.replace(
  /<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"\/><path d="M12 2v20M17 5H9\.5a3\.5 3\.5 0 0 0 0 7h5a3\.5 3\.5 0 0 1 0 7H6"\/><\/svg>\s*Cyclone Safety/g,
  `<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg> Cyclone Safety`
);

// 4. Replace Heatwave Safety $ with a Thermometer icon
code = code.replace(
  /<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9\.5a3\.5 3\.5 0 0 0 0 7h5a3\.5 3\.5 0 0 1 0 7H6"\/><\/svg>\s*Heatwave Safety/g,
  `<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg> Heatwave Safety`
);

fs.writeFileSync('src/components/AlertsScreen.jsx', code);
console.log('Fixed dollar sign icons in AlertsScreen.jsx');
