from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.models import InspectionEvent, HistoricalSummary, SystemSetting
from app.schemas import (
    DashboardFilterParams, KpiSummaryResponse, AccuracyTrendItem,
    DailyPerformanceRow, EventBreakdownRow, EventPerformanceCard, OutcomeByDateItem,
    InvalidReasonItem, InvalidReasonByEventRow, InvalidReasonTrendItem,
    LinePerformanceItem, HourlyActivityItem, HighlightsResponse
    , MonthlyAccuracyRow
)

COLOR_PALETTE = [
    "#3B82F6", "#EF4444", "#F59E0B", "#10B981", "#8B5CF6",
    "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
    "#14B8A6", "#E11D48", "#A855F7", "#D97706", "#64748B"
]

def get_target_settings(db: Session) -> Dict[str, float]:
    targets = {
        "overall_target": 90.0,
        "opspd_target": 90.0,
        "hndpos_target": 90.0
    }
    settings_rows = db.query(SystemSetting).all()
    for row in settings_rows:
        if row.key in targets:
            try:
                targets[row.key] = float(row.value)
            except ValueError:
                pass
    return targets

def apply_filters(query, filters: DashboardFilterParams):
    if filters.start_date:
        try:
            sd = datetime.strptime(filters.start_date, "%Y-%m-%d")
            query = query.filter(InspectionEvent.time_of_occurrence >= sd)
        except ValueError:
            pass
    if filters.end_date:
        try:
            # End of day
            ed = datetime.strptime(filters.end_date, "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(InspectionEvent.time_of_occurrence < ed)
        except ValueError:
            pass
    if filters.production_line and filters.production_line != "All Lines":
        query = query.filter(InspectionEvent.production_line == filters.production_line)
    if filters.event and filters.event != "All Events":
        query = query.filter(InspectionEvent.event == filters.event)
    if filters.status and filters.status != "All":
        query = query.filter(InspectionEvent.status == filters.status.lower())
    if filters.invalid_reason and filters.invalid_reason != "All Reasons":
        query = query.filter(InspectionEvent.invalid_reason == filters.invalid_reason)
    return query

def get_kpi_summary(db: Session, filters: DashboardFilterParams) -> KpiSummaryResponse:
    targets = get_target_settings(db)
    target_acc = targets["overall_target"]

    query = db.query(InspectionEvent)
    query = apply_filters(query, filters)

    total_events = query.count()
    if total_events == 0:
        return KpiSummaryResponse(
            total_events=0,
            valid_events=0,
            invalid_events=0,
            valid_percentage=None,
            invalid_rate=None,
            overall_accuracy=None,
            target_accuracy=target_acc,
            target_status="NO DATA",
            precision=None,
            recall=None,
            f1_score=None
        )

    valid_events = query.filter(InspectionEvent.status == "valid").count()
    invalid_events = total_events - valid_events

    accuracy = round((valid_events / total_events) * 100, 2)
    valid_pct = accuracy
    invalid_rate = round((invalid_events / total_events) * 100, 2)

    # TP / FP calculation
    tp = valid_events
    fp = invalid_events
    # Check if historical summary has FN
    fn_total = 0
    has_fn = False
    hist_summaries = db.query(HistoricalSummary).all()
    if hist_summaries and any(h.fn is not None for h in hist_summaries):
        has_fn = True
        fn_total = sum(h.fn for h in hist_summaries if h.fn)

    precision = round((tp / (tp + fp)) * 100, 2) if (tp + fp) > 0 else None
    recall = round((tp / (tp + fn_total)) * 100, 2) if has_fn and (tp + fn_total) > 0 else None
    f1 = (
        round(2 * (precision * recall) / (precision + recall), 2)
        if (precision and recall and (precision + recall) > 0)
        else None
    )

    status_str = "ABOVE TARGET" if accuracy >= target_acc else "BELOW TARGET"

    return KpiSummaryResponse(
        total_events=total_events,
        valid_events=valid_events,
        invalid_events=invalid_events,
        valid_percentage=valid_pct,
        invalid_rate=invalid_rate,
        overall_accuracy=accuracy,
        target_accuracy=target_acc,
        target_status=status_str,
        precision=precision,
        recall=recall,
        f1_score=f1
    )

def get_all_dates_in_range(db: Session, filters: DashboardFilterParams) -> List[datetime]:
    query = db.query(InspectionEvent.time_of_occurrence)
    query = apply_filters(query, filters)
    min_date = query.order_by(InspectionEvent.time_of_occurrence.asc()).first()
    max_date = query.order_by(InspectionEvent.time_of_occurrence.desc()).first()

    if not min_date or not max_date:
        return []

    start = min_date[0].date()
    end = max_date[0].date()

    dates = []
    curr = start
    while curr <= end:
        dates.append(curr)
        curr += timedelta(days=1)
    return dates

def get_accuracy_trend(db: Session, filters: DashboardFilterParams) -> List[AccuracyTrendItem]:
    targets = get_target_settings(db)
    target_acc = targets["overall_target"]
    dates = get_all_dates_in_range(db, filters)
    if not dates:
        return []

    # Get events grouped by date and event
    base_query = db.query(InspectionEvent)
    base_query = apply_filters(base_query, filters)
    events = base_query.all()

    data_by_date = {}
    for d in dates:
        d_str = d.strftime("%Y-%m-%d")
        data_by_date[d_str] = {
            "date": d_str,
            "formatted_date": d.strftime("%b %d"),
            "events": {} # event_name: {"total": int, "valid": int}
        }

    for ev in events:
        d_str = ev.time_of_occurrence.strftime("%Y-%m-%d")
        if d_str in data_by_date:
            ev_dict = data_by_date[d_str]["events"]
            if ev.event not in ev_dict:
                ev_dict[ev.event] = {"total": 0, "valid": 0}
            ev_dict[ev.event]["total"] += 1
            if ev.status == "valid":
                ev_dict[ev.event]["valid"] += 1

    trend_items = []
    for d_str, d_info in data_by_date.items():
        ev_dict = d_info["events"]
        tot_day = sum(v["total"] for v in ev_dict.values())
        valid_day = sum(v["valid"] for v in ev_dict.values())

        overall_acc = round((valid_day / tot_day) * 100, 2) if tot_day > 0 else None

        opspd_acc = None
        if "OPSPD" in ev_dict and ev_dict["OPSPD"]["total"] > 0:
            opspd_acc = round((ev_dict["OPSPD"]["valid"] / ev_dict["OPSPD"]["total"]) * 100, 2)

        hndpos_acc = None
        if "HNDPOS" in ev_dict and ev_dict["HNDPOS"]["total"] > 0:
            hndpos_acc = round((ev_dict["HNDPOS"]["valid"] / ev_dict["HNDPOS"]["total"]) * 100, 2)

        extra = {}
        for ev_name, counts in ev_dict.items():
            if ev_name not in ("OPSPD", "HNDPOS"):
                acc = round((counts["valid"] / counts["total"]) * 100, 2) if counts["total"] > 0 else None
                extra[ev_name] = acc

        trend_items.append(AccuracyTrendItem(
            date=d_str,
            formatted_date=d_info["formatted_date"],
            opspd=opspd_acc,
            hndpos=hndpos_acc,
            overall=overall_acc,
            target=target_acc,
            extra_events=extra
        ))

    return trend_items

def get_daily_performance(db: Session, filters: DashboardFilterParams) -> List[DailyPerformanceRow]:
    dates = get_all_dates_in_range(db, filters)
    if not dates:
        return []

    base_query = db.query(InspectionEvent)
    base_query = apply_filters(base_query, filters)
    events = base_query.all()

    data_by_date = {
        d.strftime("%Y-%m-%d"): {
            "date": d.strftime("%Y-%m-%d"),
            "formatted_date": d.strftime("%b %d"),
            "events": {}
        }
        for d in dates
    }

    for ev in events:
        d_str = ev.time_of_occurrence.strftime("%Y-%m-%d")
        if d_str in data_by_date:
            ev_dict = data_by_date[d_str]["events"]
            if ev.event not in ev_dict:
                ev_dict[ev.event] = {"total": 0, "valid": 0, "invalid": 0}
            ev_dict[ev.event]["total"] += 1
            if ev.status == "valid":
                ev_dict[ev.event]["valid"] += 1
            else:
                ev_dict[ev.event]["invalid"] += 1

    rows = []
    for d_str, d_info in data_by_date.items():
        ev_dict = d_info["events"]
        tot_day = sum(v["total"] for v in ev_dict.values())
        val_day = sum(v["valid"] for v in ev_dict.values())
        inv_day = sum(v["invalid"] for v in ev_dict.values())

        overall_acc = round((val_day / tot_day) * 100, 2) if tot_day > 0 else None

        # Status categorization
        if overall_acc is None:
            status = "No Data"
        elif overall_acc >= 90.0:
            status = "Good"
        elif overall_acc >= 80.0:
            status = "Warning"
        else:
            status = "Critical"

        opspd_data = ev_dict.get("OPSPD", {"total": 0, "valid": 0, "invalid": 0})
        opspd_acc = round((opspd_data["valid"] / opspd_data["total"]) * 100, 2) if opspd_data["total"] > 0 else None

        hndpos_data = ev_dict.get("HNDPOS", {"total": 0, "valid": 0, "invalid": 0})
        hndpos_acc = round((hndpos_data["valid"] / hndpos_data["total"]) * 100, 2) if hndpos_data["total"] > 0 else None

        rows.append(DailyPerformanceRow(
            date=d_str,
            formatted_date=d_info["formatted_date"],
            opspd_total=opspd_data["total"],
            opspd_valid=opspd_data["valid"],
            opspd_invalid=opspd_data["invalid"],
            opspd_accuracy=opspd_acc,
            hndpos_total=hndpos_data["total"],
            hndpos_valid=hndpos_data["valid"],
            hndpos_invalid=hndpos_data["invalid"],
            hndpos_accuracy=hndpos_acc,
            total_events=tot_day,
            valid=val_day,
            invalid=inv_day,
            overall_accuracy=overall_acc,
            status=status
        ))

    return rows

def get_event_performance(db: Session, filters: DashboardFilterParams) -> List[EventPerformanceCard]:
    targets = get_target_settings(db)
    query = db.query(InspectionEvent)
    query = apply_filters(query, filters)
    events = query.all()

    by_event = {}
    for ev in events:
        if ev.event not in by_event:
            by_event[ev.event] = {"total": 0, "valid": 0, "invalid": 0}
        by_event[ev.event]["total"] += 1
        if ev.status == "valid":
            by_event[ev.event]["valid"] += 1
        else:
            by_event[ev.event]["invalid"] += 1

    cards = []
    # Ensure OPSPD and HNDPOS are prioritized if present
    preferred_order = ["OPSPD", "HNDPOS"]
    all_keys = list(by_event.keys())
    ordered_keys = [k for k in preferred_order if k in all_keys] + [k for k in all_keys if k not in preferred_order]

    for ev_name in ordered_keys:
        data = by_event[ev_name]
        tot = data["total"]
        val = data["valid"]
        inv = data["invalid"]
        acc = round((val / tot) * 100, 2) if tot > 0 else None

        target_key = f"{ev_name.lower()}_target"
        target_val = targets.get(target_key, targets["overall_target"])
        achieved = (acc >= target_val) if acc is not None else None

        cards.append(EventPerformanceCard(
            event=ev_name,
            accuracy=acc,
            total=tot,
            valid=val,
            invalid=inv,
            target=target_val,
            target_achieved=achieved
        ))

    return cards

def get_outcome_by_date(db: Session, filters: DashboardFilterParams) -> List[OutcomeByDateItem]:
    dates = get_all_dates_in_range(db, filters)
    if not dates:
        return []

    base_query = db.query(InspectionEvent)
    base_query = apply_filters(base_query, filters)
    events = base_query.all()

    by_date = {
        d.strftime("%Y-%m-%d"): {
            "date": d.strftime("%Y-%m-%d"),
            "formatted_date": d.strftime("%b %d"),
            "valid": 0,
            "invalid": 0,
            "total": 0
        }
        for d in dates
    }

    for ev in events:
        d_str = ev.time_of_occurrence.strftime("%Y-%m-%d")
        if d_str in by_date:
            by_date[d_str]["total"] += 1
            if ev.status == "valid":
                by_date[d_str]["valid"] += 1
            else:
                by_date[d_str]["invalid"] += 1

    items = []
    for d_str, data in by_date.items():
        tot = data["total"]
        val = data["valid"]
        inv = data["invalid"]
        acc = round((val / tot) * 100, 2) if tot > 0 else None
        items.append(OutcomeByDateItem(
            date=d_str,
            formatted_date=data["formatted_date"],
            total=tot,
            valid=val,
            invalid=inv,
            accuracy=acc
        ))
    return items

def get_invalid_reasons_analysis(db: Session, filters: DashboardFilterParams) -> Dict[str, Any]:
    query = db.query(InspectionEvent).filter(InspectionEvent.status == "invalid")
    query = apply_filters(query, filters)
    invalid_events = query.all()

    total_invalid = len(invalid_events)
    # Total inspections count for invalid rate
    all_query = db.query(InspectionEvent)
    all_query = apply_filters(all_query, filters)
    total_inspections = all_query.count()

    invalid_rate = round((total_invalid / total_inspections) * 100, 2) if total_inspections > 0 else None

    # Distribution
    reason_counts = {}
    for ev in invalid_events:
        r = ev.invalid_reason or "Unknown"
        reason_counts[r] = reason_counts.get(r, 0) + 1

    # Sorted descending
    sorted_reasons = sorted(reason_counts.items(), key=lambda x: x[1], reverse=True)

    distribution = []
    for idx, (reason, count) in enumerate(sorted_reasons):
        pct = round((count / total_invalid) * 100, 2) if total_invalid > 0 else 0.0
        color = COLOR_PALETTE[idx % len(COLOR_PALETTE)]
        distribution.append(InvalidReasonItem(
            reason=reason,
            count=count,
            percentage=pct,
            color=color
        ))

    # Reasons by event table
    events_breakdown = {}
    for ev in invalid_events:
        r = ev.invalid_reason or "Unknown"
        if r not in events_breakdown:
            events_breakdown[r] = {"OPSPD": 0, "HNDPOS": 0, "other": 0, "total": 0}
        events_breakdown[r]["total"] += 1
        if ev.event == "OPSPD":
            events_breakdown[r]["OPSPD"] += 1
        elif ev.event == "HNDPOS":
            events_breakdown[r]["HNDPOS"] += 1
        else:
            events_breakdown[r]["other"] += 1

    by_event_rows = []
    opspd_invalid_tot = sum(1 for ev in invalid_events if ev.event == "OPSPD")
    hndpos_invalid_tot = sum(1 for ev in invalid_events if ev.event == "HNDPOS")

    for reason, data in sorted_reasons:
        b_data = events_breakdown[reason]
        opspd_c = b_data["OPSPD"]
        opspd_p = round((opspd_c / opspd_invalid_tot) * 100, 2) if opspd_invalid_tot > 0 else 0.0

        hndpos_c = b_data["HNDPOS"]
        hndpos_p = round((hndpos_c / hndpos_invalid_tot) * 100, 2) if hndpos_invalid_tot > 0 else 0.0

        tot_c = b_data["total"]
        tot_p = round((tot_c / total_invalid) * 100, 2) if total_invalid > 0 else 0.0

        by_event_rows.append(InvalidReasonByEventRow(
            reason=reason,
            opspd_count=opspd_c,
            opspd_percentage=opspd_p,
            hndpos_count=hndpos_c,
            hndpos_percentage=hndpos_p,
            total_count=tot_c,
            overall_percentage=tot_p
        ))

    # Reason trend by date
    dates = get_all_dates_in_range(db, filters)
    trend_rows = []
    if dates and total_invalid > 0:
        by_date_reasons = {d.strftime("%Y-%m-%d"): {} for d in dates}
        for ev in invalid_events:
            d_str = ev.time_of_occurrence.strftime("%Y-%m-%d")
            r = ev.invalid_reason or "Unknown"
            if d_str in by_date_reasons:
                by_date_reasons[d_str][r] = by_date_reasons[d_str].get(r, 0) + 1

        top_reasons_list = [r for r, _ in sorted_reasons[:5]]
        for d in dates:
            d_str = d.strftime("%Y-%m-%d")
            day_counts = by_date_reasons.get(d_str, {})
            day_tot = sum(day_counts.values())

            r_counts = {r: day_counts.get(r, 0) for r in top_reasons_list}
            r_pcts = {
                r: (round((day_counts.get(r, 0) / day_tot) * 100, 2) if day_tot > 0 else 0.0)
                for r in top_reasons_list
            }

            trend_rows.append(InvalidReasonTrendItem(
                date=d_str,
                formatted_date=d.strftime("%b %d"),
                reasons=r_counts,
                percentages=r_pcts
            ))

    top_insight = None
    if distribution:
        top = distribution[0]
        top_insight = {
            "reason": top.reason,
            "count": top.count,
            "percentage": top.percentage,
            "message": f"{top.reason} is the most frequent invalid reason with {top.count} events ({top.percentage}% of all invalid events)."
        }

    return {
        "total_invalid": total_invalid,
        "invalid_rate": invalid_rate,
        "distribution": distribution,
        "by_event": by_event_rows,
        "trend": trend_rows,
        "top_insight": top_insight
    }

def get_line_performance(db: Session, filters: DashboardFilterParams) -> Dict[str, Any]:
    targets = get_target_settings(db)
    target_acc = targets["overall_target"]

    query = db.query(InspectionEvent)
    query = apply_filters(query, filters)
    events = query.all()

    by_line = {}
    for ev in events:
        ln = ev.production_line
        if ln not in by_line:
            by_line[ln] = {"total": 0, "valid": 0, "invalid": 0}
        by_line[ln]["total"] += 1
        if ev.status == "valid":
            by_line[ln]["valid"] += 1
        else:
            by_line[ln]["invalid"] += 1

    lines_list = []
    lines_below = []
    best_line = None
    worst_line = None

    for ln, data in sorted(by_line.items()):
        tot = data["total"]
        val = data["valid"]
        inv = data["invalid"]
        acc = round((val / tot) * 100, 2) if tot > 0 else None

        if acc is None:
            status = "No Data"
        elif acc >= 90.0:
            status = "Good"
        elif acc >= 80.0:
            status = "Warning"
        else:
            status = "Critical"

        if acc is not None and acc < target_acc:
            lines_below.append(ln)

        item = LinePerformanceItem(
            line=ln,
            total=tot,
            valid=val,
            invalid=inv,
            accuracy=acc,
            target=target_acc,
            status=status
        )
        lines_list.append(item)

    # Sort to determine best / worst
    active_lines = [l for l in lines_list if l.accuracy is not None]
    if active_lines:
        sorted_by_acc = sorted(active_lines, key=lambda x: x.accuracy, reverse=True)
        best_line = sorted_by_acc[0].line
        worst_line = sorted_by_acc[-1].line

    return {
        "lines": lines_list,
        "best_line": best_line,
        "worst_line": worst_line,
        "lines_below_target": lines_below
    }

def get_hourly_activity(db: Session, filters: DashboardFilterParams) -> List[HourlyActivityItem]:
    query = db.query(InspectionEvent)
    query = apply_filters(query, filters)
    events = query.all()

    hourly = {f"{h:02d}:00": {"total": 0, "valid": 0, "invalid": 0} for h in range(24)}

    for ev in events:
        hour_str = f"{ev.time_of_occurrence.hour:02d}:00"
        hourly[hour_str]["total"] += 1
        if ev.status == "valid":
            hourly[hour_str]["valid"] += 1
        else:
            hourly[hour_str]["invalid"] += 1

    return [
        HourlyActivityItem(
            hour=hr,
            total=counts["total"],
            valid=counts["valid"],
            invalid=counts["invalid"]
        )
        for hr, counts in hourly.items()
    ]

def get_highlights_and_insights(db: Session, filters: DashboardFilterParams) -> HighlightsResponse:
    targets = get_target_settings(db)
    target_acc = targets["overall_target"]

    daily_rows = get_daily_performance(db, filters)
    event_cards = get_event_performance(db, filters)
    line_data = get_line_performance(db, filters)
    reason_data = get_invalid_reasons_analysis(db, filters)

    best_day = None
    worst_day = None
    days_with_data = [d for d in daily_rows if d.overall_accuracy is not None]
    if days_with_data:
        sorted_days = sorted(days_with_data, key=lambda x: x.overall_accuracy, reverse=True)
        best_day = {
            "date": sorted_days[0].formatted_date,
            "accuracy": sorted_days[0].overall_accuracy
        }
        worst_day = {
            "date": sorted_days[-1].formatted_date,
            "accuracy": sorted_days[-1].overall_accuracy
        }

    best_event = None
    needs_attention = None
    events_with_data = [e for e in event_cards if e.accuracy is not None]
    if events_with_data:
        sorted_events = sorted(events_with_data, key=lambda x: x.accuracy, reverse=True)
        best_event = {
            "event": sorted_events[0].event,
            "accuracy": sorted_events[0].accuracy
        }
        needs_attention = {
            "event": sorted_events[-1].event,
            "accuracy": sorted_events[-1].accuracy
        }

    # Generate insights
    insights = []

    # 1. Overall accuracy insight
    kpis = get_kpi_summary(db, filters)
    if kpis.overall_accuracy is not None:
        if kpis.overall_accuracy >= target_acc:
            insights.append({
                "type": "success",
                "message": f"Overall accuracy ({kpis.overall_accuracy}%) is above the {target_acc}% target."
            })
        else:
            insights.append({
                "type": "warning",
                "message": f"Overall accuracy ({kpis.overall_accuracy}%) is below the {target_acc}% target."
            })

    # 2. Event performance insight
    if needs_attention and needs_attention["accuracy"] < target_acc:
        insights.append({
            "type": "warning",
            "message": f"{needs_attention['event']} accuracy ({needs_attention['accuracy']}%) is below target and needs attention."
        })
    if best_event and (best_event["accuracy"] >= target_acc or len(events_with_data) > 1):
        insights.append({
            "type": "success",
            "message": f"{best_event['event']} is the best-performing inspection event ({best_event['accuracy']}%)."
        })

    # 3. Best / Worst Day insights
    if worst_day and worst_day["accuracy"] < 80.0:
        insights.append({
            "type": "warning",
            "message": f"{worst_day['date']} recorded the lowest accuracy at {worst_day['accuracy']}%."
        })
    if best_day:
        insights.append({
            "type": "success",
            "message": f"{best_day['date']} recorded the highest accuracy at {best_day['accuracy']}%."
        })

    # 4. Top invalid reason insight
    if reason_data.get("top_insight"):
        top = reason_data["top_insight"]
        insights.append({
            "type": "warning",
            "message": f"{top['reason']} is the most common invalid reason ({top['percentage']}% of invalid events)."
        })

    # 5. Production lines below target
    for ln in line_data.get("lines_below_target", []):
        insights.append({
            "type": "warning",
            "message": f"{ln} performance is currently below the target threshold."
        })

    return HighlightsResponse(
        best_day=best_day,
        worst_day=worst_day,
        best_event=best_event,
        needs_attention=needs_attention,
        best_line=line_data.get("best_line"),
        worst_line=line_data.get("worst_line"),
        lines_below_target=line_data.get("lines_below_target", []),
        top_invalid_reason=reason_data.get("top_insight"),
        insights=insights
    )

def get_filter_options(db: Session) -> Dict[str, Any]:
    lines = [r[0] for r in db.query(InspectionEvent.production_line).distinct().all() if r[0]]
    events = [r[0] for r in db.query(InspectionEvent.event).distinct().all() if r[0]]
    reasons = [r[0] for r in db.query(InspectionEvent.invalid_reason).distinct().all() if r[0]]

    min_date = db.query(func.min(InspectionEvent.time_of_occurrence)).scalar()
    max_date = db.query(func.max(InspectionEvent.time_of_occurrence)).scalar()

    return {
        "production_lines": sorted(lines),
        "events": sorted(events),
        "statuses": ["All", "Valid", "Invalid"],
        "invalid_reasons": sorted(reasons),
        "date_range": {
            "min_date": min_date.strftime("%Y-%m-%d") if min_date else None,
            "max_date": max_date.strftime("%Y-%m-%d") if max_date else None
        }
    }

def get_event_breakdown_table(db: Session, filters: DashboardFilterParams) -> List[EventBreakdownRow]:
    dates = get_all_dates_in_range(db, filters)
    if not dates:
        return []

    base_query = db.query(InspectionEvent)
    base_query = apply_filters(base_query, filters)
    events = base_query.all()

    by_date_event = {}
    for d in dates:
        d_str = d.strftime("%Y-%m-%d")
        by_date_event[d_str] = {
            "formatted_date": d.strftime("%B %d"),
            "events": {}
        }

    for ev in events:
        d_str = ev.time_of_occurrence.strftime("%Y-%m-%d")
        if d_str in by_date_event:
            ev_dict = by_date_event[d_str]["events"]
            if ev.event not in ev_dict:
                ev_dict[ev.event] = {"tp": 0, "fp": 0, "pp": 0}
            ev_dict[ev.event]["pp"] += 1
            if ev.status == "valid":
                ev_dict[ev.event]["tp"] += 1
            else:
                ev_dict[ev.event]["fp"] += 1

    rows = []
    for d_str, d_info in by_date_event.items():
        ev_dict = d_info["events"]
        # Prioritize OPSPD then HNDPOS
        sorted_events = sorted(ev_dict.keys(), key=lambda x: (0 if x == "OPSPD" else (1 if x == "HNDPOS" else 2), x))
        for idx, ev_name in enumerate(sorted_events):
            stats = ev_dict[ev_name]
            pp = stats["pp"]
            tp = stats["tp"]
            fp = stats["fp"]
            pct = round((tp / pp) * 100, 2) if pp > 0 else None
            rows.append(EventBreakdownRow(
                date=d_str,
                formatted_date=d_info["formatted_date"],
                is_first_in_date=(idx == 0),
                event=ev_name,
                pp=pp,
                tp=tp,
                fp=fp,
                fn=None,
                percentage=pct
            ))

    return rows

def get_monthly_accuracy(db: Session, filters: DashboardFilterParams) -> List[MonthlyAccuracyRow]:
    query = apply_filters(db.query(InspectionEvent), filters)
    events = query.order_by(InspectionEvent.time_of_occurrence.asc()).all()
    grouped: Dict[str, Dict[str, Dict[str, int]]] = {}

    for inspection in events:
        month_key = inspection.time_of_occurrence.strftime("%Y-%m")
        month_events = grouped.setdefault(month_key, {})
        counts = month_events.setdefault(inspection.event, {"pp": 0, "tp": 0, "fp": 0})
        counts["pp"] += 1
        if inspection.status == "valid":
            counts["tp"] += 1
        else:
            counts["fp"] += 1

    rows: List[MonthlyAccuracyRow] = []
    for month_key, month_events in grouped.items():
        sorted_events = sorted(
            month_events,
            key=lambda name: (0 if name == "OPSPD" else (1 if name == "HNDPOS" else 2), name)
        )
        for index, event_name in enumerate(sorted_events):
            counts = month_events[event_name]
            pp = counts["pp"]
            rows.append(MonthlyAccuracyRow(
                month=month_key,
                formatted_month=datetime.strptime(month_key, "%Y-%m").strftime("%B %Y"),
                is_first_in_month=index == 0,
                event=event_name,
                pp=pp,
                tp=counts["tp"],
                fp=counts["fp"],
                fn=None,
                percentage=round((counts["tp"] / pp) * 100, 2) if pp else None
            ))
    return rows

