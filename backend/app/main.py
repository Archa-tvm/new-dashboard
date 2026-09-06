from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from datetime import datetime
from pathlib import Path
from app.config import settings
from app.database import engine, Base
from app.routers import dashboard, events, imports, analytics, reports, settings as settings_router, auth
from app.models import UserAccount
from app.routers.auth import hash_password

Base.metadata.create_all(bind=engine)

from app.database import SessionLocal
with SessionLocal() as startup_db:
    if not startup_db.query(UserAccount).filter(UserAccount.username == "admin").first():
        startup_db.add(UserAccount(username="admin", password_hash=hash_password("inspection123")))
        startup_db.commit()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production Inspection Analytics - Industrial AI/Vision Inspection System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(events.router, prefix=settings.API_V1_STR)
app.include_router(imports.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(settings_router.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix=settings.API_V1_STR)

frontend_dist = Path(__file__).resolve().parents[2] / "frontend" / "dist"

@app.get("/")
def root():
    frontend_index = frontend_dist / "index.html"
    if frontend_index.exists():
        return FileResponse(frontend_index)
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "timestamp": datetime.utcnow().isoformat(),
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "system_status": "System Online",
        "timestamp": datetime.utcnow().isoformat()
    }

if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
