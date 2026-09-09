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
  const hasMessages = state.messages && state.messages.length > 0;

  return (
    <div className="flex flex-col h-[100dvh]">
      {/* Main chat area — scrollable */}
      <main className="flex-1 overflow-y-auto relative z-10 pt-20 sm:pt-24 pb-52 sm:pb-44">
        <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 h-full">
          {hasMessages ? <MessageList /> : <EmptyState />}
        </div>
      </main>

      {/* Input ALWAYS pinned at bottom — above mobile nav bar */}
      <div className="fixed bottom-[60px] sm:bottom-[64px] md:bottom-0 left-0 right-0 z-40 px-3 pb-2 pt-4 bg-gradient-to-t from-[var(--overlay-dark)] via-[var(--overlay-dark)]/95 to-transparent pointer-events-none animate-slide-up">
        <div className="max-w-xl mx-auto pointer-events-auto">
          <SevereAlertBanner />
          <ChatInput isHero={false} />
        </div>
      </div>
    </div>
  );
}
