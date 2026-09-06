import io
import pandas as pd
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.schemas import DashboardFilterParams
from app.services.analytics import (
    get_kpi_summary, get_daily_performance, get_event_performance,
    get_invalid_reasons_analysis, get_line_performance, apply_filters
)
from app.models import InspectionEvent
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_csv_report(report_type: str, db: Session, filters: DashboardFilterParams) -> io.BytesIO:
    buf = io.StringIO()
    if report_type == "daily":
        rows = get_daily_performance(db, filters)
        data = [{
            "Date": r.formatted_date,
            "OPSPD Total": r.opspd_total,
            "OPSPD Valid": r.opspd_valid,
            "OPSPD Invalid": r.opspd_invalid,
            "OPSPD Accuracy (%)": r.opspd_accuracy if r.opspd_accuracy is not None else "—",
            "HNDPOS Total": r.hndpos_total,
            "HNDPOS Valid": r.hndpos_valid,
            "HNDPOS Invalid": r.hndpos_invalid,
            "HNDPOS Accuracy (%)": r.hndpos_accuracy if r.hndpos_accuracy is not None else "—",
            "Total Events": r.total_events,
            "Valid": r.valid,
            "Invalid": r.invalid,
            "Overall Accuracy (%)": r.overall_accuracy if r.overall_accuracy is not None else "—",
            "Status": r.status
        } for r in rows]
        pd.DataFrame(data).to_csv(buf, index=False)

    elif report_type == "events":
        cards = get_event_performance(db, filters)
        data = [{
            "Event": c.event,
            "Total": c.total,
            "Valid": c.valid,
            "Invalid": c.invalid,
            "Accuracy (%)": c.accuracy if c.accuracy is not None else "—",
            "Target (%)": c.target,
            "Target Achieved": "Yes" if c.target_achieved else ("No" if c.target_achieved is False else "No Data")
        } for c in cards]
        pd.DataFrame(data).to_csv(buf, index=False)

    elif report_type == "reasons":
        reasons_data = get_invalid_reasons_analysis(db, filters)
        data = [{
            "Invalid Reason": item.reason,
            "Count": item.count,
            "Percentage (%)": item.percentage
        } for item in reasons_data["distribution"]]
        pd.DataFrame(data).to_csv(buf, index=False)

    elif report_type == "lines":
        line_data = get_line_performance(db, filters)
        data = [{
            "Production Line": l.line,
            "Total Events": l.total,
            "Valid": l.valid,
            "Invalid": l.invalid,
            "Accuracy (%)": l.accuracy if l.accuracy is not None else "—",
            "Target (%)": l.target,
            "Status": l.status
        } for l in line_data["lines"]]
        pd.DataFrame(data).to_csv(buf, index=False)

    else: # complete events
        q = db.query(InspectionEvent)
        q = apply_filters(q, filters)
        events = q.all()
        data = [{
            "ID": ev.id,
            "Event": ev.event,
            "Production Line": ev.production_line,
            "Timestamp": ev.time_of_occurrence.strftime("%Y-%m-%d %H:%M:%S"),
            "Status": ev.status.upper(),
            "Invalid Reason": ev.invalid_reason or "—",
            "Source File": ev.source_file,
            "Source Row": ev.source_row
        } for ev in events]
        pd.DataFrame(data).to_csv(buf, index=False)

    byte_buf = io.BytesIO()
    byte_buf.write(buf.getvalue().encode("utf-8"))
    byte_buf.seek(0)
    return byte_buf

