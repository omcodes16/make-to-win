import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Inline reload handler — clears versioned weather cache keys then refreshes
function handleCrashReload() {
  ['weathergpt-stage-cache', 'weathergpt-cache', 'weathergpt-saved-locations']
    .forEach(k => localStorage.removeItem(k));
  window.location.reload();
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error('[WeatherGPT] Crash:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#1e1b4b,#312e81)', color: 'white', padding: '24px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⛅</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>WeatherGPT needs a refresh</h2>
          <p style={{ opacity: 0.6, marginBottom: '24px', maxWidth: '320px', lineHeight: 1.5 }}>A temporary glitch occurred. Tap below to reload and continue.</p>
          <button
            onClick={handleCrashReload}
            style={{ padding: '12px 28px', background: '#6366f1', border: 'none', borderRadius: '99px', color: 'white', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}
          >
            🔄 Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
