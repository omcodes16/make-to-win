import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { getTheme } from '../utils/themes';
import { getWeatherInfo } from '../utils/weatherConditions';
import { getSeasonalContext } from '../utils/climateSeasonal';
import { EXTRA_I18N } from '../utils/translationsExtra';
import { FEATURE_I18N } from '../utils/featureTranslations';
import { requestPushPermission, notifyIfSevere } from '../utils/pushNotifications';
import Header from './Header';
import CycloneTracker from './CycloneTracker';


export default function AlertsScreen() {
  const { state } = useApp();
  
  // Derive active location and weather data
  const stageData = state.weatherStageData || {};
  const locationName = stageData.locationName || '';
  const weather = stageData.weather || state.currentWeather;

  const lang = state.language;
  const ft = FEATURE_I18N[lang] || FEATURE_I18N.en;
  const ex = EXTRA_I18N[lang] || EXTRA_I18N.en;

  // Compute seasonal context
  const currentMonthIndex = new Date().getMonth();
  const seasonalCtx = getSeasonalContext(locationName, currentMonthIndex, lang);
  const weatherInfo = weather ? getWeatherInfo(weather) : null;
  const theme = weather ? getTheme(weather, weatherInfo) : getTheme({ temperature: 20 }, { key: 'severeStorm' });
  
  const [news, setNews] = useState([]);
  const [nationalAlerts, setNationalAlerts] = useState([
    { state: "Assam", level: "High" },
    { state: "West Bengal", level: "High" },
    { state: "Bihar", level: "Moderate" }
  ]);
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [newsFilter, setNewsFilter] = useState('All');
  const [pushEnabled, setPushEnabled] = useState(Notification?.permission === 'granted');

  const handleEnablePush = async () => {
    const result = await requestPushPermission();
    setPushEnabled(result === 'granted');
  };

  // Fetch real-time news and alerts from backend
  useEffect(() => {
    let isMounted = true;
    
    const fetchNewsAndAlerts = async () => {
      setIsLoadingNews(true);
      try {
        const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
        
        // Fetch Real News
        const newsRes = await fetch(`${baseUrl}/api/news`);
        if (newsRes.ok && isMounted) {
          const data = await newsRes.json();
          if (data.news && data.news.length > 0) {
            setNews(data.news);
          }
        }
        
        // Fetch National Alerts
        const alertsRes = await fetch(`${baseUrl}/api/national-alerts`);
        if (alertsRes.ok && isMounted) {
          const alertsData = await alertsRes.json();
          if (Array.isArray(alertsData)) {
            setNationalAlerts(alertsData);
          }
        }

        // Fetch Manager/Government Alerts for current active location
        if (stageData.lat && stageData.lng) {
          const govRes = await fetch(`${baseUrl}/api/alerts?state=${encodeURIComponent(stageData.state || locationName)}&district=${encodeURIComponent(stageData.district || '')}&lat=${stageData.lat}&lng=${stageData.lng}`);
          if (govRes.ok && isMounted) {
            const govData = await govRes.json();
            dispatch({ type: 'SET_GOVERNMENT_ALERTS', payload: Array.isArray(govData) ? govData : [] });
          }
        } else if (state.currentWeather?.lat && state.currentWeather?.lng) {
          const govRes = await fetch(`${baseUrl}/api/alerts?state=${encodeURIComponent(state.currentWeather.state || state.currentWeather.locationName)}&district=${encodeURIComponent(state.currentWeather.district || '')}&lat=${state.currentWeather.lat}&lng=${state.currentWeather.lng}`);
          if (govRes.ok && isMounted) {
            const govData = await govRes.json();
            dispatch({ type: 'SET_GOVERNMENT_ALERTS', payload: Array.isArray(govData) ? govData : [] });
          }
        }

      } catch (err) {
        console.error('Failed to fetch real-time news/alerts:', err);
      } finally {
        if (isMounted) setIsLoadingNews(false);
      }
    };

    fetchNewsAndAlerts();

    return () => { isMounted = false; };
  }, [stageData.lat, stageData.lng, state.currentWeather?.lat, state.currentWeather?.lng]);

  // Compute live alerts based on actual location data
  const computeAlerts = () => {
    if (!weather || !weather.daily) {
      return [{ id: 'no-data', type: 'info', title: 'No Location Selected', desc: 'Please search for a city in the Weather View to see local alerts.', level: 'Info', prob: '0%', rain: '0', window: 'N/A', impact: 'Low' }];
    }
    
    const locName = locationName;
    const alerts = [];

    // Base rainfall stats
    const precipArr = weather.daily.precipitationSum || weather.daily.precipProbMax || [0];
    const maxRain = Math.max(...precipArr.slice(0, 3));
    const maxRainIndex = precipArr.slice(0, 3).indexOf(maxRain);
    const dayWindows = ['Today', 'Tomorrow', 'In 2 Days'];
    const rainWindow = dayWindows[maxRainIndex] || 'Next 24 hrs';
    
    const isProb = !weather.daily.precipitationSum;
    const severeThreshold = isProb ? 80 : 40;
    const cautionThreshold = isProb ? 50 : 15;
    
    const probValue = weather.daily.precipProbMax?.[maxRainIndex] !== undefined ? weather.daily.precipProbMax[maxRainIndex] : (isProb ? maxRain : (maxRain > 10 ? 90 : Math.round((maxRain/40)*100)));
    const rainRange = isProb ? 'Unknown' : `${Math.floor(maxRain * 0.8)}-${Math.ceil(maxRain * 1.2)}`;
    const actualRainDisplay = isProb ? 'N/A' : maxRain.toFixed(1);

    // Weather Codes (WMO)
    const currentCode = weather.weatherCode;
    const dailyCodes = weather.daily.weatherCode || [];
    const hasThunderstorm = [95, 96, 99].includes(currentCode) || dailyCodes.slice(0, 3).some(c => [95, 96, 99].includes(c));
    const hasHeavyRainCode = [63, 65, 67, 81, 82].includes(currentCode) || dailyCodes.slice(0, 3).some(c => [63, 65, 67, 81, 82].includes(c));

    // 1. Thunderstorm Warning (Highest Priority)
    if (hasThunderstorm) {
      alerts.push({
        id: 'thunder',
        title: ex.alertThunderTitle ? ex.alertThunderTitle(locName) : `Thunderstorm Warning in ${locName}`,
        desc: ex.alertThunderDesc || `Thunderstorms are expected. Risk of lightning strikes and strong sudden gusts.`,
        precaution: ex.alertThunderPrec || `Stay indoors, avoid using electrical equipment, and stay away from windows.`,
        level: 'Severe', prob: `${Math.max(probValue, 80)}%`, rain: rainRange, window: rainWindow, impact: 'High'
      });
    }

    // 2. Heavy Rain / Flood Warning
    if (maxRain > severeThreshold || hasHeavyRainCode) {
      alerts.push({
        id: 'rain',
        title: ex.alertHeavyRainTitle ? ex.alertHeavyRainTitle(locName) : `Heavy Rain & Flood Risk in ${locName}`,
        desc: ex.alertHeavyRainDesc ? ex.alertHeavyRainDesc(isProb, maxRain) : (isProb ? `High probability (${maxRain}%) of severe rain.` : `Heavy precipitation or showers expected. Low-lying areas may face waterlogging.`),
        precaution: ex.alertHeavyRainPrec || `Avoid unnecessary travel. Move livestock to higher ground and secure outdoor equipment.`,
        level: 'Severe', prob: `${Math.max(probValue, 70)}%`, rain: rainRange, window: rainWindow, impact: 'High'
      });
    } else if (maxRain > cautionThreshold) {
      alerts.push({
        id: 'rain-mod',
        title: ex.alertModRainTitle ? ex.alertModRainTitle(locName) : `Moderate Rain in ${locName}`,
        desc: ex.alertModRainDesc ? ex.alertModRainDesc(isProb, maxRain) : (isProb ? `Moderate chance (${maxRain}%) of rain.` : `Steady rainfall expected (${maxRain}mm).`),
        precaution: ex.alertModRainPrec || `Roads may be slippery. If spraying crops, consider delaying until the rain clears.`,
        level: 'Caution', prob: `${probValue}%`, rain: rainRange, window: rainWindow, impact: 'Moderate'
      });
    }

    // 3. High Wind
    if (weather.windSpeed > 45) {
      alerts.push({
        id: 'wind',
        title: ex.alertWindTitle ? ex.alertWindTitle(locName) : `High Wind Warning for ${locName}`,
        desc: ex.alertWindDesc ? ex.alertWindDesc(weather.windSpeed) : `Dangerous wind gusts up to ${weather.windSpeed} km/h detected.`,
        precaution: ex.alertWindPrec || `Secure loose objects, close all windows, and avoid parking or walking under large trees.`,
        level: 'Severe', prob: '85%', rain: actualRainDisplay, window: 'Next 6 hrs', impact: 'High'
      });
    }

    // 4. Poor Visibility (Fog/Smog)
    if (weather.visibility < 2000) {
      alerts.push({
        id: 'vis',
        title: ex.alertVisTitle ? ex.alertVisTitle(locName) : `Poor Visibility in ${locName}`,
        desc: ex.alertVisDesc ? ex.alertVisDesc((weather.visibility/1000).toFixed(1)) : `Visibility is severely reduced to ${(weather.visibility/1000).toFixed(1)}km.`,
        precaution: ex.alertVisPrec || `If driving, maintain a safe distance and use your fog lights or low beams.`,
        level: 'Caution', prob: '95%', rain: actualRainDisplay, window: 'Next 3 hrs', impact: 'Moderate'
      });
    }

    // 5. UV / Heat
    if (weather.uvIndex > 8) {
      alerts.push({
        id: 'uv',
        title: ex.alertUvTitle ? ex.alertUvTitle(locName) : `Extreme UV Index in ${locName}`,
        desc: ex.alertUvDesc ? ex.alertUvDesc(weather.uvIndex) : `UV Index is dangerously high at level ${weather.uvIndex}.`,
        precaution: ex.alertUvPrec || `Avoid direct sun exposure between 10 AM and 4 PM. Wear protective clothing and stay hydrated.`,
        level: 'Caution', prob: '100%', rain: actualRainDisplay, window: '10 AM - 4 PM', impact: 'Moderate'
      });
    }

    // 6. Heatwave / Severe Heatwave (IMD standard)
    const maxForecastTemp = Math.max(...(weather.daily?.maxTemp || [weather.temperature || 0]));
    const hotDays = (weather.daily?.maxTemp || []).filter(t => t >= 40).length;
    if (maxForecastTemp >= 45) {
      alerts.push({
        id: 'severe-heatwave',
        title: ex.alertSevereHeatwaveTitle ? ex.alertSevereHeatwaveTitle(locName) : `Severe Heatwave Warning for ${locName}`,
        desc: ex.alertSevereHeatwaveDesc ? ex.alertSevereHeatwaveDesc(Math.round(maxForecastTemp)) : `Extreme temperature of ${Math.round(maxForecastTemp)}°C — Severe Heatwave.`,
        precaution: ex.alertSevereHeatwavePrec || `Do NOT go outdoors. Visit nearest cooling center.`,
        level: 'Severe', prob: '100%', rain: actualRainDisplay, window: '11 AM - 4 PM', impact: 'High'
      });
    } else if (maxForecastTemp >= 40 && hotDays >= 2) {
      alerts.push({
        id: 'heatwave',
        title: ex.alertHeatwaveTitle ? ex.alertHeatwaveTitle(locName) : `Heatwave Warning for ${locName}`,
        desc: ex.alertHeatwaveDesc ? ex.alertHeatwaveDesc(Math.round(maxForecastTemp)) : `Maximum temperature ${Math.round(maxForecastTemp)}°C — IMD Heatwave declared.`,
        precaution: ex.alertHeatwavePrec || `Stay indoors 11 AM–4 PM. Drink water every 30 minutes.`,
        level: 'Severe', prob: '100%', rain: actualRainDisplay, window: '11 AM - 4 PM', impact: 'High'
      });
    }

    // 7. Cold Wave (IMD standard: ≤10°C plains)
    const minForecastTemp = Math.min(...(weather.daily?.minTemp || [weather.temperature || 20]));
    if (minForecastTemp <= 10) {
      alerts.push({
        id: 'cold-wave',
        title: ex.alertColdWaveTitle ? ex.alertColdWaveTitle(locName) : `Cold Wave Alert for ${locName}`,
        desc: ex.alertColdWaveDesc ? ex.alertColdWaveDesc(Math.round(minForecastTemp)) : `Temperature dropped to ${Math.round(minForecastTemp)}°C — Cold Wave conditions.`,
        precaution: ex.alertColdWavePrec || `Wear multiple layers. Protect livestock. Avoid outdoor exposure at night.`,
        level: 'Severe', prob: '100%', rain: actualRainDisplay, window: 'Night - Morning', impact: 'High'
      });
    }

    // 8. Lightning Danger (when thunderstorm + check CAPE if available)
    if (hasThunderstorm && !alerts.find(a => a.id === 'thunder')) {
      alerts.push({
        id: 'lightning',
        title: ex.alertLightningTitle ? ex.alertLightningTitle(locName) : `Lightning Danger Alert for ${locName}`,
        desc: ex.alertLightningDesc || `Severe thunderstorm with high lightning risk. Lightning strikes 2,000+ people annually in India.`,
        precaution: ex.alertLightningPrec || `Seek shelter in a solid building. Avoid trees, open fields, and water bodies.`,
        level: 'Severe', prob: `${Math.max(probValue, 85)}%`, rain: rainRange, window: 'Next 6 hrs', impact: 'High'
      });
    }

    // 9. GRAP Air Quality Emergency
    const aqi = weather.aqi || 0;
    if (aqi > 300) {
      const grapStage = aqi > 450 ? 4 : aqi > 400 ? 3 : aqi > 350 ? 2 : 1;
      alerts.push({
        id: 'grap',
        title: ex.alertGrapTitle ? ex.alertGrapTitle(locName, grapStage) : `Air Quality Emergency — GRAP Stage ${grapStage} in ${locName}`,
        desc: ex.alertGrapDesc ? ex.alertGrapDesc(aqi, grapStage) : `AQI ${aqi} — GRAP Stage ${grapStage}. Air is hazardous to breathe.`,
        precaution: ex.alertGrapPrec || `Wear N95 masks. Keep windows closed. Avoid all outdoor physical activity.`,
        level: aqi > 400 ? 'Severe' : 'Caution', prob: '100%', rain: actualRainDisplay, window: 'All day', impact: aqi > 400 ? 'High' : 'Moderate'
      });
    }

    // 10. Drought Watch (rainfall < 30% of seasonal average over past week)
    const weekRain = (weather.daily?.precipitationSum || []).slice(0, 7).reduce((a, b) => a + (b || 0), 0);
    const currentMonth = new Date().getMonth();
    const isMonsooonSeason = currentMonth >= 5 && currentMonth <= 9;
    if (isMonsooonSeason && weekRain < 5 && maxRain < 5) {
      const deficit = Math.round((1 - weekRain / 35) * 100);
      alerts.push({
        id: 'drought',
        title: ex.alertDroughtTitle ? ex.alertDroughtTitle(locName) : `Drought Watch for ${locName}`,
        desc: ex.alertDroughtDesc ? ex.alertDroughtDesc(Math.min(deficit, 99)) : `Rainfall is ${Math.min(deficit, 99)}% below monsoon normal. Crops face drought stress.`,
        precaution: ex.alertDroughtPrec || `Initiate emergency irrigation. Conserve water. Consider drought-resistant varieties.`,
        level: 'Caution', prob: '90%', rain: `${weekRain.toFixed(1)} mm (7-day)`, window: 'Ongoing', impact: 'Moderate'
      });
    }

    // Fallback: All Clear
    if (alerts.length === 0) {
      alerts.push({
        id: 'all-clear',
        title: ex.allClearTitle ? ex.allClearTitle(locName) : `All Clear for ${locName}`,
        desc: ex.allClearDesc || `No severe weather alerts are currently active for this region.`,
        precaution: ex.allClearPrec || `Conditions are safe for normal agricultural and travel activities.`,
        level: 'Good', prob: `${probValue}%`, rain: actualRainDisplay, window: 'N/A', impact: 'Low'
      });
    }

    return alerts;
  };

  const getDynamicImpacts = () => {
    if (!weather) return { flood: 'Low', road: 'Low', crop: 'Low', power: 'Low' };
    const precipArr = weather.daily?.precipitationSum || [0];
    const maxRain = Math.max(...precipArr.slice(0, 3));
    const wind = weather.windSpeed || 0;
    
    return {
      flood: maxRain > 50 ? 'Severe' : maxRain > 20 ? 'High' : maxRain > 5 ? 'Moderate' : 'Low',
      road: maxRain > 40 || weather.visibility < 1000 ? 'High' : maxRain > 15 ? 'Moderate' : 'Low',
      crop: maxRain > 60 || wind > 50 ? 'Severe' : maxRain > 30 ? 'High' : 'Low',
      power: wind > 60 ? 'Severe' : wind > 40 ? 'High' : wind > 20 ? 'Moderate' : 'Low'
    };
  };

  const liveAlerts = computeAlerts();
  // Fire browser push notification for severe alerts (once per session per alert)
  if (pushEnabled && locationName) notifyIfSevere(liveAlerts, locationName);
  const impactStats = getDynamicImpacts();

  const filteredNews = news.filter(item => {
    if (newsFilter === 'all') return true;
    const title = item.title.toLowerCase();
    if (newsFilter === 'alerts') return title.includes('alert') || title.includes('warn') || title.includes('severe');
    if (newsFilter === 'news') return !title.includes('alert') && !title.includes('warn');
    if (newsFilter === 'updates') return title.includes('update') || title.includes('live') || title.includes('today');
    if (newsFilter === 'research') return title.includes('study') || title.includes('climate') || title.includes('report') || title.includes('data');
    return true;
  });

  return (
    <div className="min-h-[100dvh] text-white overflow-y-auto pb-24 md:pb-20 relative font-body transition-colors duration-1000">

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 pt-20 sm:pt-28 md:pt-32 flex flex-col lg:flex-row gap-6 pb-32">
        
        {/* Left Column: Alerts & Risk */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <h2 className="text-2xl font-bold tracking-wide">{ex.liveHighAlerts}</h2>
            </div>
            
            {/* Push Notifications Toggle */}
            <button 
              onClick={handleEnablePush}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${pushEnabled ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'glass-panel border-border-color text-white/70 hover:text-white'}`}
              title="Get notifications for severe alerts"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              {pushEnabled ? 'Alerts On' : 'Enable Alerts'}
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {/* Live Cyclone Tracker (Only shows active cyclones if detected) */}
            <CycloneTracker lat={stageData.lat || state.currentWeather?.lat} lon={stageData.lng || state.currentWeather?.lng} locationName={stageData.locationName || state.currentWeather?.locationName || "Unknown Location"} />

            {state.governmentAlerts && state.governmentAlerts.length > 0 && state.governmentAlerts.map((govAlert, idx) => (
              <div key={`gov-${idx}`} className="relative bg-red-900/20 border border-red-500 rounded-xl p-5 shadow-[0_0_40px_rgba(239,68,68,0.2)] overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-red-500 to-transparent"></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4 items-center">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center border bg-red-500/20 border-red-500/50 text-red-500">
                      <svg width="28" height="28" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-1.998A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" /></svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Authority Alert</span>
                        <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                          Live
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1">{govAlert.title || "Severe Weather Warning"}</h3>
                      <p className="text-white/80 text-sm leading-relaxed">{govAlert.description || "Official government advisory is currently active for this region."}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-red-500/20 text-xs text-red-300">
                  Source: WeatherGPT Disaster Manager &bull; Valid for {locationName}
                </div>
              </div>
            ))}
            
            {liveAlerts.map((alert) => {
              const styles = alert.level === 'Severe' ? {
                cardBorder: 'border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.15)]', gradient: 'from-red-600 via-red-400', iconBg: 'bg-red-500/10 border-red-500/30 text-red-500', badge: 'bg-red-500/20 text-red-400 border-red-500/30', impactText: 'text-red-500', precautionBox: 'bg-red-500/5 border-red-500/20', precautionIcon: 'text-red-500', precautionTitle: 'text-red-500', precautionText: 'text-red-200/80', btn: 'border-red-500/30 hover:bg-red-500/10 text-red-300'
              } : alert.level === 'Caution' ? {
                cardBorder: 'border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.15)]', gradient: 'from-amber-600 via-amber-400', iconBg: 'bg-amber-500/10 border-amber-500/30 text-amber-500', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30', impactText: 'text-amber-500', precautionBox: 'bg-amber-500/5 border-amber-500/20', precautionIcon: 'text-amber-500', precautionTitle: 'text-amber-500', precautionText: 'text-amber-200/80', btn: 'border-amber-500/30 hover:bg-amber-500/10 text-amber-300'
              } : alert.level === 'Good' ? {
                cardBorder: 'border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)]', gradient: 'from-emerald-600 via-emerald-400', iconBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500', badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', impactText: 'text-emerald-500', precautionBox: 'bg-emerald-500/5 border-emerald-500/20', precautionIcon: 'text-emerald-500', precautionTitle: 'text-emerald-500', precautionText: 'text-emerald-200/80', btn: 'hidden'
              } : {
                cardBorder: 'border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.15)]', gradient: 'from-blue-600 via-blue-400', iconBg: 'bg-blue-500/10 border-blue-500/30 text-blue-500', badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30', impactText: 'text-blue-500', precautionBox: 'bg-blue-500/5 border-blue-500/20', precautionIcon: 'text-blue-500', precautionTitle: 'text-blue-500', precautionText: 'text-blue-200/80', btn: 'border-blue-500/30 hover:bg-blue-500/10 text-blue-300'
              };

              return (
              <div key={alert.id} className={`relative glass-panel border rounded-xl p-4 sm:p-5 overflow-hidden ${styles.cardBorder}`}>
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${styles.gradient} to-transparent`}></div>

                <div className="flex justify-between items-start mb-4 sm:mb-6">
                  <div className="flex gap-3 sm:gap-4 items-center">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border shrink-0 ${styles.iconBg}`}>
                      {alert.level === 'Good' ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-0.5 sm:mb-1 leading-tight">{alert.title}</h3>
                      <p className="text-white/60 text-xs sm:text-sm">{alert.desc}</p>
                    </div>
                  </div>
                  <span className={`px-2 sm:px-3 py-1 rounded border text-[9px] sm:text-[10px] font-bold uppercase tracking-widest shrink-0 ${styles.badge}`}>
                    {alert.level}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-5 border-t border-white/10 pt-4 sm:pt-5">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-white/50 text-[10px] sm:text-xs uppercase tracking-wide">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                      {ex.probLbl}
                    </div>
                    <div className="text-base sm:text-lg font-bold">{alert.prob}</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-white/50 text-xs uppercase tracking-wide">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                        {ex.expectedLbl}
                    </div>
                    <div className="text-lg font-bold">{alert.rain} <span className="text-xs font-normal text-white/50">{alert.rain !== 'Unknown' ? 'mm' : ''}</span></div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-white/50 text-xs uppercase tracking-wide">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {ex.riskWindowLbl}
                    </div>
                    <div className="text-lg font-bold">{alert.window}</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-white/50 text-xs uppercase tracking-wide">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                        {ex.impactLevelLbl}
                    </div>
                    <div className={`text-lg font-bold ${styles.impactText}`}>{alert.impact === 'Severe' ? ex.impactSevere : alert.impact === 'High' ? ex.impactHigh : alert.impact === 'Moderate' ? ex.impactMod : ex.impactLow}</div>
                  </div>
                </div>
                
                <div className={`rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border ${styles.precautionBox}`}>
                  <div className="flex items-start gap-3">
                    {alert.level === 'Good' ? (
                      <svg className={`w-5 h-5 shrink-0 mt-0.5 ${styles.precautionIcon}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    ) : (
                      <svg className={`w-5 h-5 shrink-0 mt-0.5 ${styles.precautionIcon}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    )}
                    <div>
                      <div className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${styles.precautionTitle}`}>{ex.precautionLbl}</div>
                      <div className={`text-sm ${styles.precautionText}`}>{alert.precaution}</div>
                    </div>
                  </div>
                  {styles.btn !== 'hidden' && (
                    <button 
                      onClick={() => setActiveModal('warnings')}
                      className={`text-xs border px-3 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1 shrink-0 ${styles.btn}`}
                    >
                      {ex.viewDetails} <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </button>
                  )}
                </div>
              </div>
            )})}
          </div>

          {/* Smart City & Urban Planning Dashboard */}
          <div className="glass-panel border border-white/10 rounded-xl p-5 shadow-lg flex flex-col mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white/90 tracking-wide flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                {ex.smartCityTitle}
              </h3>
              <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded">Live Data</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* AQI Monitor */}
              <div className="bg-black/20 rounded-lg p-4 border border-white/10 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-white/50 uppercase">{ex.aqiLbl}</span>
                  <svg className={`w-4 h-4 ${weather?.aqi > 150 ? 'text-red-400' : weather?.aqi > 100 ? 'text-orange-400' : 'text-green-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>
                </div>
                <div className="text-2xl font-bold mb-1">{weather?.aqi || '--'}</div>
                <div className={`text-xs ${weather?.aqi > 150 ? 'text-red-400' : weather?.aqi > 100 ? 'text-orange-400' : 'text-green-400'}`}>
                  {weather?.aqi > 150 ? 'Unhealthy' : weather?.aqi > 100 ? 'Moderate' : 'Good'} for sensitive groups
                </div>
              </div>

              {/* Heatwave / Urban Heat Island */}
              <div className="bg-black/20 rounded-lg p-4 border border-white/10 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-white/50 uppercase">{ex.heatIndexLbl}</span>
                  <svg className={`w-4 h-4 ${weather?.feelsLike > 40 ? 'text-red-400' : weather?.feelsLike > 35 ? 'text-orange-400' : 'text-yellow-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="4.22" x2="19.78" y2="5.64"/></svg>
                </div>
                <div className="text-2xl font-bold mb-1">{weather?.feelsLike || '--'}°C</div>
                <div className={`text-xs ${weather?.feelsLike > 40 ? 'text-red-400' : weather?.feelsLike > 35 ? 'text-orange-400' : 'text-white/60'}`}>
                  {weather?.feelsLike > 40 ? 'Extreme Danger' : weather?.feelsLike > 35 ? 'High Risk' : 'Normal Conditions'}
                </div>
              </div>

              {/* Infrastructure Flood Risk */}
              <div className="bg-black/20 rounded-lg p-4 border border-white/10 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-white/50 uppercase">{ex.waterRiskLbl}</span>
                  <svg className={`w-4 h-4 ${impactStats.flood === 'Severe' ? 'text-red-400' : impactStats.flood === 'High' ? 'text-orange-400' : 'text-blue-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                </div>
                <div className="text-2xl font-bold mb-1">{weather?.rain || weather?.precipitation || '0'} <span className="text-sm font-normal text-white/50">mm</span></div>
                <div className={`text-xs ${impactStats.flood === 'Severe' ? 'text-red-400' : impactStats.flood === 'High' ? 'text-orange-400' : 'text-blue-400'}`}>
                  {impactStats.flood === 'Severe' ? 'High risk for underpasses' : impactStats.flood === 'High' ? 'Moderate drainage stress' : 'Normal drainage capacity'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          

            <div className="glass-panel border border-white/10 rounded-xl p-5 shadow-lg flex flex-col">
              <h3 className="text-sm font-bold text-white/90 tracking-wide mb-5">{ex.alertImpactAreas}</h3>
              <div className="flex flex-col gap-3 flex-1">
                <div className="flex items-center justify-between p-2.5 rounded glass-panel border border-white/10">
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    <span className="text-xs font-medium text-white/80">{ex.flooding}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase ${impactStats.flood === 'Severe' ? 'text-red-500' : impactStats.flood === 'High' ? 'text-red-400' : impactStats.flood === 'Moderate' ? 'text-yellow-400 border border-yellow-500/30 px-1.5 rounded' : 'text-green-400'}`}>{impactStats.flood === 'Severe' ? ex.impactSevere : impactStats.flood === 'High' ? ex.impactHigh : impactStats.flood === 'Moderate' ? ex.impactMod : ex.impactLow}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded glass-panel border border-white/10">
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                    <span className="text-xs font-medium text-white/80">{ex.roadDisruption}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase ${impactStats.road === 'Severe' ? 'text-red-500' : impactStats.road === 'High' ? 'text-red-400' : impactStats.road === 'Moderate' ? 'text-yellow-400 border border-yellow-500/30 px-1.5 rounded' : 'text-green-400'}`}>{impactStats.road === 'Severe' ? ex.impactSevere : impactStats.road === 'High' ? ex.impactHigh : impactStats.road === 'Moderate' ? ex.impactMod : ex.impactLow}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded glass-panel border border-white/10">
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <span className="text-xs font-medium text-white/80">{ex.cropDamage}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase ${impactStats.crop === 'Severe' ? 'text-red-500' : impactStats.crop === 'High' ? 'text-red-400' : impactStats.crop === 'Moderate' ? 'text-yellow-400 border border-yellow-500/30 px-1.5 rounded' : 'text-green-400'}`}>{impactStats.crop === 'Severe' ? ex.impactSevere : impactStats.crop === 'High' ? ex.impactHigh : impactStats.crop === 'Moderate' ? ex.impactMod : ex.impactLow}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded glass-panel border border-white/10">
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    <span className="text-xs font-medium text-white/80">{ex.powerOutage}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase ${impactStats.power === 'Severe' ? 'text-red-500' : impactStats.power === 'High' ? 'text-red-400' : impactStats.power === 'Moderate' ? 'text-yellow-400 border border-yellow-500/30 px-1.5 rounded' : 'text-green-400'}`}>{impactStats.power === 'Severe' ? ex.impactSevere : impactStats.power === 'High' ? ex.impactHigh : impactStats.power === 'Moderate' ? ex.impactMod : ex.impactLow}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-0 glass-panel border border-white/10 rounded-xl md:divide-x divide-white/5">
            <button onClick={() => setActiveModal('radar')} className="flex flex-col items-center justify-center gap-2 p-4 hover:bg-white/10 transition-colors rounded-l-xl">
              <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
              <div className="text-center">
                <div className="text-xs font-bold text-white/90">{ex.liveRadar}</div>
                <div className="text-[9px] text-white/40 mt-0.5 hidden sm:block">{ex.realTimeRain}</div>
              </div>
            </button>
            <button onClick={() => setActiveModal('satellite')} className="flex flex-col items-center justify-center gap-2 p-4 hover:bg-white/10 transition-colors">
              <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9m-9 9a9 9 0 0 1 9-9"/></svg>
              <div className="text-center">
                <div className="text-xs font-bold text-white/90">{ex.satelliteView}</div>
                <div className="text-[9px] text-white/40 mt-0.5 hidden sm:block">{ex.cloudCover}</div>
              </div>
            </button>
            <button onClick={() => setActiveModal('river')} className="flex flex-col items-center justify-center gap-2 p-4 hover:bg-white/10 transition-colors">
              <svg className="w-6 h-6 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              <div className="text-center">
                <div className="text-xs font-bold text-white/90">{ex.riverLevels}</div>
                <div className="text-[9px] text-white/40 mt-0.5 hidden sm:block">{ex.floodMonitoring}</div>
              </div>
            </button>
            <button onClick={() => setActiveModal('warnings')} className="flex flex-col items-center justify-center gap-2 p-4 hover:bg-white/10 transition-colors">
              <svg className="w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-14a2 2 0 0 1-2-2v-1h18v1z"/><path d="M12 2v2"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <div className="text-center">
                <div className="text-xs font-bold text-white/90">{ex.earlyWarnings}</div>
                <div className="text-[9px] text-white/40 mt-0.5 hidden sm:block">{ex.districtAlerts}</div>
              </div>
            </button>
            <button onClick={() => setActiveModal('safety')} className="col-span-2 md:col-span-1 flex flex-col items-center justify-center gap-2 p-4 hover:bg-white/10 transition-colors rounded-r-xl">
              <svg className="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
              <div className="text-center">
                <div className="text-xs font-bold text-white/90">{ex.safetyGuide}</div>
                <div className="text-[9px] text-white/40 mt-0.5 hidden sm:block">Do's & Don'ts</div>
              </div>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-4">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[10px] text-white/40 font-medium">
              <span>Data Sources</span>
              <span className="flex items-center gap-1"><span className="w-1 h-1 bg-green-500 rounded-full"></span> IMD</span>
              <span className="flex items-center gap-1"><span className="w-1 h-1 bg-white/20 rounded-full"></span> GFS</span>
              <span className="flex items-center gap-1"><span className="w-1 h-1 bg-blue-500 rounded-full"></span> SAT</span>
              <span className="flex items-center gap-1"><span className="w-1 h-1 bg-white/20 rounded-full"></span> Radar</span>
              <span className="flex items-center gap-1"><span className="w-1 h-1 bg-white/20 rounded-full"></span> WIS 2.0</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-white/30 shrink-0">
              Last Updated <svg className="w-3 h-3 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg> 2 min ago
            </div>
          </div>
        </div>

        {/* Right Column: News */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          
          {/* Feature 7: Seasonal Context Card */}
          {seasonalCtx.found && (
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-wide mb-4">{ft.seasonTitle}</h2>
              <div className="bg-indigo-950/40  border border-indigo-400/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">📅</div>
                <div className="text-xs font-bold uppercase text-indigo-300 tracking-wider mb-3">{ft.seasonNormalFor(seasonalCtx.month, seasonalCtx.city)}</div>
                <p className="text-sm text-white/90 leading-relaxed relative z-10">{seasonalCtx.summary}</p>
                <div className="grid grid-cols-2 gap-3 mt-4 border-t border-indigo-400/20 pt-4">
                  <div>
                    <div className="text-[10px] text-white/50 uppercase tracking-widest mb-1">{ft.seasonAvgRain}</div>
                    <div className="text-lg font-bold">{seasonalCtx.avgRainfall} mm</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/50 uppercase tracking-widest mb-1">{ft.seasonAvgTemp}</div>
                    <div className="text-lg font-bold">{seasonalCtx.avgMinTemp}° – {seasonalCtx.avgMaxTemp}°</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-wide text-white">{ex.realTimeNews}</h2>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px] font-bold tracking-widest uppercase border border-red-500/20"><span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span> Live</span>
          </div>

          <div className="glass-panel border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col h-full">
            
            <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar pb-1">
              {['all', 'alerts', 'news', 'updates', 'research'].map(filter => (
                <button 
                  key={filter}
                  onClick={() => setNewsFilter(filter)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shrink-0 border transition-colors ${
                    newsFilter === filter 
                      ? 'bg-white/10 text-white border-white/10' 
                      : 'text-white/50 hover:bg-white/10 border-transparent'
                  }`}
                >
                  {filter === 'all' && <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>}
                  {ex.filters ? ex.filters[filter] || filter : filter}
                </button>
              ))}
            </div>

            <div className="flex flex-col flex-1 divide-y divide-white/5">
              {isLoadingNews ? (
                <div className="text-white/50 text-sm animate-pulse text-center py-10">{ex.fetchingNews}</div>
              ) : filteredNews.length > 0 ? (
                filteredNews.map(item => (
                  <a key={item.id} href={item.link} target="_blank" rel="noreferrer" className="flex gap-4 py-4 group transition-colors">
                    {item.image && (
                      <img src={item.image} alt="" className="w-20 h-16 sm:w-24 sm:h-20 rounded-lg object-cover bg-white/10 shrink-0 border border-white/10 group-hover:border-white/10 transition-colors" />
                    )}
                    <div className="flex flex-col justify-between flex-1 min-w-0">
                      <h4 className="font-medium text-[13px] sm:text-[14px] text-white/90 leading-snug line-clamp-3 group-hover:text-blue-400 transition-colors">{item.title}</h4>
                      <div className="flex items-center justify-between text-[10px] text-white/40 mt-2">
                        <span className="truncate pr-2">{item.source}</span>
                        <span className="shrink-0">{new Date(item.time).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </a>
                ))
              ) : (
                <div className="text-white/40 text-xs py-10 text-center">{ex.noNews}</div>
              )}
            </div>
            
            <a href="https://news.google.com/search?q=weather+india" target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 mt-2 py-2.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs font-bold tracking-wide transition-colors">
              View All on Google News <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
        </div>

      </div>


      {/* Quick Links Modal Overlay */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 " onClick={() => setActiveModal(null)}>
          <div className="glass-panel border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {activeModal === 'radar' && <><span className="text-purple-400">●</span> {ex.liveRadar}</>}
                {activeModal === 'satellite' && <><span className="text-blue-400">●</span> {ex.satelliteView}</>}
                {activeModal === 'river' && <><span className="text-cyan-400">●</span> {ex.riverLevels}</>}
                {activeModal === 'warnings' && <><span className="text-amber-400">●</span> {ex.earlyWarnings}</>}
                {activeModal === 'safety' && <><span className="text-green-400">●</span> {ex.safetyGuide}</>}
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-white/50 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-0 bg-black/20">
              {(activeModal === 'radar' || activeModal === 'satellite') && (
                <iframe 
                  width="100%" 
                  height="500" 
                  src={`https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=%C2%B0C&metricWind=km%2Fh&zoom=${(stageData.lat || state.currentWeather?.lat) ? 13 : 5}&overlay=${activeModal === 'radar' ? 'rain' : 'clouds'}&product=ecmwf&level=surface&lat=${stageData.lat || state.currentWeather?.lat || 20.5937}&lon=${stageData.lng || state.currentWeather?.lng || 78.9629}`}
                  frameBorder="0"
                  title="Weather Map"
                ></iframe>
              )}
              
              {activeModal === 'river' && (
                <div className="p-6 text-center">
                  <svg className="w-16 h-16 text-cyan-500 mx-auto mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  <h4 className="text-xl font-bold text-white mb-2">Central Water Commission (CWC) Integration</h4>
                  <p className="text-white/60 mb-6 max-w-lg mx-auto">Real-time river basin monitoring and flood forecasting data will be displayed here when connected to the official CWC telemetry API.</p>
                  <div className="inline-block bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4 max-w-sm text-left">
                    <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">Simulated Data - Brahmaputra Basin</div>
                    <div className="flex justify-between items-center text-sm mb-1"><span className="text-white/70">Current Level:</span> <span className="font-bold text-red-400">86.5m (Above Danger)</span></div>
                    <div className="flex justify-between items-center text-sm"><span className="text-white/70">Trend:</span> <span className="font-bold text-yellow-400">Rising</span></div>
                  </div>
                </div>
              )}

              {activeModal === 'warnings' && (
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span></span>
                    <span className="font-medium text-amber-200">Active Bulletins from IMD for {locationName || 'your region'}</span>
                  </div>
                  <div className="space-y-4">
                    {liveAlerts.filter(a => a.id !== 'all-clear').length > 0 ? (
                      liveAlerts.filter(a => a.id !== 'all-clear').map(alert => (
                        <div key={alert.id} className="glass-panel border border-white/10 p-4 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-bold text-white/90">{alert.title}</h5>
                            <span className="text-[10px] text-white/40">Issued: Just now</span>
                          </div>
                          <p className="text-sm text-white/60">{alert.desc}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 text-white/40">No active warnings for this location.</div>
                    )}
                  </div>
                </div>
              )}

              {activeModal === 'safety' && (
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-xl">
                    <h4 className="font-bold text-blue-400 mb-4 flex items-center gap-2"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> Flood Safety</h4>
                    <ul className="space-y-2 text-sm text-white/70 list-disc list-inside">
                      <li>Move to higher ground immediately.</li>
                      <li>Do not walk or drive through flood waters.</li>
                      <li>Turn off utilities at the main switches.</li>
                      <li>Disconnect electrical appliances.</li>
                    </ul>
                  </div>
                  <div className="bg-orange-500/10 border border-orange-500/20 p-5 rounded-xl">
                    <h4 className="font-bold text-orange-400 mb-4 flex items-center gap-2"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg> Cyclone Safety</h4>
                    <ul className="space-y-2 text-sm text-white/70 list-disc list-inside">
                      <li>Stay indoors and away from windows.</li>
                      <li>Keep an emergency kit ready (radio, torch).</li>
                      <li>Store drinking water in clean containers.</li>
                      <li>Do not venture out until official clear signal.</li>
                    </ul>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 p-5 rounded-xl">
                    <h4 className="font-bold text-yellow-400 mb-4 flex items-center gap-2"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Lightning Safety</h4>
                    <ul className="space-y-2 text-sm text-white/70 list-disc list-inside">
                      <li>Seek shelter in a substantial building.</li>
                      <li>Avoid isolated trees and tall objects.</li>
                      <li>Stay away from water and metal objects.</li>
                      <li>If outdoors, crouch down with feet together.</li>
                    </ul>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-xl">
                    <h4 className="font-bold text-red-400 mb-4 flex items-center gap-2"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg> Heatwave Safety</h4>
                    <ul className="space-y-2 text-sm text-white/70 list-disc list-inside">
                      <li>Drink plenty of water even if not thirsty.</li>
                      <li>Wear lightweight, light-colored clothing.</li>
                      <li>Avoid strenuous activities during peak hours.</li>
                      <li>Never leave children or pets in parked vehicles.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
