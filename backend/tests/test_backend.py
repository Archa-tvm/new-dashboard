import os
import pytest
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.models import InspectionEvent, ImportBatch, SystemSetting
from app.main import app
from app.services.importer import execute_import, auto_detect_columns
from app.services.analytics import (
    get_kpi_summary, get_accuracy_trend, get_daily_performance,
    get_invalid_reasons_analysis, get_line_performance, get_hourly_activity
)
from app.schemas import DashboardFilterParams

TEST_DB_URL = "sqlite:///./test_inspection.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        test_engine.dispose()
        if os.path.exists("./test_inspection.db"):
            try:
                os.remove("./test_inspection.db")
            except Exception:
                pass

@pytest.fixture(scope="module")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

def test_column_auto_detection():
    cols = ["Event", "Line", "TimeOfOccurrence", "status", "Reason"]
    mapping, unmapped, missing = auto_detect_columns(cols)
    assert len(missing) == 0
    assert mapping["Event"] == "event"
    assert mapping["Line"] == "production_line"
    assert mapping["TimeOfOccurrence"] == "time_of_occurrence"
    assert mapping["status"] == "status"
    assert mapping["Reason"] == "invalid_reason"

def test_column_auto_detection_matches_common_excel_headers():
    cols = ["EventType", "Production Line", "Date & Time", "Status", "Invalid Reason"]
    mapping, unmapped, missing = auto_detect_columns(cols)
    assert missing == []
    assert mapping == {
        "EventType": "event",
        "Production Line": "production_line",
        "Date & Time": "time_of_occurrence",
        "Status": "status",
        "Invalid Reason": "invalid_reason"
    }

def test_empty_kpi_summary(db_session):
    filters = DashboardFilterParams()
    kpis = get_kpi_summary(db_session, filters)
    assert kpis.total_events == 0
    assert kpis.overall_accuracy is None
    assert kpis.target_status == "NO DATA"

def test_import_batch1(db_session):
    sample_file = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "sample_data",
        "August_Inspection_Batch1.xlsx"
    )
    assert os.path.exists(sample_file)
    batch = execute_import(
        file_path=sample_file,
        file_name="August_Inspection_Batch1.xlsx",
        column_mapping=None,
        skip_duplicates=True,
        db=db_session
    )
    assert batch.imported_rows == 1268
    assert batch.total_rows == 1268
    assert batch.duplicate_rows == 0

def test_calculated_kpis_after_import(db_session):
    filters = DashboardFilterParams()
    kpis = get_kpi_summary(db_session, filters)
    assert kpis.total_events == 1268
    assert kpis.valid_events + kpis.invalid_events == 1268
    assert kpis.overall_accuracy is not None
    assert 80.0 <= kpis.overall_accuracy <= 99.0
    assert kpis.invalid_rate is not None
    assert abs((kpis.valid_percentage + kpis.invalid_rate) - 100.0) < 0.05

def test_show_all_dates_and_gap_handling(db_session):
    filters = DashboardFilterParams()
    trend = get_accuracy_trend(db_session, filters)
    assert len(trend) >= 15 # Aug 01 to Aug 15

    # Check Aug 05: HNDPOS had 0 events, so hndpos accuracy must be None (displayed as '—')
    aug5 = next((t for t in trend if "Aug 05" in t.formatted_date), None)
    assert aug5 is not None
    assert aug5.hndpos is None # Rule 10: Do NOT convert missing data into 0%
    assert aug5.opspd is not None

def test_invalid_reasons_and_unknown_fallback(db_session):
    filters = DashboardFilterParams()
    reasons_res = get_invalid_reasons_analysis(db_session, filters)
    assert reasons_res["total_invalid"] > 0
    # Check that reasons sum to ~100%
    dist = reasons_res["distribution"]
    total_pct = sum(r.percentage for r in dist)
    assert 99.0 <= total_pct <= 101.0

    # Invalid events without a sheet remark are grouped as 'Unnamed'.
    reason_names = [r.reason for r in dist]
    assert "Unnamed" in reason_names

def test_duplicate_detection_batch2(db_session):
    sample_file = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "sample_data",
        "August_Inspection_Batch2.xlsx"
    )
    batch = execute_import(
        file_path=sample_file,
        file_name="August_Inspection_Batch2.xlsx",
        column_mapping=None,
        skip_duplicates=True,
        db=db_session
    )
    assert batch.duplicate_rows == 15
    assert batch.imported_rows == 225

    # Total events in DB should now be 1268 + 225 = 1493
    kpis = get_kpi_summary(db_session, DashboardFilterParams())
    assert kpis.total_events == 1493

def test_api_endpoints(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"

    r = client.get("/api/dashboard/summary")
    assert r.status_code == 200
    assert r.json()["total_events"] == 1493

    r = client.get("/api/dashboard/highlights")
    assert r.status_code == 200
    assert len(r.json()["insights"]) > 0

    r_summary = client.get("/api/dashboard/event-breakdown")
    assert r_summary.status_code == 200
    first_summary = r_summary.json()[0]
    assert first_summary["pp"] == first_summary["tp"] + first_summary["fp"]
    assert first_summary["fn"] == 0
    assert first_summary["percentage"] == round((first_summary["tp"] / first_summary["pp"]) * 100, 2)

    r = client.get("/api/events?page=1&page_size=10")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 1493
    assert len(data["items"]) == 10

    # Detail drawer endpoint
    first_id = data["items"][0]["id"]
    r_detail = client.get(f"/api/events/{first_id}")
    assert r_detail.status_code == 200
    assert r_detail.json()["source_file"] != ""
    assert r_detail.json()["source_row"] > 0
