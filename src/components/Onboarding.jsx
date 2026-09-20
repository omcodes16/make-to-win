import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LANGUAGES } from '../utils/constants';

const DOMAINS = [
  {
    code: 'farmer',
    emoji: '🌾',
    title: 'Farmer',
    hindi: 'किसान',
    subtitle: 'फसल स्वास्थ्य, मौसम व छिड़काव सलाह',
    tag: 'Agri AI',
    color: '#10b981',
  },
  {
    code: 'fisherman',
    emoji: '🎣',
    title: 'Fisherman',
    hindi: 'मछुआरा',
    subtitle: 'समुद्री लहरें, तेज हवा व चक्रवात चेतावनी',
    tag: 'Marine',
    color: '#06b6d4',
  },
  {
    code: 'aviation',
    emoji: '✈️',
    title: 'Aviation & Drone',
    hindi: 'उड्डयन / ड्रोन',
    subtitle: 'रनवे दृश्यता, विंड शियर व उड़ान मौसम',
    tag: 'Aero',
    color: '#3b82f6',
  },
  {
    code: 'urbanPlanning',
    emoji: '🏙️',
    title: 'City & Commute',
    hindi: 'शहरी नागरिक',
    subtitle: 'वायु गुणवत्ता (AQI), लू व जलभराव अलर्ट',
    tag: 'Urban AQI',
    color: '#8b5cf6',
  },
  {
    code: 'general',
    emoji: '🌍',
    title: 'General Citizen',
    hindi: 'आम नागरिक',
    subtitle: 'दैनिक बारिश, तापमान व SOS आपातकालीन सुरक्षा',
    tag: 'Civil SOS',
    color: '#14b8a6',
  },
];

const JUDGE_PRESETS = [
  { label: '🌾 Kisan (Hi)', role: 'farmer', lang: 'hi' },
  { label: '🎣 Machhua (Bn)', role: 'fisherman', lang: 'bn' },
  { label: '✈️ Pilot (En)', role: 'aviation', lang: 'en' },
  { label: '🏙️ City AQI (En)', role: 'urbanPlanning', lang: 'en' },
];

