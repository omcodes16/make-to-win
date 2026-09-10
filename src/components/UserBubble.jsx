import React from 'react';

export default function UserBubble({ message }) {
  const istTime = message.istTimestamp || (message.timestamp ? new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(new Date(message.timestamp)) + ' IST' : '');

  return (
    <div className="flex flex-col items-end mb-2.5 sm:mb-5 animate-slide-up">
      <div className="max-w-[88%] sm:max-w-[85%] rounded-2xl rounded-tr-sm px-3.5 py-2 sm:px-5 sm:py-3.5 glass-bubble text-white shadow-md hover:shadow-lg border border-white/10 transition-shadow duration-300">
        <p className="text-xs sm:text-[15px] leading-relaxed">{message.text}</p>
        {istTime && (
          <div className="flex items-center justify-end gap-1 mt-0.5 sm:mt-1 text-[9px] sm:text-[10px] text-white/60 font-mono tracking-tight">
            <span>{istTime}</span>
          </div>
        )}
      </div>
    </div>
  );
}
