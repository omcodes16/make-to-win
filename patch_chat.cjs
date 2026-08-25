const fs = require('fs');

let code = fs.readFileSync('src/components/ChatInput.jsx', 'utf8');

// The exact string to replace - using regular expressions to be safe with special characters
const regex = /if \(!locationName\) \{[\s\S]*?localStorage\.setItem\('weathergpt-weather-cache', JSON\.stringify\(weatherCache\)\);/;

const newBlock = `let location = null;
        let weatherData = null;
        let weatherInfo = null;
        let severityCheck = null;
        
        // Always try to fetch weather if we think it's a location, but don't block if we can't
        if (locationName) {
          location = await geocodeLocation(locationName, state.language);
          if (location) {
            weatherData = await getWeather(location.lat, location.lng);
            weatherInfo = getWeatherInfo(weatherData.weatherCode);
            severityCheck = checkSeverity(weatherData, location.name);
            if (severityCheck && severityCheck.isSevere) {
              dispatch({ type: 'SET_SEVERE_ALERT', payload: severityCheck });
            }
          }
        }

        // Send to AI via proxy - pass full weather context if available
        const aiResponse = await sendChatMessage(text, state.language, weatherData ? {
          location: location.name,
          state: location.state,
          ...weatherData,
          conditionLabel: weatherInfo.label,
        } : null);

        // Cache raw weather data for offline use
        let weatherCache = undefined;
        if (weatherData) {
          weatherCache = {
            locationName: location.name,
            ...weatherData,
          };
          localStorage.setItem('weathergpt-weather-cache', JSON.stringify(weatherCache));
        }`;

if (code.match(regex)) {
  code = code.replace(regex, newBlock);
  fs.writeFileSync('src/components/ChatInput.jsx', code);
  console.log('Patched ChatInput.jsx');
} else {
  console.log('Could not find the block to replace.');
}
