/**
 * Sagar-Rakshak Marine Safety API Client
 * Part of WeatherGPT (SIH PS-26068)
 */

export async function requestMarineSafety({ lat, lng, locationName, language = 'en' }) {
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
  const params = new URLSearchParams({
    lat: lat || 13.0827,
    lng: lng || 80.2707,
    locationName: locationName || 'Coastal India',
    language
  });

  const res = await fetch(`${baseUrl}/api/marine-safety?${params.toString()}`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Marine safety engine temporarily unreachable.');
  }

  return await res.json();
}
