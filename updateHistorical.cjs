const fs = require('fs');

let content = fs.readFileSync('src/components/HistoricalAnalytics.jsx', 'utf8');

content = content.replace(
  "import React, { useEffect, useState } from 'react';",
  "import React, { useEffect, useState } from 'react';\nimport { useApp } from '../context/AppContext';\nimport { EXTRA_I18N } from '../utils/translationsExtra';"
);

content = content.replace(
  "export default function HistoricalAnalytics({ lat, lon }) {",
  "export default function HistoricalAnalytics({ lat, lon }) {\n  const { state } = useApp();\n  const lang = state.language || 'en';\n  const t = EXTRA_I18N[lang] || EXTRA_I18N.en;"
);

content = content.replace("Historical Climate Trends", "{t.historicalTrends}");
content = content.replace("Past 30 days local weather analytics", "{t.past30Days}");
content = content.replace(">Temperature<", ">{t.tempBtn}<");
content = content.replace(">Rainfall<", ">{t.rainBtn}<");
content = content.replace("WeatherGPT Insights", "{t.gptInsights}");
content = content.replace(">AI Generated<", ">{t.aiGenerated}<");
content = content.replace(">Agri-Risk Assessment<", ">{t.agriRisk}<");
content = content.replace(">30-Day Rain<", ">{t.thirtyDayRain}<");
content = content.replace(">Peak Temp<", ">{t.peakTemp}<");
content = content.replace(">Rainy Days<", ">{t.rainyDays}<");
content = content.replace(">Unable to generate insights without historical data.<", ">{t.noData}<");

content = content.replace(
  /Over the past 30 days, this region has experienced a total of.*?peaked at <strong className="text-orange-400">.*?<\/strong>\./gs,
  "{t.summary(totalRain, rainDays, maxTempStr)}"
);

content = content.replace(
  /\{totalRain > 100 \? "High moisture levels detected.*?: "Optimal moisture balance.*?"\}/gs,
  "{totalRain > 100 ? t.agriHigh : totalRain < 20 ? t.agriLow : t.agriOptimal}"
);

fs.writeFileSync('src/components/HistoricalAnalytics.jsx', content);
