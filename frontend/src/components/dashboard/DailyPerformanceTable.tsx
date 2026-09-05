import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  Download,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { DailyPerformanceRow } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface DailyPerformanceTableProps {
  data: DailyPerformanceRow[];
}

export const DailyPerformanceTable: React.FC<DailyPerformanceTableProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof DailyPerformanceRow>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    opspd: true,
    hndpos: true,
    overall: true,
    status: true,
  });
  const [showColMenu, setShowColMenu] = useState(false);

  // Filter & sort
  const filteredData = useMemo(() => {
    return data.filter(row => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        row.formatted_date.toLowerCase().includes(term) ||
        row.date.toLowerCase().includes(term) ||
        row.status.toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortOrder === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredData, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage]);

  const handleSort = (field: keyof DailyPerformanceRow) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const exportTableCsv = () => {
    const headers = [
      'Date',
      'OPSPD Total', 'OPSPD Valid', 'OPSPD Invalid', 'OPSPD Accuracy (%)',
      'HNDPOS Total', 'HNDPOS Valid', 'HNDPOS Invalid', 'HNDPOS Accuracy (%)',
      'Total Events', 'Valid', 'Invalid', 'Overall Accuracy (%)', 'Status'
    ];
    const rows = sortedData.map(r => [
      r.formatted_date,
      r.opspd_total, r.opspd_valid, r.opspd_invalid, r.opspd_accuracy !== null ? r.opspd_accuracy : '—',
      r.hndpos_total, r.hndpos_valid, r.hndpos_invalid, r.hndpos_accuracy !== null ? r.hndpos_accuracy : '—',
      r.total_events, r.valid, r.invalid, r.overall_accuracy !== null ? r.overall_accuracy : '—',
      r.status
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'daily_inspection_performance.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Daily Performance Table</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Granular breakdown of event metrics and compliance by date
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search date or status..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
            />
          </div>

          {/* Column Visibility Menu */}
          <div className="relative">
            <button
              onClick={() => setShowColMenu(!showColMenu)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Columns</span>
            </button>
            {showColMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-20 text-xs space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:bg-slate-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={visibleColumns.opspd}
                    onChange={e => setVisibleColumns(v => ({ ...v, opspd: e.target.checked }))}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span>OPSPD Columns</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:bg-slate-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={visibleColumns.hndpos}
                    onChange={e => setVisibleColumns(v => ({ ...v, hndpos: e.target.checked }))}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span>HNDPOS Columns</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:bg-slate-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={visibleColumns.overall}
                    onChange={e => setVisibleColumns(v => ({ ...v, overall: e.target.checked }))}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span>Overall Totals</span>
                </label>
              </div>
            )}
          </div>

          {/* Export button */}
          <button
            onClick={exportTableCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th
                onClick={() => handleSort('date')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 select-none whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Date</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {visibleColumns.opspd && (
                <>
                  <th className="py-3 px-2 text-center bg-blue-50/50 text-blue-900 border-l border-slate-200">OPSPD Total</th>
                  <th className="py-3 px-2 text-center bg-blue-50/50 text-blue-900">Valid</th>
                  <th className="py-3 px-2 text-center bg-blue-50/50 text-blue-900">Invalid</th>
                  <th
                    onClick={() => handleSort('opspd_accuracy')}
                    className="py-3 px-2 text-center bg-blue-50/50 text-blue-900 cursor-pointer hover:underline border-r border-slate-200"
                  >
                    OPSPD Acc
                  </th>
                </>
              )}

              {visibleColumns.hndpos && (
                <>
                  <th className="py-3 px-2 text-center bg-purple-50/50 text-purple-900">HNDPOS Total</th>
                  <th className="py-3 px-2 text-center bg-purple-50/50 text-purple-900">Valid</th>
                  <th className="py-3 px-2 text-center bg-purple-50/50 text-purple-900">Invalid</th>
                  <th
                    onClick={() => handleSort('hndpos_accuracy')}
                    className="py-3 px-2 text-center bg-purple-50/50 text-purple-900 cursor-pointer hover:underline border-r border-slate-200"
                  >
                    HNDPOS Acc
                  </th>
                </>
              )}

              {visibleColumns.overall && (
                <>
                  <th
                    onClick={() => handleSort('total_events')}
                    className="py-3 px-3 text-center cursor-pointer hover:text-slate-900 select-none"
                  >
                    Total
                  </th>
                  <th className="py-3 px-2 text-center text-emerald-700">Valid</th>
                  <th className="py-3 px-2 text-center text-rose-700">Invalid</th>
                  <th
                    onClick={() => handleSort('overall_accuracy')}
                    className="py-3 px-3 text-center cursor-pointer hover:text-slate-900 select-none font-bold"
                  >
                    Accuracy
                  </th>
                </>
              )}

              {visibleColumns.status && (
                <th className="py-3 px-3 text-center">Status</th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 text-slate-700">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={14} className="py-8 text-center text-slate-400">
                  No inspection events found
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr key={row.date} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                    {row.formatted_date}
                  </td>

                  {visibleColumns.opspd && (
                    <>
                      <td className="py-2.5 px-2 text-center bg-blue-50/20 border-l border-slate-100 font-medium">
                        {row.opspd_total > 0 ? row.opspd_total : '—'}
                      </td>
                      <td className="py-2.5 px-2 text-center bg-blue-50/20 text-emerald-600 font-medium">
                        {row.opspd_total > 0 ? row.opspd_valid : '—'}
                      </td>
                      <td className="py-2.5 px-2 text-center bg-blue-50/20 text-rose-600 font-medium">
                        {row.opspd_total > 0 ? row.opspd_invalid : '—'}
                      </td>
                      <td className="py-2.5 px-2 text-center bg-blue-50/20 border-r border-slate-100 font-semibold">
                        {row.opspd_accuracy !== null ? `${row.opspd_accuracy.toFixed(2)}%` : '—'}
                      </td>
                    </>
                  )}

                  {visibleColumns.hndpos && (
                    <>
                      <td className="py-2.5 px-2 text-center bg-purple-50/20 font-medium">
                        {row.hndpos_total > 0 ? row.hndpos_total : '—'}
                      </td>
                      <td className="py-2.5 px-2 text-center bg-purple-50/20 text-emerald-600 font-medium">
                        {row.hndpos_total > 0 ? row.hndpos_valid : '—'}
                      </td>
                      <td className="py-2.5 px-2 text-center bg-purple-50/20 text-rose-600 font-medium">
                        {row.hndpos_total > 0 ? row.hndpos_invalid : '—'}
                      </td>
                      <td className="py-2.5 px-2 text-center bg-purple-50/20 border-r border-slate-100 font-semibold">
                        {row.hndpos_accuracy !== null ? `${row.hndpos_accuracy.toFixed(2)}%` : '—'}
                      </td>
                    </>
                  )}

                  {visibleColumns.overall && (
                    <>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                        {row.total_events > 0 ? row.total_events : '—'}
                      </td>
                      <td className="py-2.5 px-2 text-center text-emerald-700 font-medium">
                        {row.total_events > 0 ? row.valid : '—'}
                      </td>
                      <td className="py-2.5 px-2 text-center text-rose-700 font-medium">
                        {row.total_events > 0 ? row.invalid : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-extrabold text-slate-900">
                        {row.overall_accuracy !== null ? `${row.overall_accuracy.toFixed(2)}%` : '—'}
                      </td>
                    </>
                  )}

                  {visibleColumns.status && (
                    <td className="py-2.5 px-3 text-center">
                      <StatusBadge status={row.status} />
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
        <div>
          Showing {sortedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} days
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
