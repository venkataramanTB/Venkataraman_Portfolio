"""
Seed the database from the LinkedIn data export.

    python seed.py              # only fills tables that are empty
    python seed.py --replace    # wipes content tables first, then re-seeds

Use --replace to overwrite data that is already in the database. The plain
mode skips any table that already has rows, so it cannot fix stale content.
SEED_MODE=replace in the environment does the same thing, for hosts that run
this as a pre-deploy command and cannot pass arguments.

PROVENANCE
----------
Profile, positions, education, skills and certifications are read at run time
from the official LinkedIn "Basic Data Export" of 2026-10-05, trimmed to the
public sections and committed under data/linkedin/. See linkedin_export.py for
what the export contains and what was dropped from it.

Not from the export:

  * projects       - taken from the public GitHub API (github.com/venkataramanTB).
                     The LinkedIn "Projects" section is empty.
  * social links   - the profile URLs themselves.
  * achievements   - LinkedIn's "Honors & awards" section is empty; the single
                     entry is the promotion the profile states.
  * skill category / colour / featured
                   - LinkedIn exports a flat list of skill names only. The
                     grouping lives in linkedin_export.SKILL_MAP.
  * skill.proficiency
                   - LinkedIn exposes no proficiency value. Every skill is set
                     to a flat 80. Tune these by hand; they are not measurements.

Stats are counted from the export rather than typed in, so they cannot drift.
Fields the export leaves blank stay None rather than being invented: experience
descriptions, phone, avatar_url, resume_url, project thumbnails.
"""
import os
import sys

from database import SessionLocal, engine, Base
import linkedin_export as li
import models

REPLACE = "--replace" in sys.argv or os.getenv("SEED_MODE", "").lower() == "replace"

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Ordered child-to-parent so a --replace run does not trip foreign keys.
CONTENT_TABLES = [
    models.Stat,
    models.SocialLink,
    models.Skill,
    models.Experience,
    models.Project,
    models.Certificate,
    models.Achievement,
    models.Education,
    models.Profile,
]

if REPLACE:
    for table in CONTENT_TABLES:
        deleted = db.query(table).delete()
        print(f"  cleared {table.__tablename__} ({deleted} rows)")
    db.commit()


def seed(table, rows, build):
    """Insert rows unless the table already has content and we are not replacing."""
    if db.query(table).first():
        print(f"  skip {table.__tablename__} (already populated)")
        return
    for order, row in enumerate(rows):
        db.add(build(row, order))
    print(f"  seeded {table.__tablename__} ({len(rows)} rows)")


# -- Profile -------------------------------------------------------------------
# Headline -> tagline, About -> bio, Geo Location -> location, and the primary
# confirmed address from Email Addresses.csv.
if not db.query(models.Profile).first():
    p = li.profile()
    db.add(models.Profile(
        name=p["name"],
        tagline=p["tagline"],
        bio=p["bio"],
        email=p["email"],
        location=p["location"],
        phone=None,
        avatar_url=None,
        resume_url=None,
        open_to_work=True,
    ))
    print("  seeded profiles (1 row)")
else:
    print("  skip profiles (already populated)")

# -- Social links --------------------------------------------------------------
seed(models.SocialLink, [
    ("LinkedIn", "https://www.linkedin.com/in/venkataramantb/", "linkedin"),
    ("GitHub", "https://github.com/venkataramanTB", "github"),
], lambda r, o: models.SocialLink(platform=r[0], url=r[1], icon=r[2], display_order=o))

# -- Skills --------------------------------------------------------------------
skill_rows, unmapped, missing = li.skills()
if unmapped:
    print(f"  note: {len(unmapped)} exported skills not shown "
          f"(course objectives, duplicates, unrelated) - see SKILL_MAP")
if missing:
    print(f"  warning: {len(missing)} mapped skills are no longer in the export: "
          f"{', '.join(missing)}")
seed(models.Skill, skill_rows, lambda r, o: models.Skill(
    name=r["name"], category=r["category"], color=r["color"],
    is_featured=r["is_featured"], proficiency=80, display_order=o,
))

# -- Experience ----------------------------------------------------------------
# All positions from the export, newest first. The export carries description
# text for one role only; the rest stay None. `technologies` is not in the
# export at all, so it is left empty and can be filled from the admin UI.
seed(models.Experience, li.positions(), lambda r, o: models.Experience(
    company=r["company"], role=r["role"], description=r["description"],
    start_date=r["start_date"], end_date=r["end_date"], is_current=r["is_current"],
    location=r["location"], technologies=[], display_order=o,
))

# -- Education -----------------------------------------------------------------
# The export has no field of study or GPA column; the field is read from the
# profile's own degree description.
seed(models.Education, li.education(), lambda r, o: models.Education(
    institution=r["institution"], degree=r["degree"],
    field="Computer Science" if "Chennai Institute" in r["institution"] else None,
    start_date=r["start_date"], end_date=r["end_date"], gpa=None,
    description=r["description"], display_order=o,
))

# -- Certificates --------------------------------------------------------------
# All licences and certifications, newest first, with the real credential IDs
# and verification URLs from the export.
seed(models.Certificate, li.certifications(), lambda r, o: models.Certificate(
    title=r["title"], issuer=r["issuer"], issued_date=r["issued_date"],
    expiry_date=r["expiry_date"], credential_id=r["credential_id"],
    credential_url=r["credential_url"], category=r["category"],
    image_url=None, display_order=o,
))

