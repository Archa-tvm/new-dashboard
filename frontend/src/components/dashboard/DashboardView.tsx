import React, { useEffect, useState } from 'react';
import { useFilters } from '../../context/FilterContext';
import { api } from '../../services/api';
import { DailyPerformanceRow, EventBreakdownRow, EventPerformanceCard, InspectionEvent, KpiSummary } from '../../types';
import { KpiCards } from './KpiCards';
import { InvalidReasonSection } from './InvalidReasonSection';
import { EmptyState } from '../common/EmptyState';
import { InspectionSummaryTable } from './InspectionSummaryTable';
import { InvalidInspectionsTable } from './InvalidInspectionsTable';
import { DateTotalsTable } from './DateTotalsTable';
import { OverallEventSummaryTable } from './OverallEventSummaryTable';

interface DashboardViewProps {
  onNavigateToImport: () => void;
  onNavigateToEvents: () => void;
  onSelectEvent: (event: InspectionEvent) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateToImport }) => {
  const { appliedFilters, refreshTrigger, refresh } = useFilters();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<KpiSummary | null>(null);
  const [reasonData, setReasonData] = useState<any>(null);
  const [breakdown, setBreakdown] = useState<EventBreakdownRow[]>([]);
  const [invalidEvents, setInvalidEvents] = useState<InspectionEvent[]>([]);
  const [dailyTotals, setDailyTotals] = useState<DailyPerformanceRow[]>([]);
  const [eventSummary, setEventSummary] = useState<EventPerformanceCard[]>([]);

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true);
      try {
        const [summaryResponse, reasonsResponse, breakdownResponse, invalidEventsResponse, dailyResponse, eventSummaryResponse] = await Promise.all([
          api.getSummary(appliedFilters),
          api.getInvalidReasons(appliedFilters),
          api.getEventBreakdown(appliedFilters),
          api.getEvents({
            page: 1,
            page_size: 100,
            start_date: appliedFilters.start_date,
            end_date: appliedFilters.end_date,
            production_line: appliedFilters.production_line !== 'All Lines' ? appliedFilters.production_line : undefined,
            event: appliedFilters.event !== 'All Events' ? appliedFilters.event : undefined,
            status: 'Invalid',
            invalid_reason: appliedFilters.invalid_reason !== 'All Reasons' ? appliedFilters.invalid_reason : undefined,
            sort_by: 'time_of_occurrence',
            sort_order: 'desc'
          }),
          api.getDaily(appliedFilters),
          api.getEventsSummary(appliedFilters)
        ]);
        setSummary(summaryResponse);
        setReasonData(reasonsResponse);
        setBreakdown(breakdownResponse);
        setInvalidEvents(invalidEventsResponse.items);
        setDailyTotals(dailyResponse);
        setEventSummary(eventSummaryResponse);
      } catch (error) {
        console.error('Failed to load inspection summary:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSummary();
  }, [appliedFilters, refreshTrigger]);

  if (!loading && (!summary || summary.total_events === 0)) {
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
      {summary && <KpiCards data={summary} loading={loading} />}
      <DateTotalsTable data={dailyTotals} loading={loading} />
      <InspectionSummaryTable data={breakdown} loading={loading} />
      <OverallEventSummaryTable data={eventSummary} loading={loading} />
      {reasonData && (
        <InvalidReasonSection
          totalInvalid={reasonData.total_invalid || 0}
          invalidRate={reasonData.invalid_rate}
          distribution={reasonData.distribution || []}
        />
      )}
      <InvalidInspectionsTable events={invalidEvents} loading={loading} />
    </div>
  );
};
