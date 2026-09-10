import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LANGUAGES } from '../utils/constants';

const DOMAINS = [
  {
    code: 'farmer',
    emoji: '🌾',
    title: 'Farmer',
    hindi: 'किसान',
    desc: 'Crop health, pesticide timing & safe spray alerts',
  },
  {
    code: 'fisherman',
    emoji: '🎣',
    title: 'Fisherman',
    hindi: 'मछुआरा',
    desc: 'Sea conditions, wave heights & coastal warnings',
  },
  {
    code: 'aviation',
    emoji: '✈️',
    title: 'Aviation & Drone',
    hindi: 'उड्डयन / ड्रोन',
    desc: 'Runway visibility, wind shear & flight weather',
  },
  {
    code: 'urbanPlanning',
    emoji: '🏙️',
    title: 'City & Commute',
    hindi: 'शहरी नागरिक',
    desc: 'Air quality (AQI), heatwave & drainage flood risk',
  },
  {
    code: 'general',
    emoji: '🌍',
    title: 'General Citizen',
    hindi: 'आम नागरिक',
    desc: 'Daily weather forecast, rain alerts & SOS safety',
  },
];

const POPULAR_LANGS = ['hi', 'en', 'bn', 'mr', 'ta', 'te', 'gu', 'pa', 'kn', 'ml', 'or', 'as'];

const JUDGE_PRESETS = [
  { label: '🌾 Kisan (Hi)', role: 'farmer', lang: 'hi' },
  { label: '🎣 Machhua (Bn)', role: 'fisherman', lang: 'bn' },
  { label: '✈️ Pilot (En)', role: 'aviation', lang: 'en' },
  { label: '🏙️ City AQI (En)', role: 'urbanPlanning', lang: 'en' },
];

