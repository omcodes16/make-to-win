import React, { useState, useEffect } from 'react';

export default function MobileMenuSheet({
  isOpen,
  onClose,
  currentLang,
  languages,
  onSelectLanguage,
  currentTheme,
  onSelectTheme,
  userProfile,
  onOpenHub,
  onOpenResearch,
  savedLocations,
  savedWeather,
  loadingSaved,
  onSelectSaved,
  onRemoveSaved,
  onOpenAccuracy,
  isLargeText,
  onToggleLargeText,
  isHighContrast,
  onToggleHighContrast,
  onOpenGuide,
  onOpenReviews,
  onOpenManager,
  onOpenBulletin,
}) {
  const [mobileLangSearch, setMobileLangSearch] = useState('');

  const filteredLanguages = (languages || []).filter(l =>
    l.label.toLowerCase().includes(mobileLangSearch.toLowerCase()) ||
    l.nativeLabel.toLowerCase().includes(mobileLangSearch.toLowerCase()) ||
    l.code.toLowerCase().includes(mobileLangSearch.toLowerCase())
  );

  // Prevent background scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const profileLabels = {
    farmer: { label: 'Farmer / Agriculture', icon: '🌾', color: 'from-emerald-500/20 to-green-600/20 border-emerald-500/40' },
    fisherman: { label: 'Fisherman / Marine', icon: '🎣', color: 'from-blue-500/20 to-cyan-600/20 border-blue-500/40' },
    aviation: { label: 'Aviation / Pilot', icon: '✈️', color: 'from-indigo-500/20 to-sky-600/20 border-indigo-500/40' },
    urbanPlanning: { label: 'Urban / Infrastructure', icon: '🏙️', color: 'from-purple-500/20 to-violet-600/20 border-purple-500/40' },
    general: { label: 'General Weather', icon: '🌍', color: 'from-blue-500/20 to-indigo-600/20 border-blue-500/40' },
  };

  const activeProfile = profileLabels[userProfile] || profileLabels.general;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end md:hidden">
      {/* Dimmed backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm mobile-sheet-overlay transition-opacity" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      {/* Slide-up sheet content */}
      <div 
        className="relative z-10 w-full max-h-[85vh] overflow-y-auto theme-modal rounded-t-[28px] border-t border-x border-[var(--modal-border)] text-[var(--text-primary)] shadow-2xl mobile-sheet-container pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top sheet pull handle */}
        <div className="sticky top-0 z-20 pt-3 pb-2 bg-[var(--modal-bg)] backdrop-blur-xl flex flex-col items-center">
          <div className="w-12 h-1.5 rounded-full bg-white/25 mb-2 cursor-grab active:cursor-grabbing" />
          <div className="w-full px-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-[var(--text-primary)]">Settings & Tools</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                WeatherGPT
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
              aria-label="Close menu"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-5 py-3 space-y-4">
          
          {/* Active Profile / Hub Card */}
          <div className={`p-3.5 rounded-2xl bg-gradient-to-r ${activeProfile.color} border flex items-center justify-between gap-3 shadow-sm`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-xl shrink-0 shadow-inner">
                {activeProfile.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Active Profile</p>
                <p className="text-sm font-black text-[var(--text-primary)] truncate">{activeProfile.label}</p>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenHub();
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 shrink-0 transition-all active:scale-95 flex items-center gap-1"
            >
              <span>Hub</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          {/* Official Weather & Advisory Bulletin Card (Gram Panchayat & Multi-Category) */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-indigo-600/15 to-emerald-500/15 border border-indigo-500/40 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center text-lg shrink-0 shadow-inner">
                  🏛️
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-400">Panchayat to State</p>
                  <p className="text-xs font-extrabold text-white">पंचायत, तहसील, जिला व राज्य बुलेटिन</p>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  if (onOpenBulletin) onOpenBulletin('master');
                }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all active:scale-95 flex items-center gap-1"
              >
                <span>View</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
            {/* Sector quick pills */}
            <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-white/10">
              {[
                { id: 'farmer', icon: '🌾', label: 'Kisan' },
                { id: 'fisherman', icon: '🎣', label: 'Marine' },
                { id: 'urban', icon: '🏙️', label: 'Urban' },
                { id: 'aviation', icon: '✈️', label: 'Aviation' },
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    onClose();
                    if (onOpenBulletin) onOpenBulletin(s.id);
                  }}
                  className="py-1 px-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-slate-200 flex items-center justify-center gap-1 transition-colors"
                >
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Language Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-blue-400">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <label className="text-[11px] font-black uppercase tracking-wider text-[var(--text-secondary)]">Language / भाषा</label>
              </div>
              <span className="text-[10px] text-white/50">{languages?.length || 0} languages</span>
            </div>

            {/* Mobile quick filter */}
            <div className="relative mb-2">
              <input
                type="text"
                value={mobileLangSearch}
                onChange={(e) => setMobileLangSearch(e.target.value)}
                placeholder="🔍 Filter language / भाषा खोजें..."
                className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/50 focus:outline-none focus:border-blue-400 shadow-inner"
              />
              {mobileLangSearch && (
                <button
                  onClick={() => setMobileLangSearch('')}
                  className="absolute right-2.5 top-1.5 text-xs text-white/60 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {filteredLanguages.map((l) => {
                const isActive = currentLang.code === l.code;
                return (
                  <button
                    key={l.code}
                    onClick={() => onSelectLanguage(l.code)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between border ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30 font-extrabold'
                        : 'bg-[var(--glass-bg)] border-[var(--modal-border)] text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)]'
                    }`}
                  >
                    <div>
                      <span>{l.nativeLabel}</span>
                      <span className="block text-[10px] opacity-60 font-normal">({l.label})</span>
                    </div>
                    {isActive && <span className="text-white text-xs">✓</span>}
                  </button>
                );
              })}
              {filteredLanguages.length === 0 && (
                <div className="col-span-2 text-center py-4 text-xs text-white/50">
                  No matching language
                </div>
              )}
            </div>
          </div>

          {/* Theme Selector */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs">🎨</span>
              <label className="text-[11px] font-black uppercase tracking-wider text-[var(--text-secondary)]">Theme / थीम</label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'dark', label: 'Dark', icon: '🌙' },
                { key: 'light', label: 'Light', icon: '☀️' },
                { key: 'glass', label: 'Glass', icon: '🔮' },
              ].map(({ key, label, icon }) => {
                const isActive = currentTheme === key;
                return (
                  <button
                    key={key}
                    onClick={() => onSelectTheme(key)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 border ${
                      isActive
                        ? 'border-[var(--theme-accent)] shadow-[0_0_14px_var(--focus-glow)] bg-[var(--glass-bg-hover)] text-[var(--theme-accent)] ring-1 ring-[var(--theme-accent)]'
                        : 'border-[var(--modal-border)] text-[var(--text-muted)] bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)]'
                    }`}
                  >
                    <span className="text-base">{icon}</span>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Saved Locations */}
          <div className="p-3.5 rounded-2xl bg-[var(--glass-bg)] border border-[var(--modal-border)]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-amber-500">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                <span>Saved Locations</span>
              </div>
              <span className="text-[10px] font-bold text-[var(--text-secondary)] bg-white/10 px-1.5 py-0.5 rounded-md">
                {savedLocations.length}/5
              </span>
            </div>

            {savedLocations.length === 0 ? (
              <p className="text-[11px] text-[var(--text-muted)] py-1 leading-relaxed">
                No saved locations yet. Tap the bookmark icon in Forecast View to save a city.
              </p>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pt-1">
                {savedLocations.map((loc) => {
                  const w = savedWeather[loc.name];
                  return (
                    <div
                      key={loc.name}
                      className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group"
                    >
                      <button
                        onClick={() => {
                          onSelectSaved(loc);
                          onClose();
                        }}
                        className="flex items-center gap-2.5 text-left truncate flex-1 min-w-0"
                      >
                        <span className="text-base shrink-0">{loadingSaved ? '⏳' : (w?.icon || '🌤️')}</span>
                        <span className="text-xs font-bold text-[var(--text-primary)] truncate">{loc.name}</span>
                        <span className="text-xs font-black text-blue-400 ml-auto mr-2">
                          {loadingSaved ? '...' : (w ? `${w.temp}°` : '--')}
                        </span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveSaved(loc.name);
                        }}
                        className="text-red-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="Remove location"
                        aria-label={`Remove ${loc.name}`}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI Trust & Accuracy Banner */}
          <button
            onClick={() => {
              onClose();
              onOpenAccuracy();
            }}
            className="w-full p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-left transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" strokeWidth="2" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-black text-emerald-400">AI Trust & IMD Verification</p>
                <p className="text-[10px] text-[var(--text-secondary)]">View real-time model accuracy scores</p>
              </div>
            </div>
            <span className="text-emerald-400 text-xs font-bold">›</span>
          </button>

          {/* Accessibility Settings */}
          <div className="p-3.5 rounded-2xl bg-[var(--glass-bg)] border border-[var(--modal-border)] space-y-2.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-[var(--text-secondary)] block">
              Accessibility
            </label>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-primary)]">Large text</span>
              <button
                onClick={onToggleLargeText}
                className={`w-10 h-6 rounded-full transition-all relative ${
                  isLargeText ? 'bg-indigo-600 shadow-[0_0_12px_rgba(99,102,241,0.6)]' : 'bg-white/20'
                }`}
              >
                <span
                  className={`absolute top-[3px] left-[3px] w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${
                    isLargeText ? 'translate-x-4' : ''
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-primary)]">High contrast</span>
              <button
                onClick={onToggleHighContrast}
                className={`w-10 h-6 rounded-full transition-all relative ${
                  isHighContrast ? 'bg-indigo-600 shadow-[0_0_12px_rgba(99,102,241,0.6)]' : 'bg-white/20'
                }`}
              >
                <span
                  className={`absolute top-[3px] left-[3px] w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${
                    isHighContrast ? 'translate-x-4' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Quick Links Section */}
          <div className="grid grid-cols-4 gap-2 pt-1 pb-4">
            <button
              onClick={() => {
                onClose();
                if (onOpenResearch) onOpenResearch();
              }}
              className="p-2 rounded-xl bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)] border border-[var(--modal-border)] flex flex-col items-center gap-1 text-center transition-all active:scale-95 cursor-pointer"
            >
              <span className="text-indigo-400 text-base">🔬</span>
              <span className="text-[10px] font-bold text-[var(--text-primary)]">Research</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenGuide();
              }}
              className="p-2 rounded-xl bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)] border border-[var(--modal-border)] flex flex-col items-center gap-1 text-center transition-all active:scale-95 cursor-pointer"
            >
              <span className="text-teal-400 text-base">📖</span>
              <span className="text-[10px] font-bold text-[var(--text-primary)]">Guide</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenReviews();
              }}
              className="p-2 rounded-xl bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)] border border-[var(--modal-border)] flex flex-col items-center gap-1 text-center transition-all active:scale-95 cursor-pointer"
            >
              <span className="text-amber-400 text-base">⭐</span>
              <span className="text-[10px] font-bold text-[var(--text-primary)]">Reviews</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenManager();
              }}
              className="p-2 rounded-xl bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)] border border-[var(--modal-border)] flex flex-col items-center gap-1 text-center transition-all active:scale-95 cursor-pointer"
            >
              <span className="text-red-400 text-base">🛡️</span>
              <span className="text-[10px] font-bold text-[var(--text-primary)]">Portal</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
