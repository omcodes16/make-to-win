import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import ChatInput from './ChatInput';
import SevereAlertBanner from './SevereAlertBanner';
import MessageList from './MessageList';
import EmptyState from './EmptyState';
import SavedChatsDrawer from './SavedChatsDrawer';
import SidebarAccuracyWidget from './SidebarAccuracyWidget';
import ChatAccuracyView from './ChatAccuracyView';
import { formatSessionForExport, shareViaWhatsApp, shareAnywhere } from '../utils/chatSessionManager';

export default function ChatScreen() {
  const { state, dispatch } = useApp();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCopiedActive, setIsCopiedActive] = useState(false);
  const [viewMode, setViewMode] = useState('chat'); // 'chat' | 'accuracy'
  const [shareToast, setShareToast] = useState(null);

  const hasMessages = state.messages && state.messages.length > 0;
  const stageData = state.weatherStageData;
  const weather = stageData?.weather || state.currentWeather;
  const activeLocation = stageData?.locationName || weather?.locationName || '';
  const sessions = state.savedSessions || [];
  const currentSessionId = state.currentSessionId;
  const isHi = ['hi', 'mr', 'pa', 'gu', 'or', 'ur'].includes(state.language);

  // Listen for external open accuracy screen trigger (e.g. from mobile drawer)
  useEffect(() => {
    const handleOpenAcc = () => setViewMode('accuracy');
    window.addEventListener('weathergpt-open-accuracy-screen', handleOpenAcc);
    return () => window.removeEventListener('weathergpt-open-accuracy-screen', handleOpenAcc);
  }, []);

  const handleCopyActiveAdvisory = async () => {
    const activeSession = {
      id: state.currentSessionId || 'current',
      title: state.messages.find(m => m.role === 'user')?.text || 'Current Consultation',
      location: activeLocation,
      messages: state.messages,
      createdAt: Date.now(),
    };
    const text = formatSessionForExport(activeSession, activeLocation);
    try {
      await navigator.clipboard.writeText(text);
      setIsCopiedActive(true);
      setTimeout(() => setIsCopiedActive(false), 2500);
    } catch (e) {
      console.error('Failed to copy active advisory', e);
    }
  };

  const handleSelectSession = (session) => {
    setViewMode('chat');
    dispatch({ type: 'LOAD_SESSION', payload: session });
  };

  const handleDeleteSession = (e, sessionId) => {
    e.stopPropagation();
    dispatch({ type: 'DELETE_SESSION', payload: sessionId });
  };

  const handleShareWhatsApp = (e, session) => {
    e.stopPropagation();
    const text = formatSessionForExport(session, activeLocation);
    shareViaWhatsApp(text);
  };

  const handleShareAnywhere = async (e, session) => {
    e.stopPropagation();
    const success = await shareAnywhere(session, activeLocation);
    if (success) {
      setShareToast(session.id);
      setTimeout(() => setShareToast(null), 2000);
    }
  };

  return (
    <div className="flex h-[100dvh] pt-14 sm:pt-20 pb-14 md:pb-0 w-full overflow-hidden relative">
      
      {/* ── 1. Desktop Collapsible Sidebar (Left) ── */}
      {isSidebarOpen && (
        <aside className="w-64 lg:w-72 border-r border-[var(--theme-border)] bg-[var(--header-bg)]/60 backdrop-blur-md hidden md:flex flex-col shrink-0 select-none z-10 animate-fade-in">
          
          {/* Navigation Action */}
          <div className="p-3 border-b border-[var(--theme-border)] space-y-2">
            {hasMessages || currentSessionId ? (
              <button
                onClick={() => dispatch({ type: 'START_NEW_SESSION' })}
                title={isHi ? 'मुख्य स्क्रीन / नई चर्चा पर वापस जाएं' : 'Back to Fresh Chat'}
                className="w-full py-2.5 px-3 rounded-xl font-bold text-xs text-sky-200 bg-sky-600/85 hover:bg-sky-500 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer border border-sky-400/30"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                <span>{isHi ? '← मुख्य चर्चा पर वापस जाएं' : '← Back to Fresh Chat'}</span>
              </button>
            ) : (
              <button
                onClick={() => dispatch({ type: 'START_NEW_SESSION' })}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-sky-600 hover:bg-sky-500 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>{isHi ? '+ नई मौसम चर्चा' : '+ New Consultation'}</span>
              </button>
            )}

            {currentSessionId && (
              <div className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-between text-[10px] text-sky-300 font-medium">
                <span className="truncate">{isHi ? 'सहेजी गई चर्चा सक्रिय है' : 'Viewing Past Chat'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse shrink-0" />
              </div>
            )}
          </div>

          {/* Recent Consultations List Header */}
          <div className="px-4 pt-3 pb-1.5 flex items-center justify-between text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
            <span>{isHi ? 'हाल की चर्चाएं' : 'Recent Chats'}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/5 dark:bg-white/10 text-[var(--text-primary)]">
              {sessions.length}
            </span>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1 chat-scroll scrollbar-thin">
            {sessions.length === 0 ? (
              <div className="py-8 text-center px-3">
                <p className="text-xs text-[var(--text-muted)]">
                  {isHi ? 'कोई पिछली चर्चा नहीं है।' : 'No previous consultations.'}
                </p>
                <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                  {isHi ? 'सवाल पूछने पर यहाँ अपने आप दिखेगा।' : 'Chats are auto-saved here.'}
                </p>
              </div>
            ) : (
              sessions.map((sess) => {
                const isActive = sess.id === currentSessionId;
                return (
                  <div
                    key={sess.id}
                    onClick={() => handleSelectSession(sess)}
                    className={`group px-3 py-2 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between gap-2 border ${
                      isActive
                        ? 'bg-sky-500/15 border-sky-500/40 text-[var(--text-primary)] font-semibold shadow-xs'
                        : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs truncate font-medium group-hover:text-sky-300 transition-colors">
                        {sess.title}
                      </p>
                      <span className="text-[10px] font-normal text-[var(--text-secondary)] block mt-0.5">
                        {sess.createdAtFormatted || 'Live'}
                      </span>
                    </div>

                    {/* Action Cluster: WhatsApp Share, Anywhere Share, Delete */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {/* WhatsApp Share */}
                      <button
                        onClick={(e) => handleShareWhatsApp(e, sess)}
                        title={isHi ? 'व्हाट्सएप पर शेयर करें' : 'Share on WhatsApp'}
                        className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-emerald-500 hover:bg-emerald-500/10 transition-all cursor-pointer active:scale-90"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      </button>

                      {/* Anywhere Share */}
                      <button
                        onClick={(e) => handleShareAnywhere(e, sess)}
                        title={isHi ? 'कहीं भी शेयर करें' : 'Share anywhere / Copy'}
                        className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-sky-400 hover:bg-sky-500/10 transition-all cursor-pointer active:scale-90"
                      >
                        {shareToast === sess.id ? (
                          <span className="text-[11px] text-emerald-400 font-black leading-none">✓</span>
                        ) : (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="18" cy="5" r="3" />
                            <circle cx="6" cy="12" r="3" />
                            <circle cx="18" cy="19" r="3" />
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                          </svg>
                        )}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={(e) => handleDeleteSession(e, sess.id)}
                        title={isHi ? 'हटाएं' : 'Delete chat'}
                        className="p-1 rounded-lg hover:text-rose-400 hover:bg-rose-500/10 text-[var(--text-secondary)] transition-all shrink-0 cursor-pointer active:scale-90"
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

          {/* Bottom Section: AI Answer Accuracy Tracker & Live Station */}
          <div className="p-3 border-t border-[var(--theme-border)] bg-[var(--glass-bg)]/80 flex flex-col gap-2 shrink-0">
            <SidebarAccuracyWidget 
              onOpenAccuracy={() => setViewMode(prev => prev === 'accuracy' ? 'chat' : 'accuracy')}
              isActive={viewMode === 'accuracy'}
            />
            {weather && weather.temperature != null && (
              <div className="flex items-center justify-between px-1 text-[10px] text-[var(--text-secondary)] font-medium">
                <span className="truncate max-w-[130px]">📍 {activeLocation || 'Local Station'}</span>
                <span>{Math.round(weather.temperature)}°C • 💧 {weather.humidity ?? '--'}%</span>
              </div>
            )}
          </div>

        </aside>
      )}

      {/* ── 2. Main AI Workspace (Right / Center) ── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-transparent">
        
        {/* Top Meteorological Intelligence Sub-Header */}
        <div className="px-2 sm:px-6 lg:px-8 py-1.5 sm:py-2.5 border-b border-[var(--theme-border)] bg-[var(--header-bg)]/80 backdrop-blur-md flex items-center justify-between gap-1.5 sm:gap-4 shrink-0 select-none">
          
          {/* Left: Sidebar Toggle & Radar Emblem */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            {/* Desktop Sidebar Toggle */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              className="hidden md:flex w-8 h-8 rounded-lg bg-[var(--glass-bg)] hover:bg-white/10 border border-[var(--theme-border)] items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer active:scale-95"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
            </button>

            {/* Back Navigation: when in accuracy view or has messages */}
            {viewMode === 'accuracy' ? (
              <button
                onClick={() => setViewMode('chat')}
                title={isHi ? 'मुख्य चैट पर वापस जाएं' : 'Back to Chat'}
                className="px-2 sm:px-3 py-1 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold text-sky-400 hover:text-white bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/35 transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer shadow-xs active:scale-95 shrink-0"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                <span className="hidden sm:inline">{isHi ? '← चैट पर वापस' : '← Back to Chat'}</span>
                <span className="sm:hidden">{isHi ? 'चैट' : 'Back'}</span>
              </button>
            ) : hasMessages && (
              <button
                onClick={() => { dispatch({ type: 'START_NEW_SESSION' }); setViewMode('chat'); }}
                title={isHi ? 'मुख्य स्क्रीन / नई चर्चा पर वापस जाएं' : 'Back to Fresh Chat'}
                className="px-2 sm:px-3 py-1 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold text-sky-400 hover:text-white bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/35 transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer shadow-xs active:scale-95 shrink-0"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                <span className="hidden sm:inline">{isHi ? '← मुख्य चैट पर वापस' : '← Back to Fresh Chat'}</span>
                <span className="sm:hidden">{isHi ? 'नई' : 'Fresh'}</span>
              </button>
            )}

            {/* Radar Crest */}
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 dark:text-sky-400 shrink-0 shadow-xs">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-[17px] sm:h-[17px]">
                <path d="M12 2a10 10 0 1 0 10 10" />
                <path d="M12 6a6 6 0 1 0 6 6" />
                <path d="M12 10a2 2 0 1 0 2 2" />
                <path d="M12 12 21.5 2.5" />
              </svg>
            </div>

            {/* Clean Sub-header Title without green radar pill */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs sm:text-base font-bold text-[var(--text-primary)] tracking-tight truncate">
                WeatherGPT
              </span>
              {activeLocation && (
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                  <span className="opacity-40">•</span>
                  <span className="font-semibold text-[var(--text-primary)] truncate max-w-[160px] lg:max-w-[320px]">
                    📍 {activeLocation}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Mobile Saved Chats Button */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              title="View saved consultation history"
              className="md:hidden px-2 py-1 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--glass-bg)] hover:bg-white/10 border border-[var(--theme-border)] transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span className="hidden xs:inline">Chats</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/25">
                {sessions.length}
              </span>
            </button>

            {/* Quick Export Active Advisory */}
            {hasMessages && (
              <button
                onClick={handleCopyActiveAdvisory}
                title="Copy active advisory bulletin to clipboard"
                className="px-2 sm:px-3 py-1 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold text-[var(--text-secondary)] hover:text-sky-300 bg-[var(--glass-bg)] hover:bg-sky-500/15 border border-[var(--theme-border)] hover:border-sky-500/30 transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span className="hidden sm:inline">{isCopiedActive ? 'Copied!' : 'Export'}</span>
              </button>
            )}

            {/* New Consultation */}
            {hasMessages && (
              <button
                onClick={() => { dispatch({ type: 'START_NEW_SESSION' }); setViewMode('chat'); }}
                title="Start a fresh meteorological consultation"
                className="px-2 sm:px-3 py-1 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--glass-bg)] hover:bg-white/10 border border-[var(--theme-border)] transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
                <span className="hidden sm:inline">{isHi ? 'नई चर्चा' : 'New Chat'}</span>
                <span className="sm:hidden">{isHi ? 'नई' : 'New'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Area: Accuracy View vs Messages vs Empty State */}
        <div className="flex-1 overflow-y-auto px-2 sm:px-6 md:px-8 py-2 sm:py-4 chat-scroll scrollbar-thin">
          <div className="w-full max-w-4xl lg:max-w-5xl mx-auto h-full">
            {viewMode === 'accuracy' ? (
              <ChatAccuracyView onBack={() => setViewMode('chat')} />
            ) : hasMessages ? (
              <MessageList />
            ) : (
              <EmptyState />
            )}
          </div>
        </div>

        {/* Docked Query Bar ONLY when chatting and NOT in accuracy view */}
        {hasMessages && viewMode !== 'accuracy' && (
          <div className="border-t border-[var(--theme-border)] bg-[var(--glass-bg)]/95 backdrop-blur-xl px-2 sm:px-6 md:px-8 py-2 sm:py-3 pb-3 sm:pb-4 md:pb-5 shrink-0 shadow-lg animate-slide-up">
            <div className="w-full max-w-4xl lg:max-w-5xl mx-auto">
              <SevereAlertBanner />
              <ChatInput isHero={false} />
            </div>
          </div>
        )}

      </main>

      {/* ── 3. Slide-Over Saved Chats Drawer (Mobile & Flyout) ── */}
      <SavedChatsDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />

    </div>
  );
}
