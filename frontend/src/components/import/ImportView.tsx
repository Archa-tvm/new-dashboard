import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  FileCheck2,
  Sparkles,
  AlertCircle,
  FolderSync
} from 'lucide-react';
import { api } from '../../services/api';
import { ImportBatch, FileAnalysisPreview } from '../../types';
import { DataPreviewModal } from './DataPreviewModal';
import { ColumnMapperModal } from './ColumnMapperModal';
import { ImportProgressModal } from './ImportProgressModal';
import { ImportHistoryTable } from './ImportHistoryTable';
import { useFilters } from '../../context/FilterContext';

export const ImportView: React.FC = () => {
  const { refresh } = useFilters();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [previewData, setPreviewData] = useState<FileAnalysisPreview | null>(null);
  const [uploadedToken, setUploadedToken] = useState<string>('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showMapperModal, setShowMapperModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [customMapping, setCustomMapping] = useState<Record<string, string> | undefined>();
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchHistory = async () => {
    try {
      const data = await api.getImportHistory();
      setBatches(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleFileUpload = async (file: File) => {
    setAnalyzing(true);
    setNotification(null);
    try {
      const { token, preview } = await api.analyzeFile(file);
      setUploadedToken(preview.file_token || token);
      setPreviewData(preview);

      if (!preview.can_auto_import) {
        setShowMapperModal(true);
      } else {
        setShowPreviewModal(true);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'File analysis failed.' });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleConfirmImport = async (skipDuplicates: boolean) => {
    setShowPreviewModal(false);
    setShowProgressModal(true);

    try {
      await api.executeImport(uploadedToken, customMapping, skipDuplicates);
    } catch (err: any) {
      console.error('Execute import error:', err);
      setNotification({ type: 'error', message: err.message || 'Import execution failed.' });
      setShowProgressModal(false);
    }
  };

  const handleProgressComplete = () => {
    setShowProgressModal(false);
    refresh();
    fetchHistory();
    setNotification({
      type: 'success',
      message: 'Inspection records imported and all dashboard metrics successfully recalculated.'
    });
  };

  const handleQuickDemoLoad = async (batchType: 'batch1' | 'batch2' | 'summary') => {
    setShowProgressModal(true);
    try {
      await api.loadSampleDataset(batchType);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Demo load failed.' });
      setShowProgressModal(false);
    }
  };

  const handleDeleteBatch = async (id: number) => {
    if (window.confirm('Delete this import batch and all of its inspection records?')) {
      try {
        await api.deleteImportBatch(id);
        fetchHistory();
        refresh();
        setNotification({ type: 'success', message: 'Batch deleted.' });
      } catch (err: any) {
        setNotification({ type: 'error', message: err.message || 'Failed to delete batch.' });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {notification && (
        <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between ${
          notification.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Main Upload Dropzone */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs text-center">
        <div className="max-w-xl mx-auto">
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-10 cursor-pointer transition-all hover:bg-slate-50/60 group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform shadow-xs">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Drop Excel or CSV file here
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              or <span className="text-blue-600 font-semibold underline">click to browse</span> from your computer
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span>XLSX • XLS • CSV</span>
            </div>
          </div>
        </div>

        {/* Demo Fast-Load Datasets */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Pre-configured Test Datasets for Evaluation</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => handleQuickDemoLoad('batch1')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 active:scale-95 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>1. Load Batch 1 (Aug 01 – Aug 15 • 1,268 records)</span>
            </button>

            <button
              onClick={() => handleQuickDemoLoad('batch2')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 active:scale-95 transition-all"
            >
              <FolderSync className="w-4 h-4 text-amber-600" />
              <span>2. Cumulative Batch 2 (Aug 16 – Aug 18 + 15 duplicates)</span>
            </button>

            <button
              onClick={() => handleQuickDemoLoad('summary')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 active:scale-95 transition-all"
            >
              <FileCheck2 className="w-4 h-4 text-purple-600" />
              <span>3. Load Ground-Truth Summary (TP/FP/FN/PP)</span>
            </button>
          </div>
        </div>
      </div>

      {/* History Table */}
      <ImportHistoryTable
        batches={batches}
        onDeleteBatch={handleDeleteBatch}
      />

      {/* Modals */}
      <DataPreviewModal
        isOpen={showPreviewModal}
        preview={previewData}
        onConfirmImport={handleConfirmImport}
        onOpenMapper={() => {
          setShowPreviewModal(false);
          setShowMapperModal(true);
        }}
        onCancel={() => setShowPreviewModal(false)}
      />

      {previewData && (
        <ColumnMapperModal
          isOpen={showMapperModal}
          detectedColumns={previewData.detected_columns}
          unmappedColumns={previewData.unmapped_columns}
          missingRequired={previewData.missing_required_columns}
          allSpreadsheetColumns={Object.keys(previewData.sample_rows[0] || {}).filter(k => k !== '__row_idx')}
          onConfirm={(mapping) => {
            setCustomMapping(mapping);
            setShowMapperModal(false);
            setShowPreviewModal(true);
          }}
          onCancel={() => setShowMapperModal(false)}
        />
      )}

      <ImportProgressModal
        isOpen={showProgressModal}
        onComplete={handleProgressComplete}
      />
    </div>
  );
};
