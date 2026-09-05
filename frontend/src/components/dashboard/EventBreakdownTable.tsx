import React from 'react';
import { Table2 } from 'lucide-react';
import { MonthlyAccuracyRow } from '../../types';

interface EventBreakdownTableProps {
  data: MonthlyAccuracyRow[];
  loading?: boolean;
}

export const EventBreakdownTable: React.FC<EventBreakdownTableProps> = ({ data, loading }) => {
  if (loading) return <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 animate-pulse h-64" />;

  if (!data.length) {
    return (
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 text-center min-h-[180px]">
        <Table2 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400 text-sm">No monthly accuracy data available</p>
        <p className="text-gray-600 text-xs mt-1">Import inspection data to see monthly results.</p>
      </div>
    );
  }

  const totals = data.reduce((result, row) => ({
    pp: result.pp + row.pp,
    tp: result.tp + row.tp,
    fp: result.fp + row.fp
  }), { pp: 0, tp: 0, fp: 0 });
  const totalAccuracy = totals.pp ? (totals.tp / totals.pp) * 100 : null;

  const renderAccuracy = (value: number | null) => {
    if (value === null) return <span className="text-gray-500">—</span>;
    const color = value >= 90 ? 'text-emerald-400' : value >= 75 ? 'text-yellow-400' : 'text-red-400';
    return <span className={`font-bold ${color}`}>{value.toFixed(2)}%</span>;
  };

  return (
    <section className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-700">
        <Table2 className="w-5 h-5 text-indigo-400" />
        <div>
          <h3 className="text-white font-semibold text-base">Monthly Accuracy</h3>
          <p className="text-gray-400 text-xs mt-0.5">All months and inspection events in one simple view</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase text-gray-500 bg-gray-800/60">
              <th className="px-6 py-3 text-left">Month</th>
              <th className="px-4 py-3 text-left">Event</th>
              <th className="px-4 py-3 text-center">PP</th>
              <th className="px-4 py-3 text-center text-emerald-400">TP</th>
              <th className="px-4 py-3 text-center text-red-400">FP</th>
              <th className="px-4 py-3 text-center text-orange-400">FN</th>
              <th className="px-4 py-3 text-center">Percentage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {data.map((row) => (
              <tr key={`${row.month}-${row.event}`} className="hover:bg-gray-800/40">
                <td className="px-6 py-3.5 text-white font-semibold">
                  {row.is_first_in_month ? row.formatted_month : ''}
                </td>
                <td className="px-4 py-3.5 text-cyan-300 font-bold">{row.event}</td>
                <td className="px-4 py-3.5 text-center text-gray-200 font-semibold">{row.pp}</td>
                <td className="px-4 py-3.5 text-center text-emerald-400 font-semibold">{row.tp}</td>
                <td className="px-4 py-3.5 text-center text-red-400 font-semibold">{row.fp}</td>
                <td className="px-4 py-3.5 text-center text-orange-400">{row.fn ?? '—'}</td>
                <td className="px-4 py-3.5 text-center">{renderAccuracy(row.percentage)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-800/80 border-t-2 border-gray-600 font-bold">
              <td className="px-6 py-3.5 text-gray-400">TOTAL</td>
              <td />
              <td className="px-4 py-3.5 text-center text-white">{totals.pp}</td>
              <td className="px-4 py-3.5 text-center text-emerald-400">{totals.tp}</td>
              <td className="px-4 py-3.5 text-center text-red-400">{totals.fp}</td>
              <td className="px-4 py-3.5 text-center text-gray-500">—</td>
              <td className="px-4 py-3.5 text-center">{renderAccuracy(totalAccuracy)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
};
