import React from 'react';

export default function UserBubble({ message }) {
  return (
    <div className="flex justify-end mb-4 sm:mb-6 animate-slide-up">
      <div className="max-w-[85%] rounded-[1.25rem] rounded-tr-sm px-4 py-2.5 sm:px-5 sm:py-3.5 glass-bubble text-white shadow-[0_4px_24px_rgba(99,102,241,0.25)] hover:shadow-[0_4px_24px_rgba(99,102,241,0.4)] transition-shadow duration-300">
        <p className="text-sm sm:text-[15px] leading-relaxed">{message.text}</p>
      </div>
    </div>
  );
}
