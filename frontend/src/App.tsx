import React, { useState } from 'react';
import { Sidebar, PageId } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { FiltersBar } from './components/layout/FiltersBar';
import { DashboardView } from './components/dashboard/DashboardView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { EventTable } from './components/events/EventTable';
import { EventDetailDrawer } from './components/events/EventDetailDrawer';
import { ImportView } from './components/import/ImportView';
import { ReportCenter } from './components/reports/ReportCenter';
import { SettingsView } from './components/settings/SettingsView';
import { FilterProvider } from './context/FilterContext';
import { InspectionEvent } from './types';
import { LoginView } from './components/auth/LoginView';

export const App: React.FC = () => {
  const [signedInUser, setSignedInUser] = useState<string | null>(() => localStorage.getItem('inspection-dashboard-user'));
  const [userRole, setUserRole] = useState<'admin' | 'user'>(() => {
    const savedRole = localStorage.getItem('inspection-dashboard-role');
    return savedRole === 'admin' || localStorage.getItem('inspection-dashboard-user') === 'admin' ? 'admin' : 'user';
  });
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [activeDrawerEvent, setActiveDrawerEvent] = useState<InspectionEvent | null>(null);

  if (!signedInUser) {
    return <LoginView onLogin={(username, role) => { localStorage.setItem('inspection-dashboard-user', username); localStorage.setItem('inspection-dashboard-role', role); setSignedInUser(username); setUserRole(role); }} />;
  }

  const handleLogout = () => {
    localStorage.removeItem('inspection-dashboard-user');
    localStorage.removeItem('inspection-dashboard-role');
    setSignedInUser(null);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigateToImport={() => setCurrentPage('import')}
          />
        );
      case 'analytics':
        return <AnalyticsView />;
      case 'events':
        return (
          <EventTable
            onSelectEvent={(ev) => setActiveDrawerEvent(ev)}
          />
        );
      case 'import':
        return <ImportView />;
      case 'reports':
        return <ReportCenter />;
      case 'settings':
        return <SettingsView />;
      default:
        return null;
    }
  };

  return (
    <FilterProvider>
      <div className="min-h-screen bg-slate-50 flex">
        {/* Fixed Navy Sidebar */}
        <Sidebar
          currentPage={currentPage}
          isAdmin={userRole === 'admin'}
          onSelectPage={(p) => setCurrentPage(p)}
        />

        {/* Main Content Workspace (Offset by sidebar width 64 = 16rem = 256px) */}
        <div className="flex-1 ml-64 flex flex-col min-h-screen">
          <Header username={signedInUser} onLogout={handleLogout} />
          <FiltersBar />

          <main className="flex-1 p-8 overflow-y-auto">
            {renderPage()}
          </main>
        </div>

        {/* Traceability Side Drawer */}
        <EventDetailDrawer
          event={activeDrawerEvent}
          onClose={() => setActiveDrawerEvent(null)}
        />
      </div>
    </FilterProvider>
  );
};

export default App;
