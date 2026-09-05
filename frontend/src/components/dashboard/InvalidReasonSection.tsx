import React from 'react';
import { AlertCircle } from 'lucide-react';
import { InvalidReasonItem } from '../../types';

interface InvalidReasonSectionProps {
  totalInvalid: number;
  invalidRate: number | null;
  distribution: InvalidReasonItem[];
}

export const InvalidReasonSection: React.FC<InvalidReasonSectionProps> = ({
  totalInvalid,
  invalidRate,
  distribution
}) => (
  <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
    <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-rose-600" />
        <div>
          <h3 className="text-lg font-bold text-slate-900">Why Invalid?</h3>
          <p className="text-xs text-slate-500 mt-1">Reason for each invalid inspection</p>
        </div>
      </div>
      <div className="text-right">
        <div className="text-2xl font-extrabold text-rose-700">{totalInvalid.toLocaleString()}</div>
        <div className="text-xs text-slate-500">
          invalid {invalidRate === null ? '' : `(${invalidRate.toFixed(2)}%)`}
        </div>
      </div>
    </div>
    <div className="mt-5 divide-y divide-slate-100">
      {distribution.length === 0 ? (
        <p className="py-4 text-sm text-slate-500">No invalid inspections.</p>
      ) : (
        distribution.map((item) => (
          <div key={item.reason} className="flex items-center justify-between gap-4 py-3">
            <span className="text-sm font-medium text-slate-800">{item.reason}</span>
            <span className="text-sm font-semibold text-rose-700">
              {item.count.toLocaleString()} ({item.percentage.toFixed(2)}%)
            </span>
          </div>
        ))
      )}
    </div>
  </section>
);
