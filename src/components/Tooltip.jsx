import React, { useState, useRef, useEffect } from "react";

export default function Tooltip({ text }) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block ml-2" ref={tooltipRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 text-[10px] text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
        aria-label="Info"
      >
        i
      </button>

      {isOpen && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 sm:w-56 bg-gray-900/95 backdrop-blur-md border border-white/20 text-white text-xs p-3 rounded-xl shadow-2xl animate-fade-in pointer-events-auto">
          <div className="flex justify-between items-start gap-2 mb-1">
            <span className="font-semibold text-white/90">Info</span>
            <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <p className="leading-relaxed text-white/80">{text}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900/95"></div>
        </div>
      )}
    </div>
  );
}
