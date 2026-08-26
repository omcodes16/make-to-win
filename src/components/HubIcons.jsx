import React from 'react';

export const FarmerIcon = ({ className = "w-8 h-8 text-emerald-400" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M11 21.9A10 10 0 0 0 22 12c0-5.5-4.5-10-10-10S2 6.5 2 12c0 2.2.7 4.2 1.9 5.9" strokeLinecap="round"/>
    <path d="M12 22v-9" strokeLinecap="round"/>
    <path d="M12 17c-3 0-5.5-1.5-6.5-4" strokeLinecap="round"/>
    <path d="M12 13c3 0 5.5-1.5 6.5-4" strokeLinecap="round"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
  </svg>
);

export const FishermanIcon = ({ className = "w-8 h-8 text-blue-400" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 12c2 0 4-2 6-2s4 2 6 2 4-2 6-2" strokeLinecap="round"/>
    <path d="M2 18c2 0 4-2 6-2s4 2 6 2 4-2 6-2" strokeLinecap="round"/>
    <path d="M16 6l-4-4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 2v9" strokeLinecap="round"/>
    <path d="M7 10h10" strokeLinecap="round"/>
  </svg>
);

export const AviationIcon = ({ className = "w-8 h-8 text-indigo-400" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6L3 8l6 4-4 4-2.5-.5L1 13l2 5 5 2 .5-1.5-.5-2.5 4-4 4 6l1.2-.7c.4-.2.7-.6.6-1.1z"/>
  </svg>
);

export const UrbanIcon = ({ className = "w-8 h-8 text-purple-400" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 22V10l8-8 8 8v12" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 22v-6h-4v6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 14h2" strokeLinecap="round"/>
    <path d="M13 14h2" strokeLinecap="round"/>
    <path d="M9 10h2" strokeLinecap="round"/>
    <path d="M13 10h2" strokeLinecap="round"/>
  </svg>
);
