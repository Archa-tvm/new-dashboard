from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime
import pandas as pd
from app.database import get_db
from app.models import InspectionEvent, HistoricalSummary
from app.schemas import DashboardFilterParams
from app.services.analytics import apply_filters, get_target_settings

router = APIRouter(prefix="/analytics", tags=["Analytics"])

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

@router.get("/granular")
def get_granular_analytics(
    period: str = Query("daily", regex="^(daily|weekly|monthly)$"),
    filters: DashboardFilterParams = Depends(get_filter_params),
    db: Session = Depends(get_db)
):
    query = db.query(InspectionEvent)
    query = apply_filters(query, filters)
    events = query.all()

    if not events:
        return {"period": period, "data": []}

    records = [{
        "date": ev.time_of_occurrence,
        "event": ev.event,
        "status": ev.status,
        "line": ev.production_line
    } for ev in events]

    df = pd.DataFrame(records)

    if period == "weekly":
        df["period_key"] = df["date"].dt.to_period("W").apply(lambda r: f"Week {r.week}, {r.start_time.strftime('%b %Y')}")
        df["sort_key"] = df["date"].dt.to_period("W").apply(lambda r: r.start_time)
    elif period == "monthly":
        df["period_key"] = df["date"].dt.strftime("%B %Y")
        df["sort_key"] = df["date"].dt.to_period("M").apply(lambda r: r.start_time)
    else:
        df["period_key"] = df["date"].dt.strftime("%b %d, %Y")
        df["sort_key"] = df["date"].dt.date

    grouped = df.groupby(["sort_key", "period_key"])
    results = []

    targets = get_target_settings(db)
    target_acc = targets["overall_target"]

    for (s_key, p_key), grp in grouped:
        tot = len(grp)
        valid = (grp["status"] == "valid").sum()
        invalid = tot - valid
        acc = round((valid / tot) * 100, 2) if tot > 0 else None

        # Event breakdown
        ev_grp = grp.groupby("event")
        events_dict = {}
        for ev_name, e_rows in ev_grp:
            e_tot = len(e_rows)
            e_val = (e_rows["status"] == "valid").sum()
            events_dict[ev_name] = {
                "total": int(e_tot),
                "valid": int(e_val),
                "invalid": int(e_tot - e_val),
                "accuracy": round((e_val / e_tot) * 100, 2) if e_tot > 0 else None
            }

        results.append({
            "period": p_key,
            "total": int(tot),
            "valid": int(valid),
            "invalid": int(invalid),
            "accuracy": acc,
            "target": target_acc,
            "events": events_dict,
            "status": "Good" if acc and acc >= 90 else ("Warning" if acc and acc >= 80 else ("Critical" if acc else "No Data"))
        })

    # Sort chronological
    results.sort(key=lambda x: str(x["period"]))
    return {"period": period, "data": results}

@router.get("/metrics")
def get_advanced_metrics(filters: DashboardFilterParams = Depends(get_filter_params), db: Session = Depends(get_db)):
    query = db.query(InspectionEvent)
    query = apply_filters(query, filters)
    events = query.all()

    total = len(events)
    if total == 0:
        return {
            "has_data": False,
            "tp": 0, "fp": 0, "fn": None,
            "precision": None, "recall": None, "f1_score": None, "accuracy": None,
            "notes": "No events matching filter criteria."
        }

    valid = sum(1 for e in events if e.status == "valid")
    invalid = total - valid

    tp = valid
    fp = invalid

    # Check if historical summary has FN
    hist_summaries = db.query(HistoricalSummary).all()
    has_fn = False
    fn_val = None
    if hist_summaries and any(h.fn is not None for h in hist_summaries):
        has_fn = True
        fn_val = sum(h.fn for h in hist_summaries if h.fn)

    accuracy = round((tp / total) * 100, 2)
    precision = round((tp / (tp + fp)) * 100, 2) if (tp + fp) > 0 else None
    recall = round((tp / (tp + fn_val)) * 100, 2) if has_fn and (tp + fn_val) > 0 else None
    f1 = (
        round(2 * (precision * recall) / (precision + recall), 2)
        if (precision and recall and (precision + recall) > 0)
        else None
    )

    return {
        "has_data": True,
        "total": total,
        "tp": tp,
        "fp": fp,
        "fn": fn_val if has_fn else "N/A",
        "precision": precision,
        "recall": recall if has_fn else "N/A",
        "f1_score": f1 if has_fn else "N/A",
        "accuracy": accuracy,
        "has_ground_truth_fn": has_fn
    }
