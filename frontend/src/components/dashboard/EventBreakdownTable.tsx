import React from 'react';
import { EventBreakdownRow } from '../../types';
import { Table2 } from 'lucide-react';

interface EventBreakdownTableProps {
  data: EventBreakdownRow[];
  loading?: boolean;
}

export const EventBreakdownTable: React.FC<EventBreakdownTableProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-64 mb-4" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-800 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 flex flex-col items-center justify-center text-center min-h-[180px]">
        <Table2 className="w-10 h-10 text-gray-600 mb-3" />
        <p className="text-gray-400 text-sm">No event breakdown data available</p>
        <p className="text-gray-600 text-xs mt-1">Import inspection data to see the PP/TP/FP/FN breakdown</p>
      </div>
    );
  }

  const getEventColor = (event: string) => {
    const lower = event.toLowerCase();
    if (lower === 'opspd') return 'text-blue-400';
    if (lower === 'hndpos') return 'text-purple-400';
    return 'text-cyan-400';
  };

  const getAccuracyBadge = (pct: number | null) => {
    if (pct === null) return <span className="text-gray-500">—</span>;
    const color =
      pct >= 90 ? 'text-emerald-400' :
      pct >= 75 ? 'text-yellow-400' :
      'text-red-400';
    return <span className={`font-bold ${color}`}>{pct.toFixed(2)}%</span>;
  };

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <Table2 className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-base">Event Performance Breakdown</h3>
            <p className="text-gray-400 text-xs mt-0.5">PP / TP / FP / FN metrics per event per date</p>
          </div>
        </div>
        <div className="flex gap-4 text-xs text-gray-500">
          <span><span className="font-semibold text-gray-300">PP</span> = Predicted Positive</span>
          <span><span className="font-semibold text-gray-300">TP</span> = True Positive</span>
          <span><span className="font-semibold text-gray-300">FP</span> = False Positive</span>
          <span><span className="font-semibold text-gray-300">FN</span> = False Negative</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase text-gray-500 bg-gray-800/60">
              <th className="px-6 py-3 text-left font-semibold tracking-wider w-36">Date</th>
              <th className="px-4 py-3 text-left font-semibold tracking-wider">Event</th>
              <th className="px-4 py-3 text-center font-semibold tracking-wider">PP</th>
              <th className="px-4 py-3 text-center font-semibold tracking-wider text-emerald-400">TP</th>
              <th className="px-4 py-3 text-center font-semibold tracking-wider text-red-400">FP</th>
              <th className="px-4 py-3 text-center font-semibold tracking-wider text-orange-400">FN</th>
              <th className="px-4 py-3 text-center font-semibold tracking-wider">Accuracy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {data.map((row, idx) => {
              const isEvenDate = (() => {
                // Track alternating date groups for subtle row banding
                let dateCount = 0;
                let lastDate = '';
                for (let i = 0; i <= idx; i++) {
                  if (data[i].date !== lastDate) { dateCount++; lastDate = data[i].date; }
                }
                return dateCount % 2 === 0;
              })();

              return (
                <tr
                  key={`${row.date}-${row.event}-${idx}`}
                  className={`transition-colors hover:bg-gray-800/40 ${
                    isEvenDate ? 'bg-gray-900/50' : 'bg-gray-850/30'
                  }`}
                >
                  {/* Date cell — show only for first row of that date */}
                  <td className="px-6 py-3.5 text-left align-middle">
                    {row.is_first_in_date ? (
                      <div>
                        <span className="text-white font-semibold text-sm">{row.formatted_date}</span>
                      </div>
                    ) : (
                      <span className="text-transparent select-none">–</span>
                    )}
                  </td>

                  {/* Event badge */}
                  <td className="px-4 py-3.5 align-middle">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-800 ${getEventColor(row.event)}`}>
                      {row.event}
                    </span>
                  </td>

                  {/* PP */}
                  <td className="px-4 py-3.5 text-center align-middle">
                    <span className="text-gray-200 font-semibold">{row.pp}</span>
                  </td>

                  {/* TP */}
                  <td className="px-4 py-3.5 text-center align-middle">
                    <span className="text-emerald-400 font-semibold">{row.tp}</span>
                  </td>

                  {/* FP */}
                  <td className="px-4 py-3.5 text-center align-middle">
                    <span className={`font-semibold ${row.fp > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                      {row.fp}
                    </span>
                  </td>

                  {/* FN */}
                  <td className="px-4 py-3.5 text-center align-middle">
                    <span className="text-orange-400 font-semibold">
                      {row.fn !== null && row.fn !== '' ? row.fn : '—'}
                    </span>
                  </td>

                  {/* Accuracy */}
                  <td className="px-4 py-3.5 text-center align-middle">
                    {getAccuracyBadge(row.percentage)}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Summary footer: totals row */}
          {data.length > 0 && (() => {
            const totalPP = data.reduce((s, r) => s + r.pp, 0);
            const totalTP = data.reduce((s, r) => s + r.tp, 0);
            const totalFP = data.reduce((s, r) => s + r.fp, 0);
            const overallPct = totalPP > 0 ? (totalTP / totalPP) * 100 : null;
            return (
              <tfoot>
                <tr className="bg-gray-800/80 border-t-2 border-gray-600">
                  <td className="px-6 py-3.5 text-left">
                    <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">TOTAL</span>
                  </td>
                  <td className="px-4 py-3.5" />
                  <td className="px-4 py-3.5 text-center">
                    <span className="text-white font-bold">{totalPP}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="text-emerald-400 font-bold">{totalTP}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`font-bold ${totalFP > 0 ? 'text-red-400' : 'text-gray-500'}`}>{totalFP}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="text-gray-500">—</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {overallPct !== null ? (
                      <span className={`font-bold text-sm ${overallPct >= 90 ? 'text-emerald-400' : overallPct >= 75 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {overallPct.toFixed(2)}%
                      </span>
                    ) : <span className="text-gray-500">—</span>}
                  </td>
                </tr>
              </tfoot>
            );
          })()}
        </table>
      </div>
    </div>
  );
};
