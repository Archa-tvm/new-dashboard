import React from 'react';
import { Clock3, History } from 'lucide-react';
import { InspectionEvent } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface LatestUpdatesTableProps { events: InspectionEvent[]; loading?: boolean; }

export const LatestUpdatesTable: React.FC<LatestUpdatesTableProps> = ({ events, loading }) => (
  <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
    <div className="px-6 py-5 border-b border-slate-200 flex items-center gap-3">
      <History className="w-5 h-5 text-blue-600" />
      <div><h2 className="text-base font-bold text-slate-900">Latest updates</h2><p className="text-xs text-slate-500 mt-0.5">Most recently imported inspection records</p></div>
    </div>
    {loading ? <div className="h-40 animate-pulse bg-slate-50" /> : (
      <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-xs">
        <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider"><tr><th className="px-6 py-3 text-left">Date & time</th><th className="px-4 py-3 text-left">Event</th><th className="px-4 py-3 text-left">Line</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Remarks</th></tr></thead>
        <tbody className="divide-y divide-slate-100">{events.map(event => <tr key={event.id} className="hover:bg-slate-50"><td className="px-6 py-3.5 font-mono text-slate-700"><span className="inline-flex items-center gap-1.5"><Clock3 className="w-3.5 h-3.5 text-slate-400" />{event.date_str} {event.time_str}</span></td><td className="px-4 py-3.5 font-bold text-blue-700">{event.event}</td><td className="px-4 py-3.5 text-slate-700">{event.production_line}</td><td className="px-4 py-3.5"><StatusBadge status={event.status} size="sm" /></td><td className="px-4 py-3.5 text-slate-700">{event.invalid_reason || ''}</td></tr>)}</tbody>
      </table></div>
    )}
  </section>
);