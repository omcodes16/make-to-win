import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatSessionForExport, shareViaWhatsApp, shareAnywhere } from '../utils/chatSessionManager';
import SidebarAccuracyWidget from './SidebarAccuracyWidget';

export default function SavedChatsDrawer({ isOpen, onClose }) {
  const { state, dispatch } = useApp();
  const [copiedId, setCopiedId] = useState(null);
  const [anywhereCopiedId, setAnywhereCopiedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const sessions = state.savedSessions || [];
  const currentId = state.currentSessionId;
  const isHi = ['hi', 'mr', 'pa', 'gu', 'or', 'ur'].includes(state.language);

  const filteredSessions = sessions.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.title && s.title.toLowerCase().includes(q)) ||
      (s.location && s.location.toLowerCase().includes(q)) ||
      (s.preview && s.preview.toLowerCase().includes(q))
    );
  });

  const handleSelectSession = (session) => {
    dispatch({ type: 'LOAD_SESSION', payload: session });
    onClose();
  };

  const handleDeleteSession = (e, sessionId) => {
    e.stopPropagation();
    dispatch({ type: 'DELETE_SESSION', payload: sessionId });
  };

  const handleClearAll = () => {
    const confirmMsg = isHi
      ? 'क्या आप सभी सहेजी गई मौसम चर्चाएं मिटाना चाहते हैं?'
      : 'Are you sure you want to clear all saved consultation history?';
    if (window.confirm(confirmMsg)) {
      dispatch({ type: 'CLEAR_ALL_SESSIONS' });
    }
  };

  const handleCopyAdvisory = async (e, session) => {
    e.stopPropagation();
    const text = formatSessionForExport(session, state.weatherStageData?.locationName);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(session.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleShareWhatsApp = (e, session) => {
    e.stopPropagation();
    const text = formatSessionForExport(session, state.weatherStageData?.locationName);
    shareViaWhatsApp(text);
  };

  const handleShareAnywhere = async (e, session) => {
    e.stopPropagation();
    const success = await shareAnywhere(session, state.weatherStageData?.locationName);
    if (success) {
      setAnywhereCopiedId(session.id);
      setTimeout(() => setAnywhereCopiedId(null), 2500);
    }
  };

  const handleDownload = (e, session) => {
    e.stopPropagation();
    const text = formatSessionForExport(session, state.weatherStageData?.locationName);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weathergpt-advisory-${session.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none animate-fade-in">
      {/* 1. Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
      />

      {/* 2. Slide-Over Panel */}
      <aside 
        className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-12"
        role="dialog"
        aria-modal="true"
      >
        <div className="w-screen max-w-md sm:max-w-lg glass-panel bg-[var(--header-bg)]/95 border-l border-[var(--theme-border)] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col h-full overflow-hidden">
          
          {/* Header */}
          <div className="px-3.5 sm:px-5 py-2.5 sm:py-4 border-b border-[var(--theme-border)] flex items-center justify-between gap-2 sm:gap-3 bg-[var(--glass-bg)]/60">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h3 className="text-xs sm:text-base font-bold text-[var(--text-primary)] truncate">
                    {isHi ? 'सहेजी गई चर्चाएं' : 'Saved Consultations'}
                  </h3>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-bold bg-sky-500/15 border border-sky-500/25 text-sky-600 dark:text-sky-300 shrink-0">
                    {sessions.length}
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-[var(--text-secondary)] font-medium truncate">
                  {isHi ? 'स्थानीय डिवाइस पर सुरक्षित' : 'Stored securely on this device'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  dispatch({ type: 'START_NEW_SESSION' });
                  onClose();
                }}
                title={isHi ? 'मुख्य स्क्रीन / नई चर्चा पर वापस जाएं' : 'Back to Fresh Chat'}
                className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 font-bold text-[11px] sm:text-xs transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
              >
                <span>+</span>
                <span>{isHi ? 'नई चर्चा' : 'Fresh Chat'}</span>
              </button>
              <button
                onClick={onClose}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/10 border border-[var(--theme-border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer active:scale-95"
                aria-label="Close saved chats"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Search & Action Strip */}
          <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-[var(--theme-border)] flex items-center gap-2 bg-black/5 dark:bg-white/[0.02]">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isHi ? 'चर्चाएं खोजें...' : 'Search past consultations...'}
                className="w-full bg-[var(--glass-bg)] border border-[var(--theme-border)] rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-sky-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  ✕
                </button>
              )}
            </div>

            {sessions.length > 0 && (
              <button
                onClick={handleClearAll}
                title="Clear all saved history"
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 transition-all cursor-pointer shrink-0 active:scale-95"
              >
                {isHi ? 'सभी साफ़ करें' : 'Clear All'}
              </button>
            )}
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto p-2.5 sm:p-4 space-y-2 sm:space-y-3 chat-scroll scrollbar-thin">
            {filteredSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 14 14" />
                  </svg>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] mb-1">
                  {searchQuery 
                    ? (isHi ? 'कोई मेल नहीं मिला' : 'No matching consultations')
                    : (isHi ? 'कोई सहेजी गई चर्चा नहीं है' : 'No saved consultations yet')}
                </h4>
                <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] max-w-xs leading-relaxed">
                  {searchQuery
                    ? (isHi ? 'कृपया अलग शब्द खोजें।' : 'Try searching with different keywords.')
                    : (isHi ? 'आपकी हर नई मौसम चर्चा यहाँ अपने आप सहेजी जाएगी।' : 'Every meteorological consultation you conduct will automatically be saved here.')}
                </p>
              </div>
            ) : (
              filteredSessions.map((session) => {
                const isActive = session.id === currentId;
                const isCopied = copiedId === session.id;

                return (
                  <div
                    key={session.id}
                    onClick={() => handleSelectSession(session)}
                    className={`rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border transition-all cursor-pointer text-left relative group ${
                      isActive
                        ? 'border-sky-500/60 bg-sky-500/10 shadow-md ring-1 ring-sky-500/30'
                        : 'border-[var(--theme-border)] bg-[var(--glass-bg)] hover:border-sky-500/40 hover:bg-white/[0.04]'
                    }`}
                  >
                    {/* Header: Title & Active Badge */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] line-clamp-1 group-hover:text-sky-300 transition-colors">
                        {session.title}
                      </h4>
                      {isActive && (
                        <span className="shrink-0 px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                          ACTIVE
                        </span>
                      )}
                    </div>

                    {/* Metadata Strip: Timestamp, Location, Messages Count */}
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] text-[var(--text-secondary)] font-medium mb-1.5 flex-wrap">
                      <span>{session.createdAtFormatted || 'Live Synchronized'}</span>
                      {session.location && (
                        <>
                          <span>•</span>
                          <span className="text-[var(--text-primary)] font-semibold truncate max-w-[100px] sm:max-w-[120px]">
                            📍 {session.location}
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span className="font-semibold text-sky-400">
                        {session.messages?.length || 0} msgs
                      </span>
                    </div>

                    {/* Preview Snippet */}
                    {session.preview && (
                      <p className="text-[10px] sm:text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed mb-2 sm:mb-3 bg-black/10 dark:bg-black/25 rounded-lg p-1.5 sm:p-2 border border-white/5">
                        {session.preview}
                      </p>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-between gap-1 pt-1.5 sm:pt-2 border-t border-[var(--theme-border)] text-[10px] sm:text-[11px] flex-wrap">
                      <div className="flex items-center gap-1 flex-wrap">
                        {/* Copy Advisory */}
                        <button
                          onClick={(e) => handleCopyAdvisory(e, session)}
                          title="Copy meteorological advisory bulletin"
                          className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--theme-border)] transition-all flex items-center gap-1 active:scale-95 cursor-pointer text-[10px] sm:text-xs"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                        </button>

                        {/* WhatsApp Share */}
                        <button
                          onClick={(e) => handleShareWhatsApp(e, session)}
                          title="Share bulletin via WhatsApp"
                          className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 transition-all flex items-center gap-1 active:scale-95 cursor-pointer text-[10px] sm:text-xs"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          <span>WhatsApp</span>
                        </button>

                        {/* Anywhere Share */}
                        <button
                          onClick={(e) => handleShareAnywhere(e, session)}
                          title="Share anywhere (System Sheet / Copy)"
                          className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/25 transition-all flex items-center gap-1 active:scale-95 cursor-pointer text-[10px] sm:text-xs"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="18" cy="5" r="3" />
                            <circle cx="6" cy="12" r="3" />
                            <circle cx="18" cy="19" r="3" />
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                          </svg>
                          <span>{anywhereCopiedId === session.id ? 'Shared!' : 'Share'}</span>
                        </button>

                        {/* Download text */}
                        <button
                          onClick={(e) => handleDownload(e, session)}
                          title="Download advisory as .txt"
                          className="px-1.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--theme-border)] transition-all active:scale-95 cursor-pointer"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </button>
                      </div>

                      {/* Delete Session */}
                      <button
                        onClick={(e) => handleDeleteSession(e, session.id)}
                        title="Delete this consultation"
                        className="p-1 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all active:scale-90 cursor-pointer ml-auto"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Section: AI Answer Accuracy Tracker & Quick Start */}
          <div className="p-2.5 sm:p-3.5 border-t border-[var(--theme-border)] bg-[var(--glass-bg)]/90 flex flex-col gap-2 sm:gap-3 shrink-0">
            <SidebarAccuracyWidget 
              onOpenAccuracy={() => {
                window.dispatchEvent(new CustomEvent('weathergpt-open-accuracy-screen'));
                onClose();
              }}
            />

            <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-[var(--text-secondary)] pt-1">
              <span>WeatherGPT Engine</span>
              <button
                onClick={() => {
                  dispatch({ type: 'START_NEW_SESSION' });
                  onClose();
                }}
                className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl font-bold text-[11px] sm:text-xs text-white bg-sky-600 hover:bg-sky-500 transition-all active:scale-95 shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <span>+</span>
                <span>{isHi ? 'नई चर्चा शुरू करें' : 'Start Fresh'}</span>
              </button>
            </div>
          </div>

        </div>
      </aside>
    </div>
  );
}
