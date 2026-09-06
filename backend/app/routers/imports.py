import os
import uuid
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List, Dict
from app.database import get_db
from app.config import settings
from app.models import ImportBatch, InspectionEvent, HistoricalSummary
from app.schemas import (
    FileAnalysisPreview, ImportExecutionRequest, ImportExecutionResponse, ImportBatchSchema
)
from app.services.importer import (
    analyze_spreadsheet_content, execute_import, execute_summary_import
)

router = APIRouter(prefix="/imports", tags=["Imports"])

# In-memory mapping of temporary file tokens to stored files
TEMP_FILES: Dict[str, Dict[str, str]] = {}

@router.post("/analyze", response_model=FileAnalysisPreview)
async def analyze_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".xlsx", ".xls", ".csv"]:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload an Excel (.xlsx, .xls) or CSV file.")

    token = str(uuid.uuid4())
    temp_filename = f"{token}_{file.filename}"
    temp_path = os.path.join(settings.UPLOAD_DIR, temp_filename)

    with open(temp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    TEMP_FILES[token] = {
        "file_path": temp_path,
        "file_name": file.filename
    }

    try:
        analysis = analyze_spreadsheet_content(temp_path, file.filename, db)
        analysis["file_token"] = token
        analysis["file_name"] = file.filename
        analysis["unmapped_columns"] = analysis.get("unmapped_columns", [])
        analysis["missing_required_columns"] = analysis.get("missing_required_columns", [])
        return analysis
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        if token in TEMP_FILES:
            del TEMP_FILES[token]
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

@router.post("/execute", response_model=ImportExecutionResponse)
def execute_file_import(req: ImportExecutionRequest, db: Session = Depends(get_db)):
    file_info = TEMP_FILES.get(req.file_token)
    if not file_info:
        # Fallback: check if token matches directly in upload dir
        matched = [f for f in os.listdir(settings.UPLOAD_DIR) if f.startswith(req.file_token)]
        if matched:
            file_path = os.path.join(settings.UPLOAD_DIR, matched[0])
            file_name = matched[0].split("_", 1)[1] if "_" in matched[0] else matched[0]
            file_info = {"file_path": file_path, "file_name": file_name}
        else:
            raise HTTPException(status_code=404, detail="Upload session expired or file not found. Please upload again.")

    try:
        batch = execute_import(
            file_path=file_info["file_path"],
            file_name=file_info["file_name"],
            column_mapping=req.column_mapping,
            skip_duplicates=req.skip_duplicates,
            db=db
        )

        return ImportExecutionResponse(
            batch_id=batch.id,
            file_name=batch.file_name,
            total_rows=batch.total_rows,
            imported_rows=batch.imported_rows,
            duplicate_rows=batch.duplicate_rows,
            rejected_rows=batch.rejected_rows,
            status=batch.status,
            message=f"Successfully processed {batch.imported_rows} inspection records."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")

@router.get("", response_model=List[ImportBatchSchema])
def list_import_history(db: Session = Depends(get_db)):
    batches = db.query(ImportBatch).order_by(ImportBatch.uploaded_at.desc()).all()
    return batches

@router.get("/{batch_id}", response_model=ImportBatchSchema)
def get_batch_detail(batch_id: int, db: Session = Depends(get_db)):
    b = db.query(ImportBatch).filter(ImportBatch.id == batch_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Batch not found")
    return b

@router.delete("/{batch_id}")
def delete_batch(batch_id: int, db: Session = Depends(get_db)):
    b = db.query(ImportBatch).filter(ImportBatch.id == batch_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Batch not found")
    # Delete children explicitly so this also works with SQLite deployments where
    # database-level foreign-key cascades may not be enabled.
    db.query(InspectionEvent).filter(InspectionEvent.source_import_id == batch_id).delete(synchronize_session=False)
    db.query(HistoricalSummary).filter(HistoricalSummary.source_import_id == batch_id).delete(synchronize_session=False)
    db.delete(b)
    db.commit()
    return {"success": True, "message": f"Deleted batch {batch_id} and its associated records."}

@router.post("/load-sample/{sample_type}")
def load_sample_dataset(sample_type: str, db: Session = Depends(get_db)):
    sample_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sample_data")
    if sample_type == "batch1":
        file_path = os.path.join(sample_dir, "August_Inspection_Batch1.xlsx")
        file_name = "August_Inspection_Batch1.xlsx"
    elif sample_type == "batch2":
        file_path = os.path.join(sample_dir, "August_Inspection_Batch2.xlsx")
        file_name = "August_Inspection_Batch2.xlsx"
    elif sample_type == "summary":
        file_path = os.path.join(sample_dir, "Inspection_Summary_Historical.xlsx")
        file_name = "Inspection_Summary_Historical.xlsx"
    else:
        raise HTTPException(status_code=400, detail="Unknown sample type. Options: batch1, batch2, summary")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Sample file {file_name} not found on server.")

    batch = execute_import(
        file_path=file_path,
        file_name=file_name,
        column_mapping=None,
        skip_duplicates=True,
        db=db
    )
    return {
        "success": True,
        "batch_id": batch.id,
        "file_name": batch.file_name,
        "imported_rows": batch.imported_rows,
        "duplicate_rows": batch.duplicate_rows,
        "total_rows": batch.total_rows,
        "status": batch.status
    }
