import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Onboarding from './components/Onboarding';
import ChatScreen from './components/ChatScreen';
import WeatherDashboard from './components/WeatherDashboard';
import AlertsScreen from './components/AlertsScreen';
import ReviewsScreen from './components/ReviewsScreen';
import ManagerDashboard from './components/ManagerDashboard';

function AppContent() {
  const { state, dispatch } = useApp();
  
  // Very simple client-side routing check on mount
  useEffect(() => {
    if (window.location.pathname === '/manager') {
      dispatch({ type: 'SET_ACTIVE_TAB', payload: 'manager' });
    }
  }, [dispatch]);

  // Manager doesn't need onboarding check
  if (state.activeTab === 'manager') {
    return <div key="manager" className="animate-fade-in"><ManagerDashboard /></div>;
  }

  if (!state.isOnboarded) {
    return <div key="onboarding" className="animate-fade-in"><Onboarding /></div>;
  }

  return (
    <div key={state.activeTab} className="animate-fade-in">
      {state.activeTab === 'alerts' ? <AlertsScreen /> : 
       state.activeTab === 'stage' ? <WeatherDashboard /> : 
       state.activeTab === 'reviews' ? <ReviewsScreen /> : 
       <ChatScreen />}
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
