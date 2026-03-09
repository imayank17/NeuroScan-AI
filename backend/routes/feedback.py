from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import User, Prediction, Feedback
from auth import get_current_user

router = APIRouter(prefix="/api/feedback", tags=["Feedback"])


class FeedbackCreate(BaseModel):
    prediction_id: int
    rating: int  # 1-5
    comment: str = ""


class FeedbackResponse(BaseModel):
    id: int
    prediction_id: int
    rating: int
    comment: str
    created_at: str

    class Config:
        from_attributes = True


@router.post("/", response_model=FeedbackResponse)
def create_feedback(
    data: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.rating < 1 or data.rating > 5:
        raise HTTPException(400, "Rating must be between 1 and 5")

    prediction = (
        db.query(Prediction)
        .filter(Prediction.id == data.prediction_id, Prediction.user_id == current_user.id)
        .first()
    )
    if not prediction:
        raise HTTPException(404, "Prediction not found")

    feedback = Feedback(
        user_id=current_user.id,
        prediction_id=data.prediction_id,
        rating=data.rating,
        comment=data.comment or "",
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    return FeedbackResponse(
        id=feedback.id,
        prediction_id=feedback.prediction_id,
        rating=feedback.rating,
        comment=feedback.comment or "",
        created_at=feedback.created_at.isoformat(),
    )


@router.get("/{prediction_id}")
def get_feedback(
    prediction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    feedbacks = (
        db.query(Feedback)
        .filter(Feedback.prediction_id == prediction_id, Feedback.user_id == current_user.id)
        .order_by(Feedback.created_at.desc())
        .all()
    )

    return [
        {
            "id": f.id,
            "rating": f.rating,
            "comment": f.comment,
            "created_at": f.created_at.isoformat(),
        }
        for f in feedbacks
    ]
