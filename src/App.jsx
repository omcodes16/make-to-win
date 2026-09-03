import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Onboarding from './components/Onboarding';
import ChatScreen from './components/ChatScreen';
import WeatherDashboard from './components/WeatherDashboard';
import AlertsScreen from './components/AlertsScreen';
import ReviewsScreen from './components/ReviewsScreen';
import ManagerDashboard from './components/ManagerDashboard';
import SosButton from './components/SosButton';

import { getTheme } from './utils/themes';
import { getWeatherInfo } from './utils/weatherConditions';
import Header from './components/Header';
import OfflineBanner from './components/OfflineBanner';
import { useAlertSocket } from './hooks/useAlertSocket';

function AppContent() {
  const { state, dispatch } = useApp();
  
  // Connect to Real-time WebSocket for Live Disaster Alerts and SOS updates
  useAlertSocket();
  
  // Global Theme Logic
  const weather = state.weatherStageData?.weather;
  const weatherInfo = weather ? getWeatherInfo(weather.weatherCode, state.language) : null;
  const theme = getTheme(weather, weatherInfo);

  // Profile-based Custom Background (Overriding weather bg with high-quality profile image)
  const isPortrait = typeof window !== 'undefined' && window.innerHeight > window.innerWidth;

  let customBg = theme.bgImage; 
  if (state.userProfile === 'general') {
    customBg = isPortrait ? '/backgrounds/general2.jpg' : '/backgrounds/general.jpg';
  }
  else if (state.userProfile === 'farmer') {
    customBg = isPortrait ? '/backgrounds/farmer2.jpg' : '/backgrounds/farmer.jpg';
  }
  else if (state.userProfile === 'fisherman') {
    customBg = isPortrait ? '/backgrounds/fisherman2.jpg' : '/backgrounds/fisherman.jpg';
  }
  else if (state.userProfile === 'aviation') {
    customBg = isPortrait ? '/backgrounds/aviation2.jpg' : '/backgrounds/aviation.jpg';
  }
  else if (state.userProfile === 'urbanPlanning') customBg = '/backgrounds/urban.jpg';

  // Sync URL and browser history stack whenever activeTab changes
  useEffect(() => {
    if (!state.isSettingsLoaded) return;
    const targetPath = state.activeTab === 'chat' ? '/' : `/${state.activeTab}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab: state.activeTab }, '', targetPath);
    }
  }, [state.activeTab, state.isSettingsLoaded]);

  // Prevent flash of onboarding before backend settings are loaded
  if (!state.isSettingsLoaded) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#070b14] text-white gap-3 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl p-0.5 bg-gradient-to-tr from-indigo-600 to-sky-400 animate-pulse flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)]">
          <img src="/logo.png" alt="WeatherGPT" className="w-full h-full object-cover rounded-[14px]" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-white/70">
          <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading WeatherGPT...</span>
        </div>
      </div>
    );
  }

  if (state.activeTab === 'manager') {
    return (
      <div key="manager" className={`theme-${state.uiTheme} animate-fade-in min-h-[100dvh] relative`} style={{ color: 'var(--text-primary)' }}>
        <div className="fixed inset-0 z-0 bg-cover bg-center transition-all duration-1000 blur-md scale-110" style={{ backgroundImage: `url("${customBg}")` }}></div>
        <div className="fixed inset-0 z-0 pointer-events-none transition-colors duration-1000" style={{ backgroundColor: 'var(--overlay-dark)' }}></div>
        <div className="relative z-10">
          <ManagerDashboard />
        </div>
      </div>
    );
  }

  if (!state.isOnboarded) {
    return <div key="onboarding" className={`theme-${state.uiTheme} animate-fade-in`} style={{ color: 'var(--text-primary)' }}><Onboarding /></div>;
  }

  return (
    <div className="relative min-h-[100dvh] bg-transparent transition-colors duration-1000 overflow-hidden" style={{ color: 'var(--text-primary)' }}>
      {/* Global Fixed Background Image */}
      <div className="fixed inset-0 z-0 bg-cover bg-center transition-all duration-1000 blur-md scale-110" style={{ backgroundImage: `url("${customBg}")` }}></div>
      {/* Text Contrast Layer — controlled by CSS theme variable */}
      <div className="fixed inset-0 z-0 pointer-events-none transition-colors duration-1000" style={{ backgroundColor: 'var(--overlay-dark)' }}></div>
      {/* Global Overlays */}
      <div className={`fixed inset-0 z-0 bg-gradient-to-b ${theme.overlay} pointer-events-none transition-colors duration-1000 theme-weather-overlay`}></div>
      <div className={`fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] ${theme.accent} via-transparent to-transparent pointer-events-none transition-colors duration-1000 opacity-70 theme-radial-overlay`}></div>

      <Header />
      <OfflineBanner />
      
      <div key={state.activeTab} className="animate-fade-in relative z-10 h-full">
        {state.activeTab === 'alerts' ? <AlertsScreen /> : 
         state.activeTab === 'stage' ? <WeatherDashboard /> : 
         state.activeTab === 'reviews' ? <ReviewsScreen /> : 
         <ChatScreen />}
      </div>

      {/* Global SOS Button — visible on all screens */}
      <SosButton />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
