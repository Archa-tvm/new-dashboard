from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from app.database import get_db
from app.schemas import (
    DashboardFilterParams, KpiSummaryResponse, AccuracyTrendItem,
    DailyPerformanceRow, EventPerformanceCard, OutcomeByDateItem,
    HighlightsResponse, HourlyActivityItem, InspectionEventSchema,
    EventBreakdownRow
    , MonthlyAccuracyRow
)
from app.services.analytics import (
    get_kpi_summary, get_accuracy_trend, get_daily_performance,
    get_event_performance, get_outcome_by_date, get_invalid_reasons_analysis,
    get_line_performance, get_hourly_activity, get_highlights_and_insights,
    get_filter_options, apply_filters, get_event_breakdown_table
    , get_monthly_accuracy
)
from app.models import InspectionEvent

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

def get_filter_params(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    production_line: Optional[str] = Query(None),
    event: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    invalid_reason: Optional[str] = Query(None)
) -> DashboardFilterParams:
    return DashboardFilterParams(
        start_date=start_date,
        end_date=end_date,
        production_line=production_line,
        event=event,
        status=status,
        invalid_reason=invalid_reason
    )

@router.get("/summary", response_model=KpiSummaryResponse)
def get_summary(filters: DashboardFilterParams = Depends(get_filter_params), db: Session = Depends(get_db)):
    return get_kpi_summary(db, filters)

@router.get("/trend", response_model=List[AccuracyTrendItem])
def get_trend(filters: DashboardFilterParams = Depends(get_filter_params), db: Session = Depends(get_db)):
    return get_accuracy_trend(db, filters)

@router.get("/daily", response_model=List[DailyPerformanceRow])
def get_daily(filters: DashboardFilterParams = Depends(get_filter_params), db: Session = Depends(get_db)):
    return get_daily_performance(db, filters)

@router.get("/event-summary", response_model=List[EventPerformanceCard])
def get_events_summary(filters: DashboardFilterParams = Depends(get_filter_params), db: Session = Depends(get_db)):
    return get_event_performance(db, filters)

@router.get("/outcome-by-date", response_model=List[OutcomeByDateItem])
def get_outcome(filters: DashboardFilterParams = Depends(get_filter_params), db: Session = Depends(get_db)):
    return get_outcome_by_date(db, filters)

@router.get("/invalid-reasons")
def get_invalid_reasons(filters: DashboardFilterParams = Depends(get_filter_params), db: Session = Depends(get_db)):
    return get_invalid_reasons_analysis(db, filters)

@router.get("/line-summary")
def get_line_summary(filters: DashboardFilterParams = Depends(get_filter_params), db: Session = Depends(get_db)):
    return get_line_performance(db, filters)

@router.get("/hourly", response_model=List[HourlyActivityItem])
def get_hourly(filters: DashboardFilterParams = Depends(get_filter_params), db: Session = Depends(get_db)):
    return get_hourly_activity(db, filters)

@router.get("/highlights", response_model=HighlightsResponse)
def get_highlights(filters: DashboardFilterParams = Depends(get_filter_params), db: Session = Depends(get_db)):
    return get_highlights_and_insights(db, filters)

@router.get("/filter-options")
def get_filters(db: Session = Depends(get_db)):
    return get_filter_options(db)

@router.get("/event-breakdown", response_model=List[EventBreakdownRow])
def get_breakdown(filters: DashboardFilterParams = Depends(get_filter_params), db: Session = Depends(get_db)):
    return get_event_breakdown_table(db, filters)

@router.get("/monthly-accuracy", response_model=List[MonthlyAccuracyRow])
def get_monthly_accuracy_summary(filters: DashboardFilterParams = Depends(get_filter_params), db: Session = Depends(get_db)):
    return get_monthly_accuracy(db, filters)

@router.get("/recent-events")
def get_recent_events(limit: int = 10, db: Session = Depends(get_db)):
    events = db.query(InspectionEvent).order_by(InspectionEvent.time_of_occurrence.desc()).limit(limit).all()
    res = []
    for ev in events:
        res.append({
            "id": ev.id,
            "event": ev.event,
            "production_line": ev.production_line,
            "time_of_occurrence": ev.time_of_occurrence.isoformat(),
            "date_str": ev.time_of_occurrence.strftime("%d %B %Y"),
            "time_str": ev.time_of_occurrence.strftime("%H:%M:%S"),
            "status": ev.status,
            "invalid_reason": ev.invalid_reason or "—",
            "source_file": ev.source_file,
            "source_row": ev.source_row,
            "created_at": ev.created_at.isoformat()
        })
    return res