def generate_excel_report(report_type: str, db: Session, filters: DashboardFilterParams) -> io.BytesIO:
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        if report_type == "complete" or report_type == "dashboard":
            # Multiple sheets
            # Sheet 1: KPIs
            kpis = get_kpi_summary(db, filters)
            kpi_df = pd.DataFrame([{
                "Metric": "Total Events", "Value": kpis.total_events
            }, {
                "Metric": "Valid Events", "Value": kpis.valid_events
            }, {
                "Metric": "Invalid Events", "Value": kpis.invalid_events
            }, {
                "Metric": "Overall Accuracy (%)", "Value": f"{kpis.overall_accuracy}%" if kpis.overall_accuracy is not None else "—"
            }, {
                "Metric": "Target Accuracy (%)", "Value": f"{kpis.target_accuracy}%"
            }, {
                "Metric": "Target Status", "Value": kpis.target_status
            }])
            kpi_df.to_excel(writer, sheet_name="KPI Summary", index=False)

            # Sheet 2: Daily Performance
            daily_rows = get_daily_performance(db, filters)
            pd.DataFrame([{
                "Date": r.formatted_date, "Total": r.total_events, "Valid": r.valid, "Invalid": r.invalid,
                "Accuracy (%)": r.overall_accuracy, "OPSPD Acc (%)": r.opspd_accuracy, "HNDPOS Acc (%)": r.hndpos_accuracy,
                "Status": r.status
            } for r in daily_rows]).to_excel(writer, sheet_name="Daily Performance", index=False)

            # Sheet 3: Invalid Reasons
            reasons = get_invalid_reasons_analysis(db, filters)
            pd.DataFrame([{
                "Reason": item.reason, "Count": item.count, "Percentage (%)": item.percentage
            } for item in reasons["distribution"]]).to_excel(writer, sheet_name="Invalid Reasons", index=False)

            # Sheet 4: Raw Events
            q = db.query(InspectionEvent)
            q = apply_filters(q, filters)
            events = q.limit(5000).all()
            pd.DataFrame([{
                "ID": ev.id, "Event": ev.event, "Line": ev.production_line,
                "Timestamp": ev.time_of_occurrence.strftime("%Y-%m-%d %H:%M:%S"),
                "Status": ev.status.upper(), "Reason": ev.invalid_reason or "—",
                "Source File": ev.source_file, "Source Row": ev.source_row
            } for ev in events]).to_excel(writer, sheet_name="Events", index=False)

        else:
            # Single sheet export
            csv_buf = generate_csv_report(report_type, db, filters)
            df = pd.read_csv(io.StringIO(csv_buf.getvalue().decode("utf-8")))
            df.to_excel(writer, sheet_name=report_type.capitalize(), index=False)

    output.seek(0)
    return output

def generate_pdf_report(report_type: str, db: Session, filters: DashboardFilterParams) -> io.BytesIO:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(letter), rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        name="RepTitle",
        parent=styles["Heading1"],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#0F172A")
    )
    sub_style = ParagraphStyle(
        name="RepSub",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#64748B")
    )

    story = []
    title_text = f"Simtra Usecase Analytics – {report_type.replace('_', ' ').title()} Report"
    story.append(Paragraph(title_text, title_style))
    story.append(Paragraph(f"Generated at {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')} | AI Vision Quality Control", sub_style))
    story.append(Spacer(1, 15))

    # Add KPI overview table
    kpis = get_kpi_summary(db, filters)
    kpi_data = [
        ["Total Events", "Valid Events", "Invalid Events", "Overall Accuracy", "Target", "Status"],
        [
            str(kpis.total_events),
            f"{kpis.valid_events} ({kpis.valid_percentage or 0}%)",
            f"{kpis.invalid_events} ({kpis.invalid_rate or 0}%)",
            f"{kpis.overall_accuracy or '—'}%",
            f"{kpis.target_accuracy}%",
            kpis.target_status
        ]
    ]
    kpi_table = Table(kpi_data, colWidths=[120, 120, 120, 120, 100, 140])
    kpi_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E293B")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#F8FAFC")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 18))

    # Content table based on report_type
    if report_type in ("daily", "complete", "dashboard"):
        story.append(Paragraph("Daily Inspection Performance", styles["Heading2"]))
        story.append(Spacer(1, 6))
        daily_rows = get_daily_performance(db, filters)
        d_data = [["Date", "OPSPD (V/T)", "OPSPD Acc", "HNDPOS (V/T)", "HNDPOS Acc", "Total", "Valid", "Invalid", "Accuracy", "Status"]]
        for r in daily_rows[:25]:
            d_data.append([
                r.formatted_date,
                f"{r.opspd_valid}/{r.opspd_total}",
                f"{r.opspd_accuracy}%" if r.opspd_accuracy is not None else "—",
                f"{r.hndpos_valid}/{r.hndpos_total}",
                f"{r.hndpos_accuracy}%" if r.hndpos_accuracy is not None else "—",
                str(r.total_events),
                str(r.valid),
                str(r.invalid),
                f"{r.overall_accuracy}%" if r.overall_accuracy is not None else "—",
                r.status
            ])
        d_table = Table(d_data, colWidths=[70, 80, 75, 80, 75, 55, 55, 55, 75, 60])
        d_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#334155")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ]))
        story.append(d_table)

    elif report_type == "reasons":
        story.append(Paragraph("Invalid Reason Distribution", styles["Heading2"]))
        story.append(Spacer(1, 6))
        reasons = get_invalid_reasons_analysis(db, filters)
        r_data = [["Invalid Reason", "Count", "Percentage"]]
        for item in reasons["distribution"]:
            r_data.append([item.reason, str(item.count), f"{item.percentage}%"])
        r_table = Table(r_data, colWidths=[300, 150, 150])
        r_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#334155")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ]))
        story.append(r_table)

    doc.build(story)
    buf.seek(0)
    return buf
