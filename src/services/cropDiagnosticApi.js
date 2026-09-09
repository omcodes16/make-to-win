/**
 * Crop Diagnostic API Service
 * Part of Mausam-Drishti (SIH PS-26068)
 */

export async function requestCropDiagnostic({ image, lat, lng, locationName, cropType = 'auto', language = 'en' }) {
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
  const res = await fetch(`${baseUrl}/api/crop-diagnostic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image,
      lat,
      lng,
      locationName,
      cropType,
      language
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Crop diagnostic engine is temporarily unavailable. Please try again.');
  }

  return await res.json();
}
