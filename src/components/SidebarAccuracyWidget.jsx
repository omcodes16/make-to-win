import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import AccuracyFeedModal from './AccuracyFeedModal';

export default function SidebarAccuracyWidget({ onOpenAccuracy, isActive = false }) {
  const { state } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const lang = state.language || 'en';
  const isHi = ['hi', 'mr', 'pa', 'gu', 'or', 'ur'].includes(lang);

  const fetchAccuracy = async () => {
    try {
      const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
      const res = await fetch(`${baseUrl}/api/chat-accuracy`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.warn('Failed to fetch accuracy stats for sidebar widget', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccuracy();
    const interval = setInterval(fetchAccuracy, 15000);
    return () => clearInterval(interval);
  }, []);

  const totalVerified = data?.totalVerified ?? 0;
  const accurateCount = data?.accurateCount ?? 0;
  const divergedCount = data?.divergedCount ?? 0;
  const upcomingCount = data?.upcomingCount ?? 0;
  const accuratePercent = data?.accuratePercent ?? (totalVerified > 0 ? Math.round((accurateCount / totalVerified) * 100) : 100);

  const handleClick = () => {
    if (onOpenAccuracy) {
      onOpenAccuracy();
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div 
        onClick={handleClick}
        className={`group relative p-3 rounded-2xl bg-gradient-to-b from-sky-500/[0.08] to-indigo-500/[0.04] border transition-all cursor-pointer shadow-xs hover:shadow-md select-none overflow-hidden ${
          isActive 
            ? 'border-sky-500 ring-2 ring-sky-500/30 bg-sky-500/15' 
            : 'border-sky-500/20 hover:border-sky-500/40'
        }`}
      >
        {/* Background Accent Glow */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-sky-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-sky-500/20 transition-all" />

        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 mb-2 relative z-10">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span className="text-xs font-bold text-[var(--text-primary)] truncate">
              {isHi ? 'AI उत्तर सटीकता ट्रैकर' : 'AI Accuracy Tracker'}
            </span>
          </div>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            IMD Verified
          </span>
        </div>

        {/* Accuracy Stat & Visual Bar */}
        {loading && !data ? (
          <div className="py-2 space-y-1.5 animate-pulse">
            <div className="h-4 bg-white/10 rounded-md w-3/4" />
            <div className="h-2 bg-white/5 rounded-full w-full" />
          </div>
        ) : (
          <div className="relative z-10">
            <div className="flex items-baseline justify-between gap-2 mb-1.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-extrabold text-[var(--text-primary)] tracking-tight">
                  {totalVerified > 0 ? `${accuratePercent}%` : '100%'}
                </span>
                <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                  {isHi ? 'सत्यापित विश्वसनीयता' : 'Verified Accuracy'}
                </span>
              </div>
              <span className="text-[11px] text-sky-600 dark:text-sky-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Audit ↗
              </span>
            </div>

            {/* Micro Progress Bar */}
            <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden flex mb-2">
              <div 
                className="bg-emerald-500 dark:bg-emerald-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.max(accuratePercent, 5)}%` }} 
              />
              {divergedCount > 0 && (
                <div 
                  className="bg-amber-500 dark:bg-amber-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${100 - accuratePercent}%` }} 
                />
              )}
            </div>

            {/* Metric Chips */}
            <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)] font-medium pt-1 border-t border-black/[0.06] dark:border-white/[0.06] flex-wrap gap-1">
              <span className="flex items-center gap-1">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ {accurateCount}</span>
                <span>{isHi ? 'सटीक' : 'Exact'}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="text-amber-600 dark:text-amber-400 font-bold">⚠️ {divergedCount}</span>
                <span>{isHi ? 'भिन्न' : 'Diverged'}</span>
              </span>
              {upcomingCount > 0 ? (
                <span className="flex items-center gap-1">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">⏳ {upcomingCount}</span>
                  <span>{isHi ? 'प्रतीक्षित' : 'Upcoming'}</span>
                </span>
              ) : (
                <span className="text-[var(--text-secondary)] font-semibold">
                  {totalVerified} {isHi ? 'दावे' : 'Claims'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Accuracy Feed Modal */}
      {isModalOpen && (
        <AccuracyFeedModal onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}
