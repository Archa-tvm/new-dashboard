import React from 'react';
import { History, FileSpreadsheet, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { ImportBatch } from '../../types';

interface ImportHistoryTableProps {
  batches: ImportBatch[];
  onDeleteBatch: (id: number) => void;
}

export const ImportHistoryTable: React.FC<ImportHistoryTableProps> = ({ batches, onDeleteBatch }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-4 h-4 text-blue-600" />
        <h3 className="text-base font-bold text-slate-900 tracking-tight">Import History</h3>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3">File</th>
              <th className="py-2.5 px-3">Upload Date</th>
              <th className="py-2.5 px-3 text-center">Records</th>
              <th className="py-2.5 px-3 text-center">Duplicates</th>
              <th className="py-2.5 px-3 text-center">Rejected</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {batches.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No import history yet. Upload an inspection spreadsheet to get started.
                </td>
              </tr>
            ) : (
              batches.map(b => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
                    <span>{b.file_name}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 font-mono">
                    {new Date(b.uploaded_at).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' })}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                    {b.imported_rows.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-center text-amber-600 font-medium">
                    {b.duplicate_rows}
                  </td>
                  <td className="py-2.5 px-3 text-center text-rose-600 font-medium">
                    {b.rejected_rows}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>✓ {b.status}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => onDeleteBatch(b.id)}
                      title="Delete Batch"
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
