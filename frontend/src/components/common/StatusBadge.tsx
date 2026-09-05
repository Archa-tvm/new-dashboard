import React from 'react';

interface StatusBadgeProps {
  status: 'Good' | 'Warning' | 'Critical' | 'No Data' | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const norm = (status || '').toLowerCase();
  let bg = 'bg-slate-100 text-slate-600 border-slate-200';
  let dot = 'bg-slate-400';
  let label = status;

  if (norm === 'good' || norm === 'valid' || norm === 'above target' || norm === 'target achieved') {
    bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dot = 'bg-emerald-500';
  } else if (norm === 'warning' || norm === 'needs attention') {
    bg = 'bg-amber-50 text-amber-700 border-amber-200';
    dot = 'bg-amber-500';
  } else if (norm === 'critical' || norm === 'invalid' || norm === 'below target') {
    bg = 'bg-rose-50 text-rose-700 border-rose-200';
    dot = 'bg-rose-500';
  } else if (norm === 'no data' || norm === '—' || !norm) {
    bg = 'bg-slate-100 text-slate-600 border-slate-200';
    dot = 'bg-slate-400';
    label = 'No Data';
  }

  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border font-medium ${bg} ${px}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
      <span>{label}</span>
    </span>
  );
};
