import React, { useEffect, useState } from 'react';
import { useFilters } from '../../context/FilterContext';
import { api } from '../../services/api';
import { EventBreakdownRow, EventPerformanceCard, InspectionEvent } from '../../types';
import { EmptyState } from '../common/EmptyState';
import { InspectionSummaryTable } from './InspectionSummaryTable';
import { OverallEventSummaryTable } from './OverallEventSummaryTable';
import { LatestUpdatesTable } from './LatestUpdatesTable';

interface DashboardViewProps {
  onNavigateToImport: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateToImport }) => {
  const { appliedFilters, refreshTrigger, refresh } = useFilters();
  const [loading, setLoading] = useState(true);
  const [breakdown, setBreakdown] = useState<EventBreakdownRow[]>([]);
  const [eventSummary, setEventSummary] = useState<EventPerformanceCard[]>([]);
  const [latestEvents, setLatestEvents] = useState<InspectionEvent[]>([]);

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true);
      try {
        const [breakdownResponse, eventSummaryResponse, latestResponse] = await Promise.all([
          api.getEventBreakdown(appliedFilters),
          api.getEventsSummary(appliedFilters),
          api.getEvents({ page: 1, page_size: 10, sort_by: 'time_of_occurrence', sort_order: 'desc' })
        ]);
        setBreakdown(breakdownResponse);
        setEventSummary(eventSummaryResponse);
        setLatestEvents(latestResponse.items);
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
      <InspectionSummaryTable data={breakdown} loading={loading} />
      <OverallEventSummaryTable data={eventSummary} loading={loading} />
      <LatestUpdatesTable events={latestEvents} loading={loading} />
    </div>
  );
};
