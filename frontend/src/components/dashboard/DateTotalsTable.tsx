import React from 'react';
import { CalendarDays } from 'lucide-react';
import { DailyPerformanceRow } from '../../types';

interface DateTotalsTableProps {
  data: DailyPerformanceRow[];
  loading?: boolean;
}

export const DateTotalsTable: React.FC<DateTotalsTableProps> = ({ data, loading }) => {
  if (loading) return <div className="bg-white rounded-xl border border-slate-200 h-56 animate-pulse" />;

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 flex items-center gap-3">
        <CalendarDays className="w-5 h-5 text-indigo-600" />
        <div>
          <h2 className="text-base font-bold text-slate-900">Daily totals</h2>
          <p className="text-xs text-slate-500 mt-0.5">Valid and invalid counts for each date</p>
        </div>
      </div>
      {!data.length ? (
        <div className="px-6 py-12 text-center text-xs text-slate-500">No daily data available.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-center">Total</th>
                <th className="px-4 py-3 text-center text-emerald-700">Valid / TP</th>
                <th className="px-4 py-3 text-center text-rose-700">Invalid / FP</th>
                <th className="px-4 py-3 text-center">Accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map(row => (
                <tr key={row.date} className="hover:bg-slate-50">
                  <td className="px-6 py-3.5 font-semibold text-slate-700">{row.formatted_date}</td>
                  <td className="px-4 py-3.5 text-center font-bold text-slate-800">{row.total_events}</td>
                  <td className="px-4 py-3.5 text-center font-semibold text-emerald-700">{row.valid}</td>
                  <td className="px-4 py-3.5 text-center font-semibold text-rose-700">{row.invalid}</td>
                  <td className="px-4 py-3.5 text-center font-bold text-slate-900">{row.overall_accuracy !== null ? `${row.overall_accuracy.toFixed(2)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-200">
              <tr className="font-bold text-slate-800">
                <td className="px-6 py-3.5">ALL DATES</td>
                <td className="px-4 py-3.5 text-center">{data.reduce((sum, row) => sum + row.total_events, 0)}</td>
                <td className="px-4 py-3.5 text-center text-emerald-700">{data.reduce((sum, row) => sum + row.valid, 0)}</td>
                <td className="px-4 py-3.5 text-center text-rose-700">{data.reduce((sum, row) => sum + row.invalid, 0)}</td>
                <td className="px-4 py-3.5 text-center">{(() => { const total = data.reduce((sum, row) => sum + row.total_events, 0); const valid = data.reduce((sum, row) => sum + row.valid, 0); return total ? `${((valid / total) * 100).toFixed(2)}%` : '—'; })()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
};
