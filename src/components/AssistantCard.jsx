import React from 'react';
import { getWeatherInfo } from '../utils/weatherConditions';

export default function AssistantCard({ message }) {
  const { text, data, advisory, severity, followUp, relevantStat } = message;

  // Get weather info for the icon if we have weather data
  const weatherInfo = data ? getWeatherInfo(data.weatherCode) : null;

  return (
    <div className="flex justify-start mb-6 animate-slide-up">
      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center shadow-lg border border-white/10 mr-3 flex-shrink-0">
        <span className="text-white text-xs font-bold">W</span>
      </div>
      <div className="max-w-[85%] space-y-2">
        {/* Main response card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl rounded-tl-sm shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden">
          {/* Conversational answer */}
          <div className="px-5 pt-4 pb-3">
            <p className="text-[15px] text-white leading-relaxed">{text}</p>
          </div>

          {/* Compact data row */}
          {data && (
            <div className="px-5 py-3 border-t border-white/10 flex items-center gap-4 text-sm bg-white/5">
              {weatherInfo && (
                <span className="text-2xl drop-shadow-md" role="img" aria-label={weatherInfo.label}>
                  {weatherInfo.icon}
                </span>
              )}
              <span className="font-semibold text-lg text-white">
                {data.temperature}°C
              </span>
              {/* Show AI-picked relevant stat if available, otherwise fall back */}
              {relevantStat ? (
                <span className="text-white/70 text-xs font-medium uppercase tracking-wide">
                  {relevantStat}
                </span>
              ) : (
                <>
                  {data.humidity !== undefined && (
                    <span className="text-white/70 font-medium">
                      💧 {data.humidity}%
                    </span>
                  )}
                  {data.windSpeed !== undefined && data.windSpeed > 0 && (
                    <span className="text-white/70 font-medium">
                      💨 {data.windSpeed} km/h
                    </span>
                  )}
                </>
              )}
            </div>
          )}

          {/* Advisory line */}
          {advisory && (
            <div
              className={`px-5 py-3 text-sm font-medium ${
                severity === 'severe'
                  ? 'bg-red-500/20 text-red-400 border-t border-red-500/20'
                  : 'bg-amber-500/20 text-amber-400 border-t border-amber-500/20'
              }`}
            >
              {severity === 'severe' ? '⚠️' : '🔔'} {advisory}
            </div>
          )}
        </div>

        {/* Follow-up text outside the card */}
        {followUp && (
          <p className="text-sm text-white/60 px-2 leading-relaxed">{followUp}</p>
        )}
      </div>
    </div>
  );
}
