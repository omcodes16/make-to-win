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

import MessageList from './MessageList';

export default function ChatScreen() {
  const { state } = useApp();

  return (
    <div className="flex flex-col h-[100dvh]">
      

      {/* Main chat area — scrollable */}
      <main className="flex-1 overflow-y-auto relative z-10 pt-[60px] sm:pt-[72px] pb-[200px] md:pb-[160px]">
        <div className="w-full max-w-3xl mx-auto px-3 sm:px-4">
          <MessageList />
        </div>
      </main>

      {/* Input pinned at bottom — above mobile nav bar */}
      <div className="fixed bottom-[56px] md:bottom-0 left-0 right-0 z-30 pb-3 md:pb-4 pt-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent ">
        <div className="max-w-3xl mx-auto px-3 sm:px-4">
          <SevereAlertBanner />
          <ChatInput />
        </div>
      </div>
    </div>
  );
}
