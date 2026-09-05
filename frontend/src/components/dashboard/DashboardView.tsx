import React, { useEffect, useState } from 'react';
import { useFilters } from '../../context/FilterContext';
import { api } from '../../services/api';
import { InspectionEvent, KpiSummary } from '../../types';
import { KpiCards } from './KpiCards';
import { InvalidReasonSection } from './InvalidReasonSection';
import { EmptyState } from '../common/EmptyState';

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

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true);
      try {
        const [summaryResponse, reasonsResponse] = await Promise.all([
          api.getSummary(appliedFilters),
          api.getInvalidReasons(appliedFilters)
        ]);
        setSummary(summaryResponse);
        setReasonData(reasonsResponse);
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
      {reasonData && (
        <InvalidReasonSection
          totalInvalid={reasonData.total_invalid || 0}
          invalidRate={reasonData.invalid_rate}
          distribution={reasonData.distribution || []}
          byEvent={reasonData.by_event || []}
          trend={reasonData.trend || []}
          topInsight={reasonData.top_insight}
        />
      )}
    </div>
  );
};
