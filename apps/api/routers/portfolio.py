from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models, schemas

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("", response_model=schemas.PortfolioData)
def get_full_portfolio(db: Session = Depends(get_db)):
    """Single endpoint that returns all portfolio data — used by the main frontend."""
    profile = db.query(models.Profile).first()
    return schemas.PortfolioData(
        profile=profile,
        social_links=db.query(models.SocialLink).order_by(models.SocialLink.display_order).all(),
        skills=db.query(models.Skill).order_by(models.Skill.display_order).all(),
        experiences=db.query(models.Experience).order_by(models.Experience.display_order).all(),
        projects=db.query(models.Project).order_by(models.Project.display_order).all(),
        certificates=db.query(models.Certificate).order_by(models.Certificate.display_order).all(),
        achievements=db.query(models.Achievement).order_by(models.Achievement.display_order).all(),
        education=db.query(models.Education).order_by(models.Education.display_order).all(),
        stats=db.query(models.Stat).order_by(models.Stat.display_order).all(),
    )
