import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function AuthorityQrScannerModal({ onClose, onScanSuccess }) {
  const [errorMsg, setErrorMsg] = useState('');
  const [scannedSos, setScannedSos] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameIdRef = useRef(null);

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const playSuccessChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      // Two-tone rescue intake chirp
      osc.frequency.setValueAtTime(587, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  };

  const startCamera = async () => {
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        setCameraActive(true);
        requestScanFrame();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setErrorMsg('Camera access denied or unavailable. Please check browser permissions.');
    }
  };

  const stopCamera = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const requestScanFrame = () => {
    animFrameIdRef.current = requestAnimationFrame(scanTick);
  };

  const scanTick = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestScanFrame();
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert'
    });

    if (code && code.data) {
      try {
        const parsed = JSON.parse(code.data);
        if (parsed.type === 'WEATHERGPT_SOS') {
          handleDetectedSos(parsed);
          return;
        }
      } catch (e) {
        // Continue scanning
      }
    }

    requestScanFrame();
  };

  const handleDetectedSos = async (parsed) => {
    stopCamera();
    playSuccessChime();
    setScannedSos(parsed);
    setIsSubmitting(true);

    const payload = {
      name: parsed.name || 'Citizen (Airplane Mode)',
      phone: parsed.phone || '',
      helpType: parsed.help || 'General Emergency',
      message: ('[DIRECT AIR OPTICAL SCAN — Airplane Mode Incident] ' + (parsed.msg || '')).trim(),
      lat: Number(parsed.lat),
      lng: Number(parsed.lng),
      locationNote: 'Direct Air Scan (' + (parsed.note || 'Airplane Mode') + ')',
      locationSource: 'direct_optical_air',
      isOfflineVault: true
    };

    try {
      const res = await fetch((API_URL || '') + '/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (onScanSuccess) {
        onScanSuccess({ ...payload, _id: data.id || ('scan-' + Date.now()), id: data.id || ('scan-' + Date.now()), timestamp: new Date() });
      }
    } catch (err) {
      console.error('Error submitting scanned SOS:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in' onClick={onClose}>
      <div
        className='theme-modal border-2 border-emerald-500/60 rounded-3xl p-6 w-full max-w-md shadow-2xl text-[var(--text-primary)] max-h-[95vh] overflow-y-auto relative text-center'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='space-y-1 mb-3'>
          <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'>
            <span className='w-2 h-2 rounded-full bg-emerald-400 animate-ping'></span>
            Direct Air Intake • Optical Scanner
          </div>
          <h2 className='text-xl font-black text-[var(--text-primary)] tracking-tight'>
            Scan Citizen Rescue Code
          </h2>
          <p className='text-[var(--text-secondary)] text-xs font-medium'>
            Point camera at victim phone screen to ingest their offline SOS ticket with <b>0 Internet required on their phone</b>!
          </p>
        </div>

        {!scannedSos && (
          <div className='relative w-full aspect-square rounded-2xl overflow-hidden bg-black border-2 border-emerald-500/40 shadow-inner my-3'>
            <video ref={videoRef} className='w-full h-full object-cover' />
            <canvas ref={canvasRef} className='hidden' />

            <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
              <div className='w-56 h-56 border-2 border-emerald-400/80 rounded-2xl relative animate-pulse'>
                <div className='absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400'></div>
                <div className='absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400'></div>
                <div className='absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400'></div>
                <div className='absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400'></div>
                <div className='w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-bounce'></div>
              </div>
            </div>

            {errorMsg && (
              <div className='absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-4 text-xs text-red-400 space-y-2'>
                <span className='text-3xl'>????</span>
                <p>{errorMsg}</p>
                <button
                  onClick={startCamera}
                  className='py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl'
                >
                  Retry Camera
                </button>
              </div>
            )}
          </div>
        )}

        {scannedSos && (
          <div className='space-y-3 my-4 animate-fade-in'>
            <div className='w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-emerald-500/30'>
              ?
            </div>
            <div>
              <h3 className='text-lg font-black text-emerald-400'>Direct Optical Transfer Complete!</h3>
              <p className='text-xs text-[var(--text-secondary)]'>Incident successfully ingested from Airplane Mode victim.</p>
            </div>

            <div className='bg-black/50 border border-emerald-500/30 rounded-2xl p-4 text-left font-mono text-xs text-neutral-300 space-y-2'>
              <div className='flex justify-between border-b border-white/10 pb-1.5'>
                <span className='text-neutral-500'>VICTIM:</span>
                <span className='font-bold text-white'>{scannedSos.name || 'Anonymous'}</span>
              </div>
              <div className='flex justify-between border-b border-white/10 pb-1.5'>
                <span className='text-neutral-500'>HELP CATEGORY:</span>
                <span className='font-bold text-red-400'>{scannedSos.help || 'General'}</span>
              </div>
              <div className='flex justify-between border-b border-white/10 pb-1.5'>
                <span className='text-neutral-500'>GPS COORDS:</span>
                <span className='font-bold text-amber-300'>{Number(scannedSos.lat)?.toFixed(4)}°, {Number(scannedSos.lng)?.toFixed(4)}°</span>
              </div>
              {scannedSos.phone && (
                <div className='flex justify-between border-b border-white/10 pb-1.5'>
                  <span className='text-neutral-500'>PHONE:</span>
                  <span className='font-bold text-blue-300'>{scannedSos.phone}</span>
                </div>
              )}
            </div>

            <a
              href={'https://www.google.com/maps?q=' + scannedSos.lat + ',' + scannedSos.lng}
              target='_blank'
              rel='noopener noreferrer'
              className='w-full py-2.5 px-3 bg-blue-600/40 hover:bg-blue-600/70 border border-blue-500/40 text-blue-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all'
            >
              ?? Open Exact Coordinates in Google Maps
            </a>
          </div>
        )}

        <div className='flex gap-2 pt-2'>
          {scannedSos ? (
            <button
              type='button'
              onClick={onClose}
              className='w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-xs text-white shadow-lg shadow-emerald-600/30'
            >
              View in Live Triage Queue
            </button>
          ) : (
            <button
              type='button'
              onClick={onClose}
              className='w-full py-2.5 bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)] border border-[var(--theme-border)] text-[var(--text-primary)] rounded-xl font-bold text-xs'
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
