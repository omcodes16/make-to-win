import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import UserBubble from './UserBubble';
import AssistantCard from './AssistantCard';
import ErrorMessage from './ErrorMessage';
import EmptyState from './EmptyState';
import LoadingIndicator from './LoadingIndicator';

export default function MessageList() {
  const { state } = useApp();
  const { messages, isLoading } = state;
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on new messages or loading change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return <EmptyState />;
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4 chat-scroll scrollbar-hide overflow-y-auto">
      {messages.map(msg => {
        switch (msg.role) {
          case 'user':
            return <UserBubble key={msg.id} message={msg} />;
          case 'assistant':
            return <AssistantCard key={msg.id} message={msg} />;
          case 'error':
            return <ErrorMessage key={msg.id} message={msg} />;
          default:
            return null;
        }
      })}

      {isLoading && <LoadingIndicator />}

      <div ref={bottomRef} />
    </div>
  );
}
