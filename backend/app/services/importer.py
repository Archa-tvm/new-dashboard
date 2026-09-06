import os
import io
import re
import pandas as pd
from datetime import datetime
from typing import Dict, List, Tuple, Any, Optional
from sqlalchemy.orm import Session
from app.models import InspectionEvent, ImportBatch, HistoricalSummary

COLUMN_ALIASES = {
    "event": ["event", "eventtype", "event_type", "type", "inspection_event", "event_name"],
    "production_line": ["line", "productionline", "production_line", "production line", "prod_line", "line_no", "linename"],
    "time_of_occurrence": ["timeofoccurrence", "time_of_occurrence", "timestamp", "datetime", "date_time", "date & time", "date/time", "time", "date_time_occurrence"],
    "status": ["status", "result", "outcome", "inspection_status", "state"],
    "invalid_reason": ["reason", "remarks", "remark", "invalidreason", "invalid_reason", "invalid reason", "comment", "comments", "reasons", "failure_reason"]
}

SUMMARY_ALIASES = {
    "date": ["date", "day", "timestamp"],
    "event": ["event", "eventtype", "type"],
    "pp": ["pp", "predicted_positives", "positive_predictions"],
    "tp": ["tp", "true_positives"],
    "fp": ["fp", "false_positives"],
    "fn": ["fn", "false_negatives"],
    "percentage": ["percentage", "percent", "accuracy", "accuracy_percent"]
}

def normalize_col_name(col: str) -> str:
    return re.sub(r'[^a-z0-9]+', '', str(col).strip().lower())

def auto_detect_columns(columns: List[str]) -> Tuple[Dict[str, str], List[str], List[str]]:
    """
    Returns:
      mapping: {original_col: app_field}
      unmapped: [original_cols]
      missing_required: [app_fields]
    """
    mapping = {}
    used_app_fields = set()

    for col in columns:
        norm = normalize_col_name(col)
        matched = False
        for app_field, aliases in COLUMN_ALIASES.items():
            if app_field in used_app_fields:
                continue
            for alias in aliases:
                if norm == normalize_col_name(alias):
                    mapping[col] = app_field
                    used_app_fields.add(app_field)
                    matched = True
                    break
            if matched:
                break

    required = ["event", "production_line", "time_of_occurrence", "status"]
    missing_required = [f for f in required if f not in used_app_fields]
    unmapped = [c for c in columns if c not in mapping]
    return mapping, unmapped, missing_required

def is_historical_summary_file(columns: List[str]) -> bool:
    norm_cols = [normalize_col_name(c) for c in columns]
    has_tp = any("tp" in c for c in norm_cols)
    has_fp = any("fp" in c for c in norm_cols)
    return has_tp and has_fp

def parse_datetime_flexible(val: Any) -> Optional[datetime]:
    if val is None or pd.isna(val) or str(val).strip() == "":
        return None
    if isinstance(val, (datetime, pd.Timestamp)):
        return val.to_pydatetime() if hasattr(val, "to_pydatetime") else val
    try:
        dt = pd.to_datetime(val)
        return dt.to_pydatetime() if hasattr(dt, "to_pydatetime") else dt
    except Exception:
        return None

