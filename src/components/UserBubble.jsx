import React from 'react';

export default function UserBubble({ message }) {
  return (
    <div className="flex justify-end mb-6 animate-slide-up">
      <div className="max-w-[85%] rounded-3xl rounded-tr-sm px-5 py-3.5 bg-blue-600 text-white shadow-lg border border-blue-500/50">
        <p className="text-[15px] leading-relaxed">{message.text}</p>
      </div>
    </div>
  );
}
