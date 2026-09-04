import { useEffect, useRef, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';

/**
 * Resolves the appropriate WebSocket URL across local dev, Docker, and production deployments.
 */
function getWebSocketUrl() {
  const metaEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

  // 1. Explicit WS override
  if (metaEnv.VITE_WS_URL) {
    return metaEnv.VITE_WS_URL;
  }

  // 2. Derive from API URL if provided
  if (metaEnv.VITE_API_URL) {
    return metaEnv.VITE_API_URL.replace(/^http:\/\//, 'ws://').replace(/^https:\/\//, 'wss://');
  }

  // 3. Fallback to browser location
  if (typeof window !== 'undefined') {
    const isSecure = window.location.protocol === 'https:';
    const protocol = isSecure ? 'wss:' : 'ws:';
    const hostname = window.location.hostname;

    // In local Vite development (port 5173), Express runs on port 3001
    if (window.location.port === '5173') {
      return `${protocol}//${hostname}:3001`;
    }

    // In production / Docker / unified port
    return `${protocol}//${window.location.host}`;
  }

  return 'ws://localhost:3001';
}

/**
 * Custom hook to connect to the WeatherGPT Real-Time Disaster Alert System.
 * - Receives instantaneous pushes for authority and radius alerts
 * - Filters updates based on reported location
 * - Reconnects automatically with exponential backoff
 * - Activates fallback REST polling when disconnected
 */
export function useAlertSocket() {
  const { state, dispatch } = useApp();
  const [isConnected, setIsConnected] = useState(false);
  const [socketStatus, setSocketStatus] = useState('disconnected'); // 'connecting' | 'connected' | 'reconnecting' | 'fallback_polling'
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const fallbackPollIntervalRef = useRef(null);
  const retryCountRef = useRef(0);

  const stageData = state.weatherStageData;
  const activeLat = stageData?.lat;
  const activeLng = stageData?.lng;
  const activeState = stageData?.state || stageData?.locationName;
  const activeDistrict = stageData?.district;

  // Fallback REST polling function (runs only if WebSocket is disconnected)
  const pollAlertsRest = useCallback(async () => {
    if (!activeLat || !activeLng) return;
    try {
      const metaEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
      const baseUrl = (metaEnv.VITE_API_URL || '').replace(/\/+$/, '');
      const url = `${baseUrl}/api/alerts?state=${encodeURIComponent(activeState || '')}&district=${encodeURIComponent(activeDistrict || '')}&lat=${activeLat}&lng=${activeLng}`;
      const res = await fetch(url);
      if (res.ok) {
        const alerts = await res.json();
        if (Array.isArray(alerts)) {
          dispatch({ type: 'SET_GOVERNMENT_ALERTS', payload: alerts });
        }
      }
    } catch (err) {
      console.warn('[Alerts REST Fallback] Poll error:', err.message);
    }
  }, [activeLat, activeLng, activeState, activeDistrict, dispatch]);

  // Send current location to WebSocket server for spatial radius filtering
  const sendLocationUpdate = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (activeLat && activeLng) {
        wsRef.current.send(JSON.stringify({
          type: 'register_location',
          lat: activeLat,
          lng: activeLng,
          state: activeState || '',
          district: activeDistrict || ''
        }));
      }
    }
  }, [activeLat, activeLng, activeState, activeDistrict]);

  // Establish WebSocket connection
  const connect = useCallback(() => {
    if (typeof window === 'undefined' || typeof WebSocket === 'undefined') return;

    if (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN)) {
      return;
    }

    const wsUrl = getWebSocketUrl();
    setSocketStatus(retryCountRef.current === 0 ? 'connecting' : 'reconnecting');

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setSocketStatus('connected');
        retryCountRef.current = 0;

        // Clear fallback polling once WebSocket is alive
        if (fallbackPollIntervalRef.current) {
          clearInterval(fallbackPollIntervalRef.current);
          fallbackPollIntervalRef.current = null;
        }

        // Send active location on connection
        sendLocationUpdate();

        // Start ping heartbeat every 25 seconds
        if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'authority_alert') {
            // New instant disaster alert delivered
            if (data.alert) {
              dispatch({ type: 'PUSH_LIVE_ALERT', payload: data.alert });
            }
          } else if (data.type === 'authority_alert_dismissed') {
            // Authority dismissed an active alert
            if (data.alertId) {
              dispatch({ type: 'DISMISS_LIVE_ALERT', payload: data.alertId });
            }
          } else if (data.type === 'sos_status_update') {
            // Live SOS rescue status updated by disaster officer
            dispatch({ type: 'UPDATE_SOS_STATUS', payload: data });
          } else if (data.type === 'new_sos_alert') {
            // Real-time SOS incident delivered to connected clients/portal
            if (data.sos) {
              window.dispatchEvent(new CustomEvent('weathergpt-new-sos', { detail: data.sos }));
            }
          }
        } catch (e) {
          console.warn('[WS Parse Error]:', e);
        }
      };

      ws.onerror = (err) => {
        // Handled silently by onclose
      };

      ws.onclose = () => {
        setIsConnected(false);
        setSocketStatus('reconnecting');
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        // Activate REST polling fallback if WebSocket is offline
        if (!fallbackPollIntervalRef.current) {
          setSocketStatus('fallback_polling');
          pollAlertsRest();
          fallbackPollIntervalRef.current = setInterval(pollAlertsRest, 30000); // Poll every 30s
        }

        // Exponential backoff reconnect: 1.5s, 2.25s, 3.3s ... up to 30s max
        const backoff = Math.min(1500 * Math.pow(1.5, retryCountRef.current), 30000);
        const jitter = Math.random() * 500;
        retryCountRef.current += 1;

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, backoff + jitter);
      };

    } catch (err) {
      console.warn('[WS Connection Error]:', err.message);
      // Ensure fallback polling is running
      if (!fallbackPollIntervalRef.current) {
        setSocketStatus('fallback_polling');
        pollAlertsRest();
        fallbackPollIntervalRef.current = setInterval(pollAlertsRest, 30000);
      }
    }
  }, [sendLocationUpdate, pollAlertsRest, dispatch]);

  // Initialize connection on component mount
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (fallbackPollIntervalRef.current) clearInterval(fallbackPollIntervalRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  // Sync location changes immediately over open WebSocket
  useEffect(() => {
    if (isConnected) {
      sendLocationUpdate();
    }
  }, [activeLat, activeLng, activeState, activeDistrict, isConnected, sendLocationUpdate]);

  return {
    isConnected,
    socketStatus,
    sendLocationUpdate
  };
}
