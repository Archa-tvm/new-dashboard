import React from 'react';
import { ArrowRight, History } from 'lucide-react';
import { InspectionEvent } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface RecentEventsProps {
  events: InspectionEvent[];
  onViewAll: () => void;
  onSelectEvent: (event: InspectionEvent) => void;
}

export const RecentEvents: React.FC<RecentEventsProps> = ({
  events,
  onViewAll,
  onSelectEvent
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-blue-600" />
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Recent Events</h3>
        </div>
        <button
          onClick={onViewAll}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 active:scale-95 transition-all"
        >
          <span>View All Events</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3">Time</th>
              <th className="py-2.5 px-3">Event</th>
              <th className="py-2.5 px-3">Line</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Reason</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {events.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400">
                  No recent inspection events found
                </td>
              </tr>
            ) : (
              events.map(ev => (
                <tr
                  key={ev.id}
                  onClick={() => onSelectEvent(ev)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-2 px-3 font-mono text-slate-600 font-medium">
                    {ev.time_str}
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-900">
                    {ev.event}
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    {ev.production_line}
                  </td>
                  <td className="py-2 px-3">
                    <StatusBadge status={ev.status} size="sm" />
                  </td>
                  <td className="py-2 px-3 text-slate-600 capitalize truncate max-w-[150px]">
                    {ev.invalid_reason || '—'}
                  </td>
                  <td className="py-2 px-3 text-right text-blue-600 hover:underline">
                    View
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
