import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Calendar, BrainCircuit, Target, ShieldCheck, Award } from 'lucide-react';
import { api } from '../../services/api';
import { useFilters } from '../../context/FilterContext';
import { StatusBadge } from '../common/StatusBadge';

export const AnalyticsView: React.FC = () => {
  const { appliedFilters } = useFilters();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [granularData, setGranularData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [gRes, mRes] = await Promise.all([
        api.getGranular(period, appliedFilters),
        api.getMetrics(appliedFilters)
      ]);
      setGranularData(gRes.data || []);
      setMetrics(mRes);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period, appliedFilters]);

  return (
    <div className="space-y-6">
      {/* Top Controls & Period Toggle */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Granular Quality Analytics</h2>
          <p className="text-xs text-slate-500">
            Multi-timeframe aggregation and machine learning quality metrics
          </p>
        </div>

        {/* Daily / Weekly / Monthly Switch */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
          <button
            onClick={() => setPeriod('daily')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              period === 'daily'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily Rollup
          </button>
          <button
            onClick={() => setPeriod('weekly')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              period === 'weekly'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly Rollup
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              period === 'monthly'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly Rollup
          </button>
        </div>
      </div>

      {/* Ground Truth & ML Confusion Matrix Cards (Rule 8) */}
      {metrics && metrics.has_data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Precision</span>
            <div className="mt-1 text-2xl font-extrabold text-slate-900">
              {metrics.precision !== null ? `${metrics.precision.toFixed(2)}%` : '—'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">TP / (TP + FP)</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Recall</span>
            <div className="mt-1 text-2xl font-extrabold text-slate-900">
              {metrics.recall !== null && metrics.recall !== 'N/A' ? `${metrics.recall.toFixed(2)}%` : 'N/A'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {metrics.has_ground_truth_fn ? 'TP / (TP + FN)' : 'Requires FN Ground Truth'}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">F1 Score</span>
            <div className="mt-1 text-2xl font-extrabold text-slate-900">
              {metrics.f1_score !== null && metrics.f1_score !== 'N/A' ? `${metrics.f1_score.toFixed(2)}%` : 'N/A'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Harmonic Mean</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Confusion Breakdown</span>
            <div className="mt-1 flex items-center gap-3 text-xs font-mono">
              <span className="text-emerald-700 font-bold">TP: {metrics.tp}</span>
              <span className="text-rose-700 font-bold">FP: {metrics.fp}</span>
              <span className="text-slate-500 font-bold">FN: {metrics.fn}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Raw events truth source</div>
          </div>
        </div>
      )}

      {/* Rollup Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 tracking-tight mb-4">
          Accuracy Aggregation by {period.toUpperCase()}
        </h3>
        <div className="h-72 w-full">
          {granularData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No aggregated data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={granularData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} unit="%" />
                <Tooltip formatter={(val: any) => [`${val}%`, 'Accuracy']} />
                <Bar dataKey="accuracy" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Rollup Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 tracking-tight mb-4">
          Aggregated Performance Breakdown
        </h3>
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Period</th>
                <th className="py-2.5 px-3 text-center">Total Events</th>
                <th className="py-2.5 px-3 text-center text-emerald-700">Valid</th>
                <th className="py-2.5 px-3 text-center text-rose-700">Invalid</th>
                <th className="py-2.5 px-3 text-center font-bold">Accuracy</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {granularData.map(row => (
                <tr key={row.period} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{row.period}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-800">{row.total}</td>
                  <td className="py-2.5 px-3 text-center text-emerald-600 font-medium">{row.valid}</td>
                  <td className="py-2.5 px-3 text-center text-rose-600 font-medium">{row.invalid}</td>
                  <td className="py-2.5 px-3 text-center font-extrabold text-slate-900">
                    {row.accuracy !== null ? `${row.accuracy.toFixed(2)}%` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
