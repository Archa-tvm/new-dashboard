import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye
} from 'lucide-react';
import { InspectionEvent } from '../../types';
import { api } from '../../services/api';
import { StatusBadge } from '../common/StatusBadge';
import { useFilters } from '../../context/FilterContext';

interface EventTableProps {
  onSelectEvent: (event: InspectionEvent) => void;
}

export const EventTable: React.FC<EventTableProps> = ({ onSelectEvent }) => {
  const { appliedFilters, options } = useFilters();
  const [events, setEvents] = useState<InspectionEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('time_of_occurrence');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Local filters inside Events page
  const [localLine, setLocalLine] = useState(appliedFilters.production_line);
  const [localEvent, setLocalEvent] = useState(appliedFilters.event);
  const [localStatus, setLocalStatus] = useState(appliedFilters.status);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.getEvents({
        page,
        page_size: pageSize,
        search,
        sort_by: sortBy,
        sort_order: sortOrder,
        start_date: appliedFilters.start_date,
        end_date: appliedFilters.end_date,
        production_line: localLine !== 'All Lines' ? localLine : undefined,
        event: localEvent !== 'All Events' ? localEvent : undefined,
        status: localStatus !== 'All' ? localStatus : undefined,
        invalid_reason: appliedFilters.invalid_reason !== 'All Reasons' ? appliedFilters.invalid_reason : undefined
      });
      setEvents(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page, pageSize, sortBy, sortOrder, appliedFilters, localLine, localEvent, localStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === events.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(events.map(e => e.id));
    }
  };

  const toggleSelectRow = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  const handleExport = () => {
    const exportUrl = api.getExportEventsUrl({
      search,
      start_date: appliedFilters.start_date,
      end_date: appliedFilters.end_date,
      production_line: localLine !== 'All Lines' ? localLine : undefined,
      event: localEvent !== 'All Events' ? localEvent : undefined,
      status: localStatus !== 'All' ? localStatus : undefined,
    });
    window.open(exportUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by event, line, reason, or file..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Quick Line Filter */}
          <select
            value={localLine}
            onChange={e => { setLocalLine(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none text-xs"
          >
            <option value="All Lines">All Lines</option>
            {options.production_lines.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          {/* Quick Event Filter */}
          <select
            value={localEvent}
            onChange={e => { setLocalEvent(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none text-xs"
          >
            <option value="All Events">All Events</option>
            {options.events.map(ev => (
              <option key={ev} value={ev}>{ev}</option>
            ))}
          </select>

          {/* Quick Status Filter */}
          <select
            value={localStatus}
            onChange={e => { setLocalStatus(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none text-xs"
          >
            <option value="All">All Statuses</option>
            <option value="Valid">Valid</option>
            <option value="Invalid">Invalid</option>
          </select>

          {/* Export CSV */}
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium border border-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-10">
                  <input
                    type="checkbox"
                    checked={events.length > 0 && selectedIds.length === events.length}
                    onChange={toggleSelectAll}
                    className="rounded text-blue-600"
                  />
                </th>
                <th
                  onClick={() => handleSort('time_of_occurrence')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 select-none whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Date & Time</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('event')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Event</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('production_line')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Production Line</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Invalid Reason</th>
                <th className="py-3 px-3">Source File</th>
                <th className="py-3 px-3 text-center">Row</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading inspection events...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No inspection events matching filter criteria
                  </td>
                </tr>
              ) : (
                events.map(ev => {
                  const isSelected = selectedIds.includes(ev.id);
                  return (
                    <tr
                      key={ev.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(ev.id)}
                          className="rounded text-blue-600"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {ev.date_str} <span className="text-slate-400">{ev.time_str}</span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {ev.event}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {ev.production_line}
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={ev.status} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 capitalize text-slate-700 truncate max-w-[160px]">
                        {ev.invalid_reason || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 truncate max-w-[140px]" title={ev.source_file}>
                        {ev.source_file}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                        {ev.source_row}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => onSelectEvent(ev)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span>
              Showing {total > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
              {Math.min(page * pageSize, total)} of {total.toLocaleString()} events
            </span>
            {selectedIds.length > 0 && (
              <span className="font-semibold text-blue-600">
                ({selectedIds.length} selected)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-700 text-xs focus:outline-none"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>

            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium px-1">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
