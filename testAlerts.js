const locations = [
  { name: 'Shillong', lat: 25.5788, lng: 91.8933 },
  { name: 'Kochi', lat: 9.9312, lng: 76.2673 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Cherrapunji', lat: 25.2702, lng: 91.7323 },
  { name: 'New Delhi', lat: 28.6139, lng: 77.2090 }
];

async function checkLocations() {
  console.log('Testing Alert Windows for 5 Locations (Simulating UI Logic):\\n');
  for (const loc of locations) {
    const res = await fetch(\https://api.open-meteo.com/v1/forecast?latitude=\&longitude=\&daily=weathercode,precipitation_sum,precipitation_probability_max&timezone=auto\);
    const data = await res.json();
    
    // Simulate the exact logic from AlertsScreen.jsx
    const precipArr = data.daily.precipitation_sum || [0,0,0];
    const maxRain = Math.max(...precipArr.slice(0, 3));
    const maxRainIndex = precipArr.slice(0, 3).indexOf(maxRain);
    
    const dayWindows = ['Today', 'Tomorrow', 'In 2 Days'];
    const rainWindow = dayWindows[maxRainIndex] || 'Next 24 hrs';

    console.log(\📍 \\);
    console.log(\   3-Day Rain Forecast: [\] mm\);
    console.log(\   Max Rain Selected: \ mm (Index \)\);
    console.log(\   ✅ Alert UI Window assigned: \"\\"\\n\);
  }
}
checkLocations().catch(console.error);
