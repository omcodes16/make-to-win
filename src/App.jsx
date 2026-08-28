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

  if (state.activeTab === 'manager') {
    return <div key="manager" className="animate-fade-in"><ManagerDashboard /></div>;
  }

  if (!state.isOnboarded) {
    return <div key="onboarding" className="animate-fade-in"><Onboarding /></div>;
  }

  return (
    <div className="relative min-h-[100dvh] bg-surface-0 transition-colors duration-1000 overflow-hidden">
      {/* Global Fixed Background Image */}
      <div className="fixed inset-0 z-0 bg-cover bg-center transition-opacity duration-1000" style={{ backgroundImage: `url("${theme.bgImage}")` }}></div>
      {/* Global Overlays */}
      <div className={`fixed inset-0 z-0 bg-gradient-to-b ${theme.overlay} backdrop-blur-md pointer-events-none transition-colors duration-1000`}></div>
      <div className={`fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] ${theme.accent} via-transparent to-transparent pointer-events-none transition-colors duration-1000`}></div>

      <Header />
      
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
