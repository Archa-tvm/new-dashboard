import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { InspectionEvent } from '../../types';

interface InvalidInspectionsTableProps {
  events: InspectionEvent[];
  loading?: boolean;
}

export const InvalidInspectionsTable: React.FC<InvalidInspectionsTableProps> = ({ events, loading }) => {
  if (loading) return <div className="bg-white rounded-xl border border-slate-200 h-64 animate-pulse" />;

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-rose-600" />
        <div>
          <h2 className="text-base font-bold text-slate-900">Invalid inspections</h2>
          <p className="text-xs text-slate-500 mt-0.5">When the inspection failed and the remark recorded in the sheet</p>
        </div>
      </div>
      {!events.length ? (
        <div className="px-6 py-12 text-center text-xs text-slate-500">No invalid inspections match the active filters.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Time</th>
                <th className="px-4 py-3 text-left">Event</th>
                <th className="px-4 py-3 text-left">Line</th>
                <th className="px-4 py-3 text-left">Why invalid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map(event => (
                <tr key={event.id} className="hover:bg-rose-50/40">
                  <td className="px-6 py-3.5 font-semibold text-slate-700">{event.date_str}</td>
                  <td className="px-4 py-3.5 font-mono text-slate-700"><span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" />{event.time_str}</span></td>
                  <td className="px-4 py-3.5 font-bold text-blue-700">{event.event}</td>
                  <td className="px-4 py-3.5 text-slate-700">{event.production_line}</td>
                  <td className="px-4 py-3.5 font-semibold text-rose-700">{event.invalid_reason || 'Unknown'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};