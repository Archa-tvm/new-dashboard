import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { KpiSummary } from '../../types';

interface KpiCardsProps {
  data: KpiSummary;
  loading?: boolean;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ data }) => {
  const cards = [
    {
      label: 'Valid Events',
      value: data.valid_events,
      percentage: data.valid_percentage,
      icon: CheckCircle,
      labelClass: 'text-emerald-600',
      iconClass: 'bg-emerald-50 text-emerald-600',
      valueClass: 'text-emerald-600'
    },
    {
      label: 'Invalid Events',
      value: data.invalid_events,
      percentage: data.invalid_rate,
      icon: XCircle,
      labelClass: 'text-rose-600',
      iconClass: 'bg-rose-50 text-rose-600',
      valueClass: 'text-rose-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {cards.map(({ label, value, percentage, icon: Icon, labelClass, iconClass, valueClass }) => (
        <div key={label} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold tracking-wider uppercase ${labelClass}`}>{label}</span>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconClass}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900">
            {value.toLocaleString()}
          </div>
          <div className={`mt-1 text-sm font-semibold ${valueClass}`}>
            {percentage === null ? '—' : `${percentage.toFixed(2)}% of all inspections`}
          </div>
        </div>
      ))}
    </div>
  );
};
