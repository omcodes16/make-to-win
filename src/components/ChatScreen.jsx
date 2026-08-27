import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import Header from './Header';
import ChatInput from './ChatInput';
import UserBubble from './UserBubble';
import AssistantCard from './AssistantCard';
import EmptyState from './EmptyState';
import SevereAlertBanner from './SevereAlertBanner';
import { getTheme } from '../utils/themes';
import { getWeatherInfo } from '../utils/weatherConditions';
import OfflineBanner from './OfflineBanner';
import MessageList from './MessageList';

export default function ChatScreen() {
  const { state } = useApp();

  // Use dynamic theme based on currently known weather condition
  const weather = state.weatherStageData?.weather;
  const weatherInfo = weather ? getWeatherInfo(weather.weatherCode, state.language) : null;
  const theme = weather && weatherInfo ? getTheme(weather, weatherInfo) : getTheme({ temperature: 20 }, { key: 'partlyCloudy' });

  return (
    <div className="flex flex-col h-[100dvh] bg-surface-0 transition-colors duration-1000 overflow-hidden">
      {/* Fixed Background Image (Hardware Accelerated) */}
      <div className="fixed inset-0 z-0 bg-cover bg-center transition-opacity duration-1000" style={{ backgroundImage: `url(${theme.bgImage})` }}></div>
      
      {/* Overlay Gradients */}
      <div className={`fixed inset-0 z-0 bg-gradient-to-b ${theme.overlay} backdrop-blur-md pointer-events-none transition-colors duration-1000`}></div>
      <div className={`fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] ${theme.accent} via-transparent to-transparent pointer-events-none transition-colors duration-1000`}></div>
      
      <Header />
      <OfflineBanner />

      {/* Main chat area — scrollable */}
      <main className="flex-1 overflow-y-auto relative z-10 pt-[60px] sm:pt-[72px] pb-[200px] md:pb-[160px]">
        <div className="w-full max-w-3xl mx-auto px-3 sm:px-4">
          <MessageList />
        </div>
      </main>

      {/* Input pinned at bottom — above mobile nav bar */}
      <div className="fixed bottom-[56px] md:bottom-0 left-0 right-0 z-30 pb-3 md:pb-4 pt-8 bg-gradient-to-t from-surface-0 via-surface-0/80 to-transparent">
        <div className="max-w-3xl mx-auto px-3 sm:px-4">
          <SevereAlertBanner />
          <ChatInput />
        </div>
      </div>
    </div>
  );
}
