import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Circle } from 'lucide-react';

interface ImportProgressModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

const STEPS = [
  'Reading spreadsheet',
  'Detecting columns',
  'Validating records',
  'Checking duplicates',
  'Calculating analytics',
  'Updating dashboard'
];

export const ImportProgressModal: React.FC<ImportProgressModalProps> = ({ isOpen, onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 400);
          return prev;
        }
      });
    }, 450);

    return () => clearInterval(interval);
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-2xl max-w-sm w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-blue-600">Processing</span>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">IMPORTING DATA</h3>
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-3.5">
          {STEPS.map((step, idx) => {
            const isFinished = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div key={step} className="flex items-center gap-3 text-xs">
                {isFinished ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                )}
                <span className={`font-medium ${
                  isFinished
                    ? 'text-slate-700'
                    : isCurrent
                    ? 'text-blue-600 font-bold'
                    : 'text-slate-400'
                }`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