export default function Onboarding() {
  const { state, dispatch } = useApp();
  const [selectedDomain, setSelectedDomain] = useState(state.userProfile || 'farmer');
  const [selectedLang, setSelectedLang] = useState(state.language || 'hi');
  const [showLangModal, setShowLangModal] = useState(false);
  const [searchLang, setSearchLang] = useState('');

  const isLight = state.uiTheme === 'light';

  const handleStart = () => {
    dispatch({ type: 'SET_PROFILE', payload: selectedDomain });
    dispatch({ type: 'SET_LANGUAGE', payload: selectedLang });
    dispatch({ type: 'SET_ONBOARDED' });
  };

  const handlePreset = (p) => {
    setSelectedDomain(p.role);
    setSelectedLang(p.lang);
  };

  const activeLangObj =
    LANGUAGES.find((l) => l.code === selectedLang) || {
      code: 'hi',
      label: 'Hindi',
      nativeLabel: 'हिन्दी',
    };

  const filteredLanguages = LANGUAGES.filter((l) => {
    const q = searchLang.toLowerCase().trim();
    if (!q) return true;
    return (
      l.label.toLowerCase().includes(q) ||
      l.nativeLabel.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q)
    );
  });

  // UI Theme Colors with guaranteed high contrast
  const colors = {
    bg: isLight ? '#f1f5f9' : '#080d1a',
    cardBg: isLight ? '#ffffff' : '#0f172a',
    cardBorder: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)',
    textPrimary: isLight ? '#0f172a' : '#f8fafc',
    textSecondary: isLight ? '#475569' : '#94a3b8',
    textMuted: isLight ? '#64748b' : '#64748b',
    accent: isLight ? '#059669' : '#10b981',
    accentGlow: isLight ? 'rgba(5, 150, 105, 0.2)' : 'rgba(16, 185, 129, 0.25)',
    itemHover: isLight ? '#f8fafc' : '#1e293b',
    itemBorder: isLight ? '#e2e8f0' : '#1e293b',
    modalBg: isLight ? '#ffffff' : '#0f172a',
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px 12px',
        boxSizing: 'border-box',
        backgroundColor: colors.bg,
        color: colors.textPrimary,
        fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
        position: 'relative',
      }}
    >
      {/* Ambient Cool Glow Elements */}
      <div
        style={{
          position: 'fixed',
          top: '-10%',
          left: '-10%',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: isLight
            ? 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '-10%',
          right: '-10%',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: isLight
            ? 'radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {/* Top Navbar */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '2px 4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '7px',
                background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
              }}
            >
              <img
                src="/logo.png"
                alt="Logo"
                style={{ width: '22px', height: '22px', borderRadius: '5px', objectFit: 'contain' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <span style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '-0.3px', color: colors.textPrimary }}>
              Weather<span style={{ color: colors.accent }}>GPT</span>
            </span>
            <span
              style={{
                fontSize: '9.5px',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '20px',
                backgroundColor: isLight ? '#ecfdf5' : 'rgba(16,185,129,0.15)',
                color: isLight ? '#047857' : '#34d399',
                border: `1px solid ${isLight ? '#a7f3d0' : 'rgba(16,185,129,0.3)'}`,
              }}
            >
              SIH 2026
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() =>
                dispatch({
                  type: 'SET_UI_THEME',
                  payload: isLight ? 'dark' : 'light',
                })
              }
              title={isLight ? 'Dark Mode' : 'Light Mode'}
              style={{
                padding: '4px 8px',
                borderRadius: '8px',
                border: `1px solid ${colors.cardBorder}`,
                backgroundColor: colors.cardBg,
                color: colors.textSecondary,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {isLight ? '🌙' : '☀️'}
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: 'SET_ONBOARDED' })}
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'transparent',
                color: colors.textSecondary,
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Skip →
            </button>
          </div>
        </header>

        {/* Main Card (Fits perfectly on mobile) */}
        <main
          style={{
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: '18px',
            padding: '14px 14px 12px',
            boxShadow: isLight
              ? '0 10px 25px -5px rgba(0,0,0,0.06), 0 4px 6px -2px rgba(0,0,0,0.02)'
              : '0 20px 40px -10px rgba(0,0,0,0.6)',
            boxSizing: 'border-box',
          }}
        >
          {/* Card Header */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 900,
                  letterSpacing: '-0.3px',
                  color: colors.textPrimary,
                }}
              >
                Welcome to Weather<span style={{ color: colors.accent }}>GPT</span>
              </h1>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: colors.accent,
                  backgroundColor: isLight ? '#ecfdf5' : 'rgba(16,185,129,0.15)',
                  padding: '2px 7px',
                  borderRadius: '12px',
                  border: `1px solid ${isLight ? '#a7f3d0' : 'rgba(16,185,129,0.3)'}`,
                }}
              >
                Hyperlocal AI
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: '11.5px',
                color: colors.textSecondary,
                lineHeight: 1.35,
              }}
            >
              मौसम की सटीक जानकारी, आपके काम के अनुसार · Choose your role & language.
            </p>
          </div>

          {/* Section 1: Domain Selection (Direct, Cool, Bilingual) */}
          <section style={{ marginBottom: '10px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  color: colors.textSecondary,
                }}
              >
                1. Select Profession / अपनी श्रेणी चुनें:
              </span>
              <span style={{ fontSize: '10px', color: colors.textMuted }}>
                Tailors radar & AI
              </span>
            </div>

            {/* 5 Compact, Punchy Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {DOMAINS.map((d) => {
                const isSelected = selectedDomain === d.code;
                return (
                  <button
                    key={d.code}
                    type="button"
                    onClick={() => setSelectedDomain(d.code)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderRadius: '11px',
                      border: `1.5px solid ${isSelected ? colors.accent : colors.itemBorder}`,
                      backgroundColor: isSelected
                        ? (isLight ? '#ecfdf5' : 'rgba(16,185,129,0.12)')
                        : (isLight ? '#f8fafc' : '#131b2e'),
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.12s ease',
                      boxSizing: 'border-box',
                      width: '100%',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0, flex: 1 }}>
                      {/* Vibrant Emoji Container */}
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: isSelected
                            ? (isLight ? '#d1fae5' : 'rgba(16,185,129,0.25)')
                            : (isLight ? '#ffffff' : '#1e293b'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          flexShrink: 0,
                          boxShadow: isSelected ? '0 2px 6px rgba(16,185,129,0.2)' : 'none',
                        }}
                      >
                        {d.emoji}
                      </div>

                      {/* Direct Hindi & English Info */}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: 800,
                              color: isSelected
                                ? (isLight ? '#065f46' : '#34d399')
                                : colors.textPrimary,
                            }}
                          >
                            {d.title}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: isSelected
                                ? (isLight ? '#059669' : '#6ee7b7')
                                : colors.textSecondary,
                            }}
                          >
                            · {d.hindi}
                          </span>
                          <span
                            style={{
                              marginLeft: 'auto',
                              fontSize: '9px',
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: '4px',
                              backgroundColor: isSelected
                                ? (isLight ? '#a7f3d0' : 'rgba(16,185,129,0.3)')
                                : (isLight ? '#e2e8f0' : '#1e293b'),
                              color: isSelected
                                ? (isLight ? '#065f46' : '#6ee7b7')
                                : colors.textMuted,
                            }}
                          >
                            {d.tag}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: '10.5px',
                            color: colors.textSecondary,
                            marginTop: '1px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {d.subtitle}
                        </div>
                      </div>
                    </div>

                    {/* Radio Indicator */}
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: `1.5px solid ${isSelected ? colors.accent : (isLight ? '#cbd5e1' : '#475569')}`,
                        backgroundColor: isSelected ? colors.accent : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginLeft: '8px',
                      }}
                    >
                      {isSelected && (
                        <span style={{ color: '#ffffff', fontSize: '9px', fontWeight: 900 }}>
                          ✓
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Section 2: Compact Language Window Trigger ("choti si window se select kare") */}
          <section style={{ marginBottom: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '11px',
                border: `1px solid ${colors.itemBorder}`,
                backgroundColor: isLight ? '#f8fafc' : '#131b2e',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🌐</span>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: colors.textMuted }}>
                    Language / भाषा:
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: colors.accent }}>
                    {activeLangObj.nativeLabel}{' '}
                    <span style={{ fontSize: '11px', fontWeight: 600, color: colors.textSecondary }}>
                      ({activeLangObj.label})
                    </span>
                  </div>
                </div>
              </div>

              {/* Click opens the small window/modal */}
              <button
                type="button"
                onClick={() => {
                  setSearchLang('');
                  setShowLangModal(true);
                }}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: `1.5px solid ${colors.accent}`,
                  backgroundColor: isLight ? '#ecfdf5' : 'rgba(16,185,129,0.18)',
                  color: isLight ? '#065f46' : '#34d399',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>भाषा बदलें</span>
                <span style={{ fontSize: '10px' }}>▼</span>
              </button>
            </div>
          </section>

          {/* Primary CTA Button */}
          <button
            onClick={handleStart}
            type="button"
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: '11px',
              border: 'none',
              backgroundColor: colors.accent,
              color: '#ffffff',
              fontSize: '14.5px',
              fontWeight: 800,
              letterSpacing: '-0.2px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              transition: 'transform 0.15s, opacity 0.15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>Get Started · डैशबोर्ड शुरू करें</span>
            <span style={{ fontSize: '16px' }}>→</span>
          </button>

          {/* Evaluation Presets (SIH Judges / Demo) */}
          <div
            style={{
              marginTop: '10px',
              paddingTop: '8px',
              borderTop: `1px solid ${colors.cardBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '4px',
            }}
          >
            <span style={{ fontSize: '10.5px', fontWeight: 700, color: colors.textMuted }}>
              ⚡ Quick Presets:
            </span>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {JUDGE_PRESETS.map((p, i) => {
                const isCurrent = selectedDomain === p.role && selectedLang === p.lang;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handlePreset(p)}
                    style={{
                      padding: '2.5px 7px',
                      borderRadius: '6px',
                      border: `1px solid ${isCurrent ? colors.accent : colors.itemBorder}`,
                      backgroundColor: isCurrent ? (isLight ? '#ecfdf5' : 'rgba(16,185,129,0.2)') : (isLight ? '#f1f5f9' : '#1e293b'),
                      color: isCurrent ? (isLight ? '#065f46' : '#34d399') : colors.textSecondary,
                      fontSize: '10.5px',
                      fontWeight: isCurrent ? 800 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer
          style={{
            fontSize: '10.5px',
            color: colors.textMuted,
            textAlign: 'center',
            padding: '2px 0',
          }}
        >
          IMD & MoES Weather Feeds · 100% Client-Side · Zero Login Required
        </footer>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          "CHOTI SI WINDOW" — Small, Cool Language Selection Modal
          ───────────────────────────────────────────────────────────── */}
      {showLangModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box',
          }}
          onClick={() => setShowLangModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '380px',
              backgroundColor: colors.modalBg,
              border: `1.5px solid ${isLight ? '#cbd5e1' : '#334155'}`,
              borderRadius: '18px',
              padding: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '18px' }}>🌐</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: colors.textPrimary }}>
                  Choose Language / भाषा चुनें
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowLangModal(false)}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  border: `1px solid ${colors.cardBorder}`,
                  backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
                  color: colors.textSecondary,
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Quick Search */}
            <div style={{ marginBottom: '10px' }}>
              <input
                type="text"
                value={searchLang}
                onChange={(e) => setSearchLang(e.target.value)}
                placeholder="Search language / भाषा खोजें..."
                autoFocus
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '9px',
                  border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
                  backgroundColor: isLight ? '#f8fafc' : '#131b2e',
                  color: colors.textPrimary,
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Language Grid (17 Indian Languages) */}
            <div
              style={{
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '6px',
                paddingRight: '2px',
                maxHeight: '320px',
              }}
            >
              {filteredLanguages.map((l) => {
                const isSelected = selectedLang === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setSelectedLang(l.code);
                      setShowLangModal(false);
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: `1.5px solid ${isSelected ? colors.accent : colors.itemBorder}`,
                      backgroundColor: isSelected
                        ? (isLight ? '#ecfdf5' : 'rgba(16,185,129,0.18)')
                        : (isLight ? '#f8fafc' : '#131b2e'),
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.1s ease',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 800,
                          color: isSelected
                            ? (isLight ? '#065f46' : '#34d399')
                            : colors.textPrimary,
                        }}
                      >
                        {l.nativeLabel}
                      </span>
                      {isSelected && (
                        <span style={{ fontSize: '11px', color: colors.accent, fontWeight: 900 }}>
                          ✓
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: '10.5px',
                        color: colors.textSecondary,
                        marginTop: '1px',
                      }}
                    >
                      {l.label} ({l.code.toUpperCase()})
                    </span>
                  </button>
                );
              })}
            </div>

            {filteredLanguages.length === 0 && (
              <div
                style={{
                  padding: '20px',
                  textAlign: 'center',
                  fontSize: '12px',
                  color: colors.textMuted,
                }}
              >
                No matching language found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
