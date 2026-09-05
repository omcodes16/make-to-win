/**
 * climateStats.js - Climate & Meteorological Indices Computation Module
 * 
 * Part of WeatherGPT Research & Climate Analytics (SIH PS-26068).
 * Pure JavaScript computation functions for historical climate data analysis.
 * No external API dependencies or network calls inside this file.
 */

/**
 * Computes the Ordinary Least Squares (OLS) linear regression trend over a time series.
 *
 * Formula:
 *   Slope (m) = Σ((x - x̄) * (y - ȳ)) / Σ((x - x̄)²)
 *   where x = year, y = observed value, x̄ = mean of years, ȳ = mean of values.
 *
 * In plain English:
 *   Fits the optimal straight line through yearly climate observations to calculate
 *   the trajectory and rate of change. It returns both the yearly rate of change
 *   (slopePerYear) and the 10-year decadal rate of change (slopePerDecade).
 *
 * @param {number[]} years - Array of calendar years (e.g., [1990, 1991, 1992, ...]).
 * @param {number[]} values - Array of corresponding yearly metric values (e.g., mean temp, total rain).
 * @returns {{ slopePerYear: number, slopePerDecade: number }} Rate of change per year and per decade.
 */
export function linearTrend(years = [], values = []) {
  if (!Array.isArray(years) || !Array.isArray(values) || years.length === 0 || values.length === 0) {
    return { slopePerYear: 0, slopePerDecade: 0 };
  }

  // Filter out any non-numeric or null/undefined pairs
  const validPairs = [];
  const len = Math.min(years.length, values.length);
  for (let i = 0; i < len; i++) {
    const yVal = Number(years[i]);
    const vVal = Number(values[i]);
    if (!Number.isNaN(yVal) && !Number.isNaN(vVal) && values[i] !== null && values[i] !== undefined) {
      validPairs.push({ x: yVal, y: vVal });
    }
  }

  const n = validPairs.length;
  if (n < 2) {
    return { slopePerYear: 0, slopePerDecade: 0 };
  }

  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += validPairs[i].x;
    sumY += validPairs[i].y;
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    const dx = validPairs[i].x - meanX;
    const dy = validPairs[i].y - meanY;
    numerator += dx * dy;
    denominator += dx * dx;
  }

  if (denominator === 0) {
    return { slopePerYear: 0, slopePerDecade: 0 };
  }

  const slope = numerator / denominator;
  const slopePerYear = Number(slope.toFixed(4));
  const slopePerDecade = Number((slope * 10).toFixed(4));

  return { slopePerYear, slopePerDecade };
}

/**
 * Calculates the standard score (z-score) anomaly for a climate variable.
 *
 * Formula:
 *   z = (value - mean) / stdDev
 *
 * In plain English:
 *   Standardizes an observed climate value by expressing how many standard deviations
 *   it sits above or below the long-term historical baseline mean. A z-score above +2.0
 *   or below -2.0 represents a statistically significant extreme climatic event.
 *
 * @param {number} value - The observed value to evaluate.
 * @param {number} mean - Historical baseline climatological mean.
 * @param {number} stdDev - Historical baseline standard deviation.
 * @returns {number} Standardized anomaly score (z-score), rounded to 2 decimal places.
 */
export function zScoreAnomaly(value, mean, stdDev) {
  const val = Number(value);
  const m = Number(mean);
  const s = Number(stdDev);

  if (Number.isNaN(val) || Number.isNaN(m) || Number.isNaN(s) || s === 0) {
    return 0;
  }

  const z = (val - m) / s;
  return Number(z.toFixed(2));
}

/**
 * Computes the Consecutive Dry Days (CDD) index — the longest run of dry days.
 *
 * Definition (WMO / ETCCDI standard):
 *   Maximum number of consecutive days with daily precipitation < 1.0 mm.
 *
 * In plain English:
 *   Measures the longest continuous drought spell or duration without rainfall (or < 1 mm).
 *   Essential for assessing agricultural drought conditions and water reservoir depletion.
 *
 * @param {number[]} dailyPrecipArray - Array of daily precipitation measurements in mm.
 * @returns {number} Longest streak of consecutive dry days.
 */
export function consecutiveDryDays(dailyPrecipArray = []) {
  if (!Array.isArray(dailyPrecipArray) || dailyPrecipArray.length === 0) {
    return 0;
  }

  let maxStreak = 0;
  let currentStreak = 0;

  for (let i = 0; i < dailyPrecipArray.length; i++) {
    const precip = Number(dailyPrecipArray[i]);
    if (!Number.isNaN(precip) && precip < 1.0) {
      currentStreak++;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    } else {
      currentStreak = 0;
    }
  }

  return maxStreak;
}

/**
 * Computes the Consecutive Wet Days (CWD) index — the longest run of wet days.
 *
 * Definition (WMO / ETCCDI standard):
 *   Maximum number of consecutive days with daily precipitation >= 1.0 mm.
 *
 * In plain English:
 *   Finds the longest uninterrupted sequence of rainy days (>= 1 mm). Used to evaluate
 *   soil saturation, prolonged rainfall patterns, and heightened flood/landslide hazards.
 *
 * @param {number[]} dailyPrecipArray - Array of daily precipitation measurements in mm.
 * @returns {number} Longest streak of consecutive wet days.
 */
