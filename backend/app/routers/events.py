from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, or_
from typing import Optional, List
from datetime import datetime, timedelta
import pandas as pd
import io
from app.database import get_db
from app.models import InspectionEvent
from app.schemas import DashboardFilterParams, PaginatedEventsResponse, InspectionEventSchema

router = APIRouter(prefix="/events", tags=["Events"])

@router.get("", response_model=PaginatedEventsResponse)
def get_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: Optional[str] = Query(None),
    sort_by: str = Query("time_of_occurrence"),
    sort_order: str = Query("desc"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    production_line: Optional[str] = Query(None),
    event: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    invalid_reason: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(InspectionEvent)

    # Apply date and categorical filters
    if start_date:
        try:
            sd = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(InspectionEvent.time_of_occurrence >= sd)
        except ValueError:
            pass
    if end_date:
        try:
            ed = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(InspectionEvent.time_of_occurrence < ed)
        except ValueError:
            pass
    if production_line and production_line != "All Lines":
        query = query.filter(InspectionEvent.production_line == production_line)
    if event and event != "All Events":
        query = query.filter(InspectionEvent.event == event)
    if status and status != "All":
        query = query.filter(InspectionEvent.status == status.lower())
    if invalid_reason and invalid_reason != "All Reasons":
        query = query.filter(InspectionEvent.invalid_reason == invalid_reason)

    # Search
    if search:
        s_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                InspectionEvent.event.ilike(s_term),
                InspectionEvent.production_line.ilike(s_term),
                InspectionEvent.status.ilike(s_term),
                InspectionEvent.invalid_reason.ilike(s_term),
                InspectionEvent.source_file.ilike(s_term)
            )
        )

    total = query.count()

    # Sorting
    sort_col = getattr(InspectionEvent, sort_by, InspectionEvent.time_of_occurrence)
    if sort_order.lower() == "asc":
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))

    offset = (page - 1) * page_size
    records = query.offset(offset).limit(page_size).all()

    items = []
    for r in records:
        items.append(InspectionEventSchema(
            id=r.id,
            event=r.event,
            production_line=r.production_line,
            time_of_occurrence=r.time_of_occurrence,
            date_str=r.time_of_occurrence.strftime("%d %b %Y"),
            time_str=r.time_of_occurrence.strftime("%H:%M:%S"),
            status=r.status,
            invalid_reason=r.invalid_reason,
            source_file=r.source_file,
            source_row=r.source_row,
            created_at=r.created_at
        ))

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedEventsResponse(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        items=items
    )

@router.get("/export")
def export_events(
    search: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    production_line: Optional[str] = Query(None),
    event: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    invalid_reason: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(InspectionEvent)
    if start_date:
        try:
            sd = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(InspectionEvent.time_of_occurrence >= sd)
        except ValueError:
            pass
    if end_date:
        try:
            ed = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(InspectionEvent.time_of_occurrence < ed)
        except ValueError:
            pass
    if production_line and production_line != "All Lines":
        query = query.filter(InspectionEvent.production_line == production_line)
    if event and event != "All Events":
        query = query.filter(InspectionEvent.event == event)
    if status and status != "All":
        query = query.filter(InspectionEvent.status == status.lower())
    if invalid_reason and invalid_reason != "All Reasons":
        query = query.filter(InspectionEvent.invalid_reason == invalid_reason)
    if search:
        s_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                InspectionEvent.event.ilike(s_term),
                InspectionEvent.production_line.ilike(s_term),
                InspectionEvent.status.ilike(s_term),
                InspectionEvent.invalid_reason.ilike(s_term),
                InspectionEvent.source_file.ilike(s_term)
            )
        )

    records = query.order_by(desc(InspectionEvent.time_of_occurrence)).limit(10000).all()
    rows = []
    for r in records:
        rows.append({
            "Date": r.time_of_occurrence.strftime("%Y-%m-%d"),
            "Time": r.time_of_occurrence.strftime("%H:%M:%S"),
            "Event": r.event,
            "Production Line": r.production_line,
            "Status": r.status.upper(),
            "Invalid Reason": r.invalid_reason or "—",
            "Source File": r.source_file,
            "Source Row": r.source_row
        })

    buf = io.StringIO()
    pd.DataFrame(rows).to_csv(buf, index=False)
    return Response(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=inspection_events_export.csv"}
    )

@router.get("/{event_id}", response_model=InspectionEventSchema)
def get_event_detail(event_id: int, db: Session = Depends(get_db)):
    ev = db.query(InspectionEvent).filter(InspectionEvent.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    return InspectionEventSchema(
        id=ev.id,
        event=ev.event,
        production_line=ev.production_line,
        time_of_occurrence=ev.time_of_occurrence,
        date_str=ev.time_of_occurrence.strftime("%d %B %Y"),
        time_str=ev.time_of_occurrence.strftime("%H:%M:%S"),
        status=ev.status,
        invalid_reason=ev.invalid_reason,
        source_file=ev.source_file,
        source_row=ev.source_row,
        created_at=ev.created_at
    )
