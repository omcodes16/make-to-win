import React from 'react';

export default function ErrorMessage({ message }) {
  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[85%] bg-clay/5 border border-clay/20 rounded-bubble rounded-bl-sm px-4 py-3">
        <p className="text-[15px] text-dusk/80 leading-relaxed">{message.text}</p>
      </div>
    </div>
  );
}
