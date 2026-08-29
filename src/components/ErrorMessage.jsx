import React from 'react';

export default function ErrorMessage({ message }) {
  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[85%] bg-red-950/40  border border-red-500/30 rounded-3xl rounded-bl-sm px-5 py-3.5 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
        <p className="text-[15px] text-red-200 leading-relaxed">{message.text}</p>
      </div>
    </div>
  );
}
