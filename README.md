# Production Inspection Analytics Dashboard

An industrial-grade, AI-powered Quality Monitoring & Analytics Platform for manufacturing vision inspection systems. Engineered with **React**, **TypeScript**, **Tailwind CSS**, **Recharts**, **Python FastAPI**, **Pandas**, **OpenPyXL**, and **SQLAlchemy** (supporting **PostgreSQL** with zero-dependency **SQLite** automatic local fallback).

---

## 🌟 Key Capabilities & Architectural Highlights

1. **100% Completely Data-Driven**:
   - Zero hard-coded values, zero fake timestamps, zero fabricated metrics.
   - If no data exists, KPI cards, tables, and charts display clean `—` / `No Data` placeholders. Missing data is never erroneously converted to `0%`.
2. **Robust File Ingestion & Flexible Schema Mapping**:
   - Supports Excel (`.xlsx`, `.xls`) and `.csv` files.
   - Intelligent fuzzy header normalization handles aliases:
     - **Event**: `Event`, `EventType`, `type`, `inspection_event`
     - **Line**: `Line`, `ProductionLine`, `prod_line`, `line_no`
     - **Timestamp**: `TimeOfOccurrence`, `Timestamp`, `DateTime`, `Time`
     - **Status**: `status`, `Status`, `result`, `outcome`
     - **Reason**: `Reason`, `InvalidReason`, `Comment`, `comments`
   - Fallback interactive **Column Mapping Screen** whenever column names are ambiguous.
3. **Smart Validation & Duplicate Detection**:
   - Deduplication key: `(Event + Production Line + TimeOfOccurrence)`.
   - Checks duplicates against existing database records and within the current file batch.
   - Provides an explicit prompt: `15 duplicate events detected. [Skip Duplicates] [Cancel Import]`.
   - If an invalid inspection record has no reason, it is classified as `Unknown` rather than being silently dropped.
4. **Cumulative Dynamic Updates**:
   - Ingesting a first batch (e.g., Aug 01 – Aug 15) and subsequently uploading a second batch (e.g., Aug 16 – Aug 18) automatically updates all KPIs, date ranges, charts, tables, line performances, hourly shifts, and reports without manual intervention or code edits.
5. **Traceability Down to Spreadsheet Rows**:
   - Every inspection event records its original `source_file` and 1-indexed `source_row`.
   - Clicking any event row anywhere opens a side drawer displaying full traceability back to the exact spreadsheet row.
6. **Multi-Format Report Center**:
   - Generates audit-ready reports in **PDF**, **Excel** (multi-sheet), and **CSV**, plus direct **Print** previews.
   - All reports automatically respect the active filters (Date Range, Production Line, Event, Status, Reason).

---

## 📐 Mathematical Formulas

- **Total Events**:
  $$\text{Total Events} = \text{Valid Events} + \text{Invalid Events}$$
- **Overall Accuracy**:
  $$\text{Accuracy} = \frac{\text{Valid Events}}{\text{Total Events}} \times 100$$
  *(If $\text{Total Events} = 0$, display `—`)*
- **Invalid Rate**:
  $$\text{Invalid Rate} = \frac{\text{Invalid Events}}{\text{Total Events}} \times 100$$
- **Invalid Reason Percentage**:
  $$\text{Reason Percentage} = \frac{\text{Reason Count}}{\text{Total Invalid Events}} \times 100$$
- **Precision / Recall / F1 (Ground Truth Integration)**:
  $$\text{Precision} = \frac{TP}{TP + FP}, \quad \text{Recall} = \frac{TP}{TP + FN}, \quad F_1 = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$$
  *(For raw vision inspection data where no false negatives exist, $TP = \text{Valid}$, $FP = \text{Invalid}$, and $FN = N/A$. False negatives are never fabricated).*

---

## 🚀 Quick Start Guide

### Local Application Links
- Frontend dashboard: http://localhost:5173
- Backend API documentation: http://127.0.0.1:8000/docs

### Dashboard Login
- Username: `admin`
- Password: `inspection123`

Use **Create a new account** on the login screen to register another username and password. Accounts are stored in the backend database with hashed passwords. Logging out only ends the browser session. Imported spreadsheets, inspection events, remarks, and summaries remain stored in the database and are available after signing in again.

### Free Public Deployment
This repository includes `render.yaml` for a free Render web service. Create a new Web Service at [render.com](https://render.com), connect this repository, and choose **Blueprint**. Render will build the React frontend and serve it from the FastAPI application. The free service may sleep after inactivity.

### 1. Requirements
- Python 3.10+
- Node.js 18+ (Node.js LTS is pre-bundled in `scratch/tools/nodejs`)

### 2. Launching the Application
Run the launcher script:
```powershell
.\run_app.ps1
```
Or start the backend and frontend separately:

#### Backend:
```powershell
cd backend
$env:PYTHONPATH = "app"
python -m uvicorn app.main:app --port 8000 --reload
```
- API Base: `http://127.0.0.1:8000`
- Interactive Swagger Documentation: `http://127.0.0.1:8000/docs`

#### Frontend:
```powershell
cd frontend
$env:PATH = "..\tools\nodejs;" + $env:PATH
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 🧪 Testing with Pre-Configured Datasets

Sample manufacturing datasets are pre-generated in `backend/sample_data/`:
1. `August_Inspection_Batch1.xlsx` (1,268 records, Aug 01 – Aug 15)
   - Features low accuracy on Aug 05 (~33% with HNDPOS missing to test the `—` gap rule), high accuracy on Aug 08 (~98%), and Production Line 3 running below target.
2. `August_Inspection_Batch2.xlsx` (240 records, Aug 16 – Aug 18)
   - Contains 15 exact duplicate records from Batch 1 to demonstrate duplicate detection and cumulative updating.
3. `Inspection_Summary_Historical.xlsx` (30 summary records)
   - Historical ground-truth data with PP, TP, FP, FN columns.

On the **Import Data** page, click any of the **Pre-configured Test Datasets** buttons to load and verify them with one click.

---

## 🗄️ PostgreSQL Configuration

To point to a remote or local PostgreSQL instance, set the `DATABASE_URL` environment variable:
```powershell
$env:DATABASE_URL = "postgresql://postgres:password@localhost:5432/inspection_analytics"
```
If `DATABASE_URL` is omitted, the application automatically uses a local SQLite database (`inspection_analytics.db`).

---

## 🛡️ Running Automated Tests

Run the comprehensive pytest suite:
```powershell
$env:PYTHONPATH = "backend"
python -m pytest backend/tests -v
```
All 8 test suites validate column detection, empty states, batch ingestion, KPI calculation accuracy, date gap preservation, reason percentages, duplicate skipping, and REST API endpoints.
