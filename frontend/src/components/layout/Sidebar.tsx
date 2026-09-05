import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  CalendarDays,
  UploadCloud,
  FileText,
  Settings as SettingsIcon,
  Cpu,
  Radio
} from 'lucide-react';

export type PageId = 'dashboard' | 'analytics' | 'events' | 'import' | 'reports' | 'settings';

interface SidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onSelectPage }) => {
  const mainNav = [
    { id: 'dashboard' as PageId, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics' as PageId, label: 'Analytics', icon: BarChart3 },
    { id: 'events' as PageId, label: 'Events', icon: CalendarDays },
  ];

  const managementNav = [
    { id: 'import' as PageId, label: 'Import Data', icon: UploadCloud },
    { id: 'reports' as PageId, label: 'Reports', icon: FileText },
  ];

  const systemNav = [
    { id: 'settings' as PageId, label: 'Settings', icon: SettingsIcon },
  ];

  const renderNavGroup = (items: typeof mainNav) => (
    <ul className="space-y-1">
      {items.map(item => {
        const Icon = item.icon;
        const isActive = currentPage === item.id;
        return (
          <li key={item.id}>
            <button
              onClick={() => onSelectPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside className="w-64 bg-[#0B132B] border-r border-slate-800/80 flex flex-col h-screen fixed left-0 top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-[11px] font-bold tracking-widest text-blue-400 uppercase">Production</div>
            <div className="text-sm font-bold text-white tracking-tight">INSPECTION ANALYTICS</div>
          </div>
        </div>
      </div>

      {/* Nav Content */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">Main</div>
          {renderNavGroup(mainNav)}
        </div>

        <div>
          <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">Management</div>
          {renderNavGroup(managementNav)}
        </div>

        <div>
          <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">System</div>
          {renderNavGroup(systemNav)}
        </div>
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-[#070D1E]/60">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-slate-200">System Online</span>
          <span className="ml-auto text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">AI Engine v2.4</span>
        </div>
      </div>
    </aside>
  );
};
