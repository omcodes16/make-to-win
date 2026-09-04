import { FEATURE_I18N } from './featureTranslations.js';

export function computeHeatIndex(tempC, humidity) {
  if (tempC < 27) return tempC;
  const T = (tempC * 9) / 5 + 32;
  const R = humidity;
  let HI =
    -42.379 +
    2.04901523 * T +
    10.14333127 * R -
    0.22475541 * T * R -
    0.00683783 * T * T -
    0.05481717 * R * R +
    0.00122874 * T * T * R +
    0.00085282 * T * R * R -
    0.00000199 * T * T * R * R;
  if (R < 13 && T >= 80 && T <= 112) {
    HI -= ((13 - R) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
  } else if (R > 85 && T >= 80 && T <= 87) {
    HI += ((R - 85) / 10) * ((87 - T) / 5);
  }
  return Math.round(((HI - 32) * 5) / 9);
}

export function getHeatRisk(heatIndexC, lang = 'en') {
  const t = FEATURE_I18N[lang] || FEATURE_I18N.en;
  if (heatIndexC >= 54) return { level: 'extreme-danger', label: t.heatExtremeDanger, icon: '☠️', color: 'text-rose-800 dark:text-red-300', bg: 'bg-rose-100 dark:bg-red-900/40', border: 'border-rose-300 dark:border-red-500/60', dot: 'bg-rose-500 dark:bg-red-400', advice: t.heatAdvExtremeDanger };
  if (heatIndexC >= 41) return { level: 'danger', label: t.heatDanger, icon: '🔴', color: 'text-orange-900 dark:text-orange-300', bg: 'bg-orange-100 dark:bg-orange-900/30', border: 'border-orange-300 dark:border-orange-500/50', dot: 'bg-orange-500 dark:bg-orange-400', advice: t.heatAdvDanger };
  if (heatIndexC >= 32) return { level: 'extreme-caution', label: t.heatExtremeCaution, icon: '🟠', color: 'text-amber-900 dark:text-amber-300', bg: 'bg-amber-100 dark:bg-amber-900/25', border: 'border-amber-300 dark:border-amber-500/40', dot: 'bg-amber-500 dark:bg-amber-400', advice: t.heatAdvExtremeCaution };
  if (heatIndexC >= 27) return { level: 'caution', label: t.heatCaution, icon: '🟡', color: 'text-amber-900 dark:text-yellow-300', bg: 'bg-amber-100 dark:bg-yellow-900/20', border: 'border-amber-300 dark:border-yellow-500/30', dot: 'bg-amber-500 dark:bg-yellow-400', advice: t.heatAdvCaution };
  return { level: 'comfortable', label: t.heatComfortable, icon: '🟢', color: 'text-emerald-900 dark:text-green-300', bg: 'bg-emerald-100 dark:bg-green-900/20', border: 'border-emerald-300 dark:border-green-500/30', dot: 'bg-emerald-500 dark:bg-green-400', advice: t.heatAdvComfortable };
}
