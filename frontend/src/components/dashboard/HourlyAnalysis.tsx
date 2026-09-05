import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { Clock } from 'lucide-react';
import { HourlyActivityItem } from '../../types';

interface HourlyAnalysisProps {
  data: HourlyActivityItem[];
}

export const HourlyAnalysis: React.FC<HourlyAnalysisProps> = ({ data }) => {
  const [metric, setMetric] = useState<'total' | 'valid' | 'invalid'>('total');

  // Filter hours between 06:00 and 23:00 or active hours
  const activeHours = data.filter(d => {
    const hr = parseInt(d.hour.split(':')[0], 10);
    return hr >= 6 && hr <= 23;
  });

  const barColor = metric === 'valid' ? '#10b981' : metric === 'invalid' ? '#ef4444' : '#3b82f6';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Inspection Activity by Hour</h3>
            <p className="text-xs text-slate-500">24-hour manufacturing shift distribution</p>
          </div>
        </div>

        {/* Toggle [Total] [Valid] [Invalid] */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
          <button
            onClick={() => setMetric('total')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              metric === 'total' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Total
          </button>
          <button
            onClick={() => setMetric('valid')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              metric === 'valid' ? 'bg-white text-emerald-700 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Valid
          </button>
          <button
            onClick={() => setMetric('invalid')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              metric === 'invalid' ? 'bg-white text-rose-700 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Invalid
          </button>
        </div>
      </div>

      <div className="h-56 w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            No hourly data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activeHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <Tooltip
                formatter={(val: any) => [`${val} inspections`, metric.toUpperCase()]}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
              />
              <Bar dataKey={metric} fill={barColor} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
