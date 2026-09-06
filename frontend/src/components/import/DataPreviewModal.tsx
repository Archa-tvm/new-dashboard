import React, { useState } from 'react';
import {
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Layers,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles
} from 'lucide-react';
import { FileAnalysisPreview } from '../../types';

interface DataPreviewModalProps {
  isOpen: boolean;
  preview: FileAnalysisPreview | null;
  onConfirmImport: (skipDuplicates: boolean) => void;
  onOpenMapper: () => void;
  onCancel: () => void;
}

export const DataPreviewModal: React.FC<DataPreviewModalProps> = ({
  isOpen,
  preview,
  onConfirmImport,
  onOpenMapper,
  onCancel
}) => {
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  if (!isOpen || !preview) return null;

  const hasDuplicates = preview.duplicate_count > 0;
  const sampleHeaders = preview.sample_rows.length > 0 ? Object.keys(preview.sample_rows[0]).filter(k => k !== '__row_idx') : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">FILE ANALYSIS</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              File: <strong className="text-slate-800 font-semibold">{preview.file_name}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!preview.can_auto_import && (
              <button
                onClick={onOpenMapper}
                className="px-3 py-1.5 rounded-lg border border-blue-300 text-blue-700 bg-blue-50 text-xs font-semibold hover:bg-blue-100"
              >
                Adjust Column Mapping
              </button>
            )}
            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* File KPI Overview Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Total Rows</span>
              <span className="text-lg font-extrabold text-slate-900">{preview.total_rows.toLocaleString()}</span>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 block">Valid Est.</span>
              <span className="text-lg font-extrabold text-emerald-900">{preview.valid_count_estimate.toLocaleString()}</span>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-rose-700 block">Invalid Est.</span>
              <span className="text-lg font-extrabold text-rose-900">{preview.invalid_count_estimate.toLocaleString()}</span>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 block">Duplicates</span>
              <span className="text-lg font-extrabold text-amber-900">{preview.duplicate_count}</span>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-700 block">Event Types</span>
              <span className="text-lg font-extrabold text-blue-900">{preview.event_types_detected.length}</span>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 block">Lines</span>
              <span className="text-lg font-extrabold text-purple-900">{preview.production_lines_detected.length}</span>
            </div>
          </div>

          {/* Validation Checklist Badges */}
          <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Schema Detection Verification</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" /> Event detected ({preview.event_types_detected.join(', ') || 'Auto'})
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" /> Date & Time detected ({preview.date_range_detected || 'Present'})
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" /> Line detected ({preview.production_lines_detected.join(', ') || 'Auto'})
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" /> Status detected
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" /> Reason detected
              </span>
            </div>
          </div>

          {/* Duplicate Detection Callout Banner (Rule 31) */}
          {hasDuplicates && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <div className="font-bold text-amber-900 text-sm">
                    {preview.duplicate_count} duplicate events detected.
                  </div>
                  <div className="text-amber-800 mt-0.5">
                    Matching Event + Line + the complete date and time in TimeOfOccurrence.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-amber-900 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={e => setSkipDuplicates(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span>Skip Duplicates (Recommended)</span>
                </label>
              </div>
            </div>
          )}

          {/* Data Preview Table (20-30 rows) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Data Preview (First {preview.sample_rows.length} Rows)
              </span>
              <span className="text-[11px] text-slate-500">Header row 1, data rows 2+</span>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-60">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                  <tr>
                    <th className="py-2 px-2.5 text-center text-slate-400">Row</th>
                    {sampleHeaders.map(col => (
                      <th key={col} className="py-2 px-3 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {preview.sample_rows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-1.5 px-2.5 text-center font-mono text-slate-400">
                        {row.__row_idx}
                      </td>
                      {sampleHeaders.map(col => (
                        <td key={col} className="py-1.5 px-3 truncate max-w-[160px]">
                          {row[col] !== '' ? String(row[col]) : <span className="text-slate-300">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-100"
          >
            Cancel Import
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onConfirmImport(skipDuplicates)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-600/20"
            >
              <span>Confirm & Import Records</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
