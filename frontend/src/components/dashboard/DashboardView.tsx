import React, { useEffect, useState } from 'react';
import { useFilters } from '../../context/FilterContext';
import { api } from '../../services/api';
import { EventBreakdownRow, EventPerformanceCard } from '../../types';
import { EmptyState } from '../common/EmptyState';
import { InspectionSummaryTable } from './InspectionSummaryTable';
import { OverallEventSummaryTable } from './OverallEventSummaryTable';

interface DashboardViewProps {
  onNavigateToImport: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateToImport }) => {
  const { appliedFilters, refreshTrigger, refresh } = useFilters();
  const [loading, setLoading] = useState(true);
  const [breakdown, setBreakdown] = useState<EventBreakdownRow[]>([]);
  const [eventSummary, setEventSummary] = useState<EventPerformanceCard[]>([]);

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true);
      try {
        const [breakdownResponse, eventSummaryResponse] = await Promise.all([
          api.getEventBreakdown(appliedFilters),
          api.getEventsSummary(appliedFilters)
        ]);
        setBreakdown(breakdownResponse);
        setEventSummary(eventSummaryResponse);
      } catch (error) {
        console.error('Failed to load inspection summary:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSummary();
  }, [appliedFilters, refreshTrigger]);

  if (!loading && !breakdown.length && !eventSummary.length) {
    return (
      <EmptyState
        onNavigateToImport={onNavigateToImport}
        onLoadSample={async () => {
          await api.loadSampleDataset('batch1');
          refresh();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(420px,0.8fr)] gap-6 items-start">
        <InspectionSummaryTable data={breakdown} loading={loading} />
        <OverallEventSummaryTable data={eventSummary} loading={loading} />
      </div>
    </div>
  );
};
