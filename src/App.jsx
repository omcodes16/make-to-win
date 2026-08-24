import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Onboarding from './components/Onboarding';
import ChatScreen from './components/ChatScreen';
import WeatherDashboard from './components/WeatherDashboard';
import AlertsScreen from './components/AlertsScreen';

function AppContent() {
  const { state } = useApp();
  
  if (!state.isOnboarded) {
    return <div key="onboarding" className="animate-fade-in"><Onboarding /></div>;
  }

  return (
    <div key={state.activeTab} className="animate-fade-in">
      {state.activeTab === 'alerts' ? <AlertsScreen /> : 
       state.activeTab === 'stage' ? <WeatherDashboard /> : 
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
