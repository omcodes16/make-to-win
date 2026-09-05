import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { searchLocationSuggestions, geocodeLocation } from '../services/weatherApi';
import { 
  linearTrend, 
  zScoreAnomaly, 
  consecutiveDryDays, 
  consecutiveWetDays, 
  heatwaveDays, 
  extremeRainDays, 
  growingDegreeDays 
} from '../../server/climateStats.js';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { exportToCSV } from '../utils/csvExport';

const LOCATION_COLORS = ['#38bdf8', '#f97316', '#10b981'];
const CURRENT_YEAR = new Date().getFullYear();

const ERA5_CLIMATE_CACHE = new Map();

function getClimateCacheKey(loc, sY, eY) {
  return `${Number(loc.lat).toFixed(2)}_${Number(loc.lng).toFixed(2)}_${sY}_${eY}`;
}

export default function ResearchPanel() {
  const { state, dispatch } = useApp();
  const isLight = state.uiTheme === 'light';

  // Location comparison state: up to 3 locations
  const initialLoc = useMemo(() => {
    if (state.weatherStageData?.lat && state.weatherStageData?.lng) {
      return {
        name: state.weatherStageData.locationName || 'Current Location',
        lat: state.weatherStageData.lat,
        lng: state.weatherStageData.lng
      };
    }
    return { name: 'New Delhi', lat: 28.6139, lng: 77.2090 };
  }, [state.weatherStageData?.lat, state.weatherStageData?.lng, state.weatherStageData?.locationName]);

  const [locations, setLocations] = useState([initialLoc]);
  const [activeTableLocIndex, setActiveTableLocIndex] = useState(0);

  // Year range state
  const [startYear, setStartYear] = useState(1990);
  const [endYear, setEndYear] = useState(CURRENT_YEAR);

  // Synchronize locations if initialLoc changes (e.g., location updated in weather stage)
  const prevInitLocRef = useRef(initialLoc);
  useEffect(() => {
    if (
      Math.abs(prevInitLocRef.current.lat - initialLoc.lat) > 0.01 ||
      Math.abs(prevInitLocRef.current.lng - initialLoc.lng) > 0.01
    ) {
      prevInitLocRef.current = initialLoc;
      setLocations([initialLoc]);
      setActiveTableLocIndex(0);
    }
  }, [initialLoc]);

  // Autocomplete search state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);

  // Active chart variable
  const [selectedVariable, setSelectedVariable] = useState('meanTemp'); // 'meanTemp', 'maxTemp', 'totalPrecip', 'gdd', 'cdd', 'heatwaveDays'
  const [showTrendLine, setShowTrendLine] = useState(true);

  // Table sorting state
  const [sortField, setSortField] = useState('year');
  const [sortAsc, setSortAsc] = useState(true);

  // Data fetching state initialized from cache if available
  const [locationsData, setLocationsData] = useState(() => {
    const sY = 1990;
    const eY = CURRENT_YEAR;
    const key = getClimateCacheKey(initialLoc, sY, eY);
    if (ERA5_CLIMATE_CACHE.has(key)) {
      return [ERA5_CLIMATE_CACHE.get(key)];
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Handle location search with debounce
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val || val.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    setIsSearching(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchLocationSuggestions(val, state.language || 'en');
        setSuggestions(results || []);
        setShowDropdown(true);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  const handleAddLocation = (loc) => {
    if (locations.length >= 3) return;
    const isDuplicate = locations.some(
      l => Math.abs(l.lat - loc.lat) < 0.05 && Math.abs(l.lng - loc.lng) < 0.05
    );
    if (!isDuplicate) {
      setLocations(prev => [...prev, { name: loc.name, lat: loc.lat, lng: loc.lng }]);
    }
    setSearchQuery('');
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleRemoveLocation = (indexToRemove) => {
    if (locations.length <= 1) return;
    setLocations(prev => prev.filter((_, idx) => idx !== indexToRemove));
    if (activeTableLocIndex >= indexToRemove && activeTableLocIndex > 0) {
      setActiveTableLocIndex(prev => prev - 1);
    }
  };

  // Helper for resilient fetching with automatic retry on 429 (rate-limit)
  const fetchWithRetry = async (url, retries = 2, delayMs = 1500) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const res = await fetch(url);
      if (res.status === 429 && attempt < retries) {
        console.warn(`[Open-Meteo] HTTP 429 rate limit hit. Retrying in ${delayMs}ms (attempt ${attempt + 1}/${retries})...`);
        await new Promise(r => setTimeout(r, delayMs));
        delayMs *= 1.5;
        continue;
      }
      return res;
    }
  };

  // Fetch single location from Open-Meteo with live computation and retry on 429
  const fetchClimateDataForLocation = async (loc, sY, eY, startStr, endStr) => {
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${loc.lat}&longitude=${loc.lng}&start_date=${startStr}&end_date=${endStr}&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum&timezone=auto`;
    const res = await fetchWithRetry(url);

    if (!res.ok) {
      if (res.status === 429) {
        throw new Error(`${loc.name}: Open-Meteo rate limit reached. Please wait a moment and click Retry.`);
      }
      throw new Error(`${loc.name}: Open-Meteo returned HTTP ${res.status}`);
    }

    const json = await res.json();
    if (!json.daily || !json.daily.time || json.daily.time.length === 0) {
      throw new Error(`${loc.name}: No archive data found for this period.`);
    }

    const daily = json.daily;
    const nDays = daily.time.length;
    const yearBuckets = new Map();
    const allDailyMaxTemps = [];

    for (let i = 0; i < nDays; i++) {
      const dateStr = daily.time[i];
      const yr = parseInt(dateStr.slice(0, 4), 10);
      const tMean = daily.temperature_2m_mean?.[i];
      const tMax = daily.temperature_2m_max?.[i];
      const tMin = daily.temperature_2m_min?.[i];
      const precip = daily.precipitation_sum?.[i] ?? 0;

      if (!yearBuckets.has(yr)) {
        yearBuckets.set(yr, {
          year: yr,
          precipList: [],
          meanTempList: [],
          maxTempList: [],
          minTempList: [],
          dailyRecords: []
        });
      }

      const bucket = yearBuckets.get(yr);
      bucket.precipList.push(precip);
      if (tMean != null) bucket.meanTempList.push(tMean);
      if (tMax != null) {
        bucket.maxTempList.push(tMax);
        allDailyMaxTemps.push(tMax);
        bucket.dailyRecords.push({ date: dateStr, temp: tMax });
      }
      if (tMin != null) bucket.minTempList.push(tMin);
    }

    const baselineMaxMean = allDailyMaxTemps.length > 0
      ? allDailyMaxTemps.reduce((a, b) => a + b, 0) / allDailyMaxTemps.length
      : 30;

    const yearlyData = [];
    const years = [];
    const yearlyMeanTemps = [];
    const yearlyTotalPrecip = [];

    for (const [yr, b] of yearBuckets.entries()) {
      const totalRain = b.precipList.reduce((a, b) => a + b, 0);
      const avgMeanTemp = b.meanTempList.length > 0
        ? b.meanTempList.reduce((a, b) => a + b, 0) / b.meanTempList.length
        : null;
      const peakMaxTemp = b.maxTempList.length > 0 ? Math.max(...b.maxTempList) : null;
      const lowestMinTemp = b.minTempList.length > 0 ? Math.min(...b.minTempList) : null;

      const cdd = consecutiveDryDays(b.precipList);
      const cwd = consecutiveWetDays(b.precipList);
      const hw = heatwaveDays(b.dailyRecords, baselineMaxMean);
      const extRain = extremeRainDays(b.precipList);
      const gdd = growingDegreeDays(b.meanTempList, 10);

      years.push(yr);
      if (avgMeanTemp != null) yearlyMeanTemps.push(Number(avgMeanTemp.toFixed(2)));
      yearlyTotalPrecip.push(Number(totalRain.toFixed(1)));

      yearlyData.push({
        year: yr,
        meanTemp: avgMeanTemp != null ? Number(avgMeanTemp.toFixed(2)) : null,
        maxTemp: peakMaxTemp != null ? Number(peakMaxTemp.toFixed(1)) : null,
        minTemp: lowestMinTemp != null ? Number(lowestMinTemp.toFixed(1)) : null,
        totalPrecip: Number(totalRain.toFixed(1)),
        cdd,
        cwd,
        heatwaveDays: hw.count,
        extremeRainDays: extRain,
        gdd
      });
    }

    yearlyData.sort((a, b) => a.year - b.year);

    const tempTrend = linearTrend(years, yearlyMeanTemps);
    const precipTrend = linearTrend(years, yearlyTotalPrecip);

    let zScore = 0;
    if (yearlyMeanTemps.length >= 2) {
      const n = yearlyMeanTemps.length;
      const mean = yearlyMeanTemps.reduce((a, b) => a + b, 0) / n;
      const variance = yearlyMeanTemps.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
      const stdDev = Math.sqrt(variance);
      const latestVal = yearlyMeanTemps[yearlyMeanTemps.length - 1];
      zScore = zScoreAnomaly(latestVal, mean, stdDev);
    }

    const totalHwDays = yearlyData.reduce((sum, y) => sum + y.heatwaveDays, 0);
    const totalExtRainDays = yearlyData.reduce((sum, y) => sum + y.extremeRainDays, 0);
    const maxCdd = Math.max(...yearlyData.map(y => y.cdd), 0);
    const maxCwd = Math.max(...yearlyData.map(y => y.cwd), 0);
    const avgGdd = yearlyData.length > 0
      ? Number((yearlyData.reduce((sum, y) => sum + y.gdd, 0) / yearlyData.length).toFixed(1))
      : 0;

    return {
      location: loc,
      coordinates: { lat: loc.lat, lng: loc.lng },
      startYear: sY,
      endYear: eY,
      generated: new Date().toISOString(),
      source: 'ERA5 Reanalysis via Open-Meteo',
      indices: {
        tempTrend,
        precipTrend,
        zScore,
        totalHeatwaveDays: totalHwDays,
        totalExtremeRainDays: totalExtRainDays,
        maxCdd,
        maxCwd,
        avgGdd
      },
      yearlyData
    };
  };

  // Live data fetcher for all selected locations (incremental & sequential)
  const fetchAllClimateData = async (forceRefetchAll = false) => {
    if (locations.length === 0) return;

    const sY = Math.max(1990, Number(startYear) || 1990);
    let eY = Math.min(CURRENT_YEAR, Number(endYear) || CURRENT_YEAR);
    if (eY < sY) eY = sY;

    const startStr = `${sY}-01-01`;
    // Cap at 5 days ago for official ERA5 reanalysis availability & avoid rate limits
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() - 5);
    const maxDateStr = maxDate.toISOString().split('T')[0];
    let endStr = `${eY}-12-31`;
    if (endStr > maxDateStr) endStr = maxDateStr;

    // Fast check: if not forcing refetch, can all locations be resolved from cache or locationsData?
    if (!forceRefetchAll) {
      const allCached = [];
      let allFound = true;
      for (const loc of locations) {
        const key = getClimateCacheKey(loc, sY, eY);
        const cached = ERA5_CLIMATE_CACHE.get(key) || locationsData.find(d => 
          Math.abs(d.coordinates.lat - loc.lat) < 0.05 && 
          Math.abs(d.coordinates.lng - loc.lng) < 0.05 &&
          d.startYear === sY && d.endYear === eY
        );
        if (cached) {
          allCached.push(cached);
        } else {
          allFound = false;
          break;
        }
      }
      if (allFound && allCached.length === locations.length) {
        setLocationsData(allCached);
        setFetchError(null);
        return;
      }
    }

    setIsLoading(true);
    setFetchError(null);

    try {
      const results = [];
      const errors = [];

      for (let locIdx = 0; locIdx < locations.length; locIdx++) {
        const loc = locations[locIdx];
        const cacheKey = getClimateCacheKey(loc, sY, eY);

        if (forceRefetchAll) {
          ERA5_CLIMATE_CACHE.delete(cacheKey);
        }

        // If not forcing full refetch, reuse cached data or locationsData
        const existing = !forceRefetchAll
          ? (ERA5_CLIMATE_CACHE.get(cacheKey) || locationsData.find(d => 
              Math.abs(d.coordinates.lat - loc.lat) < 0.05 && 
              Math.abs(d.coordinates.lng - loc.lng) < 0.05 &&
              d.startYear === sY && d.endYear === eY
            ))
          : null;

        if (existing) {
          results.push(existing);
          continue;
        }

        // Polite pause before network call if another location was just fetched
        if (results.length > 0) {
          await new Promise(r => setTimeout(r, 400));
        }

        try {
          const locResult = await fetchClimateDataForLocation(loc, sY, eY, startStr, endStr);
          ERA5_CLIMATE_CACHE.set(cacheKey, locResult);
          results.push(locResult);
        } catch (locErr) {
          errors.push(locErr.message);
        }
      }

      if (results.length > 0) {
        setLocationsData(results);
      }
      if (errors.length > 0) {
        setFetchError(errors.join(' | '));
      }
    } catch (err) {
      console.error('ResearchPanel fetch error:', err);
      setFetchError(err.message || 'Failed to fetch historical climate archive data.');
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch when locations or years change
  useEffect(() => {
    fetchAllClimateData();
  }, [locations, startYear, endYear]);

  // Merge yearlyData for multi-location chart visualization
  const chartData = useMemo(() => {
    if (locationsData.length === 0) return [];
    
    // Map by year
    const yearMap = new Map();
    locationsData.forEach((locResult, locIdx) => {
      const locKey = `loc_${locIdx}`;
      locResult.yearlyData.forEach(item => {
        if (!yearMap.has(item.year)) {
          yearMap.set(item.year, { year: item.year });
        }
        const row = yearMap.get(item.year);
        row[locKey] = item[selectedVariable];
      });
    });

    const rows = Array.from(yearMap.values()).sort((a, b) => a.year - b.year);

    // Compute trend line values for each location
    if (showTrendLine) {
      locationsData.forEach((locResult, locIdx) => {
        const locKey = `loc_${locIdx}`;
        const trendKey = `trend_${locIdx}`;
        const years = [];
        const values = [];
        rows.forEach(r => {
          if (r[locKey] != null) {
            years.push(r.year);
            values.push(r[locKey]);
          }
        });
        const trend = linearTrend(years, values);
        if (years.length >= 2) {
          const meanX = years.reduce((a, b) => a + b, 0) / years.length;
          const meanY = values.reduce((a, b) => a + b, 0) / values.length;
          const m = trend.slopePerYear;
          const c = meanY - m * meanX;
          rows.forEach(r => {
            r[trendKey] = Number((m * r.year + c).toFixed(2));
          });
        }
      });
    }

    return rows;
  }, [locationsData, selectedVariable, showTrendLine]);

  // Active location for Table view
  const activeLocData = locationsData[activeTableLocIndex] || locationsData[0];

  // Sorted table rows
  const sortedTableData = useMemo(() => {
    if (!activeLocData?.yearlyData) return [];
    const copy = [...activeLocData.yearlyData];
    copy.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      return sortAsc ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
    return copy;
  }, [activeLocData, sortField, sortAsc]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(prev => !prev);
    } else {
      setSortField(field);
      setSortAsc(false); // Default descending when switching field
    }
  };

  // Dynamic variable metadata for axis and tooltips
  const variableMeta = {
    meanTemp: { label: 'Mean Temperature', unit: '°C', color: '#38bdf8' },
    maxTemp: { label: 'Peak Max Temp', unit: '°C', color: '#ea580c' },
    totalPrecip: { label: 'Total Precipitation', unit: 'mm', color: '#3b82f6' },
    gdd: { label: 'Growing Degree Days', unit: 'GDD', color: '#10b981' },
    cdd: { label: 'Consecutive Dry Days', unit: 'days', color: '#eab308' },
    heatwaveDays: { label: 'Heatwave Days', unit: 'days', color: '#ef4444' }
  };

  const activeMeta = variableMeta[selectedVariable] || variableMeta.meanTemp;

  // Chart styling colors
  const gridColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
  const axisColor = isLight ? '#63574f' : '#94a3b8';
  const tooltipBg = isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.95)';
  const tooltipBorder = isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.15)';
  const tooltipText = isLight ? '#191412' : '#ffffff';

  // Handle CSV export trigger using actual displayed live data
  const handleExportCSVClick = () => {
    if (!activeLocData || !activeLocData.yearlyData) return;
    exportToCSV(activeLocData.yearlyData, {
      location: activeLocData.location.name,
      coordinates: activeLocData.coordinates,
      period: `${activeLocData.startYear}–${activeLocData.endYear}`,
      source: activeLocData.source,
      generated: activeLocData.generated || new Date().toISOString()
    });
  };

  return (
    <div className="min-h-[100dvh] overflow-y-auto pb-28 md:pb-24 relative font-body transition-colors duration-1000" style={{ color: 'var(--text-primary)' }}>
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-20 sm:pt-28 md:pt-32 pb-20 space-y-6 animate-fade-in">
        
        {/* Quick Back Navigation Bar */}
        <div className="flex items-center justify-between mb-1">
          <button
            onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'chat' })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[var(--text-primary)] font-bold text-xs backdrop-blur-md border border-[var(--theme-border)] transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <span>←</span>
            <span>Back to Chat</span>
          </button>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
            ERA5 Climate Analytics
          </span>
        </div>

        {/* HEADER SECTION */}
        <div className="glass-panel border border-[var(--theme-border)] rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-400">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5s-2.5-1.1-2.5-2.5V2"/>
                  <path d="M8.5 2h7"/>
                  <path d="M14.5 16h-5"/>
                </svg>
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Research & Climate Analytics
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                SIH PS-26068
              </span>
            </div>
            <p className="mt-2 text-xs sm:text-sm text-[var(--text-secondary)]">
              Multi-decadal ERA5 reanalysis via Open-Meteo Archive (1990–Present). Real-time mathematical computation of climate change indices, drought runs, heatwave episodes, and agricultural growing degree days.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportCSVClick}
              disabled={isLoading || !activeLocData}
              className="px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export CSV
            </button>
            <button
              onClick={() => fetchAllClimateData(true)}
              disabled={isLoading}
              title="Force Refresh Climate Data (Bypasses Cache)"
              className="p-2 rounded-xl glass-panel border border-[var(--glass-border)] text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)] transition-all cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={isLoading ? 'animate-spin text-indigo-400' : ''}>
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </button>
          </div>
        </div>

        {/* CONTROLS BAR: Locations & Year Range */}
        <div className="mt-6 pt-5 border-t border-[var(--theme-border)] grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          
          {/* Location Autocomplete Input (5 cols) */}
          <div className="lg:col-span-6 relative" ref={dropdownRef}>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Compare Locations (Up to 3)
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={locations.length >= 3 ? "Max 3 locations reached" : "Search Indian city or district to compare..."}
                disabled={locations.length >= 3}
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-50"
              />
              <svg className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {isSearching && (
                <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin absolute right-3 top-3"></div>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showDropdown && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl bg-[var(--modal-bg)] border border-[var(--modal-border)] shadow-2xl overflow-hidden max-h-56 overflow-y-auto backdrop-blur-xl">
                {suggestions.map((loc, idx) => (
                  <button
                    key={`${loc.name}-${idx}`}
                    onClick={() => handleAddLocation(loc)}
                    className="w-full px-4 py-2.5 text-left text-xs sm:text-sm text-[var(--text-primary)] hover:bg-indigo-500/15 flex items-center justify-between transition-colors border-b border-[var(--theme-border)] last:border-none cursor-pointer"
                  >
                    <div>
                      <span className="font-bold">{loc.name}</span>
                      {loc.state && <span className="text-[var(--text-secondary)] text-[11px] ml-1.5">({loc.state})</span>}
                    </div>
                    <span className="text-[10px] text-indigo-400 font-bold uppercase">+ Add</span>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Location Chips */}
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              {locations.map((loc, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all"
                  style={{
                    backgroundColor: `${LOCATION_COLORS[idx]}15`,
                    borderColor: `${LOCATION_COLORS[idx]}40`,
                    color: LOCATION_COLORS[idx]
                  }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: LOCATION_COLORS[idx] }}></span>
                  <span>{loc.name}</span>
                  {locations.length > 1 && (
                    <button
                      onClick={() => handleRemoveLocation(idx)}
                      className="ml-1 hover:opacity-75 focus:outline-none cursor-pointer text-xs font-black"
                      title="Remove location"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Year Range Picker (4 cols) */}
          <div className="lg:col-span-4">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Time Period (ERA5 Reanalysis)
            </label>
            <div className="flex items-center gap-2">
              <select
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}
                className="flex-1 py-2 px-2.5 text-xs sm:text-sm rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                {Array.from({ length: CURRENT_YEAR - 1990 + 1 }, (_, i) => 1990 + i).map(yr => (
                  <option key={yr} value={yr} className="bg-slate-900 text-white">{yr}</option>
                ))}
              </select>
              <span className="text-[var(--text-secondary)] text-xs font-bold">to</span>
              <select
                value={endYear}
                onChange={(e) => setEndYear(Number(e.target.value))}
                className="flex-1 py-2 px-2.5 text-xs sm:text-sm rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                {Array.from({ length: CURRENT_YEAR - 1990 + 1 }, (_, i) => 1990 + i).map(yr => (
                  <option key={yr} value={yr} className="bg-slate-900 text-white">{yr}</option>
                ))}
              </select>
            </div>
            
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 mt-2">
              <button
                onClick={() => { setStartYear(1990); setEndYear(CURRENT_YEAR); }}
                className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
              >
                1990–Present
              </button>
              <button
                onClick={() => { setStartYear(2000); setEndYear(CURRENT_YEAR); }}
                className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
              >
                2000–Present
              </button>
              <button
                onClick={() => { setStartYear(CURRENT_YEAR - 10); setEndYear(CURRENT_YEAR); }}
                className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
              >
                Last 10Y
              </button>
            </div>
          </div>

          {/* Trend Line Toggle (2 cols) */}
          <div className="lg:col-span-2 flex flex-col justify-center">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Trend Overlay
            </label>
            <button
              onClick={() => setShowTrendLine(prev => !prev)}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                showTrendLine 
                  ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' 
                  : 'bg-[var(--input-bg)] text-[var(--text-secondary)] border-[var(--input-border)]'
              }`}
            >
              <span>{showTrendLine ? '✓ Trend Line Active' : 'Show OLS Trend'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* ERROR BANNER */}
      {fetchError && (
        <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{fetchError}</span>
          </div>
          <button 
            onClick={fetchAllClimateData}
            className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-xs font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI STATS CARDS (Primary Location) */}
      {activeLocData && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          
          {/* Card 1: Temp Trend */}
          <div className="glass-panel border border-[var(--theme-border)] rounded-2xl p-4 shadow-md">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Temp Trend (OLS)
            </div>
            <div className="text-xl font-black mt-1 text-sky-400">
              {activeLocData.indices.tempTrend.slopePerDecade > 0 ? '+' : ''}
              {activeLocData.indices.tempTrend.slopePerDecade}°C
              <span className="text-[10px] font-normal text-[var(--text-secondary)]"> /decade</span>
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
              ({activeLocData.indices.tempTrend.slopePerYear}°C/yr)
            </div>
          </div>

          {/* Card 2: Rainfall Trend */}
          <div className="glass-panel border border-[var(--theme-border)] rounded-2xl p-4 shadow-md">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Precip Trend
            </div>
            <div className="text-xl font-black mt-1 text-blue-400">
              {activeLocData.indices.precipTrend.slopePerDecade > 0 ? '+' : ''}
              {activeLocData.indices.precipTrend.slopePerDecade}mm
              <span className="text-[10px] font-normal text-[var(--text-secondary)]"> /decade</span>
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
              ({activeLocData.indices.precipTrend.slopePerYear}mm/yr)
            </div>
          </div>

          {/* Card 3: Max Drought Run (CDD) */}
          <div className="glass-panel border border-[var(--theme-border)] rounded-2xl p-4 shadow-md">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Peak Dry Spell (CDD)
            </div>
            <div className="text-xl font-black mt-1 text-amber-400">
              {activeLocData.indices.maxCdd}
              <span className="text-[10px] font-normal text-[var(--text-secondary)]"> days</span>
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
              Rainfall &lt; 1.0mm
            </div>
          </div>

          {/* Card 4: Heatwaves */}
          <div className="glass-panel border border-[var(--theme-border)] rounded-2xl p-4 shadow-md">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Heatwave Days
            </div>
            <div className="text-xl font-black mt-1 text-rose-400">
              {activeLocData.indices.totalHeatwaveDays}
              <span className="text-[10px] font-normal text-[var(--text-secondary)]"> total</span>
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
              (&gt; Seasonal + 5°C, 3+ d)
            </div>
          </div>

          {/* Card 5: Extreme Rain Days */}
          <div className="glass-panel border border-[var(--theme-border)] rounded-2xl p-4 shadow-md">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Downpours &gt;100mm
            </div>
            <div className="text-xl font-black mt-1 text-cyan-400">
              {activeLocData.indices.totalExtremeRainDays}
              <span className="text-[10px] font-normal text-[var(--text-secondary)]"> days</span>
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
              R100mm extreme index
            </div>
          </div>

          {/* Card 6: GDD (Growing Degree Days) */}
          <div className="glass-panel border border-[var(--theme-border)] rounded-2xl p-4 shadow-md">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Avg Yearly GDD
            </div>
            <div className="text-xl font-black mt-1 text-emerald-400">
              {activeLocData.indices.avgGdd}
              <span className="text-[10px] font-normal text-[var(--text-secondary)]"> units</span>
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
              Base threshold 10°C
            </div>
          </div>

        </div>
      )}

      {/* CHART SECTION */}
      <div className="glass-panel border border-[var(--theme-border)] rounded-3xl p-6 shadow-xl relative">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
              <span>📈</span>
              <span>Historical Trajectory & Multi-Decadal Regression</span>
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Comparing yearly values and Ordinary Least Squares (OLS) linear trendlines across {startYear}–{endYear}.
            </p>
          </div>

          {/* Variable Selector Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[var(--input-bg)] p-1 rounded-2xl border border-[var(--input-border)]">
            {[
              { id: 'meanTemp', label: 'Mean Temp (°C)' },
              { id: 'maxTemp', label: 'Max Temp (°C)' },
              { id: 'totalPrecip', label: 'Precip (mm)' },
              { id: 'gdd', label: 'GDD' },
              { id: 'cdd', label: 'Dry Days (CDD)' },
              { id: 'heatwaveDays', label: 'Heatwave Days' }
            ].map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVariable(v.id)}
                className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  selectedVariable === v.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* CHART CONTAINER */}
        <div className="w-full h-80 sm:h-96">
          {isLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                Fetching live ERA5 reanalysis data from Open-Meteo Archive...
              </span>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis 
                  dataKey="year" 
                  stroke={axisColor} 
                  fontSize={11} 
                  tickMargin={8} 
                  tick={{ fill: axisColor, fontSize: 11, fontWeight: 600 }}
                />
                <YAxis 
                  stroke={axisColor} 
                  fontSize={11} 
                  tickFormatter={(val) => `${val}${activeMeta.unit}`} 
                  tick={{ fill: axisColor, fontSize: 11, fontWeight: 600 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: tooltipBorder,
                    borderRadius: '16px',
                    color: tooltipText,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                    backdropFilter: 'blur(12px)'
                  }}
                  formatter={(value, name) => {
                    return [`${value} ${activeMeta.unit}`, name];
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '12px', fontWeight: 600 }} 
                />

                {/* Draw Lines for each location */}
                {locationsData.map((locResult, idx) => {
                  const locKey = `loc_${idx}`;
                  const trendKey = `trend_${idx}`;
                  const color = LOCATION_COLORS[idx] || '#818cf8';

                  return (
                    <React.Fragment key={locKey}>
                      {/* Raw yearly data line */}
                      <Line
                        type="monotone"
                        dataKey={locKey}
                        name={`${locResult.location.name} (${activeMeta.label})`}
                        stroke={color}
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: color }}
                        activeDot={{ r: 6 }}
                      />
                      {/* OLS linear regression trend line */}
                      {showTrendLine && (
                        <Line
                          type="monotone"
                          dataKey={trendKey}
                          name={`${locResult.location.name} (Trendline)`}
                          stroke={color}
                          strokeWidth={1.8}
                          strokeDasharray="5 5"
                          dot={false}
                          activeDot={false}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-[var(--text-secondary)]">
              No historical data available for the chosen parameters.
            </div>
          )}
        </div>
      </div>

      {/* SORTABLE CLIMATE INDICES TABLE */}
      <div className="glass-panel border border-[var(--theme-border)] rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
              <span>📋</span>
              <span>Year-by-Year Climate Indices Breakdown</span>
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Click any column header to sort ascending or descending.
            </p>
          </div>

          {/* Location Tab Switcher for Table (if multiple locations) */}
          {locationsData.length > 1 && (
            <div className="flex items-center gap-1 bg-[var(--input-bg)] p-1 rounded-xl border border-[var(--input-border)]">
              {locationsData.map((locRes, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTableLocIndex(idx)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTableLocIndex === idx
                      ? 'bg-indigo-600 text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {locRes.location.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* TABLE WRAPPER */}
        <div className="overflow-x-auto rounded-2xl border border-[var(--theme-border)]">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-[var(--input-bg)] border-b border-[var(--theme-border)] text-[var(--text-secondary)] font-extrabold uppercase text-[10px] sm:text-[11px] tracking-wider">
                {[
                  { field: 'year', label: 'Year' },
                  { field: 'meanTemp', label: 'Mean Temp (°C)' },
                  { field: 'maxTemp', label: 'Peak Max (°C)' },
                  { field: 'totalPrecip', label: 'Rainfall (mm)' },
                  { field: 'cdd', label: 'Dry Days (CDD)' },
                  { field: 'cwd', label: 'Wet Days (CWD)' },
                  { field: 'heatwaveDays', label: 'Heatwave Days' },
                  { field: 'extremeRainDays', label: 'Extreme Rain (>100mm)' },
                  { field: 'gdd', label: 'GDD (Base 10°C)' }
                ].map(col => (
                  <th
                    key={col.field}
                    onClick={() => handleSort(col.field)}
                    className="py-3 px-3.5 cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <span>{col.label}</span>
                      {sortField === col.field ? (
                        <span className="text-indigo-400 font-black">{sortAsc ? '▲' : '▼'}</span>
                      ) : (
                        <span className="opacity-25">↕</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--theme-border)] font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-[var(--text-secondary)]">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading records...</span>
                    </div>
                  </td>
                </tr>
              ) : sortedTableData.length > 0 ? (
                sortedTableData.map((row) => (
                  <tr key={row.year} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-3.5 font-bold text-indigo-400">{row.year}</td>
                    <td className="py-2.5 px-3.5">{row.meanTemp != null ? `${row.meanTemp}°C` : '--'}</td>
                    <td className="py-2.5 px-3.5 font-semibold text-orange-400">{row.maxTemp != null ? `${row.maxTemp}°C` : '--'}</td>
                    <td className="py-2.5 px-3.5 font-semibold text-blue-400">{row.totalPrecip != null ? `${row.totalPrecip} mm` : '--'}</td>
                    <td className="py-2.5 px-3.5">{row.cdd} d</td>
                    <td className="py-2.5 px-3.5">{row.cwd} d</td>
                    <td className="py-2.5 px-3.5">
                      <span className={row.heatwaveDays > 0 ? 'text-rose-400 font-bold' : 'text-[var(--text-secondary)]'}>
                        {row.heatwaveDays} d
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span className={row.extremeRainDays > 0 ? 'text-cyan-400 font-bold' : 'text-[var(--text-secondary)]'}>
                        {row.extremeRainDays} d
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-emerald-400 font-semibold">{row.gdd}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-[var(--text-secondary)]">
                    No data records available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* METADATA FOOTER */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[var(--text-secondary)] gap-2">
          <span>Source: <strong>ERA5 Reanalysis via Open-Meteo Archive API</strong> (Resolution ~25 km).</span>
          <span>Last fetched: <strong>{new Date().toLocaleTimeString()}</strong> (Real-time Live Fetch)</span>
        </div>
      </div>

    </div>
  </div>
  );
}
