"""
MAGNETIC AI - Database Layer (SQLite via SQLAlchemy)
Persists analysis history and generated report metadata.
"""

import os
import json
from datetime import datetime
from typing import List, Dict, Any, Optional

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker

DB_PATH = "reports_history.db"
engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class AnalysisRecord(Base):
    __tablename__ = "analysis_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    material_name = Column(String(128), default="Custom Sample")
    predicted_category = Column(String(64))
    confidence = Column(Float)
    hard_soft_class = Column(String(64), nullable=True)
    input_features_json = Column(Text)
    probabilities_json = Column(Text)
    properties_json = Column(Text, nullable=True)
    pdf_report_path = Column(String(256), nullable=True)


Base.metadata.create_all(bind=engine)


def save_analysis(
    predicted_category: str,
    confidence: float,
    input_features: Dict[str, Any],
    probabilities: Dict[str, float],
    material_name: str = "Custom Sample",
    hard_soft_class: Optional[str] = None,
    properties: Optional[Dict[str, Any]] = None,
    pdf_report_path: Optional[str] = None
) -> int:
    db = SessionLocal()
    try:
        record = AnalysisRecord(
            material_name=material_name,
            predicted_category=predicted_category,
            confidence=confidence,
            hard_soft_class=hard_soft_class,
            input_features_json=json.dumps(input_features),
            probabilities_json=json.dumps(probabilities),
            properties_json=json.dumps(properties) if properties else None,
            pdf_report_path=pdf_report_path
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record.id
    finally:
        db.close()


def get_analysis_history(limit: int = 50) -> List[Dict[str, Any]]:
    db = SessionLocal()
    try:
        records = db.query(AnalysisRecord).order_by(AnalysisRecord.created_at.desc()).limit(limit).all()
        history = []
        for r in records:
            history.append({
                "id": r.id,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "material_name": r.material_name,
                "predicted_category": r.predicted_category,
                "confidence": r.confidence,
                "hard_soft_class": r.hard_soft_class,
                "input_features": json.loads(r.input_features_json) if r.input_features_json else {},
                "probabilities": json.loads(r.probabilities_json) if r.probabilities_json else {},
                "properties": json.loads(r.properties_json) if r.properties_json else {},
                "pdf_report_path": r.pdf_report_path
            })
        return history
    finally:
        db.close()
