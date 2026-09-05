import React from 'react';
import { Award, AlertTriangle, CalendarCheck, CalendarX } from 'lucide-react';
import { EventPerformanceCard, HighlightsData } from '../../types';

interface EventPerformanceProps {
  events: EventPerformanceCard[];
  highlights?: HighlightsData;
}

export const EventPerformanceCards: React.FC<EventPerformanceProps> = ({ events, highlights }) => {
  return (
    <div className="space-y-5">
      {/* Event Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {events.map(card => {
          const isAchieved = card.target_achieved === true;
          const isNoData = card.accuracy === null;
          const pct = card.accuracy || 0;

          // Circular progress math (r = 38, perimeter = 2 * PI * 38 ≈ 238.76)
          const radius = 38;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = isNoData ? circumference : circumference - (pct / 100) * circumference;

          return (
            <div key={card.event} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">Event Performance</span>
                  <h4 className="text-lg font-extrabold text-slate-900 tracking-tight mt-0.5">{card.event}</h4>
                </div>

                {/* Target badge */}
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 font-medium block">Target: {card.target}%</span>
                  <div className="mt-0.5">
                    {isNoData ? (
                      <span className="text-xs text-slate-400 font-semibold">● NO DATA</span>
                    ) : isAchieved ? (
                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 justify-end">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        TARGET ACHIEVED
                      </span>
                    ) : (
                      <span className="text-xs text-rose-600 font-bold flex items-center gap-1 justify-end">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        BELOW TARGET
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                {/* Circular Progress */}
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r={radius}
                      stroke="#f1f5f9"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r={radius}
                      stroke={isAchieved ? '#10b981' : (isNoData ? '#cbd5e1' : '#f59e0b')}
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-base font-extrabold text-slate-900 leading-none">
                      {isNoData ? '—' : `${pct.toFixed(1)}%`}
                    </span>
                    <span className="text-[9px] text-slate-500 font-medium mt-0.5">Accuracy</span>
                  </div>
                </div>

                {/* Stats list */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-slate-500">Total Inspections:</span>
                    <span className="font-bold text-slate-800">{card.total.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-emerald-600 font-medium">Valid:</span>
                    <span className="font-bold text-emerald-700">{card.valid.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-rose-600 font-medium">Invalid:</span>
                    <span className="font-bold text-rose-700">{card.invalid.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Highlights: Best/Worst Cards */}
      {highlights && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Best Day */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
              <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Best Day</span>
            </div>
            <div className="mt-1 text-sm font-bold text-slate-900 truncate">
              {highlights.best_day?.date || '—'}
            </div>
            <div className="text-xs font-semibold text-emerald-600">
              {highlights.best_day ? `${highlights.best_day.accuracy.toFixed(2)}%` : 'No data'}
            </div>
          </div>

          {/* Worst Day */}
          <div className="bg-rose-50/70 border border-rose-200/80 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-800 uppercase tracking-wider">
              <CalendarX className="w-3.5 h-3.5 text-rose-600" />
              <span>Worst Day</span>
            </div>
            <div className="mt-1 text-sm font-bold text-slate-900 truncate">
              {highlights.worst_day?.date || '—'}
            </div>
            <div className="text-xs font-semibold text-rose-600">
              {highlights.worst_day ? `${highlights.worst_day.accuracy.toFixed(2)}%` : 'No data'}
            </div>
          </div>

          {/* Best Event */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-800 uppercase tracking-wider">
              <Award className="w-3.5 h-3.5 text-blue-600" />
              <span>Best Event</span>
            </div>
            <div className="mt-1 text-sm font-bold text-slate-900 truncate">
              {highlights.best_event?.event || '—'}
            </div>
            <div className="text-xs font-semibold text-blue-600">
              {highlights.best_event ? `${highlights.best_event.accuracy.toFixed(2)}%` : 'No data'}
            </div>
          </div>

          {/* Needs Attention */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-800 uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Needs Attention</span>
            </div>
            <div className="mt-1 text-sm font-bold text-slate-900 truncate">
              {highlights.needs_attention?.event || '—'}
            </div>
            <div className="text-xs font-semibold text-amber-600">
              {highlights.needs_attention ? `${highlights.needs_attention.accuracy.toFixed(2)}%` : 'No data'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
