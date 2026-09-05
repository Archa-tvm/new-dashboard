from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base

class ImportBatch(Base):
    __tablename__ = "import_batches"

    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(20), nullable=False)
    total_rows = Column(Integer, default=0)
    imported_rows = Column(Integer, default=0)
    duplicate_rows = Column(Integer, default=0)
    rejected_rows = Column(Integer, default=0)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="Imported")

    events = relationship("InspectionEvent", back_populates="import_batch", cascade="all, delete-orphan")
    summaries = relationship("HistoricalSummary", back_populates="import_batch", cascade="all, delete-orphan")


class InspectionEvent(Base):
    __tablename__ = "inspection_events"

    id = Column(Integer, primary_key=True, index=True)
    event = Column(String(50), nullable=False, index=True)
    production_line = Column(String(100), nullable=False, index=True)
    time_of_occurrence = Column(DateTime, nullable=False, index=True)
    status = Column(String(20), nullable=False, index=True) # "valid" or "invalid"
    invalid_reason = Column(String(255), nullable=True, index=True)
    source_file = Column(String(255), nullable=False)
    source_row = Column(Integer, nullable=False)
    source_import_id = Column(Integer, ForeignKey("import_batches.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    import_batch = relationship("ImportBatch", back_populates="events")

    __table_args__ = (
        Index("idx_event_line_time", "event", "production_line", "time_of_occurrence"),
    )


class HistoricalSummary(Base):
    __tablename__ = "historical_summaries"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, nullable=False, index=True)
    event = Column(String(50), nullable=False, index=True)
    pp = Column(Integer, nullable=True)
    tp = Column(Integer, nullable=True)
    fp = Column(Integer, nullable=True)
    fn = Column(Integer, nullable=True)
    percentage = Column(Float, nullable=True)
    source_file = Column(String(255), nullable=False)
    source_import_id = Column(Integer, ForeignKey("import_batches.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    import_batch = relationship("ImportBatch", back_populates="summaries")


class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(String(255), nullable=False)
