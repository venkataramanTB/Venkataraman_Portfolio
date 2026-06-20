"""
Admin CRUD router — all endpoints require a valid JWT.
Covers: profile, social_links, skills, experiences, projects,
        certificates, achievements, education, stats.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from auth import get_current_admin
import models, schemas

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(get_current_admin)])


# ── Helper ────────────────────────────────────────────────────────────────────

def _get_or_404(db, model, id):
    obj = db.query(model).filter(model.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    return obj


# ── Profile ───────────────────────────────────────────────────────────────────

@router.get("/profile", response_model=schemas.ProfileOut)
def get_profile(db: Session = Depends(get_db)):
    p = db.query(models.Profile).first()
    if not p:
        raise HTTPException(404, "Profile not found")
    return p

@router.post("/profile", response_model=schemas.ProfileOut)
def create_profile(body: schemas.ProfileCreate, db: Session = Depends(get_db)):
    p = models.Profile(**body.model_dump())
    db.add(p); db.commit(); db.refresh(p)
    return p

@router.put("/profile/{id}", response_model=schemas.ProfileOut)
def update_profile(id: int, body: schemas.ProfileUpdate, db: Session = Depends(get_db)):
    p = _get_or_404(db, models.Profile, id)
    for k, v in body.model_dump().items():
        setattr(p, k, v)
    db.commit(); db.refresh(p)
    return p


# ── Social Links ──────────────────────────────────────────────────────────────

@router.get("/social-links", response_model=List[schemas.SocialLinkOut])
def list_social(db: Session = Depends(get_db)):
    return db.query(models.SocialLink).order_by(models.SocialLink.display_order).all()

@router.post("/social-links", response_model=schemas.SocialLinkOut)
def create_social(body: schemas.SocialLinkCreate, db: Session = Depends(get_db)):
    s = models.SocialLink(**body.model_dump()); db.add(s); db.commit(); db.refresh(s); return s

@router.put("/social-links/{id}", response_model=schemas.SocialLinkOut)
def update_social(id: int, body: schemas.SocialLinkUpdate, db: Session = Depends(get_db)):
    s = _get_or_404(db, models.SocialLink, id)
    for k, v in body.model_dump().items(): setattr(s, k, v)
    db.commit(); db.refresh(s); return s

@router.delete("/social-links/{id}", status_code=204)
def delete_social(id: int, db: Session = Depends(get_db)):
    db.delete(_get_or_404(db, models.SocialLink, id)); db.commit()


# ── Skills ────────────────────────────────────────────────────────────────────

@router.get("/skills", response_model=List[schemas.SkillOut])
def list_skills(db: Session = Depends(get_db)):
    return db.query(models.Skill).order_by(models.Skill.display_order).all()

@router.post("/skills", response_model=schemas.SkillOut)
def create_skill(body: schemas.SkillCreate, db: Session = Depends(get_db)):
    s = models.Skill(**body.model_dump()); db.add(s); db.commit(); db.refresh(s); return s

@router.put("/skills/{id}", response_model=schemas.SkillOut)
def update_skill(id: int, body: schemas.SkillUpdate, db: Session = Depends(get_db)):
    s = _get_or_404(db, models.Skill, id)
    for k, v in body.model_dump().items(): setattr(s, k, v)
    db.commit(); db.refresh(s); return s

@router.delete("/skills/{id}", status_code=204)
def delete_skill(id: int, db: Session = Depends(get_db)):
    db.delete(_get_or_404(db, models.Skill, id)); db.commit()


# ── Experience ────────────────────────────────────────────────────────────────

@router.get("/experiences", response_model=List[schemas.ExperienceOut])
def list_exp(db: Session = Depends(get_db)):
    return db.query(models.Experience).order_by(models.Experience.display_order).all()

@router.post("/experiences", response_model=schemas.ExperienceOut)
def create_exp(body: schemas.ExperienceCreate, db: Session = Depends(get_db)):
    e = models.Experience(**body.model_dump()); db.add(e); db.commit(); db.refresh(e); return e

@router.put("/experiences/{id}", response_model=schemas.ExperienceOut)
def update_exp(id: int, body: schemas.ExperienceUpdate, db: Session = Depends(get_db)):
    e = _get_or_404(db, models.Experience, id)
    for k, v in body.model_dump().items(): setattr(e, k, v)
    db.commit(); db.refresh(e); return e

@router.delete("/experiences/{id}", status_code=204)
def delete_exp(id: int, db: Session = Depends(get_db)):
    db.delete(_get_or_404(db, models.Experience, id)); db.commit()


# ── Projects ──────────────────────────────────────────────────────────────────

@router.get("/projects", response_model=List[schemas.ProjectOut])
def list_projects(db: Session = Depends(get_db)):
    return db.query(models.Project).order_by(models.Project.display_order).all()

@router.post("/projects", response_model=schemas.ProjectOut)
def create_project(body: schemas.ProjectCreate, db: Session = Depends(get_db)):
    p = models.Project(**body.model_dump()); db.add(p); db.commit(); db.refresh(p); return p

@router.put("/projects/{id}", response_model=schemas.ProjectOut)
def update_project(id: int, body: schemas.ProjectUpdate, db: Session = Depends(get_db)):
    p = _get_or_404(db, models.Project, id)
    for k, v in body.model_dump().items(): setattr(p, k, v)
    db.commit(); db.refresh(p); return p

@router.delete("/projects/{id}", status_code=204)
def delete_project(id: int, db: Session = Depends(get_db)):
    db.delete(_get_or_404(db, models.Project, id)); db.commit()


# ── Certificates ──────────────────────────────────────────────────────────────

@router.get("/certificates", response_model=List[schemas.CertificateOut])
def list_certs(db: Session = Depends(get_db)):
    return db.query(models.Certificate).order_by(models.Certificate.display_order).all()

@router.post("/certificates", response_model=schemas.CertificateOut)
def create_cert(body: schemas.CertificateCreate, db: Session = Depends(get_db)):
    c = models.Certificate(**body.model_dump()); db.add(c); db.commit(); db.refresh(c); return c

@router.put("/certificates/{id}", response_model=schemas.CertificateOut)
def update_cert(id: int, body: schemas.CertificateUpdate, db: Session = Depends(get_db)):
    c = _get_or_404(db, models.Certificate, id)
    for k, v in body.model_dump().items(): setattr(c, k, v)
    db.commit(); db.refresh(c); return c

@router.delete("/certificates/{id}", status_code=204)
def delete_cert(id: int, db: Session = Depends(get_db)):
    db.delete(_get_or_404(db, models.Certificate, id)); db.commit()


# ── Achievements ──────────────────────────────────────────────────────────────

@router.get("/achievements", response_model=List[schemas.AchievementOut])
def list_achieve(db: Session = Depends(get_db)):
    return db.query(models.Achievement).order_by(models.Achievement.display_order).all()

@router.post("/achievements", response_model=schemas.AchievementOut)
def create_achieve(body: schemas.AchievementCreate, db: Session = Depends(get_db)):
    a = models.Achievement(**body.model_dump()); db.add(a); db.commit(); db.refresh(a); return a

@router.put("/achievements/{id}", response_model=schemas.AchievementOut)
def update_achieve(id: int, body: schemas.AchievementUpdate, db: Session = Depends(get_db)):
    a = _get_or_404(db, models.Achievement, id)
    for k, v in body.model_dump().items(): setattr(a, k, v)
    db.commit(); db.refresh(a); return a

@router.delete("/achievements/{id}", status_code=204)
def delete_achieve(id: int, db: Session = Depends(get_db)):
    db.delete(_get_or_404(db, models.Achievement, id)); db.commit()


# ── Education ─────────────────────────────────────────────────────────────────

@router.get("/education", response_model=List[schemas.EducationOut])
def list_edu(db: Session = Depends(get_db)):
    return db.query(models.Education).order_by(models.Education.display_order).all()

@router.post("/education", response_model=schemas.EducationOut)
def create_edu(body: schemas.EducationCreate, db: Session = Depends(get_db)):
    e = models.Education(**body.model_dump()); db.add(e); db.commit(); db.refresh(e); return e

@router.put("/education/{id}", response_model=schemas.EducationOut)
def update_edu(id: int, body: schemas.EducationUpdate, db: Session = Depends(get_db)):
    e = _get_or_404(db, models.Education, id)
    for k, v in body.model_dump().items(): setattr(e, k, v)
    db.commit(); db.refresh(e); return e

@router.delete("/education/{id}", status_code=204)
def delete_edu(id: int, db: Session = Depends(get_db)):
    db.delete(_get_or_404(db, models.Education, id)); db.commit()


# ── Stats ─────────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=List[schemas.StatOut])
def list_stats(db: Session = Depends(get_db)):
    return db.query(models.Stat).order_by(models.Stat.display_order).all()

@router.post("/stats", response_model=schemas.StatOut)
def create_stat(body: schemas.StatCreate, db: Session = Depends(get_db)):
    s = models.Stat(**body.model_dump()); db.add(s); db.commit(); db.refresh(s); return s

@router.put("/stats/{id}", response_model=schemas.StatOut)
def update_stat(id: int, body: schemas.StatUpdate, db: Session = Depends(get_db)):
    s = _get_or_404(db, models.Stat, id)
    for k, v in body.model_dump().items(): setattr(s, k, v)
    db.commit(); db.refresh(s); return s

@router.delete("/stats/{id}", status_code=204)
def delete_stat(id: int, db: Session = Depends(get_db)):
    db.delete(_get_or_404(db, models.Stat, id)); db.commit()
