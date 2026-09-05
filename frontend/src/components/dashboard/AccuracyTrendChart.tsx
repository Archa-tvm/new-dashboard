import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend
} from 'recharts';
import { AccuracyTrendItem } from '../../types';

interface AccuracyTrendChartProps {
  data: AccuracyTrendItem[];
  targetAccuracy?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const item: AccuracyTrendItem = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs border border-slate-700 min-w-[160px]">
        <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1.5 mb-2">
          {item.formatted_date || item.date}
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-blue-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              OPSPD:
            </span>
            <span className="font-bold">
              {item.opspd !== null && item.opspd !== undefined ? `${item.opspd.toFixed(2)}%` : '— (No Data)'}
            </span>
          </div>

          <div className="flex items-center justify-between text-purple-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              HNDPOS:
            </span>
            <span className="font-bold">
              {item.hndpos !== null && item.hndpos !== undefined ? `${item.hndpos.toFixed(2)}%` : '— (No Data)'}
            </span>
          </div>

          <div className="flex items-center justify-between text-emerald-400 pt-1 border-t border-slate-800/80">
            <span className="flex items-center gap-1.5 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Overall:
            </span>
            <span className="font-bold">
              {item.overall !== null && item.overall !== undefined ? `${item.overall.toFixed(2)}%` : '— (No Data)'}
            </span>
          </div>

          <div className="flex items-center justify-between text-rose-400 pt-0.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-0.5 bg-rose-500"></span>
              Target:
            </span>
            <span className="font-medium">{item.target.toFixed(2)}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const AccuracyTrendChart: React.FC<AccuracyTrendChartProps> = ({
  data,
  targetAccuracy = 90.0
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Inspection Accuracy Trend</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily accuracy percentage by inspection event compared against target
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-blue-600 font-medium">
            <span className="w-3 h-0.5 bg-blue-600 rounded-full"></span>
            <span>OPSPD</span>
          </div>
          <div className="flex items-center gap-1.5 text-purple-600 font-medium">
            <span className="w-3 h-0.5 bg-purple-600 rounded-full"></span>
            <span>HNDPOS</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
            <span className="w-3 h-0.5 bg-emerald-600 rounded-full"></span>
            <span>Overall</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-500 font-medium">
            <span className="w-3 border-t border-dashed border-rose-500"></span>
            <span>{targetAccuracy}% Target</span>
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
            <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="formatted_date"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
                unit="%"
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={targetAccuracy}
                stroke="#f43f5e"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `Target: ${targetAccuracy}%`,
                  position: 'insideTopRight',
                  fill: '#f43f5e',
                  fontSize: 10,
                  offset: 8
                }}
              />
              {/* ConnectNulls is false: missing dates show break rather than 0% */}
              <Line
                type="monotone"
                dataKey="opspd"
                name="OPSPD"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 3, fill: '#2563eb' }}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="hndpos"
                name="HNDPOS"
                stroke="#9333ea"
                strokeWidth={2}
                dot={{ r: 3, fill: '#9333ea' }}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="overall"
                name="Overall"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: '#10b981' }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
