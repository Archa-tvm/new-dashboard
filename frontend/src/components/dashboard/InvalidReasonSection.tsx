import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as PieTooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as LineTooltip
} from 'recharts';
import { AlertCircle, AlertTriangle, ChevronRight, BarChart2 } from 'lucide-react';
import {
  InvalidReasonItem,
  InvalidReasonByEventRow,
  InvalidReasonTrendItem
} from '../../types';

interface InvalidReasonSectionProps {
  totalInvalid: number;
  invalidRate: number | null;
  distribution: InvalidReasonItem[];
  byEvent: InvalidReasonByEventRow[];
  trend: InvalidReasonTrendItem[];
  topInsight: {
    reason: string;
    count: number;
    percentage: number;
    message: string;
  } | null;
}

const COLORS = [
  '#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

export const InvalidReasonSection: React.FC<InvalidReasonSectionProps> = ({
  totalInvalid,
  invalidRate,
  distribution,
  byEvent,
  trend,
  topInsight
}) => {
  const [trendMetric, setTrendMetric] = useState<'count' | 'percentage'>('count');
  const [eventFilter, setEventFilter] = useState<'ALL' | 'OPSPD' | 'HNDPOS'>('ALL');

  // Filter reasons by event table
  const filteredByEvent = byEvent.filter(row => {
    if (eventFilter === 'OPSPD') return row.opspd_count > 0;
    if (eventFilter === 'HNDPOS') return row.hndpos_count > 0;
    return true;
  });

  // Prepare trend data for Recharts
  const trendChartData = trend.map(t => {
    const item: any = { formatted_date: t.formatted_date };
    const source = trendMetric === 'count' ? t.reasons : t.percentages;
    Object.entries(source).forEach(([rName, val]) => {
      item[rName] = val;
    });
    return item;
  });

  const top5Reasons = distribution.slice(0, 5).map(d => d.reason);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Invalid Reason Analysis</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Systematic diagnosis of defect modalities and false-trigger classifications
          </p>
        </div>

        {/* Header KPI Pills */}
        <div className="flex items-center gap-3">
          <div className="bg-rose-50 border border-rose-200 rounded-lg px-4 py-2 text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-700 block">Total Invalid</span>
            <span className="text-xl font-extrabold text-rose-900 leading-tight">
              {totalInvalid.toLocaleString()}
            </span>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 block">Invalid Rate</span>
            <span className="text-xl font-extrabold text-amber-900 leading-tight">
              {invalidRate !== null ? `${invalidRate.toFixed(2)}%` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Top Invalid Reason Dynamic Insight Card */}
      {topInsight && (
        <div className="bg-amber-50/80 border-l-4 border-amber-500 p-4 rounded-r-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-bold text-amber-900 uppercase tracking-wider text-[10px]">
              ⚠ TOP INVALID REASON
            </div>
            <div className="text-slate-800 font-semibold mt-0.5">
              <span className="capitalize text-amber-950 underline">{topInsight.reason}</span> is the most frequent invalid reason.
            </div>
            <div className="text-slate-600 mt-1">
              <span className="font-bold text-slate-900">{topInsight.count} events</span> ({topInsight.percentage.toFixed(2)}% of all invalid events).
            </div>
          </div>
        </div>
      )}

      {/* Row 1: Donut Chart + Top Reasons Horizontal Bar List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Donut Chart (5 cols) */}
        <div className="lg:col-span-5 bg-slate-50/50 rounded-xl border border-slate-200 p-5 flex flex-col items-center">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 self-start">
            Invalid Reason Distribution
          </h4>
          <div className="relative w-64 h-64 flex items-center justify-center">
            {totalInvalid === 0 ? (
              <div className="text-xs text-slate-400">No invalid events</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribution}
                      dataKey="count"
                      nameKey="reason"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={2}
                    >
                      {distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <PieTooltip
                      formatter={(val: any, name: any, item: any) => [
                        `${val} events (${item.payload.percentage.toFixed(2)}%)`,
                        item.payload.reason
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text */}
                <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-slate-900 leading-none">
                    {totalInvalid}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-1">
                    Invalid Events
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Top Reasons Horizontal Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-slate-50/50 rounded-xl border border-slate-200 p-5 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Top Invalid Reasons
            </h4>
            <div className="space-y-3">
              {distribution.slice(0, 6).map((item, idx) => (
                <div key={item.reason} className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-800 capitalize truncate max-w-[200px]">
                      {item.reason}
                    </span>
                    <span className="font-mono text-slate-600 font-bold">
                      {item.count} | {item.percentage.toFixed(2)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color || COLORS[idx % COLORS.length]
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-4 text-right">
            Sorted descending by frequency
          </div>
        </div>
      </div>

      {/* Row 2: Reasons by Event Table & Reason Trend by Date */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reasons by Event Table */}
        <div className="border border-slate-200 rounded-xl p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Invalid Reasons by Event
            </h4>
            <div className="flex items-center gap-1 text-[11px]">
              <button
                onClick={() => setEventFilter('ALL')}
                className={`px-2 py-0.5 rounded ${
                  eventFilter === 'ALL' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setEventFilter('OPSPD')}
                className={`px-2 py-0.5 rounded ${
                  eventFilter === 'OPSPD' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                OPSPD
              </button>
              <button
                onClick={() => setEventFilter('HNDPOS')}
                className={`px-2 py-0.5 rounded ${
                  eventFilter === 'HNDPOS' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                HNDPOS
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-2 px-2.5">Reason</th>
                  <th className="py-2 px-2 text-center">OPSPD (C / %)</th>
                  <th className="py-2 px-2 text-center">HNDPOS (C / %)</th>
                  <th className="py-2 px-2 text-center font-bold">Total (C / %)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredByEvent.map(row => (
                  <tr key={row.reason} className="hover:bg-slate-50">
                    <td className="py-2 px-2.5 font-medium text-slate-800 capitalize">
                      {row.reason}
                    </td>
                    <td className="py-2 px-2 text-center text-slate-600">
                      {row.opspd_count} <span className="text-slate-400">({row.opspd_percentage.toFixed(1)}%)</span>
                    </td>
                    <td className="py-2 px-2 text-center text-slate-600">
                      {row.hndpos_count} <span className="text-slate-400">({row.hndpos_percentage.toFixed(1)}%)</span>
                    </td>
                    <td className="py-2 px-2 text-center font-bold text-slate-900">
                      {row.total_count} <span className="text-rose-600">({row.overall_percentage.toFixed(1)}%)</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reason Trend with Toggle [Count] / [Percentage] */}
        <div className="border border-slate-200 rounded-xl p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Invalid Reason Trend
            </h4>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setTrendMetric('count')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  trendMetric === 'count'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Count
              </button>
              <button
                onClick={() => setTrendMetric('percentage')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  trendMetric === 'percentage'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Percentage
              </button>
            </div>
          </div>

          <div className="h-56 w-full">
            {trendChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No trend data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="formatted_date"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                    unit={trendMetric === 'percentage' ? '%' : ''}
                  />
                  <LineTooltip />
                  {top5Reasons.map((rName, idx) => (
                    <Line
                      key={rName}
                      type="monotone"
                      dataKey={rName}
                      name={rName}
                      stroke={COLORS[idx % COLORS.length]}
                      strokeWidth={1.5}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