def analyze_spreadsheet_content(file_path: str, file_name: str, db: Session) -> Dict[str, Any]:
    file_type = os.path.splitext(file_name)[1].lower()
    
    if file_type == ".csv":
        df = pd.read_csv(file_path)
    else:
        df = pd.read_excel(file_path, engine="openpyxl")

    total_rows = len(df)
    columns = [str(c) for c in df.columns]
    mapping, unmapped, missing = auto_detect_columns(columns)

    sample_rows = []
    for idx, row in df.head(30).iterrows():
        r_dict = {col: ("" if pd.isna(val) else str(val)) for col, val in row.items()}
        r_dict["__row_idx"] = idx + 2 # 1-indexed row number assuming header is row 1
        sample_rows.append(r_dict)

    # If required columns are mapped, compute preliminary stats
    date_range_str = None
    event_types = []
    lines = []
    valid_estimate = 0
    invalid_estimate = 0
    duplicates_detected = 0
    warnings_count = 0
    rejected_count = 0

    if not missing:
        rev_map = {v: k for k, v in mapping.items()}
        time_col = rev_map.get("time_of_occurrence")
        event_col = rev_map.get("event")
        line_col = rev_map.get("production_line")
        status_col = rev_map.get("status")

        valid_dates = []
        seen_keys = set()

        for idx, row in df.iterrows():
            row_valid = True
            time_val = parse_datetime_flexible(row.get(time_col))
            if not time_val:
                rejected_count += 1
                row_valid = False
            else:
                valid_dates.append(time_val)

            evt = str(row.get(event_col, "")).strip()
            ln = str(row.get(line_col, "")).strip()
            st = str(row.get(status_col, "")).strip().lower()

            if not evt or not ln:
                warnings_count += 1

            if row_valid and time_val:
                key = (evt, ln, time_val.strftime("%Y-%m-%d %H:%M:%S"))
                if key in seen_keys:
                    duplicates_detected += 1
                else:
                    seen_keys.add(key)
                    # Check DB duplicate
                    existing = db.query(InspectionEvent.id).filter(
                        InspectionEvent.event == evt,
                        InspectionEvent.production_line == ln,
                        InspectionEvent.time_of_occurrence == time_val
                    ).first()
                    if existing:
                        duplicates_detected += 1

            if st in ("valid", "pass", "ok", "true", "1"):
                valid_estimate += 1
            elif st in ("invalid", "fail", "ng", "false", "0"):
                invalid_estimate += 1
            else:
                warnings_count += 1

        if valid_dates:
            min_d = min(valid_dates).strftime("%b %d, %Y")
            max_d = max(valid_dates).strftime("%b %d, %Y")
            date_range_str = f"{min_d} – {max_d}" if min_d != max_d else min_d

        if event_col:
            event_types = sorted(list({str(x).strip() for x in df[event_col].dropna() if str(x).strip()}))
        if line_col:
            lines = sorted(list({str(x).strip() for x in df[line_col].dropna() if str(x).strip()}))

    return {
        "file_name": file_name,
        "file_type": file_type,
        "total_rows": total_rows,
        "detected_columns": mapping,
        "unmapped_columns": unmapped,
        "missing_required_columns": missing,
        "can_auto_import": len(missing) == 0,
        "sample_rows": sample_rows,
        "date_range_detected": date_range_str,
        "event_types_detected": event_types,
        "production_lines_detected": lines,
        "valid_count_estimate": valid_estimate,
        "invalid_count_estimate": invalid_estimate,
        "duplicate_count": duplicates_detected,
        "warning_count": warnings_count,
        "rejected_count": rejected_count
    }

