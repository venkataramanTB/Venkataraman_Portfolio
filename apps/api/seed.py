"""
Run once to populate Neon DB with initial data:
  python seed.py
"""
from database import SessionLocal, engine, Base
import models

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# ── Profile ───────────────────────────────────────────────────────────────────
if not db.query(models.Profile).first():
    db.add(models.Profile(
        name="Venkataraman TB",
        tagline="AI Engineer · Full Stack Developer · iOS Dev · ML Engineer",
        bio=(
            "I architect intelligent systems that span the full stack — from "
            "training ML models and shipping LLM-powered agents to building "
            "pixel-perfect iOS apps and high-throughput web backends. "
            "I thrive where AI meets product."
        ),
        email="venkataraman.tb@mythics.com",
        location="India",
        open_to_work=True,
    ))

# ── Social Links ──────────────────────────────────────────────────────────────
if not db.query(models.SocialLink).first():
    socials = [
        ("LinkedIn", "https://www.linkedin.com/in/venkataraman-tb-4859771ab/", "linkedin", 0),
        ("GitHub", "https://github.com/venkataraman-tb", "github", 1),
    ]
    for platform, url, icon, order in socials:
        db.add(models.SocialLink(platform=platform, url=url, icon=icon, display_order=order))

# ── Stats ─────────────────────────────────────────────────────────────────────
if not db.query(models.Stat).first():
    stats = [
        ("Projects Shipped", "30", "+", "rocket", 0),
        ("AI Models Deployed", "10", "+", "brain", 1),
        ("iOS Apps", "5", "+", "smartphone", 2),
        ("Certifications", "15", "+", "award", 3),
    ]
    for label, value, suffix, icon, order in stats:
        db.add(models.Stat(label=label, value=value, suffix=suffix, icon=icon, display_order=order))

# ── Skills ────────────────────────────────────────────────────────────────────
if not db.query(models.Skill).first():
    skills = [
        # AI / ML
        ("LLMs & Prompt Engineering", "AI / ML", 95, "#a78bfa", True, 0),
        ("LangChain / LlamaIndex", "AI / ML", 90, "#a78bfa", True, 1),
        ("PyTorch / TensorFlow", "AI / ML", 88, "#a78bfa", True, 2),
        ("RAG Pipelines", "AI / ML", 92, "#a78bfa", True, 3),
        ("MLOps & Model Deployment", "AI / ML", 85, "#a78bfa", False, 4),
        # Full Stack
        ("Svelte / SvelteKit", "Full Stack", 90, "#38bdf8", True, 5),
        ("React / Next.js", "Full Stack", 88, "#38bdf8", True, 6),
        ("FastAPI / Python", "Full Stack", 93, "#38bdf8", True, 7),
        ("Node.js / Express", "Full Stack", 85, "#38bdf8", False, 8),
        ("PostgreSQL / Neon DB", "Full Stack", 88, "#38bdf8", False, 9),
        # iOS
        ("Swift / SwiftUI", "iOS", 92, "#fb923c", True, 10),
        ("Core ML / Create ML", "iOS", 85, "#fb923c", True, 11),
        ("UIKit", "iOS", 80, "#fb923c", False, 12),
        # DevOps / Cloud
        ("Docker / Kubernetes", "DevOps", 82, "#34d399", False, 13),
        ("Vercel / Render", "DevOps", 90, "#34d399", False, 14),
        ("AWS / GCP", "DevOps", 78, "#34d399", False, 15),
    ]
    for name, cat, prof, color, featured, order in skills:
        db.add(models.Skill(
            name=name, category=cat, proficiency=prof,
            color=color, is_featured=featured, display_order=order
        ))

# ── Experience ────────────────────────────────────────────────────────────────
if not db.query(models.Experience).first():
    db.add(models.Experience(
        company="Mythics",
        role="AI Engineer",
        description=(
            "Designing and deploying LLM-powered solutions on Oracle Cloud. "
            "Building RAG pipelines, fine-tuning models, and shipping AI features "
            "that reduce manual effort by 60%."
        ),
        start_date="2023-01",
        is_current=True,
        location="Remote, India",
        technologies=["Python", "LangChain", "FastAPI", "Oracle Cloud", "PostgreSQL"],
        display_order=0,
    ))

# ── Projects ──────────────────────────────────────────────────────────────────
if not db.query(models.Project).first():
    projects = [
        {
            "title": "AI-Powered RAG Assistant",
            "description": "Enterprise knowledge-base chatbot built on LangChain + GPT-4 with sub-second retrieval.",
            "technologies": ["Python", "LangChain", "FastAPI", "Pinecone", "React"],
            "category": "AI / ML",
            "is_featured": True,
            "display_order": 0,
        },
        {
            "title": "Full Stack SaaS Dashboard",
            "description": "Real-time analytics platform with SvelteKit frontend, FastAPI backend and Neon DB.",
            "technologies": ["Svelte", "FastAPI", "PostgreSQL", "Vercel", "Render"],
            "category": "Full Stack",
            "is_featured": True,
            "display_order": 1,
        },
        {
            "title": "iOS ML Camera App",
            "description": "Native iOS app using Core ML for real-time object detection and scene classification.",
            "technologies": ["Swift", "SwiftUI", "Core ML", "Vision", "Create ML"],
            "category": "iOS",
            "is_featured": True,
            "display_order": 2,
        },
        {
            "title": "LLM Fine-Tuning Pipeline",
            "description": "End-to-end MLOps pipeline for fine-tuning and evaluating open-source LLMs.",
            "technologies": ["Python", "PyTorch", "HuggingFace", "Docker", "GCP"],
            "category": "AI / ML",
            "is_featured": False,
            "display_order": 3,
        },
    ]
    for p in projects:
        db.add(models.Project(**p))

db.commit()
db.close()
print("✓ Seed complete")
