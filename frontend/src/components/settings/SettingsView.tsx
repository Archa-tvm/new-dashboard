import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RotateCcw, Database, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { SettingsData } from '../../types';
import { useFilters } from '../../context/FilterContext';

export const SettingsView: React.FC = () => {
  const { refresh } = useFilters();
  const [settings, setSettings] = useState<SettingsData>({
    overall_target: 90.0,
    opspd_target: 90.0,
    hndpos_target: 90.0,
    auto_refresh: true,
    refresh_interval: 30,
    database_type: 'SQLite (Local Fallback)',
    database_url_masked: ''
  });
  const [saved, setSaved] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(console.error);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings(settings);
      setSaved(true);
      refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const handleResetDatabase = async () => {
    if (window.confirm('WARNING: This will permanently delete all uploaded inspection events and history batches. Are you sure?')) {
      setResetting(true);
      try {
        await api.resetDatabase();
        refresh();
        alert('Inspection database cleared successfully.');
      } catch (err) {
        console.error('Reset error:', err);
      } finally {
        setResetting(false);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">System & KPI Target Configuration</h2>
          <p className="text-xs text-slate-500 mt-1">
            Customize target quality thresholds, live synchronization intervals, and persistence options
          </p>
        </div>
        {saved && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Targets Saved
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Quality Thresholds */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight uppercase tracking-wider text-xs border-b border-slate-100 pb-2">
            Inspection Accuracy Targets
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Overall Accuracy Target (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={settings.overall_target}
                onChange={e => setSettings({ ...settings, overall_target: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">Primary benchmark for KPI cards (default 90%)</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                OPSPD Event Target (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={settings.opspd_target}
                onChange={e => setSettings({ ...settings, opspd_target: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">Target for operator speed inspection</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                HNDPOS Event Target (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={settings.hndpos_target}
                onChange={e => setSettings({ ...settings, hndpos_target: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">Target for hand positioning inspection</p>
            </div>
          </div>
        </div>

        {/* Live Refresh Settings */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight uppercase tracking-wider text-xs border-b border-slate-100 pb-2">
            Auto-Refresh & Polling
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.auto_refresh}
                onChange={e => setSettings({ ...settings, auto_refresh: e.target.checked })}
                className="rounded text-blue-600 focus:ring-0 w-4 h-4"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Enable Dynamic Dashboard Auto-Refresh</span>
                <span className="text-[11px] text-slate-500">Periodically poll database for newly ingested inspection files</span>
              </div>
            </label>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Refresh Interval (Seconds)
              </label>
              <select
                value={settings.refresh_interval}
                onChange={e => setSettings({ ...settings, refresh_interval: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value={10}>10 Seconds (Real-Time)</option>
                <option value={30}>30 Seconds (Default)</option>
                <option value={60}>1 Minute</option>
                <option value={300}>5 Minutes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Database Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Database Architecture Status</h3>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-700">Storage Engine: </span>
              <span className="font-bold text-blue-700">{settings.database_type}</span>
            </div>
            <span className="text-slate-500 font-mono text-[11px]">{settings.database_url_masked}</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Engineered with full PostgreSQL support via SQLAlchemy. Automatically falls back to high-performance local SQLite for instant zero-dependency execution.
          </p>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-600/20"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>

          {/* Danger Zone: Reset Database */}
          <button
            type="button"
            onClick={handleResetDatabase}
            disabled={resetting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-semibold active:scale-95 transition-all"
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Clear Inspection Records</span>
          </button>
        </div>
      </form>
    </div>
  );
};
