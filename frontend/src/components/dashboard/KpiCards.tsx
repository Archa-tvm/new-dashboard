import React from 'react';
import { Layers, CheckCircle, XCircle, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { KpiSummary } from '../../types';

interface KpiCardsProps {
  data: KpiSummary;
  loading?: boolean;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ data, loading }) => {
  const isAboveTarget = data.overall_accuracy !== null && data.overall_accuracy >= data.target_accuracy;
  const isNoData = data.total_events === 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* 1. Total Events */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Total Events</span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isNoData ? '—' : data.total_events.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center text-xs text-slate-500">
            <span>Raw inspection events recorded</span>
          </div>
        </div>
        {/* Subtle bottom indicator */}
        <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full" style={{ width: '100%' }}></div>
        </div>
      </div>

      {/* 2. Valid Events */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-emerald-600 uppercase">Valid Events</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isNoData ? '—' : data.valid_events.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center text-xs text-emerald-600 font-semibold">
            {isNoData || data.valid_percentage === null ? (
              <span>— of total</span>
            ) : (
              <span>{data.valid_percentage.toFixed(2)}% of total</span>
            )}
          </div>
        </div>
        <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${data.valid_percentage || 0}%` }}
          ></div>
        </div>
      </div>

      {/* 3. Invalid Events */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-rose-600 uppercase">Invalid Events</span>
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isNoData ? '—' : data.invalid_events.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center text-xs text-rose-600 font-semibold">
            {isNoData || data.invalid_rate === null ? (
              <span>— of total</span>
            ) : (
              <span>{data.invalid_rate.toFixed(2)}% of total</span>
            )}
          </div>
        </div>
        <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-rose-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(data.invalid_rate || 0, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* 4. Overall Accuracy */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Overall Accuracy</span>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isNoData
              ? 'bg-slate-100 text-slate-500'
              : isAboveTarget
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-amber-50 text-amber-600'
          }`}>
            <Target className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {isNoData || data.overall_accuracy === null ? '—' : `${data.overall_accuracy.toFixed(2)}%`}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Target: {data.target_accuracy}%
            </span>
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold">
            {isNoData ? (
              <span className="text-slate-400">NO DATA</span>
            ) : isAboveTarget ? (
              <span className="text-emerald-600 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                ✓ ABOVE TARGET
              </span>
            ) : (
              <span className="text-rose-600 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                ⚠ BELOW TARGET
              </span>
            )}
          </div>
        </div>
        <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isAboveTarget ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            style={{ width: `${Math.min(data.overall_accuracy || 0, 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};