export default function Onboarding() {
  const { state, dispatch } = useApp();
  const [selectedDomain, setSelectedDomain] = useState('farmer');
  const [selectedLang, setSelectedLang] = useState('hi');

  const isLight = state.uiTheme === 'light';

  const handleStart = () => {
    dispatch({ type: 'SET_PROFILE', payload: selectedDomain });
    dispatch({ type: 'SET_LANGUAGE', payload: selectedLang });
    dispatch({ type: 'SET_ONBOARDED' });
  };

  const handlePreset = (p) => {
    setSelectedDomain(p.role);
    setSelectedLang(p.lang);
    dispatch({ type: 'SET_PROFILE', payload: p.role });
    dispatch({ type: 'SET_LANGUAGE', payload: p.lang });
  };

  const activeLangObj = LANGUAGES.find(l => l.code === selectedLang) || { label: 'Hindi', nativeLabel: 'हिन्दी' };

  return (
    <div
      style={{
        minHeight: '100dvh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
        backgroundColor: isLight ? '#f6f7fb' : '#0a0e17',
        color: isLight ? '#1e293b' : '#f8fafc',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Top Simple Bar */}
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '28px', height: '28px', borderRadius: '7px' }} />
          <span style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.3px' }}>
            Weather<span style={{ color: '#f59e0b' }}>GPT</span>
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '6px',
              backgroundColor: isLight ? '#e2e8f0' : '#1e293b',
              color: isLight ? '#475569' : '#94a3b8',
            }}
          >
            SIH 2026
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => dispatch({ type: 'SET_UI_THEME', payload: isLight ? 'dark' : 'light' })}
            title="Toggle theme"
            style={{
              padding: '5px 9px',
              borderRadius: '8px',
              border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
              backgroundColor: isLight ? '#ffffff' : '#1e293b',
              color: isLight ? '#334155' : '#e2e8f0',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            {isLight ? '🌙' : '☀️'}
          </button>

          <button
            onClick={() => dispatch({ type: 'SET_ONBOARDED' })}
            style={{
              padding: '5px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              color: isLight ? '#64748b' : '#94a3b8',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Skip →
          </button>
        </div>
      </div>

      {/* Main Clean Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: isLight ? '#ffffff' : '#111827',
          border: `1px solid ${isLight ? '#e2e8f0' : '#1f2937'}`,
          borderRadius: '20px',
          padding: '24px 20px',
          boxShadow: isLight ? '0 10px 30px rgba(0,0,0,0.05)' : '0 12px 40px rgba(0,0,0,0.4)',
          boxSizing: 'border-box',
        }}
      >
        {/* Title */}
        <div style={{ marginBottom: '20px' }}>
          <h1
            style={{
              margin: '0 0 4px',
              fontSize: '22px',
              fontWeight: 800,
              letterSpacing: '-0.4px',
              color: isLight ? '#0f172a' : '#ffffff',
            }}
          >
            Welcome to WeatherGPT
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: '13px',
              color: isLight ? '#64748b' : '#94a3b8',
              lineHeight: 1.4,
            }}
          >
            मौसम की सटीक जानकारी, आपके काम के अनुसार। Choose your role to get started.
          </p>
        </div>

        {/* Question 1: Select Category */}
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              color: isLight ? '#475569' : '#94a3b8',
              marginBottom: '10px',
            }}
          >
            1. What do you do? / आपकी श्रेणी
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {DOMAINS.map((d) => {
              const isSelected = selectedDomain === d.code;
              return (
                <button
                  key={d.code}
                  onClick={() => setSelectedDomain(d.code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: `1.5px solid ${isSelected ? (isLight ? '#059669' : '#10b981') : (isLight ? '#e2e8f0' : '#1f2937')}`,
                    backgroundColor: isSelected
                      ? (isLight ? '#ecfdf5' : 'rgba(16,185,129,0.12)')
                      : (isLight ? '#f8fafc' : '#161e2e'),
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    boxSizing: 'border-box',
                    width: '100%',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <span style={{ fontSize: '22px', flexShrink: 0 }}>{d.emoji}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: isSelected ? (isLight ? '#065f46' : '#34d399') : (isLight ? '#0f172a' : '#f1f5f9') }}>
                        {d.title} <span style={{ fontSize: '12px', fontWeight: 500, color: isLight ? '#64748b' : '#94a3b8' }}>({d.hindi})</span>
                      </div>
                      <div style={{ fontSize: '11px', color: isLight ? '#64748b' : '#94a3b8', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {d.desc}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: `1.5px solid ${isSelected ? (isLight ? '#059669' : '#10b981') : (isLight ? '#94a3b8' : '#475569')}`,
                      backgroundColor: isSelected ? (isLight ? '#059669' : '#10b981') : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginLeft: '10px',
                    }}
                  >
                    {isSelected && <span style={{ color: '#ffffff', fontSize: '10px', fontWeight: 900 }}>✓</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Question 2: Select Language */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label
              style={{
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                color: isLight ? '#475569' : '#94a3b8',
              }}
            >
              2. Select Language / भाषा
            </label>
            <span style={{ fontSize: '12px', fontWeight: 600, color: isLight ? '#059669' : '#10b981' }}>
              {activeLangObj.nativeLabel} ({activeLangObj.label})
            </span>
          </div>

          {/* Quick Scrollable Chips ("Select from scroll") */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '8px',
              marginBottom: '8px',
              WebkitOverflowScrolling: 'touch',
            }}
            className="wg-lang-scroll"
          >
            {POPULAR_LANGS.map((code) => {
              const lo = LANGUAGES.find(l => l.code === code) || { nativeLabel: code, label: code };
              const isSel = selectedLang === code;
              return (
                <button
                  key={code}
                  onClick={() => setSelectedLang(code)}
                  style={{
                    flexShrink: 0,
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: `1px solid ${isSel ? (isLight ? '#059669' : '#10b981') : (isLight ? '#cbd5e1' : '#334155')}`,
                    backgroundColor: isSel
                      ? (isLight ? '#059669' : '#10b981')
                      : (isLight ? '#f1f5f9' : '#1e293b'),
                    color: isSel ? '#ffffff' : (isLight ? '#334155' : '#cbd5e1'),
                    fontSize: '12px',
                    fontWeight: isSel ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {lo.nativeLabel}
                </button>
              );
            })}
          </div>

          {/* Dropdown for All Languages */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              style={{
                width: '100%',
                appearance: 'none',
                WebkitAppearance: 'none',
                padding: '8px 32px 8px 12px',
                borderRadius: '10px',
                border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
                backgroundColor: isLight ? '#f8fafc' : '#161e2e',
                color: isLight ? '#0f172a' : '#f8fafc',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} style={{ backgroundColor: isLight ? '#ffffff' : '#1e293b', color: isLight ? '#0f172a' : '#ffffff' }}>
                  {l.nativeLabel} — {l.label}
                </option>
              ))}
            </select>
            <div
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                fontSize: '10px',
                color: isLight ? '#64748b' : '#94a3b8',
              }}
            >
              ▼
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={handleStart}
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: isLight ? '#059669' : '#10b981',
            color: '#ffffff',
            fontSize: '15px',
            fontWeight: 800,
            letterSpacing: '-0.2px',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
            transition: 'opacity 0.2s',
          }}
        >
          Get Started →
        </button>

        {/* Judge Quick Presets (Subtle, discreet for SIH evaluation) */}
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${isLight ? '#f1f5f9' : '#1f2937'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: isLight ? '#94a3b8' : '#64748b' }}>
              Quick Presets:
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {JUDGE_PRESETS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handlePreset(p)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: `1px solid ${isLight ? '#e2e8f0' : '#334155'}`,
                    backgroundColor: isLight ? '#f8fafc' : '#1e293b',
                    color: isLight ? '#64748b' : '#94a3b8',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Footer */}
      <div
        style={{
          marginTop: '16px',
          fontSize: '11px',
          color: isLight ? '#94a3b8' : '#64748b',
          textAlign: 'center',
        }}
      >
        IMD & MoES Weather Feeds · 100% Client-Side · Zero Login Required
      </div>

      <style>{`
        .wg-lang-scroll::-webkit-scrollbar {
          display: none;
        }
        .wg-lang-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
