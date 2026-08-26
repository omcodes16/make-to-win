/**
 * Chat API service — sends user message + weather context to the Express proxy,
 * which forwards to Groq. Returns structured AI response.
 */
export async function sendMessage(message, language, weatherData, history = [], profile = 'general') {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, language, weatherData, history, profile }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Weather AI is temporarily unavailable. Try again in a moment.');
  }

  return await res.json();
}
