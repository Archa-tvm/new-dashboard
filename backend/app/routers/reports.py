from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.schemas import DashboardFilterParams
from app.services.reporter import generate_csv_report, generate_excel_report, generate_pdf_report

router = APIRouter(prefix="/reports", tags=["Reports"])

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

@router.get("/download")
def download_report(
    report_type: str = Query("complete", regex="^(daily|monthly|events|reasons|lines|complete)$"),
    file_format: str = Query("csv", regex="^(csv|excel|pdf)$"),
    filters: DashboardFilterParams = Depends(get_filter_params),
    db: Session = Depends(get_db)
):
    filename_base = f"inspection_report_{report_type}"

    if file_format == "csv":
        buf = generate_csv_report(report_type, db, filters)
        return Response(
            content=buf.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename_base}.csv"}
        )
    elif file_format == "excel":
        buf = generate_excel_report(report_type, db, filters)
        return Response(
            content=buf.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename_base}.xlsx"}
        )
    elif file_format == "pdf":
        buf = generate_pdf_report(report_type, db, filters)
        return Response(
            content=buf.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename_base}.pdf"}
        )
    else:
        raise HTTPException(status_code=400, detail="Unsupported format")
