/**
 * Coastal SIH Demonstration Scenarios & Acoustic Marine Foghorn
 * Part of Sagar-Rakshak (SIH PS-26068)
 */

export const COASTAL_SIH_SCENARIOS = [
  {
    key: 'kallakkadal_kerala',
    title: 'Kallakkadal Swell Surge',
    titleHi: 'कल्लाकडाल अचानक लहरें (केरल)',
    port: 'Vizhinjam Harbor, Kerala',
    lat: 8.3820,
    lng: 76.9940,
    icon: '🌊',
    badge: 'INCOIS Swell Alert',
    badgeColor: 'border-cyan-500/40 text-cyan-300 bg-cyan-950/40',
    desc: 'High-energy 14s swells from Southern Ocean surging onto beachhead.'
  },
  {
    key: 'imbl_palk_bay',
    title: 'IMBL Border Proximity Alert',
    titleHi: 'समुद्री सीमा (IMBL) निकटता चेतावनी',
    port: 'Rameswaram / Palk Strait, TN',
    lat: 9.2876,
    lng: 79.3129,
    icon: '🚨',
    badge: 'Border Radar',
    badgeColor: 'border-red-500/40 text-red-300 bg-red-950/40',
    desc: 'Approaching international Sri Lanka maritime border in Palk Bay.'
  },
  {
    key: 'cyclone_signal_odisha',
    title: 'Cyclone Port Danger Signal 7',
    titleHi: 'चक्रवात खतरा संकेत ७ (ओडिशा)',
    port: 'Paradip Port, Odisha',
    lat: 20.2644,
    lng: 86.6667,
    icon: '🌀',
    badge: 'Port Signal VII',
    badgeColor: 'border-amber-500/40 text-amber-300 bg-amber-950/40',
    desc: 'Squally gales & 4.2m sea waves. All fishing suspended.'
  },
  {
    key: 'optimal_deepsea_gujarat',
    title: 'Optimal Deep-Sea Fishing',
    titleHi: 'उत्तम गहरा समुद्री मत्स्यन (गुजरात)',
    port: 'Veraval Coast, Gujarat',
    lat: 20.9000,
    lng: 70.3667,
    icon: '☀️',
    badge: 'Deep-Sea Safe',
    badgeColor: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/40',
    desc: 'Calm waters (0.8m waves). Safe up to 50 NM offshore.'
  }
];

/**
 * Synthesize an authentic deep acoustic marine foghorn sound using Web Audio API
 */
export function playMarineFoghorn() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Dual-frequency marine foghorn chord (140Hz and 175Hz - minor third harmonic)
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(140, ctx.currentTime);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(175, ctx.currentTime);

    // Filter to give deep resonance
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, ctx.currentTime);

    // Foghorn envelope: gradual swell and long resonant tail
    gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.35);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 1.85);
    osc2.stop(ctx.currentTime + 1.85);
  } catch (e) {
    console.warn('Web Audio foghorn error:', e);
  }
}