def execute_import(
    file_path: str,
    file_name: str,
    column_mapping: Optional[Dict[str, str]],
    skip_duplicates: bool,
    db: Session
) -> ImportBatch:
    file_type = os.path.splitext(file_name)[1].lower()
    if file_type == ".csv":
        df = pd.read_csv(file_path)
    else:
        df = pd.read_excel(file_path, engine="openpyxl")

    total_rows = len(df)
    columns = [str(c) for c in df.columns]

    mapping = column_mapping or {}
    if not mapping:
        mapping, _, missing = auto_detect_columns(columns)
        if missing:
            raise ValueError(f"Missing required columns: {', '.join(missing)}")

    # Check if historical summary
    if is_historical_summary_file(columns) and not ("status" in mapping.values()):
        return execute_summary_import(df, file_name, file_type, db)

    rev_map = {v: k for k, v in mapping.items()}
    event_col = rev_map.get("event")
    line_col = rev_map.get("production_line")
    time_col = rev_map.get("time_of_occurrence")
    status_col = rev_map.get("status")
    reason_col = rev_map.get("invalid_reason")

    batch = ImportBatch(
        file_name=file_name,
        file_type=file_type,
        total_rows=total_rows,
        imported_rows=0,
        duplicate_rows=0,
        rejected_rows=0,
        status="Imported"
    )
    db.add(batch)
    db.flush()

    seen_keys_in_batch = set()
    events_to_insert = []
    imported_count = 0
    duplicate_count = 0
    rejected_count = 0

    for idx, row in df.iterrows():
        source_row_num = idx + 2 # Header is row 1, data starts at row 2

        time_val = parse_datetime_flexible(row.get(time_col))
        if not time_val:
            rejected_count += 1
            continue

        raw_event = str(row.get(event_col, "")).strip()
        raw_line = str(row.get(line_col, "")).strip()
        raw_status = str(row.get(status_col, "")).strip().lower()
        raw_reason = ""
        if reason_col and reason_col in row and not pd.isna(row.get(reason_col)):
            raw_reason = str(row.get(reason_col)).strip()

        if not raw_event or not raw_line:
            rejected_count += 1
            continue

        # Normalize status
        if raw_status in ("valid", "pass", "ok", "true", "1"):
            norm_status = "valid"
            reason_final = None # valid records don't need reason
        elif raw_status in ("invalid", "fail", "ng", "false", "0"):
            norm_status = "invalid"
            # If invalid has no reason, classify as Unknown (Rule 46)
            reason_final = raw_reason if raw_reason else "Unknown"
        else:
            rejected_count += 1
            continue

        # Deduplication key: Event + Production Line + TimeOfOccurrence
        dup_key = (raw_event, raw_line, time_val.strftime("%Y-%m-%d %H:%M:%S"))
        
        is_duplicate = False
        if dup_key in seen_keys_in_batch:
            is_duplicate = True
        else:
            # Check DB
            exists = db.query(InspectionEvent.id).filter(
                InspectionEvent.event == raw_event,
                InspectionEvent.production_line == raw_line,
                InspectionEvent.time_of_occurrence == time_val
            ).first()
            if exists:
                is_duplicate = True

        if is_duplicate:
            duplicate_count += 1
            if skip_duplicates:
                continue

        seen_keys_in_batch.add(dup_key)

        event_obj = InspectionEvent(
            event=raw_event,
            production_line=raw_line,
            time_of_occurrence=time_val,
            status=norm_status,
            invalid_reason=reason_final,
            source_file=file_name,
            source_row=source_row_num,
            source_import_id=batch.id
        )
        events_to_insert.append(event_obj)
        imported_count += 1

    if events_to_insert:
        db.bulk_save_objects(events_to_insert)

    batch.imported_rows = imported_count
    batch.duplicate_rows = duplicate_count
    batch.rejected_rows = rejected_count
    batch.status = "Imported" if imported_count > 0 else ("Duplicates Skipped" if duplicate_count > 0 else "Failed")
    db.commit()
    db.refresh(batch)
    return batch

def execute_summary_import(df: pd.DataFrame, file_name: str, file_type: str, db: Session) -> ImportBatch:
    batch = ImportBatch(
        file_name=file_name,
        file_type=file_type,
        total_rows=len(df),
        imported_rows=0,
        duplicate_rows=0,
        rejected_rows=0,
        status="Imported Summary"
    )
    db.add(batch)
    db.flush()

    summaries = []
    imported_count = 0
    rejected_count = 0

    col_map = {}
    for col in df.columns:
        norm = normalize_col_name(col)
        for field, aliases in SUMMARY_ALIASES.items():
            if any(norm == normalize_col_name(a) for a in aliases):
                col_map[field] = col
                break

    for idx, row in df.iterrows():
        dt = parse_datetime_flexible(row.get(col_map.get("date")))
        evt = str(row.get(col_map.get("event"), "SUMMARY")).strip()
        if not dt:
            rejected_count += 1
            continue

        def safe_int(v):
            try:
                return int(v) if not pd.isna(v) else None
            except Exception:
                return None

        def safe_float(v):
            try:
                return float(v) if not pd.isna(v) else None
            except Exception:
                return None

        s = HistoricalSummary(
            date=dt,
            event=evt,
            pp=safe_int(row.get(col_map.get("pp"))),
            tp=safe_int(row.get(col_map.get("tp"))),
            fp=safe_int(row.get(col_map.get("fp"))),
            fn=safe_int(row.get(col_map.get("fn"))),
            percentage=safe_float(row.get(col_map.get("percentage"))),
            source_file=file_name,
            source_import_id=batch.id
        )
        summaries.append(s)
        imported_count += 1

    if summaries:
        db.bulk_save_objects(summaries)

    batch.imported_rows = imported_count
    batch.rejected_rows = rejected_count
    db.commit()
    db.refresh(batch)
    return batch
