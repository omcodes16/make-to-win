import React from 'react';
import { useApp } from '../context/AppContext';

const NAV_ITEMS = [
  { key: 'chat',     icon: '🏠', labels: { en: 'Home', hi: 'होम', bn: 'হোম', as: 'হোম', default: 'Home' } },
  { key: 'stage',    icon: '🌤️', labels: { en: 'Weather', hi: 'मौसम', bn: 'আবহাওয়া', as: 'বতৰ', default: 'Weather' } },
  { key: 'alerts',   icon: '🚨', labels: { en: 'Alerts', hi: 'अलर्ट', bn: 'সতর্কতা', as: 'সতৰ্কতা', default: 'Alerts' } },
  { key: 'research', icon: '🔬', labels: { en: 'Tools', hi: 'टूल्स', bn: 'সরঞ্জাম', as: 'সঁজুলি', default: 'Tools' } },
];

function getLabel(item, lang) {
  return item.labels[lang] || item.labels.default;
}

export default function BottomNav() {
  const { state, dispatch } = useApp();
  const lang = state.language || 'en';

  const handleSOS = () => {
    window.dispatchEvent(new CustomEvent('weathergpt-open-sos'));
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[60] md:hidden"
      style={{
        background: 'var(--header-bg)',
        borderTop: '1px solid var(--theme-border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-stretch h-[58px]">
        {NAV_ITEMS.map((item) => {
          const isActive = state.activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: item.key })}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95"
              style={{
                color: isActive ? 'var(--theme-accent)' : 'var(--text-secondary)',
                borderBottom: isActive ? '2.5px solid var(--theme-accent)' : '2.5px solid transparent',
                background: 'transparent',
              }}
              aria-label={getLabel(item, lang)}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="text-[9px] font-semibold tracking-wide" style={{ fontWeight: isActive ? 700 : 500 }}>
                {getLabel(item, lang)}
              </span>
            </button>
          );
        })}

        {/* SOS Tab — always red */}
        <button
          onClick={handleSOS}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all"
          style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff' }}
          aria-label="Emergency SOS"
        >
          <span className="text-xl leading-none">🆘</span>
          <span className="text-[9px] font-black tracking-wide">
            {lang === 'hi' || lang === 'mr' || lang === 'pa' || lang === 'gu' ? 'एसओएस' : 'SOS'}
          </span>
        </button>
      </div>
    </nav>
  );
}
