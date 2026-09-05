export interface FilterState {
  start_date: string;
  end_date: string;
  production_line: string;
  event: string;
  status: string;
  invalid_reason: string;
}

export interface FilterOptions {
  production_lines: string[];
  events: string[];
  statuses: string[];
  invalid_reasons: string[];
  date_range: {
    min_date: string | null;
    max_date: string | null;
  };
}

export interface KpiSummary {
  total_events: number;
  valid_events: number;
  invalid_events: number;
  valid_percentage: number | null;
  invalid_rate: number | null;
  overall_accuracy: number | null;
  target_accuracy: number;
  target_status: string; // "ABOVE TARGET" | "BELOW TARGET" | "NO DATA"
  precision: number | null;
  recall: number | null;
  f1_score: number | null;
}

export interface AccuracyTrendItem {
  date: string;
  formatted_date: string;
  opspd: number | null;
  hndpos: number | null;
  overall: number | null;
  target: number;
  extra_events?: Record<string, number | null>;
}

export interface DailyPerformanceRow {
  date: string;
  formatted_date: string;
  opspd_total: number;
  opspd_valid: number;
  opspd_invalid: number;
  opspd_accuracy: number | null;
  hndpos_total: number;
  hndpos_valid: number;
  hndpos_invalid: number;
  hndpos_accuracy: number | null;
  total_events: number;
  valid: number;
  invalid: number;
  overall_accuracy: number | null;
  status: 'Good' | 'Warning' | 'Critical' | 'No Data';
}

export interface EventBreakdownRow {
  date: string;
  formatted_date: string;
  is_first_in_date: boolean;
  event: string;
  pp: number;
  tp: number;
  fp: number;
  fn: string | null;
  percentage: number | null;
}

export interface EventPerformanceCard {
  event: string;
  accuracy: number | null;
  total: number;
  valid: number;
  invalid: number;
  target: number;
  target_achieved: boolean | null;
}

export interface OutcomeByDateItem {
  date: string;
  formatted_date: string;
  total: number;
  valid: number;
  invalid: number;
  accuracy: number | null;
}

export interface InvalidReasonItem {
  reason: string;
  count: number;
  percentage: number;
  color?: string;
}

export interface InvalidReasonByEventRow {
  reason: string;
  opspd_count: number;
  opspd_percentage: number;
  hndpos_count: number;
  hndpos_percentage: number;
  total_count: number;
  overall_percentage: number;
}

export interface InvalidReasonTrendItem {
  date: string;
  formatted_date: string;
  reasons: Record<string, number>;
  percentages: Record<string, number>;
}

export interface LinePerformanceItem {
  line: string;
  total: number;
  valid: number;
  invalid: number;
  accuracy: number | null;
  target: number;
  status: 'Good' | 'Warning' | 'Critical' | 'No Data';
}

export interface HourlyActivityItem {
  hour: string;
  total: number;
  valid: number;
  invalid: number;
}

export interface HighlightsData {
  best_day: { date: string; accuracy: number } | null;
  worst_day: { date: string; accuracy: number } | null;
  best_event: { event: string; accuracy: number } | null;
  needs_attention: { event: string; accuracy: number } | null;
  best_line: string | null;
  worst_line: string | null;
  lines_below_target: string[];
  top_invalid_reason: {
    reason: string;
    count: number;
    percentage: number;
    message: string;
  } | null;
  insights: Array<{
    type: 'success' | 'warning' | 'info';
    message: string;
  }>;
}

export interface InspectionEvent {
  id: number;
  event: string;
  production_line: string;
  time_of_occurrence: string;
  date_str: string;
  time_str: string;
  status: string;
  invalid_reason: string | null;
  source_file: string;
  source_row: number;
  created_at: string;
}

export interface PaginatedEvents {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: InspectionEvent[];
}

export interface ImportBatch {
  id: number;
  file_name: string;
  file_type: string;
  total_rows: number;
  imported_rows: number;
  duplicate_rows: number;
  rejected_rows: number;
  uploaded_at: string;
  status: string;
}

export interface FileAnalysisPreview {
  file_token: string;
  file_name: string;
  file_type: string;
  total_rows: number;
  detected_columns: Record<string, string>;
  unmapped_columns: string[];
  missing_required_columns: string[];
  can_auto_import: boolean;
  sample_rows: Array<Record<string, any>>;
  date_range_detected: string | null;
  event_types_detected: string[];
  production_lines_detected: string[];
  valid_count_estimate: number;
  invalid_count_estimate: number;
  duplicate_count: number;
  warning_count: number;
  rejected_count: number;
}

export interface SettingsData {
  overall_target: number;
  opspd_target: number;
  hndpos_target: number;
  auto_refresh: boolean;
  refresh_interval: number;
  database_type: string;
  database_url_masked: string;
}
