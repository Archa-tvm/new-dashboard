import React from 'react';
import { X, FileSpreadsheet, Hash, Clock, Calendar, CheckCircle2, XCircle, MapPin } from 'lucide-react';
import { InspectionEvent } from '../../types';

interface EventDetailDrawerProps {
  event: InspectionEvent | null;
  onClose: () => void;
}

export const EventDetailDrawer: React.FC<EventDetailDrawerProps> = ({ event, onClose }) => {
  if (!event) return null;

  const isValid = event.status.toLowerCase() === 'valid';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end transition-opacity">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Inspection Event</span>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">{event.event}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status highlight banner */}
          <div className={`p-4 rounded-xl border flex items-center gap-3 ${
            isValid
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            {isValid ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
            )}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider">Inspection Outcome</div>
              <div className="text-base font-extrabold uppercase">
                {isValid ? '✓ VALID INSPECTION' : '✕ INVALID INSPECTION'}
              </div>
            </div>
          </div>

          {/* Core metadata */}
          <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4 space-y-3.5 text-xs">
            <div>
              <span className="text-slate-400 uppercase font-bold tracking-wider text-[10px]">Production Line</span>
              <div className="mt-0.5 font-semibold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {event.production_line}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
              <div>
                <span className="text-slate-400 uppercase font-bold tracking-wider text-[10px]">Date</span>
                <div className="mt-0.5 font-semibold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {event.date_str}
                </div>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold tracking-wider text-[10px]">Time</span>
                <div className="mt-0.5 font-semibold text-slate-800 flex items-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {event.time_str}
                </div>
              </div>
            </div>

            {!isValid && (
              <div className="pt-2 border-t border-slate-200">
                <span className="text-rose-600 uppercase font-bold tracking-wider text-[10px]">Failure Reason</span>
                <div className="mt-0.5 font-bold text-slate-900 capitalize text-sm">
                  {event.invalid_reason || 'Unknown'}
                </div>
              </div>
            )}
          </div>

          {/* Traceability to Spreadsheet Source */}
          <div className="border border-blue-200/80 bg-blue-50/40 rounded-xl p-4 text-xs">
            <div className="flex items-center gap-2 text-blue-900 font-bold mb-3 uppercase tracking-wider text-[10px]">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span>Spreadsheet Traceability</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-600">
                <span>Source File:</span>
                <span className="font-semibold text-slate-900 truncate max-w-[200px]" title={event.source_file}>
                  {event.source_file}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Spreadsheet Row:</span>
                <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-blue-200 text-blue-800">
                  Row {event.source_row}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Event Record ID:</span>
                <span className="font-mono text-slate-500">#{event.id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 transition-colors"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
};