# -- Achievements --------------------------------------------------------------
# The LinkedIn "Honors & awards" section is empty. This single entry is the
# promotion the profile itself states.
seed(models.Achievement, [
    dict(title="Promoted to Associate Software Engineer at Mythics",
         description="Promoted after shipping work across generative AI, LLMs, "
                     "RAG, automation and enterprise technology.",
         date="Sep 2026", icon="achievements", category="Career"),
], lambda r, o: models.Achievement(display_order=o, **r))

# -- Projects ------------------------------------------------------------------
# From the public GitHub account; forks and placeholder repos excluded.
# `technologies` is the repo's real language breakdown. Descriptions are only
# present where the repo itself sets one.
PROJECTS = [
    dict(title="Learning Management System", description=None,
         technologies=["JavaScript", "CSS"], category="Full Stack",
         github_url="https://github.com/venkataramanTB/Learning-Management-System",
         demo_url="https://lms-mu-seven.vercel.app", is_featured=True),
    dict(title="Dynamic Navigation System", description=None,
         technologies=["Python"], category="Python",
         github_url="https://github.com/venkataramanTB/Dynamic_Navigation_system",
         demo_url=None, is_featured=True),
    dict(title="Skillset System",
         description="A web app for student skillset system management.",
         technologies=["HTML", "CSS"], category="Full Stack",
         github_url="https://github.com/venkataramanTB/Skillset-System",
         demo_url=None, is_featured=True),
    dict(title="Chatbot", description=None,
         technologies=["Python"], category="AI / ML",
         github_url="https://github.com/venkataramanTB/Chatbot",
         demo_url=None, is_featured=False),
    dict(title="F1 Data Analytics", description=None,
         technologies=[], category="AI / ML",
         github_url="https://github.com/venkataramanTB/F1_Data_Analytics",
         demo_url=None, is_featured=False),
    dict(title="Post Validation Service", description=None,
         technologies=["Python", "JavaScript"], category="Full Stack",
         github_url="https://github.com/venkataramanTB/PostValidation_Service",
         demo_url=None, is_featured=False),
    dict(title="Employee Detail System Management", description=None,
         technologies=["JavaScript", "HTML", "CSS"], category="Full Stack",
         github_url="https://github.com/venkataramanTB/Employee-Detail-System-Management",
         demo_url=None, is_featured=False),
    dict(title="Flight Booking System", description=None,
         technologies=["JavaScript", "HTML", "CSS"], category="Full Stack",
         github_url="https://github.com/venkataramanTB/Flight-Booking-System",
         demo_url="https://flight-tickets.vercel.app", is_featured=False),
    dict(title="Student Details", description=None,
         technologies=["JavaScript", "Shell", "Docker"], category="Full Stack",
         github_url="https://github.com/venkataramanTB/Student-Details",
         demo_url="https://student-details-jet.vercel.app", is_featured=False),
    dict(title="Penny Raise", description=None,
         technologies=["JavaScript"], category="Full Stack",
         github_url="https://github.com/venkataramanTB/Penny-Raise",
         demo_url="https://penny-raise.vercel.app", is_featured=False),
    dict(title="Project Medicine", description=None,
         technologies=["JavaScript"], category="Full Stack",
         github_url="https://github.com/venkataramanTB/Project-Medicine",
         demo_url=None, is_featured=False),
    dict(title="Anti Drug Application", description=None,
         technologies=[], category="Full Stack",
         github_url="https://github.com/venkataramanTB/Anti-Drug-Application",
         demo_url=None, is_featured=False),
    dict(title="Portfolio (React)", description=None,
         technologies=["HTML"], category="Full Stack",
         github_url="https://github.com/venkataramanTB/Portfolio_React",
         demo_url=None, is_featured=False),
    dict(title="Portfolio (SvelteKit + FastAPI)", description=None,
         technologies=["Svelte", "SvelteKit", "FastAPI", "Python", "PostgreSQL"],
         category="Full Stack",
         github_url="https://github.com/venkataramanTB/Venkataraman_Portfolio",
         demo_url="https://venkataraman-tb-portfolio.up.railway.app/",
         is_featured=False),
]

seed(models.Project, PROJECTS, lambda r, o: models.Project(
    long_description=None, thumbnail_url=None, appstore_url=None,
    display_order=o, **r))

# -- Stats ---------------------------------------------------------------------
# Counted from the export and the project list, so these stay true when the
# export is refreshed instead of drifting from hand-typed numbers.
counts = li.counts()
seed(models.Stat, [
    ("Certifications", str(counts["certifications"]), "", "verify"),
    ("Roles & Internships", str(counts["roles"]), "", "work"),
    ("Public Projects", str(len(PROJECTS)), "", "projects"),
    ("Years in Tech", str(counts["years_in_tech"]), "+", "stats"),
], lambda r, o: models.Stat(label=r[0], value=r[1], suffix=r[2], icon=r[3], display_order=o))


db.commit()
db.close()
print("Seed complete" + (" (replaced)" if REPLACE else ""))
