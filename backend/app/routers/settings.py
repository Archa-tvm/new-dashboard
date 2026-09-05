from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, engine
from app.models import SystemSetting, InspectionEvent, ImportBatch, HistoricalSummary
from app.schemas import SettingsSchema
from app.config import settings

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("", response_model=SettingsSchema)
def get_settings(db: Session = Depends(get_db)):
    db_settings = {s.key: s.value for s in db.query(SystemSetting).all()}

    overall = float(db_settings.get("overall_target", settings.OVERALL_TARGET))
    opspd = float(db_settings.get("opspd_target", settings.OPSPD_TARGET))
    hndpos = float(db_settings.get("hndpos_target", settings.HNDPOS_TARGET))
    auto_ref = db_settings.get("auto_refresh", "true").lower() in ("true", "1")
    interval = int(db_settings.get("refresh_interval", settings.REFRESH_INTERVAL))

    db_type = "PostgreSQL" if "postgresql" in settings.DATABASE_URL else "SQLite (Local Fallback)"
    db_masked = settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else settings.DATABASE_URL

    return SettingsSchema(
        overall_target=overall,
        opspd_target=opspd,
        hndpos_target=hndpos,
        auto_refresh=auto_ref,
        refresh_interval=interval,
        database_type=db_type,
        database_url_masked=db_masked
    )

@router.post("")
def update_settings(new_settings: SettingsSchema, db: Session = Depends(get_db)):
    updates = {
        "overall_target": str(new_settings.overall_target),
        "opspd_target": str(new_settings.opspd_target),
        "hndpos_target": str(new_settings.hndpos_target),
        "auto_refresh": "true" if new_settings.auto_refresh else "false",
        "refresh_interval": str(new_settings.refresh_interval)
    }

    for k, v in updates.items():
        existing = db.query(SystemSetting).filter(SystemSetting.key == k).first()
        if existing:
            existing.value = v
        else:
            db.add(SystemSetting(key=k, value=v))

    db.commit()
    return {"success": True, "message": "Settings updated successfully."}

@router.post("/reset-database")
def reset_database(confirm: bool = False, db: Session = Depends(get_db)):
    if not confirm:
        raise HTTPException(status_code=400, detail="Confirmation required to clear inspection database.")

    db.query(InspectionEvent).delete()
    db.query(HistoricalSummary).delete()
    db.query(ImportBatch).delete()
    db.commit()
    return {"success": True, "message": "All inspection records and batches have been reset."}
