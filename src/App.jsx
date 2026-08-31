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

function AppContent() {
  const { state, dispatch } = useApp();
  
  useEffect(() => {
    if (window.location.pathname === '/manager') {
      dispatch({ type: 'SET_ACTIVE_TAB', payload: 'manager' });
    }
  }, [dispatch]);

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

  if (state.activeTab === 'manager') {
    return (
      <div key="manager" className={`theme-${state.uiTheme} animate-fade-in min-h-[100dvh] relative`} style={{ color: 'var(--text-primary)' }}>
        <div className="fixed inset-0 z-0 bg-cover bg-center transition-all duration-1000" style={{ backgroundImage: `url("${customBg}")` }}></div>
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
      <div className="fixed inset-0 z-0 bg-cover bg-center transition-all duration-1000" style={{ backgroundImage: `url("${customBg}")` }}></div>
      {/* Text Contrast Layer — controlled by CSS theme variable */}
      <div className="fixed inset-0 z-0 pointer-events-none transition-colors duration-1000" style={{ backgroundColor: 'var(--overlay-dark)' }}></div>
      {/* Global Overlays */}
      <div className={`fixed inset-0 z-0 bg-gradient-to-b ${theme.overlay} pointer-events-none transition-colors duration-1000`}></div>
      <div className={`fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] ${theme.accent} via-transparent to-transparent pointer-events-none transition-colors duration-1000 opacity-70`}></div>

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
