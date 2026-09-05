import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { OutcomeByDateItem } from '../../types';

interface OutcomeBarChartProps {
  data: OutcomeByDateItem[];
}

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const item: OutcomeByDateItem = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs border border-slate-700 min-w-[140px]">
        <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1.5 mb-2">
          {item.formatted_date || item.date}
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-slate-300">
            <span>Total:</span>
            <span className="font-bold text-white">{item.total}</span>
          </div>
          <div className="flex items-center justify-between text-emerald-400">
            <span>Valid:</span>
            <span className="font-bold">{item.valid}</span>
          </div>
          <div className="flex items-center justify-between text-rose-400">
            <span>Invalid:</span>
            <span className="font-bold">{item.invalid}</span>
          </div>
          <div className="flex items-center justify-between text-blue-400 pt-1 border-t border-slate-800">
            <span>Accuracy:</span>
            <span className="font-bold">
              {item.accuracy !== null ? `${item.accuracy.toFixed(2)}%` : '—'}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const OutcomeBarChart: React.FC<OutcomeBarChartProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Inspection Outcome by Date</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily volume distribution of valid and invalid inspection events
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-emerald-600">
            <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
            <span>Valid</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-500">
            <span className="w-3 h-3 rounded-sm bg-rose-500"></span>
            <span>Invalid</span>
          </div>
        </div>
      </div>

      <div className="h-72 w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            No data available for selected filter range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="formatted_date"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="valid" name="Valid" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="invalid" name="Invalid" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
