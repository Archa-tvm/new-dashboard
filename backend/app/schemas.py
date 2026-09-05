from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

# Filter schema
class DashboardFilterParams(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    production_line: Optional[str] = None
    event: Optional[str] = None
    status: Optional[str] = None
    invalid_reason: Optional[str] = None

# KPI Cards Schema
class KpiSummaryResponse(BaseModel):
    total_events: int
    valid_events: int
    invalid_events: int
    valid_percentage: Optional[float] = None
    invalid_rate: Optional[float] = None
    overall_accuracy: Optional[float] = None # None if total_events == 0
    target_accuracy: float
    target_status: str # "ABOVE TARGET", "BELOW TARGET", "NO DATA"
    # Ground truth metrics
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None

# Accuracy Trend Item
class AccuracyTrendItem(BaseModel):
    date: str
    formatted_date: str
    opspd: Optional[float] = None
    hndpos: Optional[float] = None
    overall: Optional[float] = None
    target: float = 90.0
    extra_events: Dict[str, Optional[float]] = Field(default_factory=dict)

# Daily Performance Table Row
class DailyPerformanceRow(BaseModel):
    date: str
    formatted_date: str
    opspd_total: int
    opspd_valid: int
    opspd_invalid: int
    opspd_accuracy: Optional[float] = None
    hndpos_total: int
    hndpos_valid: int
    hndpos_invalid: int
    hndpos_accuracy: Optional[float] = None
    total_events: int
    valid: int
    invalid: int
    overall_accuracy: Optional[float] = None
    status: str # "Good", "Warning", "Critical", "No Data"

# Event Performance Card
class EventPerformanceCard(BaseModel):
    event: str
    accuracy: Optional[float] = None
    total: int
    valid: int
    invalid: int
    target: float
    target_achieved: Optional[bool] = None

# Stacked Bar Item
class OutcomeByDateItem(BaseModel):
    date: str
    formatted_date: str
    total: int
    valid: int
    invalid: int
    accuracy: Optional[float] = None

# Invalid Reason Distribution Item
class InvalidReasonItem(BaseModel):
    reason: str
    count: int
    percentage: float
    color: Optional[str] = None

# Invalid Reason By Event Item
class InvalidReasonByEventRow(BaseModel):
    reason: str
    opspd_count: int
    opspd_percentage: float
    hndpos_count: int
    hndpos_percentage: float
    total_count: int
    overall_percentage: float

# Invalid Reason Trend Item
class InvalidReasonTrendItem(BaseModel):
    date: str
    formatted_date: str
    reasons: Dict[str, int]
    percentages: Dict[str, float]

# Production Line Performance
class LinePerformanceItem(BaseModel):
    line: str
    total: int
    valid: int
    invalid: int
    accuracy: Optional[float] = None
    target: float
    status: str # "Good", "Warning", "Critical", "No Data"

# Hourly Analysis Item
class HourlyActivityItem(BaseModel):
    hour: str # "00:00", "01:00", ... "23:00"
    total: int
    valid: int
    invalid: int

# Highlights & Insights
class HighlightsResponse(BaseModel):
    best_day: Optional[Dict[str, Any]] = None
    worst_day: Optional[Dict[str, Any]] = None
    best_event: Optional[Dict[str, Any]] = None
    needs_attention: Optional[Dict[str, Any]] = None
    best_line: Optional[str] = None
    worst_line: Optional[str] = None
    lines_below_target: List[str] = Field(default_factory=list)
    top_invalid_reason: Optional[Dict[str, Any]] = None
    insights: List[Dict[str, str]] = Field(default_factory=list)

# Inspection Event Response Schema
class InspectionEventSchema(BaseModel):
    id: int
    event: str
    production_line: str
    time_of_occurrence: datetime
    date_str: str
    time_str: str
    status: str
    invalid_reason: Optional[str] = None
    source_file: str
    source_row: int
    created_at: datetime

    model_config = {"from_attributes": True}

# Paginated Events Response
class PaginatedEventsResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: List[InspectionEventSchema]

# Import Schemas
class FileAnalysisPreview(BaseModel):
    file_token: str = ""
    file_name: str
    file_type: str
    total_rows: int
    detected_columns: Dict[str, str] # e.g. {"Event": "event", "Line": "production_line"}
    unmapped_columns: List[str]
    missing_required_columns: List[str]
    can_auto_import: bool
    sample_rows: List[Dict[str, Any]]
    date_range_detected: Optional[str] = None
    event_types_detected: List[str] = Field(default_factory=list)
    production_lines_detected: List[str] = Field(default_factory=list)
    valid_count_estimate: int = 0
    invalid_count_estimate: int = 0
    duplicate_count: int = 0
    warning_count: int = 0
    rejected_count: int = 0

class ImportExecutionRequest(BaseModel):
    file_token: str
    column_mapping: Optional[Dict[str, str]] = None
    skip_duplicates: bool = True

class ImportExecutionResponse(BaseModel):
    batch_id: int
    file_name: str
    total_rows: int
    imported_rows: int
    duplicate_rows: int
    rejected_rows: int
    status: str
    message: str

class ImportBatchSchema(BaseModel):
    id: int
    file_name: str
    file_type: str
    total_rows: int
    imported_rows: int
    duplicate_rows: int
    rejected_rows: int
    uploaded_at: datetime
    status: str

    model_config = {"from_attributes": True}

# Settings Schema
class SettingsSchema(BaseModel):
    overall_target: float = 90.0
    opspd_target: float = 90.0
    hndpos_target: float = 90.0
    auto_refresh: bool = True
    refresh_interval: int = 30
    database_type: str = "SQLite (Local Fallback)"
    database_url_masked: str = ""
