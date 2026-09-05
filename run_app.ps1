# Production Inspection Analytics Launcher Script
$ErrorActionPreference = "Stop"

$ProjectRoot = $PSScriptRoot
$ToolsDir = Join-Path $ProjectRoot "..\tools\nodejs"

if (Test-Path $ToolsDir) {
    $env:PATH = "$ToolsDir;" + $env:PATH
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  PRODUCTION INSPECTION ANALYTICS - INDUSTRIAL AI SYSTEM  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Check Python
Write-Host "[1/2] Launching FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Green
$BackendProcess = Start-Process -FilePath "python" -ArgumentList "-m uvicorn app.main:app --port 8000 --reload" -WorkingDirectory (Join-Path $ProjectRoot "backend") -PassThru

# Check Frontend
Write-Host "[2/2] Launching React Vite Frontend on http://localhost:5173..." -ForegroundColor Green
$FrontendProcess = Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory (Join-Path $ProjectRoot "frontend") -PassThru

Write-Host "`nSystem is running!" -ForegroundColor Yellow
Write-Host "Frontend URL: http://localhost:5173" -ForegroundColor White
Write-Host "Backend API Docs: http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "`nPress Ctrl+C or close this window to exit.`n" -ForegroundColor DarkGray

try {
    Wait-Process -Id $FrontendProcess.Id
} finally {
    Stop-Process -Id $BackendProcess.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $FrontendProcess.Id -ErrorAction SilentlyContinue
}
