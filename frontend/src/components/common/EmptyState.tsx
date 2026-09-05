import React from 'react';
import { UploadCloud, FileSpreadsheet, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  onNavigateToImport: () => void;
  onLoadSample?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onNavigateToImport, onLoadSample }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-8 text-center bg-white rounded-xl border border-slate-200 shadow-sm max-w-2xl mx-auto my-12">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-5 text-blue-600 shadow-inner">
        <FileSpreadsheet className="w-8 h-8" />
      </div>

      <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-2">Production Inspection Analytics</h2>
      <p className="text-sm font-medium text-slate-700 mb-1">No inspection data available.</p>
      <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
        Upload an Excel (.xlsx/.xls) or CSV file containing raw vision inspection events to automatically calculate KPIs, trends, and line performance.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={onNavigateToImport}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-600/20"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Inspection Data</span>
        </button>

        {onLoadSample && (
          <button
            onClick={onLoadSample}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium border border-slate-200 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>Load Demo Batch 1 (1,268 rows)</span>
          </button>
        )}
      </div>
    </div>
  );
};
