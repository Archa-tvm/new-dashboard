import React from 'react';
import { CheckCircle2, AlertTriangle, Info, Sparkles } from 'lucide-react';

interface DynamicInsightsProps {
  insights: Array<{
    type: 'success' | 'warning' | 'info';
    message: string;
  }>;
}

export const DynamicInsights: React.FC<DynamicInsightsProps> = ({ insights }) => {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-blue-600" />
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">Data-Driven Quality Insights</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {insights.map((ins, idx) => {
          const isSuccess = ins.type === 'success';
          const isWarning = ins.type === 'warning';

          return (
            <div
              key={idx}
              className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs leading-relaxed ${
                isSuccess
                  ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-900'
                  : isWarning
                  ? 'bg-amber-50/50 border-amber-200/80 text-amber-900'
                  : 'bg-blue-50/50 border-blue-200/80 text-blue-900'
              }`}
            >
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              {isWarning && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
              {!isSuccess && !isWarning && <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
              <span className="font-medium">{ins.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
