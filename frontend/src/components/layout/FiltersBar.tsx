import React from 'react';
import { Filter, RotateCcw, Calendar, CheckCircle2 } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';

export const FiltersBar: React.FC = () => {
  const { filters, options, updateFilter, applyFilters, resetFilters } = useFilters();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  };

  return (
    <div className="bg-white border-b border-slate-200 px-8 py-3.5 shadow-xs">
      <div className="flex flex-wrap items-center gap-3">
        {/* Date Range */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="date"
            value={filters.start_date}
            onChange={e => updateFilter('start_date', e.target.value)}
            className="bg-transparent text-slate-800 focus:outline-none text-xs"
            placeholder="Start Date"
            min={options.date_range.min_date || undefined}
            max={options.date_range.max_date || undefined}
          />
          <span className="text-slate-400 font-medium">→</span>
          <input
            type="date"
            value={filters.end_date}
            onChange={e => updateFilter('end_date', e.target.value)}
            className="bg-transparent text-slate-800 focus:outline-none text-xs"
            placeholder="End Date"
            min={options.date_range.min_date || undefined}
            max={options.date_range.max_date || undefined}
          />
        </div>

        {/* Production Line */}
        <div className="flex items-center text-xs">
          <select
            value={filters.production_line}
            onChange={e => updateFilter('production_line', e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-xs"
          >
            <option value="All Lines">All Lines</option>
            {options.production_lines.map(line => (
              <option key={line} value={line}>{line}</option>
            ))}
          </select>
        </div>

        {/* Event */}
        <div className="flex items-center text-xs">
          <select
            value={filters.event}
            onChange={e => updateFilter('event', e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-xs"
          >
            <option value="All Events">All Events</option>
            {options.events.map(ev => (
              <option key={ev} value={ev}>{ev}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="flex items-center text-xs">
          <select
            value={filters.status}
            onChange={e => updateFilter('status', e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-xs"
          >
            <option value="All">All Statuses</option>
            <option value="Valid">Valid Only</option>
            <option value="Invalid">Invalid Only</option>
          </select>
        </div>

        {/* Invalid Reason */}
        <div className="flex items-center text-xs">
          <select
            value={filters.invalid_reason}
            onChange={e => updateFilter('invalid_reason', e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-xs max-w-[180px] truncate"
          >
            <option value="All Reasons">All Reasons</option>
            {options.invalid_reasons.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={applyFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-xs"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Apply Filters</span>
          </button>

          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 active:scale-95 transition-all border border-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
