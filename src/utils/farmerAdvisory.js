/**
 * Farmer Advisory Utility - PS 26068
 * Generates plain-language actionable field guidance from live weather data.
 */
export function getFarmerAdvisory(weather, selectedDay = 0) {
  if (!weather) return null;
  const code = selectedDay === 0 ? weather.weatherCode : weather.daily?.weatherCode?.[selectedDay];
  const rain = selectedDay === 0 ? (weather.rain || weather.precipitation || 0) : 0;
  const uv = selectedDay === 0 ? weather.uvIndex : (weather.daily?.uvIndexMax?.[selectedDay] || 0);
  const wind = selectedDay === 0 ? weather.windSpeed : 0;
  const humidity = weather.humidity || 0;
  const temp = selectedDay === 0 ? weather.temperature : Math.round(((weather.daily?.maxTemp?.[selectedDay] || 0) + (weather.daily?.minTemp?.[selectedDay] || 0)) / 2);
  const precipProb = weather.daily?.precipProbMax?.[selectedDay] || weather.daily?.precipProbMax?.[0] || 0;

  if (code >= 95) return { icon: 'storm', title: 'Stop All Field Work', advice: 'Severe thunderstorm in progress. Evacuate open fields immediately. Do not operate machinery outdoors.', type: 'danger' };
  if (code >= 65 || rain > 10) return { icon: 'rain', title: 'Delay Field Operations', advice: `Heavy rain (${rain}mm). Delay fertiliser application, planting, and harvesting. Check drainage channels for waterlogging.`, type: 'danger' };
  if (selectedDay > 0 && precipProb > 75) return { icon: 'rain', title: 'Delay Field Operations', advice: `Heavy rain likely (${precipProb}% probability). Plan field work for a drier day. Check drainage.`, type: 'danger' };
  if ((code >= 51 && code <= 67) || precipProb > 40) return { icon: 'drizzle', title: 'Avoid Pesticide Spraying', advice: `Rain likely (${precipProb}% chance). Chemicals will be washed away — wait for a dry 4-hour window.`, type: 'caution' };
  if (uv >= 9) return { icon: 'uv', title: 'Avoid Noon Field Work', advice: `UV Index ${uv} is Very High. Work before 10 AM or after 4 PM. Wear a hat and drink water frequently. Risk of heat exhaustion.`, type: 'danger' };
  if (wind > 25) return { icon: 'wind', title: 'High Wind — Spray Drift Risk', advice: `Wind at ${wind} km/h will cause spray to drift off-target. Wait for wind below 15 km/h before pesticide or fertiliser spraying.`, type: 'caution' };
  if (humidity > 85 && temp > 25) return { icon: 'fungal', title: 'Fungal Disease Alert', advice: `High humidity (${humidity}%) + warm temperature creates ideal conditions for fungal crop disease. Inspect crops and apply preventive fungicide.`, type: 'caution' };
  if (code === 45 || code === 48) return { icon: 'fog', title: 'Dense Fog — Limited Visibility', advice: 'Avoid operating tractors and machinery until fog clears. Fog promotes fungal spread on standing crops.', type: 'caution' };
  if (temp <= 5) return { icon: 'frost', title: 'Frost Risk Tonight', advice: `Temperature dropping to ${temp}°C. Cover sensitive crops with mulch or polythene sheets overnight to prevent frost damage.`, type: 'danger' };
  if (precipProb < 20 && wind < 15 && uv < 9) return { icon: 'good', title: 'Ideal Conditions Today', advice: `Clear skies, low wind (${wind || '--'} km/h), no rain forecast. Good day for pesticide spraying, fertiliser application, and field operations.`, type: 'good' };
  return { icon: 'ok', title: 'Suitable Working Conditions', advice: `Acceptable conditions for general farm work. ${uv >= 6 ? 'UV moderate — use sun protection during 11 AM–3 PM.' : 'Comfortable day for outdoor activities.'}`, type: 'good' };
}
