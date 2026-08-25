const fs = require('fs');

let content = fs.readFileSync('src/components/AlertsScreen.jsx', 'utf8');

// Ensure import if missing
if (!content.includes("import { EXTRA_I18N }")) {
  content = content.replace(
    "import { getSeasonalContext } from '../utils/climateSeasonal';",
    "import { getSeasonalContext } from '../utils/climateSeasonal';\nimport { EXTRA_I18N } from '../utils/translationsExtra';"
  );
}

// Add the extra dictionary reference
content = content.replace(
  "const ft = FEATURE_I18N[lang] || FEATURE_I18N.en;",
  "const ft = FEATURE_I18N[lang] || FEATURE_I18N.en;\n  const ex = EXTRA_I18N[lang] || EXTRA_I18N.en;"
);

// Replace hardcoded words
content = content.replace(/>Live High Alerts</g, ">{ex.liveHighAlerts}<");
content = content.replace(/>Top Risk States</g, ">{ex.topRiskStates}<");
content = content.replace(/>Real-Time India Weather News</g, ">{ex.realTimeNews}<");
content = content.replace(/>View Details /g, ">{ex.viewDetails} ");

content = content.replace(/>Live Radar</g, ">{ex.liveRadar}<");
content = content.replace(/>Real-time rainfall</g, ">{ex.realTimeRain}<");
content = content.replace(/>Satellite View</g, ">{ex.satelliteView}<");
content = content.replace(/>Cloud cover</g, ">{ex.cloudCover}<");
content = content.replace(/>River Levels</g, ">{ex.riverLevels}<");
content = content.replace(/>Flood monitoring</g, ">{ex.floodMonitoring}<");
content = content.replace(/>Early Warnings</g, ">{ex.earlyWarnings}<");
content = content.replace(/>District-level alerts</g, ">{ex.districtAlerts}<");
content = content.replace(/>Safety Guide</g, ">{ex.safetyGuide}<");
content = content.replace(/>Do's &amp; Don'ts</g, ">{ex.dosDonts}<");

// Modals
content = content.replace(/> Live Rain Radar</g, "> {ex.liveRadar}<");
content = content.replace(/> Satellite Cloud Cover</g, "> {ex.satelliteView}<");
content = content.replace(/> River Levels & Flood Monitor</g, "> {ex.riverLevels}<");
content = content.replace(/> District Early Warnings</g, "> {ex.earlyWarnings}<");
content = content.replace(/> Emergency Safety Guide</g, "> {ex.safetyGuide}<");

// News Filters
content = content.replace(/\['All', 'Alerts', 'News', 'Updates', 'Research'\]\.map\(filter => \(/g, "['all', 'alerts', 'news', 'updates', 'research'].map(filter => (");
content = content.replace(/\{filter === 'All'/g, "{filter === 'all'");
content = content.replace(/>\n\s*\{filter\}\n\s*<\/button>/g, ">\n                  {ex.filters[filter]}\n                </button>");

// "Fetching live news..."
content = content.replace(/>Fetching live news\.\.\.</g, ">{ex.fetchingNews}<");
content = content.replace(/>No news found for this filter\.</g, ">{ex.noNews}<");

fs.writeFileSync('src/components/AlertsScreen.jsx', content);
