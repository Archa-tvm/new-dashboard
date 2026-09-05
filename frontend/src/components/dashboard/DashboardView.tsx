import React, { useState, useEffect } from 'react';
import { useFilters } from '../../context/FilterContext';
import { api } from '../../services/api';
import {
  KpiSummary,
  AccuracyTrendItem,
  DailyPerformanceRow,
  EventPerformanceCard,
  OutcomeByDateItem,
  LinePerformanceItem,
  HourlyActivityItem,
  HighlightsData,
  InspectionEvent,
  EventBreakdownRow
} from '../../types';
import { KpiCards } from './KpiCards';
import { AccuracyTrendChart } from './AccuracyTrendChart';
import { EventPerformanceCards } from './EventPerformanceCards';
import { DailyPerformanceTable } from './DailyPerformanceTable';
import { EventBreakdownTable } from './EventBreakdownTable';
import { OutcomeBarChart } from './OutcomeBarChart';
import { InvalidReasonSection } from './InvalidReasonSection';
import { LinePerformance } from './LinePerformance';
import { HourlyAnalysis } from './HourlyAnalysis';
import { RecentEvents } from './RecentEvents';
import { DynamicInsights } from './DynamicInsights';
import { EmptyState } from '../common/EmptyState';

interface DashboardViewProps {
  onNavigateToImport: () => void;
  onNavigateToEvents: () => void;
  onSelectEvent: (event: InspectionEvent) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToImport,
  onNavigateToEvents,
  onSelectEvent
}) => {
  const { appliedFilters, refreshTrigger, refresh } = useFilters();

  const [loading, setLoading] = useState(true);
  const [kpiSummary, setKpiSummary] = useState<KpiSummary | null>(null);
  const [trendData, setTrendData] = useState<AccuracyTrendItem[]>([]);
  const [dailyData, setDailyData] = useState<DailyPerformanceRow[]>([]);
  const [eventCards, setEventCards] = useState<EventPerformanceCard[]>([]);
  const [outcomeData, setOutcomeData] = useState<OutcomeByDateItem[]>([]);
  const [reasonData, setReasonData] = useState<any>(null);
  const [lineData, setLineData] = useState<{
    lines: LinePerformanceItem[];
    best_line: string | null;
    worst_line: string | null;
    lines_below_target: string[];
  }>({ lines: [], best_line: null, worst_line: null, lines_below_target: [] });
  const [hourlyData, setHourlyData] = useState<HourlyActivityItem[]>([]);
  const [highlights, setHighlights] = useState<HighlightsData | null>(null);
  const [recentEvents, setRecentEvents] = useState<InspectionEvent[]>([]);
  const [breakdownData, setBreakdownData] = useState<EventBreakdownRow[]>([]);

  const loadAllDashboardData = async () => {
    setLoading(true);
    try {
      const [
        summaryRes,
        trendRes,
        dailyRes,
        eventsRes,
        outcomeRes,
        reasonsRes,
        lineRes,
        hourlyRes,
        highlightsRes,
        recentRes,
        breakdownRes
      ] = await Promise.all([
        api.getSummary(appliedFilters),
        api.getTrend(appliedFilters),
        api.getDaily(appliedFilters),
        api.getEventsSummary(appliedFilters),
        api.getOutcomeByDate(appliedFilters),
        api.getInvalidReasons(appliedFilters),
        api.getLineSummary(appliedFilters),
        api.getHourly(appliedFilters),
        api.getHighlights(appliedFilters),
        api.getRecentEvents(10),
        api.getEventBreakdown(appliedFilters)
      ]);

      setKpiSummary(summaryRes);
      setTrendData(trendRes);
      setDailyData(dailyRes);
      setEventCards(eventsRes);
      setOutcomeData(outcomeRes);
      setReasonData(reasonsRes);
      setLineData(lineRes);
      setHourlyData(hourlyRes);
      setHighlights(highlightsRes);
      setRecentEvents(recentRes);
      setBreakdownData(breakdownRes);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllDashboardData();
  }, [appliedFilters, refreshTrigger]);

  // If no data exists in entire DB
  const hasNoData = !kpiSummary || kpiSummary.total_events === 0;

  if (!loading && hasNoData) {
    return (
      <EmptyState
        onNavigateToImport={onNavigateToImport}
        onLoadSample={async () => {
          try {
            await api.loadSampleDataset('batch1');
            refresh();
          } catch (err) {
            console.error('Failed to load sample dataset', err);
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Dynamic Data-Driven Insights */}
      {highlights && highlights.insights && highlights.insights.length > 0 && (
        <DynamicInsights insights={highlights.insights} />
      )}

      {/* 2. Four Premium KPI Cards */}
      {kpiSummary && <KpiCards data={kpiSummary} loading={loading} />}

      {/* 3. Primary Accuracy Trend Chart */}
      <AccuracyTrendChart
        data={trendData}
        targetAccuracy={kpiSummary?.target_accuracy || 90.0}
      />

      {/* 4. Event Performance Cards & Highlights */}
      <EventPerformanceCards
        events={eventCards}
        highlights={highlights || undefined}
      />

      {/* 5. Daily Performance Table & Stacked Outcome Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7">
          <DailyPerformanceTable data={dailyData} />
        </div>
        <div className="lg:col-span-5">
          <OutcomeBarChart data={outcomeData} />
        </div>
      </div>

      {/* 5b. Event PP/TP/FP/FN Breakdown Table */}
      <EventBreakdownTable data={breakdownData} loading={loading} />

      {/* 6. Comprehensive Invalid Reason Analysis Section */}
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

      {/* 7. Line Performance & Hourly Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LinePerformance
          lines={lineData.lines}
          bestLine={lineData.best_line}
          worstLine={lineData.worst_line}
          linesBelowTarget={lineData.lines_below_target}
        />
        <HourlyAnalysis data={hourlyData} />
      </div>

      {/* 8. Recent Events List */}
      <RecentEvents
        events={recentEvents}
        onViewAll={onNavigateToEvents}
        onSelectEvent={onSelectEvent}
      />
    </div>
  );
};
