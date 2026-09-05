import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  Calendar,
  Layers,
  AlertCircle,
  Factory
} from 'lucide-react';
import { api } from '../../services/api';
import { useFilters } from '../../context/FilterContext';

interface ReportCard {
  id: string;
  title: string;
  desc: string;
  icon: any;
  types: ('pdf' | 'excel' | 'csv')[];
}

const REPORTS: ReportCard[] = [
  {
    id: 'daily',
    title: 'Daily Performance Report',
    desc: 'Day-by-day inspection outcome numbers, OPSPD/HNDPOS accuracy, and status compliance.',
    icon: Calendar,
    types: ['pdf', 'excel', 'csv'],
  },
  {
    id: 'monthly',
    title: 'Monthly Performance Report',
    desc: 'High-level executive quality rollups aggregated by calendar month.',
    icon: Calendar,
    types: ['pdf', 'excel', 'csv'],
  },
  {
    id: 'events',
    title: 'Event Performance Report',
    desc: 'Comparison of individual inspection events against target benchmarks.',
    icon: Layers,
    types: ['pdf', 'excel', 'csv'],
  },
  {
    id: 'reasons',
    title: 'Invalid Reason Report',
    desc: 'Detailed breakdown of defect modalities, failure frequencies, and percentages.',
    icon: AlertCircle,
    types: ['pdf', 'excel', 'csv'],
  },
  {
    id: 'lines',
    title: 'Production Line Report',
    desc: 'Line-by-line quality performance, compliance targets, and failure rates.',
    icon: Factory,
    types: ['pdf', 'excel', 'csv'],
  },
  {
    id: 'complete',
    title: 'Complete Inspection Report',
    desc: 'Comprehensive multi-sheet audit package including raw traceability records.',
    icon: FileText,
    types: ['pdf', 'excel', 'csv'],
  },
];

export const ReportCenter: React.FC = () => {
  const { appliedFilters } = useFilters();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = (reportId: string, format: 'pdf' | 'excel' | 'csv') => {
    setDownloadingId(`${reportId}-${format}`);
    const url = api.getReportDownloadUrl(reportId, format, appliedFilters);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `inspection_${reportId}_report.${format === 'excel' ? 'xlsx' : format}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloadingId(null), 1000);
  };

  const handlePrint = (reportId: string) => {
    const url = api.getReportDownloadUrl(reportId, 'pdf', appliedFilters);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Compliance & Executive Report Center</h2>
          <p className="text-xs text-slate-500 mt-1">
            Generate audit-ready quality reports respecting all active filters (Date, Line, Event, Reason)
          </p>
        </div>

        <button
          onClick={() => handlePrint('complete')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition-all"
        >
          <Printer className="w-4 h-4 text-slate-600" />
          <span>Print Complete Audit</span>
        </button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {REPORTS.map(rep => {
          const Icon = rep.icon;
          return (
            <div key={rep.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">{rep.title}</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{rep.desc}</p>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Export:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleDownload(rep.id, 'pdf')}
                    className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-[11px] font-bold transition-colors"
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => handleDownload(rep.id, 'excel')}
                    className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-bold transition-colors"
                  >
                    Excel
                  </button>
                  <button
                    onClick={() => handleDownload(rep.id, 'csv')}
                    className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-[11px] font-bold transition-colors"
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => handlePrint(rep.id)}
                    title="Print"
                    className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
