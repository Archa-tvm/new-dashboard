import React from 'react';
import { Table2 } from 'lucide-react';
import { EventBreakdownRow } from '../../types';

interface InspectionSummaryTableProps {
  data: EventBreakdownRow[];
  loading?: boolean;
}

export const InspectionSummaryTable: React.FC<InspectionSummaryTableProps> = ({ data, loading }) => {
  if (loading) return <div className="bg-white rounded-xl border border-slate-200 h-64 animate-pulse" />;

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 flex items-center gap-3">
        <Table2 className="w-5 h-5 text-blue-600" />
        <div>
          <h2 className="text-base font-bold text-slate-900">Daily Event Summary</h2>
          <p className="text-xs text-slate-500 mt-0.5">Date is calculated from each event TimeOfOccurrence value</p>
        </div>
      </div>
      {!data.length ? (
        <div className="px-6 py-12 text-center text-xs text-slate-500">Import inspection rows to see the summary.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Event</th>
                <th className="px-4 py-3 text-center">PP</th>
                <th className="px-4 py-3 text-center text-emerald-700">TP</th>
                <th className="px-4 py-3 text-center text-rose-700">FP</th>
                <th className="px-4 py-3 text-center">FN</th>
                <th className="px-4 py-3 text-center">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map(row => (
                <tr key={`${row.date}-${row.event}`} className="hover:bg-slate-50">
                  <td className="px-6 py-3.5 font-semibold text-slate-700">{row.is_first_in_date ? row.formatted_date : ''}</td>
                  <td className="px-4 py-3.5 font-bold text-blue-700">{row.event}</td>
                  <td className="px-4 py-3.5 text-center font-semibold text-slate-800">{row.pp || ''}</td>
                  <td className="px-4 py-3.5 text-center font-semibold text-emerald-700">{row.tp}</td>
                  <td className="px-4 py-3.5 text-center font-semibold text-rose-700">{row.fp || ''}</td>
                  <td className="px-4 py-3.5 text-center text-slate-500"></td>
                  <td className="px-4 py-3.5 text-center font-bold text-slate-900">{row.percentage !== null ? `${row.percentage.toFixed(2)}%` : '0.00%'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
