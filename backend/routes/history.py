from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Prediction
from auth import get_current_user

router = APIRouter(prefix="/api/history", tags=["History"])


@router.get("/")
def get_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    predictions = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .order_by(Prediction.created_at.desc())
        .all()
    )

    return [
        {
            "id": p.id,
            "filename": p.filename,
            "file_type": p.file_type,
            "prediction": p.prediction,
            "confidence": p.confidence,
            "created_at": p.created_at.isoformat(),
        }
        for p in predictions
    ]


@router.get("/{prediction_id}")
def get_prediction_detail(
    prediction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prediction = (
        db.query(Prediction)
        .filter(Prediction.id == prediction_id, Prediction.user_id == current_user.id)
        .first()
    )
    if not prediction:
        raise HTTPException(404, "Prediction not found")

    return {
        "id": prediction.id,
        "filename": prediction.filename,
        "file_type": prediction.file_type,
        "prediction": prediction.prediction,
        "confidence": prediction.confidence,
        "eeg_data": prediction.eeg_data,
        "signal_stats": prediction.signal_stats,
        "created_at": prediction.created_at.isoformat(),
    }
