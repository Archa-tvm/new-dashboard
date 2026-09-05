import {
  FilterState, FilterOptions, KpiSummary, AccuracyTrendItem,
  DailyPerformanceRow, EventPerformanceCard, OutcomeByDateItem,
  LinePerformanceItem, HourlyActivityItem, HighlightsData,
  PaginatedEvents, InspectionEvent, ImportBatch, FileAnalysisPreview,
  SettingsData
} from '../types';

const API_BASE = '/api';

function buildQuery(params: Record<string, any>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      q.append(key, String(val));
    }
  });
  const res = q.toString();
  return res ? `?${res}` : '';
}

export const api = {
  // Dashboard
  async getSummary(filters: FilterState): Promise<KpiSummary> {
    const res = await fetch(`${API_BASE}/dashboard/summary${buildQuery(filters)}`);
    if (!res.ok) throw new Error('Failed to load KPI summary');
    return res.json();
  },

  async getTrend(filters: FilterState): Promise<AccuracyTrendItem[]> {
    const res = await fetch(`${API_BASE}/dashboard/trend${buildQuery(filters)}`);
    if (!res.ok) throw new Error('Failed to load accuracy trend');
    return res.json();
  },

  async getDaily(filters: FilterState): Promise<DailyPerformanceRow[]> {
    const res = await fetch(`${API_BASE}/dashboard/daily${buildQuery(filters)}`);
    if (!res.ok) throw new Error('Failed to load daily performance');
    return res.json();
  },

  async getEventsSummary(filters: FilterState): Promise<EventPerformanceCard[]> {
    const res = await fetch(`${API_BASE}/dashboard/event-summary${buildQuery(filters)}`);
    if (!res.ok) throw new Error('Failed to load event summary');
    return res.json();
  },

  async getOutcomeByDate(filters: FilterState): Promise<OutcomeByDateItem[]> {
    const res = await fetch(`${API_BASE}/dashboard/outcome-by-date${buildQuery(filters)}`);
    if (!res.ok) throw new Error('Failed to load outcome by date');
    return res.json();
  },

  async getInvalidReasons(filters: FilterState): Promise<any> {
    const res = await fetch(`${API_BASE}/dashboard/invalid-reasons${buildQuery(filters)}`);
    if (!res.ok) throw new Error('Failed to load invalid reasons analysis');
    return res.json();
  },

  async getLineSummary(filters: FilterState): Promise<{
    lines: LinePerformanceItem[];
    best_line: string | null;
    worst_line: string | null;
    lines_below_target: string[];
  }> {
    const res = await fetch(`${API_BASE}/dashboard/line-summary${buildQuery(filters)}`);
    if (!res.ok) throw new Error('Failed to load line summary');
    return res.json();
  },

  async getHourly(filters: FilterState): Promise<HourlyActivityItem[]> {
    const res = await fetch(`${API_BASE}/dashboard/hourly${buildQuery(filters)}`);
    if (!res.ok) throw new Error('Failed to load hourly activity');
    return res.json();
  },

  async getHighlights(filters: FilterState): Promise<HighlightsData> {
    const res = await fetch(`${API_BASE}/dashboard/highlights${buildQuery(filters)}`);
    if (!res.ok) throw new Error('Failed to load highlights');
    return res.json();
  },

  async getFilterOptions(): Promise<FilterOptions> {
    const res = await fetch(`${API_BASE}/dashboard/filter-options`);
    if (!res.ok) throw new Error('Failed to load filter options');
    return res.json();
  },

  async getRecentEvents(limit: number = 10): Promise<InspectionEvent[]> {
    const res = await fetch(`${API_BASE}/dashboard/recent-events?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to load recent events');
    return res.json();
  },

  // Events Table
  async getEvents(params: Record<string, any>): Promise<PaginatedEvents> {
    const res = await fetch(`${API_BASE}/events${buildQuery(params)}`);
    if (!res.ok) throw new Error('Failed to load events');
    return res.json();
  },

  async getEventDetail(id: number): Promise<InspectionEvent> {
    const res = await fetch(`${API_BASE}/events/${id}`);
    if (!res.ok) throw new Error('Failed to load event detail');
    return res.json();
  },

  getExportEventsUrl(filters: Record<string, any>): string {
    return `${API_BASE}/events/export${buildQuery(filters)}`;
  },

  // Imports
  async analyzeFile(file: File): Promise<{ token: string; preview: FileAnalysisPreview }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/imports/analyze`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Analysis failed' }));
      throw new Error(err.detail || 'Failed to analyze file');
    }
    const preview: FileAnalysisPreview = await res.json();
    return { token: (preview as any).token || '', preview };
  },

  async executeImport(fileToken: string, columnMapping?: Record<string, string>, skipDuplicates: boolean = true) {
    const res = await fetch(`${API_BASE}/imports/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_token: fileToken,
        column_mapping: columnMapping,
        skip_duplicates: skipDuplicates
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Import failed' }));
      throw new Error(err.detail || 'Import failed');
    }
    return res.json();
  },

  async getImportHistory(): Promise<ImportBatch[]> {
    const res = await fetch(`${API_BASE}/imports`);
    if (!res.ok) throw new Error('Failed to load import history');
    return res.json();
  },

  async deleteImportBatch(id: number) {
    const res = await fetch(`${API_BASE}/imports/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete batch');
    return res.json();
  },

  async loadSampleDataset(sampleType: 'batch1' | 'batch2' | 'summary') {
    const res = await fetch(`${API_BASE}/imports/load-sample/${sampleType}`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to load sample dataset' }));
      throw new Error(err.detail || 'Failed to load sample dataset');
    }
    return res.json();
  },

  // Analytics
  async getGranular(period: 'daily' | 'weekly' | 'monthly', filters: FilterState) {
    const res = await fetch(`${API_BASE}/analytics/granular${buildQuery({ period, ...filters })}`);
    if (!res.ok) throw new Error('Failed to load granular analytics');
    return res.json();
  },

  async getMetrics(filters: FilterState) {
    const res = await fetch(`${API_BASE}/analytics/metrics${buildQuery(filters)}`);
    if (!res.ok) throw new Error('Failed to load metrics');
    return res.json();
  },

  // Reports
  getReportDownloadUrl(reportType: string, fileFormat: string, filters: FilterState) {
    return `${API_BASE}/reports/download${buildQuery({ report_type: reportType, file_format: fileFormat, ...filters })}`;
  },

  // Settings
  async getSettings(): Promise<SettingsData> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to load settings');
    return res.json();
  },

  async updateSettings(settings: SettingsData) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  async resetDatabase() {
    const res = await fetch(`${API_BASE}/settings/reset-database?confirm=true`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset database');
    return res.json();
  }
};
