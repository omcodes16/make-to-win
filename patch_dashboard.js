const fs = require('fs');
let code = fs.readFileSync('src/components/WeatherDashboard.jsx', 'utf8');

// Import HistoricalAnalytics
if (!code.includes('HistoricalAnalytics')) {
  code = code.replace("import RadarMap from './RadarMap';", "import RadarMap from './RadarMap';\nimport HistoricalAnalytics from './HistoricalAnalytics';");
  
  // Inject component at the end of the container
  code = code.replace(
    '          </div>\n          \n        </div>', 
    '          </div>\n\n          {/* Historical Data Section */}\n          <HistoricalAnalytics lat={stageData.lat} lon={stageData.lng} />\n          \n        </div>'
  );
  
  fs.writeFileSync('src/components/WeatherDashboard.jsx', code, 'utf8');
  console.log('Injected HistoricalAnalytics into WeatherDashboard');
}
