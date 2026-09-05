import React from 'react';
import { Factory, Trophy, AlertTriangle } from 'lucide-react';
import { LinePerformanceItem } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface LinePerformanceProps {
  lines: LinePerformanceItem[];
  bestLine: string | null;
  worstLine: string | null;
  linesBelowTarget: string[];
}

export const LinePerformance: React.FC<LinePerformanceProps> = ({
  lines,
  bestLine,
  worstLine,
  linesBelowTarget
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Factory className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Production Line Performance</h3>
          </div>
        </div>

        {/* Lines list */}
        <div className="space-y-3.5">
          {lines.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No production line data available
            </div>
          ) : (
            lines.map(l => {
              const acc = l.accuracy || 0;
              const isBest = l.line === bestLine;
              const isWorst = l.line === worstLine && lines.length > 1;
              const isBelow = linesBelowTarget.includes(l.line);

              return (
                <div key={l.line} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{l.line}</span>
                      {isBest && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded flex items-center gap-1">
                          <Trophy className="w-2.5 h-2.5" /> Best Line
                        </span>
                      )}
                      {isWorst && isBelow && (
                        <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" /> Needs Attention
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-extrabold text-slate-900">
                        {l.accuracy !== null ? `${l.accuracy.toFixed(2)}%` : '—'}
                      </span>
                      <StatusBadge status={l.status} size="sm" />
                    </div>
                  </div>

                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        l.status === 'Good'
                          ? 'bg-emerald-500'
                          : l.status === 'Warning'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${acc}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Summary Footer */}
      {linesBelowTarget.length > 0 && (
        <div className="mt-5 pt-3 border-t border-slate-100 text-xs text-amber-700 bg-amber-50/50 p-2.5 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            <strong className="font-semibold">{linesBelowTarget.join(', ')}</strong> {linesBelowTarget.length === 1 ? 'is' : 'are'} operating below target quality thresholds.
          </span>
        </div>
      )}
    </div>
  );
};
