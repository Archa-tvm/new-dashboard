import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "Simtra Usecase Analytics"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./inspection_analytics.db")
    OVERALL_TARGET: float = float(os.getenv("OVERALL_TARGET", "90.0"))
    OPSPD_TARGET: float = float(os.getenv("OPSPD_TARGET", "90.0"))
    HNDPOS_TARGET: float = float(os.getenv("HNDPOS_TARGET", "90.0"))
    AUTO_REFRESH: bool = os.getenv("AUTO_REFRESH", "true").lower() in ("true", "1")
    REFRESH_INTERVAL: int = int(os.getenv("REFRESH_INTERVAL", "30")) # seconds
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