export function consecutiveWetDays(dailyPrecipArray = []) {
  if (!Array.isArray(dailyPrecipArray) || dailyPrecipArray.length === 0) {
    return 0;
  }

  let maxStreak = 0;
  let currentStreak = 0;

  for (let i = 0; i < dailyPrecipArray.length; i++) {
    const precip = Number(dailyPrecipArray[i]);
    if (!Number.isNaN(precip) && precip >= 1.0) {
      currentStreak++;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    } else {
      currentStreak = 0;
    }
  }

  return maxStreak;
}

/**
 * Detects heatwave events and counts the total qualifying heatwave days.
 *
 * Definition:
 *   A heatwave event is defined as 3 or more consecutive days where the daily
 *   temperature exceeds the seasonal mean by more than 5°C (temp > seasonalMean + 5°C).
 *
 * In plain English:
 *   Scans the daily temperature record to spot periods where the heat remained severely
 *   abnormal (> 5°C above seasonal expectation) for at least 3 consecutive days. Returns
 *   both the cumulative count of days that were part of heatwaves and a detailed list of each event.
 *
 * @param {Array<number|{temp: number, date?: string}>} dailyTempArray - Daily temperatures (or objects with temp & optional date).
 * @param {number} seasonalMean - Long-term climatological seasonal mean temperature in °C.
 * @returns {{ count: number, events: Array<{ startIndex: number, endIndex: number, length: number, maxTemp: number, startDate?: string, endDate?: string }> }} Total heatwave days and list of events.
 */
export function heatwaveDays(dailyTempArray = [], seasonalMean = 0) {
  if (!Array.isArray(dailyTempArray) || dailyTempArray.length === 0) {
    return { count: 0, events: [] };
  }

  const threshold = Number(seasonalMean) + 5.0;
  const events = [];
  let currentRun = [];

  for (let i = 0; i < dailyTempArray.length; i++) {
    const item = dailyTempArray[i];
    const temp = typeof item === 'object' && item !== null ? Number(item.temp ?? item.temperature) : Number(item);
    const date = typeof item === 'object' && item !== null ? item.date : undefined;

    if (!Number.isNaN(temp) && temp > threshold) {
      currentRun.push({ index: i, temp, date });
    } else {
      if (currentRun.length >= 3) {
        const temps = currentRun.map(d => d.temp);
        events.push({
          startIndex: currentRun[0].index,
          endIndex: currentRun[currentRun.length - 1].index,
          length: currentRun.length,
          maxTemp: Number(Math.max(...temps).toFixed(1)),
          startDate: currentRun[0].date,
          endDate: currentRun[currentRun.length - 1].date
        });
      }
      currentRun = [];
    }
  }

  // Check trailing run
  if (currentRun.length >= 3) {
    const temps = currentRun.map(d => d.temp);
    events.push({
      startIndex: currentRun[0].index,
      endIndex: currentRun[currentRun.length - 1].index,
      length: currentRun.length,
      maxTemp: Number(Math.max(...temps).toFixed(1)),
      startDate: currentRun[0].date,
      endDate: currentRun[currentRun.length - 1].date
    });
  }

  const totalCount = events.reduce((sum, ev) => sum + ev.length, 0);

  return {
    count: totalCount,
    events
  };
}

/**
 * Counts extreme rainfall days with precipitation exceeding 100mm in a single day.
 *
 * Definition (R100mm index):
 *   Count of days where daily rainfall > 100 mm.
 *
 * In plain English:
 *   Tracks catastrophic, high-impact downpours where rainfall exceeds 100 mm (very heavy to extremely
 *   heavy rainfall per meteorological thresholds). Critical for urban flash flood and infrastructure risk.
 *
 * @param {number[]} dailyPrecipArray - Array of daily precipitation measurements in mm.
 * @returns {number} Total count of extreme rainfall days (> 100 mm).
 */
export function extremeRainDays(dailyPrecipArray = []) {
  if (!Array.isArray(dailyPrecipArray) || dailyPrecipArray.length === 0) {
    return 0;
  }

  let count = 0;
  for (let i = 0; i < dailyPrecipArray.length; i++) {
    const precip = Number(dailyPrecipArray[i]);
    if (!Number.isNaN(precip) && precip > 100.0) {
      count++;
    }
  }

  return count;
}

/**
 * Computes Growing Degree Days (GDD) accumulated over the period.
 *
 * Formula:
 *   GDD = Σ max(0, dailyMeanTemp - baseTemp)
 *
 * In plain English:
 *   Quantifies heat accumulation over time used by agronomists and climate researchers
 *   to predict plant phenology, crop development stages, and pest life cycles. Any day
 *   where the mean temperature is above the base threshold (default 10°C) accumulates
 *   thermal units proportional to the excess temperature.
 *
 * @param {Array<number|{temp: number}>} dailyTempArray - Array of daily mean temperatures in °C.
 * @param {number} [baseTemp=10] - Base temperature threshold below which development stops (default: 10°C).
 * @returns {number} Total accumulated Growing Degree Days (rounded to 2 decimal places).
 */
export function growingDegreeDays(dailyTempArray = [], baseTemp = 10) {
  if (!Array.isArray(dailyTempArray) || dailyTempArray.length === 0) {
    return 0;
  }

  const base = Number(baseTemp);
  let gddSum = 0;

  for (let i = 0; i < dailyTempArray.length; i++) {
    const item = dailyTempArray[i];
    const temp = typeof item === 'object' && item !== null ? Number(item.temp ?? item.temperature ?? item.meanTemp) : Number(item);
    if (!Number.isNaN(temp)) {
      const excess = temp - base;
      if (excess > 0) {
        gddSum += excess;
      }
    }
  }

  return Number(gddSum.toFixed(2));
}
