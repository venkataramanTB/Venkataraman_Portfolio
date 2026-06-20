from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Float, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from database import Base


class Profile(Base):
    __tablename__ = "profiles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    tagline = Column(String(255))
    bio = Column(Text)
    avatar_url = Column(String(500))
    resume_url = Column(String(500))
    email = Column(String(100))
    phone = Column(String(30))
    location = Column(String(100))
    open_to_work = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class SocialLink(Base):
    __tablename__ = "social_links"
    id = Column(Integer, primary_key=True, index=True)
    platform = Column(String(50), nullable=False)
    url = Column(String(500), nullable=False)
    icon = Column(String(50))
    display_order = Column(Integer, default=0)


class Skill(Base):
    __tablename__ = "skills"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(100), nullable=False)
    proficiency = Column(Integer, default=80)
    icon_url = Column(String(500))
    color = Column(String(20))
    display_order = Column(Integer, default=0)
    is_featured = Column(Boolean, default=False)


class Experience(Base):
    __tablename__ = "experiences"
    id = Column(Integer, primary_key=True, index=True)
    company = Column(String(200), nullable=False)
    role = Column(String(200), nullable=False)
    description = Column(Text)
    start_date = Column(String(20))
    end_date = Column(String(20))
    is_current = Column(Boolean, default=False)
    company_logo_url = Column(String(500))
    location = Column(String(100))
    technologies = Column(JSON, default=list)
    display_order = Column(Integer, default=0)


class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    long_description = Column(Text)
    thumbnail_url = Column(String(500))
    demo_url = Column(String(500))
    github_url = Column(String(500))
    appstore_url = Column(String(500))
    technologies = Column(JSON, default=list)
    category = Column(String(100))
    is_featured = Column(Boolean, default=False)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Certificate(Base):
    __tablename__ = "certificates"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    issuer = Column(String(200), nullable=False)
    issued_date = Column(String(20))
    expiry_date = Column(String(20))
    credential_id = Column(String(200))
    credential_url = Column(String(500))
    image_url = Column(String(500))
    category = Column(String(100))
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Achievement(Base):
    __tablename__ = "achievements"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    description = Column(Text)
    date = Column(String(20))
    icon = Column(String(100))
    category = Column(String(100))
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Education(Base):
    __tablename__ = "education"
    id = Column(Integer, primary_key=True, index=True)
    institution = Column(String(200), nullable=False)
    degree = Column(String(200), nullable=False)
    field = Column(String(200))
    start_date = Column(String(20))
    end_date = Column(String(20))
    gpa = Column(Float)
    logo_url = Column(String(500))
    description = Column(Text)
    display_order = Column(Integer, default=0)


class Stat(Base):
    __tablename__ = "stats"
    id = Column(Integer, primary_key=True, index=True)
    label = Column(String(100), nullable=False)
    value = Column(String(50), nullable=False)
    suffix = Column(String(20))
    icon = Column(String(100))
    display_order = Column(Integer, default=0)


class CVDocument(Base):
    __tablename__ = "cv_documents"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255))
    raw_text = Column(Text)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    chunks = relationship("CVChunk", back_populates="document", cascade="all, delete-orphan")


class CVChunk(Base):
    __tablename__ = "cv_chunks"
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("cv_documents.id"))
    chunk_text = Column(Text)
    chunk_index = Column(Integer)
    embedding = Column(Vector(768), nullable=True)
    document = relationship("CVDocument", back_populates="chunks")
