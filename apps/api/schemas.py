from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── Profile ───────────────────────────────────────────────────────────────────

class ProfileBase(BaseModel):
    name: str
    tagline: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    resume_url: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    open_to_work: bool = True

class ProfileCreate(ProfileBase): pass
class ProfileUpdate(ProfileBase): pass
class ProfileOut(ProfileBase):
    id: int
    class Config: from_attributes = True


# ── Social Links ──────────────────────────────────────────────────────────────

class SocialLinkBase(BaseModel):
    platform: str
    url: str
    icon: Optional[str] = None
    display_order: int = 0

class SocialLinkCreate(SocialLinkBase): pass
class SocialLinkUpdate(SocialLinkBase): pass
class SocialLinkOut(SocialLinkBase):
    id: int
    class Config: from_attributes = True


# ── Skill ─────────────────────────────────────────────────────────────────────

class SkillBase(BaseModel):
    name: str
    category: str
    proficiency: int = 80
    icon_url: Optional[str] = None
    color: Optional[str] = None
    display_order: int = 0
    is_featured: bool = False

class SkillCreate(SkillBase): pass
class SkillUpdate(SkillBase): pass
class SkillOut(SkillBase):
    id: int
    class Config: from_attributes = True


# ── Experience ────────────────────────────────────────────────────────────────

class ExperienceBase(BaseModel):
    company: str
    role: str
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: bool = False
    company_logo_url: Optional[str] = None
    location: Optional[str] = None
    technologies: List[str] = []
    display_order: int = 0

class ExperienceCreate(ExperienceBase): pass
class ExperienceUpdate(ExperienceBase): pass
class ExperienceOut(ExperienceBase):
    id: int
    class Config: from_attributes = True


# ── Project ───────────────────────────────────────────────────────────────────

class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    long_description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    demo_url: Optional[str] = None
    github_url: Optional[str] = None
    appstore_url: Optional[str] = None
    technologies: List[str] = []
    category: Optional[str] = None
    is_featured: bool = False
    display_order: int = 0

class ProjectCreate(ProjectBase): pass
class ProjectUpdate(ProjectBase): pass
class ProjectOut(ProjectBase):
    id: int
    created_at: Optional[datetime] = None
    class Config: from_attributes = True


# ── Certificate ───────────────────────────────────────────────────────────────

class CertificateBase(BaseModel):
    title: str
    issuer: str
    issued_date: Optional[str] = None
    expiry_date: Optional[str] = None
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    display_order: int = 0

class CertificateCreate(CertificateBase): pass
class CertificateUpdate(CertificateBase): pass
class CertificateOut(CertificateBase):
    id: int
    created_at: Optional[datetime] = None
    class Config: from_attributes = True


# ── Achievement ───────────────────────────────────────────────────────────────

class AchievementBase(BaseModel):
    title: str
    description: Optional[str] = None
    date: Optional[str] = None
    icon: Optional[str] = None
    category: Optional[str] = None
    display_order: int = 0

class AchievementCreate(AchievementBase): pass
class AchievementUpdate(AchievementBase): pass
class AchievementOut(AchievementBase):
    id: int
    created_at: Optional[datetime] = None
    class Config: from_attributes = True


# ── Education ─────────────────────────────────────────────────────────────────

class EducationBase(BaseModel):
    institution: str
    degree: str
    field: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    gpa: Optional[float] = None
    logo_url: Optional[str] = None
    description: Optional[str] = None
    display_order: int = 0

class EducationCreate(EducationBase): pass
class EducationUpdate(EducationBase): pass
class EducationOut(EducationBase):
    id: int
    class Config: from_attributes = True


# ── Stats ─────────────────────────────────────────────────────────────────────

class StatBase(BaseModel):
    label: str
    value: str
    suffix: Optional[str] = None
    icon: Optional[str] = None
    display_order: int = 0

class StatCreate(StatBase): pass
class StatUpdate(StatBase): pass
class StatOut(StatBase):
    id: int
    class Config: from_attributes = True


# ── Full portfolio payload (single fetch for SSR) ─────────────────────────────

class PortfolioData(BaseModel):
    profile: Optional[ProfileOut] = None
    social_links: List[SocialLinkOut] = []
    skills: List[SkillOut] = []
    experiences: List[ExperienceOut] = []
    projects: List[ProjectOut] = []
    certificates: List[CertificateOut] = []
    achievements: List[AchievementOut] = []
    education: List[EducationOut] = []
    stats: List[StatOut] = []


# ── CV / Chat ──────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

class CVStatus(BaseModel):
    has_cv: bool
    filename: Optional[str] = None
    uploaded_at: Optional[datetime] = None
    chunks_count: int = 0
    has_embeddings: bool = False

class CVImportResult(BaseModel):
    profiles_created: int = 0
    skills_created: int = 0
    experiences_created: int = 0
    education_created: int = 0
    projects_created: int = 0
    certificates_created: int = 0
    achievements_created: int = 0
    chunks_embedded: int = 0
    message: str = ""

class LinkedInSyncRequest(BaseModel):
    linkedin_url: str
