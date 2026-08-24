import React from 'react';
import { useApp } from '../context/AppContext';
import { getSkyBandGradient } from '../utils/weatherConditions';

export default function SkyBand({ overrideCondition, overrideLoading }) {
  const { state } = useApp();
  const weatherCondition = overrideCondition || state.weatherCondition;
  const isLoading = overrideLoading !== undefined ? overrideLoading : state.isLoading;

  const gradient = getSkyBandGradient(weatherCondition);

  // Combine animation classes based on state
  const animClass = isLoading
    ? 'sky-drift sky-pulse'
    : weatherCondition === 'rain' || weatherCondition === 'storm'
      ? 'sky-drift sky-rain'
      : 'sky-drift';

  return (
    <div
      className={`sky-band fixed top-0 left-0 right-0 z-50 h-[6px] ${animClass}`}
      style={{ background: gradient }}
      role="presentation"
      aria-hidden="true"
    />
  );
}
