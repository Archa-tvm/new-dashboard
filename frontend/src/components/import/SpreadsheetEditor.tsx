import React, { useState } from 'react';
import { ClipboardPaste, Plus, Send, Trash2 } from 'lucide-react';

export interface SpreadsheetRow {
  event: string;
  line: string;
  time: string;
  status: string;
  reason: string;
}

const emptyRow = (): SpreadsheetRow => ({ event: '', line: '', time: '', status: '', reason: '' });

interface SpreadsheetEditorProps {
  onImport: (file: File) => void;
  disabled?: boolean;
}

export const SpreadsheetEditor: React.FC<SpreadsheetEditorProps> = ({ onImport, disabled = false }) => {
  const [rows, setRows] = useState<SpreadsheetRow[]>(() => Array.from({ length: 6 }, emptyRow));

  const updateRow = (index: number, field: keyof SpreadsheetRow, value: string) => {
    setRows(current => current.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>, rowIndex: number) => {
    const text = event.clipboardData.getData('text/plain');
    if (!text.includes('\t') && !text.includes('\n')) return;

    event.preventDefault();
    const pastedRows = text.trimEnd().split(/\r?\n/).map(line => line.split('\t'));
    setRows(current => {
      const next = [...current];
      pastedRows.forEach((values, offset) => {
        const targetIndex = rowIndex + offset;
        while (next.length <= targetIndex) next.push(emptyRow());
        next[targetIndex] = {
          event: values[0] || '',
          line: values[1] || '',
          time: values[2] || '',
          status: values[3] || '',
          reason: values[4] || ''
        };
      });
      return next;
    });
  };

  const removeRow = (index: number) => {
    setRows(current => current.length > 1 ? current.filter((_, rowIndex) => rowIndex !== index) : current);
  };

  const addRow = () => setRows(current => [...current, emptyRow()]);

  const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const importRows = () => {
    const populatedRows = rows.filter(row => Object.values(row).some(value => value.trim()));
    if (!populatedRows.length) return;

    const csv = [
      ['Event', 'Line', 'TimeOfOccurrence', 'status', 'invalid reason'],
      ...populatedRows.map(row => [row.event, row.line, row.time, row.status, row.reason])
    ].map(row => row.map(escapeCsv).join(',')).join('\n');
    onImport(new File([csv], 'manual_inspection_sheet.csv', { type: 'text/csv' }));
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Create inspection sheet</h2>
          <p className="text-xs text-slate-500 mt-1">Paste rows from Excel or enter them here. The dashboard summary updates after import.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={addRow} disabled={disabled} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <Plus className="w-3.5 h-3.5" /> Add row
          </button>
          <button type="button" onClick={importRows} disabled={disabled} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50">
            <Send className="w-3.5 h-3.5" /> Import sheet
          </button>
        </div>
      </div>
      <div className="px-6 pt-4 flex items-center gap-2 text-[11px] text-slate-500">
        <ClipboardPaste className="w-3.5 h-3.5 text-blue-600" />
        Paste tab-separated rows starting in any Event cell. Use status values valid or invalid.
      </div>
      <div className="overflow-x-auto p-6 pt-3">
        <table className="w-full min-w-[760px] text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 uppercase tracking-wider">
              <th className="px-3 py-2 text-left">Event</th>
              <th className="px-3 py-2 text-left">Line</th>
              <th className="px-3 py-2 text-left">TimeOfOccurrence</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Invalid reason</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b border-slate-100">
                {(Object.keys(row) as Array<keyof SpreadsheetRow>).map(field => (
                  <td key={field} className="px-1 py-1">
                    <input
                      value={row[field]}
                      onChange={event => updateRow(index, field, event.target.value)}
                      onPaste={field === 'event' ? event => handlePaste(event, index) : undefined}
                      placeholder={index === 0 ? field === 'time' ? '2026-08-01 13:53:05' : field : ''}
                      className="w-full px-2 py-2 rounded border border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                    />
                  </td>
                ))}
                <td className="px-1 py-1 text-center">
                  <button type="button" title="Remove row" onClick={() => removeRow(index)} disabled={disabled} className="p-2 text-slate-400 hover:text-rose-600 disabled:opacity-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
