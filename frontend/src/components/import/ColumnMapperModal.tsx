import React, { useEffect, useState } from 'react';
import { Columns, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ColumnMapperModalProps {
  isOpen: boolean;
  detectedColumns: Record<string, string>;
  unmappedColumns: string[];
  missingRequired: string[];
  allSpreadsheetColumns: string[];
  onConfirm: (mapping: Record<string, string>) => void;
  onCancel: () => void;
}

const APP_FIELDS = [
  { key: 'event', label: 'Event / EventType', required: true },
  { key: 'production_line', label: 'Production Line', required: true },
  { key: 'time_of_occurrence', label: 'Date & Time / Timestamp', required: true },
  { key: 'status', label: 'Status (Valid / Invalid)', required: true },
  { key: 'invalid_reason', label: 'Invalid Reason / Comment', required: false },
];

export const ColumnMapperModal: React.FC<ColumnMapperModalProps> = ({
  isOpen,
  detectedColumns,
  unmappedColumns,
  missingRequired,
  allSpreadsheetColumns,
  onConfirm,
  onCancel
}) => {
  // Initialize current mapping: { app_field: original_col }
  const [fieldToCol, setFieldToCol] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    Object.entries(detectedColumns).forEach(([orig, appF]) => {
      init[appF] = orig;
    });
    return init;
  });

  useEffect(() => {
    const nextMapping: Record<string, string> = {};
    Object.entries(detectedColumns).forEach(([originalColumn, appField]) => {
      nextMapping[appField] = originalColumn;
    });
    setFieldToCol(nextMapping);
  }, [detectedColumns, allSpreadsheetColumns]);

  if (!isOpen) return null;

  const handleSelect = (appField: string, originalCol: string) => {
    setFieldToCol(prev => ({
      ...prev,
      [appField]: originalCol
    }));
  };

  const handleProceed = () => {
    // Invert mapping back to { original_col: app_field }
    const result: Record<string, string> = {};
    Object.entries(fieldToCol).forEach(([appF, origCol]) => {
      if (origCol) {
        result[origCol] = appF;
      }
    });
    onConfirm(result);
  };

  const hasAllRequired = APP_FIELDS.filter(f => f.required).every(f => Boolean(fieldToCol[f.key]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-2xl max-w-lg w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Columns className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Map Spreadsheet Columns</h3>
            <p className="text-xs text-slate-500">
              Use the raw inspection sheet: Event, Line, TimeOfOccurrence, status, and Reason
            </p>
          </div>
        </div>

        {missingRequired.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-lg flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Some required columns could not be mapped automatically. Please select them below.</span>
          </div>
        )}

        <div className="space-y-3.5 my-5 text-xs">
          <div className="grid grid-cols-2 text-slate-400 font-bold uppercase tracking-wider text-[10px] pb-1 border-b border-slate-200">
            <span>Application Field</span>
            <span>Excel Column</span>
          </div>

          {APP_FIELDS.map(f => {
            const selectedCol = fieldToCol[f.key] || '';

            return (
              <div key={f.key} className="grid grid-cols-2 items-center gap-3">
                <div className="flex items-center gap-1.5 font-medium text-slate-800">
                  <span>{f.label}</span>
                  {f.required && <span className="text-rose-500 font-bold">*</span>}
                </div>

                <select
                  value={selectedCol}
                  onChange={e => handleSelect(f.key, e.target.value)}
                  className={`w-full p-2 rounded-lg border text-xs bg-slate-50 focus:outline-none focus:ring-2 ${
                    f.required && !selectedCol
                      ? 'border-amber-300 focus:ring-amber-500 text-amber-900'
                      : 'border-slate-300 focus:ring-blue-500 text-slate-800'
                  }`}
                >
                  <option value="">-- Select matching Excel column --</option>
                  {allSpreadsheetColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            onClick={handleProceed}
            disabled={!hasAllRequired}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <span>Continue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
