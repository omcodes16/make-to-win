import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export default function SosQrModal({ sosData, onClose }) {
  const [qrUrl, setQrUrl] = useState('');
  const [isSirenActive, setIsSirenActive] = useState(false);
  const audioCtxRef = useRef(null);
  const sirenIntervalRef = useRef(null);

  useEffect(() => {
    if (!sosData) return;

    const payload = {
      type: 'WEATHERGPT_SOS',
      v: 1,
      name: sosData.name || 'Anonymous',
      phone: sosData.phone || '',
      help: sosData.helpType || 'General Emergency',
      msg: sosData.message || '',
      lat: Number(sosData.lat || 0),
      lng: Number(sosData.lng || 0),
      note: sosData.locationNote || 'Offline Airplane Mode',
      src: sosData.locationSource || 'offline_vault',
      time: Date.now(),
    };

    QRCode.toDataURL(JSON.stringify(payload), {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => setQrUrl(url))
      .catch((err) => console.error('QR Generation error:', err));

    return () => {
      stopSiren();
    };
  }, [sosData]);

  const startSiren = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      audioCtxRef.current = new AudioCtx();
      setIsSirenActive(true);

      const playBeep = (freq, duration) => {
        if (!audioCtxRef.current) return;
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      };

      sirenIntervalRef.current = setInterval(() => {
        playBeep(850, 0.35);
        setTimeout(() => playBeep(550, 0.35), 400);
      }, 850);
    } catch (e) {
      console.warn('Audio Context error:', e);
    }
  };

  const stopSiren = () => {
    setIsSirenActive(false);
    if (sirenIntervalRef.current) {
      clearInterval(sirenIntervalRef.current);
      sirenIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {}
      audioCtxRef.current = null;
    }
  };

  return (
    <div className='fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in' onClick={onClose}>
      <div
        className='theme-modal border-2 border-red-500/60 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-[var(--text-primary)] max-h-[92vh] overflow-y-auto relative text-center'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='space-y-1 mb-2'>
          <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/40'>
            <span className='w-2 h-2 rounded-full bg-red-400 animate-ping'></span>
            Direct Air Transfer (Zero Internet)
          </div>
          <h2 className='text-xl font-black text-[var(--text-primary)] tracking-tight'>
            Emergency Rescue Optical Code
          </h2>
          <p className='text-[var(--text-secondary)] text-xs font-medium'>
            Show this screen to any Rescue Officer or Authority Portal camera to transmit directly with <b>Airplane Mode ON</b>!
          </p>
        </div>

        {/* QR Code Container */}
        <div className='bg-white p-3 rounded-2xl shadow-inner border border-neutral-300 inline-block my-2 mx-auto'>
          {qrUrl ? (
            <img src={qrUrl} alt='Rescue QR Code' className='w-56 h-56 mx-auto object-contain' />
          ) : (
            <div className='w-56 h-56 flex items-center justify-center text-black font-bold text-xs'>
              Generating Rescue Code...
            </div>
          )}
        </div>

        {/* Coordinate details */}
        {sosData && (
          <div className='bg-neutral-900/60 border border-neutral-700/60 rounded-xl p-2.5 text-left font-mono text-[11px] text-neutral-300 space-y-1 mb-3'>
            <div className='flex justify-between'>
              <span className='text-neutral-500'>CATEGORY:</span>
              <span className='font-bold text-red-400'>{sosData.helpType || 'Emergency'}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-neutral-500'>GPS:</span>
              <span className='font-bold text-amber-300'>{Number(sosData.lat)?.toFixed(4)}°, {Number(sosData.lng)?.toFixed(4)}°</span>
            </div>
            {sosData.name && (
              <div className='flex justify-between'>
                <span className='text-neutral-500'>NAME:</span>
                <span className='font-semibold text-white'>{sosData.name}</span>
              </div>
            )}
            <div className='text-[10px] text-emerald-400/90 pt-0.5 border-t border-neutral-800'>
              ? 100% Optical Light Transfer • Works in Full Airplane Mode
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className='flex gap-2'>
          <button
            type='button'
            onClick={isSirenActive ? stopSiren : startSiren}
            className={'flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 ' + (isSirenActive ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700')}
          >
            <span>{isSirenActive ? '?? Stop Siren' : '?? Acoustic Siren Beacon'}</span>
          </button>
          <button
            type='button'
            onClick={onClose}
            className='py-2.5 px-5 bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)] border border-[var(--theme-border)] text-[var(--text-primary)] rounded-xl font-bold text-xs transition-colors active:scale-95'
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
