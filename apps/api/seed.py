"""
Seed the database with real profile data.

    python seed.py              # only fills tables that are empty
    python seed.py --replace    # wipes content tables first, then re-seeds

Use --replace to overwrite data that is already in the database. The plain
mode skips any table that already has rows, so it cannot fix stale content.

PROVENANCE
----------
Everything here was read from the live LinkedIn profile at
https://www.linkedin.com/in/venkataramantb/ on 2026-10-05, except:

  * projects       - taken from the public GitHub API (github.com/venkataramanTB).
                     The LinkedIn "Projects" section is empty.
  * skill.proficiency
                   - LinkedIn exposes no proficiency value. Every skill is set
                     to a flat 80. Tune these by hand; they are not measurements.
  * profile.bio    - the profile has no "About" section. The text below is
                     assembled only from facts stated elsewhere on the profile.

Fields LinkedIn had no data for are left as None rather than invented:
experience descriptions, phone, avatar_url, resume_url, project thumbnails.
"""
import sys

from database import SessionLocal, engine, Base
import models

REPLACE = "--replace" in sys.argv

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
if not db.query(models.Profile).first():
    db.add(models.Profile(
        name="Venkataraman TB",
        tagline="Associate Software Engineer @ Mythics | Application Development, Applied Machine Learning",
        bio=(
            "Associate Software Engineer at Mythics, working across generative AI, "
            "large language models, RAG, automation and enterprise technology. "
            "Computer Science engineering graduate from Chennai Institute of Technology, "
            "with Oracle Cloud Infrastructure professional certifications in Data Science, "
            "Generative AI and Database architecture."
        ),
        email="venkataraman.tb@mythics.com",
        phone=None,
        location="Bengaluru, Karnataka, India",
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
    ("Portfolio", "https://venkataraman-portfolio.netlify.app/", "site"),
], lambda r, o: models.SocialLink(platform=r[0], url=r[1], icon=r[2], display_order=o))

# -- Stats ---------------------------------------------------------------------
# Counts are real and checkable: 7 certifications listed on LinkedIn, 14 non-fork
# public repos, 9 listed positions, first internship Jan 2022.
seed(models.Stat, [
    ("Certifications", "7", "", "verify"),
    ("Public Projects", "14", "", "projects"),
    ("Roles & Internships", "9", "", "work"),
    ("Years in Tech", "4", "+", "stats"),
], lambda r, o: models.Stat(label=r[0], value=r[1], suffix=r[2], icon=r[3], display_order=o))

# -- Skills --------------------------------------------------------------------
# All 26 skills listed on the profile, across its four category tabs.
# Proficiency is a uniform placeholder - see PROVENANCE above.
seed(models.Skill, [
    # AI / ML
    ("Applied Machine Learning", "AI / ML", "#a78bfa", True),
    ("Generative AI", "AI / ML", "#a78bfa", True),
    ("Large Language Models (LLM)", "AI / ML", "#a78bfa", True),
    ("Retrieval-Augmented Generation (RAG)", "AI / ML", "#a78bfa", True),
    ("Large Language Model Operations (LLMOps)", "AI / ML", "#a78bfa", False),
    ("Data Science", "AI / ML", "#a78bfa", True),
    ("Model Optimization", "AI / ML", "#a78bfa", False),
    ("AI Chatbots", "AI / ML", "#a78bfa", False),
    ("Chatbots", "AI / ML", "#a78bfa", False),
    ("Core ML", "AI / ML", "#a78bfa", False),
    # Cloud
    ("Cloud Computing", "Cloud", "#34d399", True),
    ("Amazon Web Services (AWS)", "Cloud", "#34d399", True),
    ("Oracle Database", "Cloud", "#34d399", True),
    ("Disaster Recovery", "Cloud", "#34d399", False),
    ("Data Migration", "Cloud", "#34d399", False),
    ("Resource Management", "Cloud", "#34d399", False),
    # Engineering
    ("Application Development", "Engineering", "#38bdf8", True),
    ("Python (Programming Language)", "Engineering", "#38bdf8", True),
    ("Flask", "Engineering", "#38bdf8", False),
    ("Redux.js", "Engineering", "#38bdf8", False),
    ("Pandas (Software)", "Engineering", "#38bdf8", False),
    ("Seaborn", "Engineering", "#38bdf8", False),
    ("Anaconda", "Engineering", "#38bdf8", False),
    ("Tkinter", "Engineering", "#38bdf8", False),
    # Listed on the profile as-is. "LLVM" is very likely a mis-pick for "LLM"
    # and "Online Music" comes from the music side of the profile - both are
    # kept because they are on the profile, but consider removing them there.
    ("LLVM", "Other", "#94a3b8", False),
    ("Online Music", "Other", "#94a3b8", False),
], lambda r, o: models.Skill(
    name=r[0], category=r[1], proficiency=80, color=r[2],
    is_featured=r[3], display_order=o,
))

# -- Experience ----------------------------------------------------------------
# Nine positions, newest first. LinkedIn carries no description text for these,
# so description stays None. `technologies` only lists skills LinkedIn itself
# associates with that role.
seed(models.Experience, [
    dict(company="Mythics", role="Associate Software Engineer",
         start_date="Sep 2026", end_date=None, is_current=True,
         location="Bengaluru, Karnataka, India", technologies=[]),
    dict(company="Mythics", role="Practice AI Engineer",
         start_date="May 2025", end_date="Sep 2026", is_current=False,
         location="Bangalore Urban, Karnataka, India", technologies=[]),
    dict(company="Smart ERP Solutions", role="Generative AI Engineer",
         start_date="May 2025", end_date="May 2025", is_current=False,
         location="Bangalore Urban, Karnataka, India",
         technologies=["Python", "Pandas", "Flask", "Anaconda", "Seaborn",
                       "Tkinter", "Generative AI",
                       "Retrieval-Augmented Generation (RAG)", "LLMOps"]),
    dict(company="ReferralYogi", role="Software Developer",
         start_date="Jul 2024", end_date="May 2025", is_current=False,
         location="India", technologies=["Redux.js"]),
    dict(company="Adobe", role="Gen AI Engineer Intern",
         start_date="Sep 2023", end_date="May 2024", is_current=False,
         location="Hyderabad, Telangana, India", technologies=[]),
    dict(company="Lumos Magazine", role="Graphic Designer",
         start_date="Feb 2023", end_date="Nov 2023", is_current=False,
         location="Remote", technologies=[]),
    dict(company="Larsen & Toubro", role="Full-stack Developer Intern",
         start_date="May 2023", end_date="Aug 2023", is_current=False,
         location="Chennai, Tamil Nadu, India", technologies=["Generative AI"]),
    dict(company="Lumos Chennai Institute of Technology", role="Video Editor",
         start_date="Feb 2023", end_date="Feb 2023", is_current=False,
         location="Chennai, Tamil Nadu, India", technologies=[]),
    dict(company="AiVirex Innovations", role="Graphic Designer",
         start_date="Jan 2022", end_date="Sep 2022", is_current=False,
         location="Remote", technologies=[]),
], lambda r, o: models.Experience(description=None, display_order=o, **r))

# -- Education -----------------------------------------------------------------
seed(models.Education, [
    dict(institution="Chennai Institute of Technology",
         degree="Bachelor of Engineering - BE",
         field="Computer Science",
         start_date="Sep 2021", end_date="Apr 2025", gpa=None,
         description="Activities and societies: Pianist, Music Producer, "
                     "Basketball Player, Badminton Player"),
], lambda r, o: models.Education(display_order=o, **r))

# -- Certificates --------------------------------------------------------------
# All seven licences and certifications, newest first, with the real credential
# IDs and verification URLs behind each "Show credential" link.
seed(models.Certificate, [
    dict(title="Certificate of Completion: AI Fluency Framework & Foundations",
         issuer="Anthropic", issued_date="Mar 2026",
         credential_id="u5mk454ux44v",
         credential_url="https://verify.skilljar.com/c/u5mk454ux44v",
         category="AI / ML"),
    dict(title="Manage Kubernetes in Google Cloud Skill Badge",
         issuer="Google", issued_date="Nov 2025",
         credential_id=None,
         credential_url="https://www.credly.com/badges/15e06985-6b34-4bd2-b0b2-04d3302c1dad/linked_in_profile",
         category="Cloud"),
    dict(title="Oracle Cloud Infrastructure 2025 Certified Data Science Professional",
         issuer="Oracle", issued_date="Oct 2025",
         credential_id="28F6EE8911F712C99E217253528E684A661A99ABE68B5E023DF13A62B44A27C6",
         credential_url="https://catalog-education.oracle.com/pls/certview/sharebadge"
                        "?id=28F6EE8911F712C99E217253528E684A661A99ABE68B5E023DF13A62B44A27C6",
         category="AI / ML"),
    dict(title="Oracle Cloud Infrastructure 2025 Certified Generative AI Professional",
         issuer="Oracle", issued_date="Oct 2025",
         credential_id="743817E6C2437B24585899C88E2B9AD723ADBB7CEC37C1CCDDFDE0E982E30B02",
         credential_url="https://catalog-education.oracle.com/pls/certview/sharebadge"
                        "?id=743817E6C2437B24585899C88E2B9AD723ADBB7CEC37C1CCDDFDE0E982E30B02",
         category="AI / ML"),
    dict(title="Oracle Database@AWS Certified Architect Professional",
         issuer="Oracle", issued_date="Oct 2025",
         credential_id="8A76210A256124F3EE31D9C23F4D7D384E713007550F82388BFD8A84B769C31D",
         credential_url="https://catalog-education.oracle.com/pls/certview/sharebadge"
                        "?id=8A76210A256124F3EE31D9C23F4D7D384E713007550F82388BFD8A84B769C31D",
         category="Cloud"),
    dict(title="PCAP - Programming Essentials in Python",
         issuer="Cisco", issued_date="Jun 2024",
         credential_id=None, credential_url=None,
         category="Engineering"),
    dict(title="Cybersecurity Essentials",
         issuer="Cisco", issued_date="Feb 2023",
         credential_id=None,
         credential_url="https://www.credly.com/badges/6a02c3b6-6d11-4365-9cec-9196c55ad759/linked_in_profile",
         category="Security"),
], lambda r, o: models.Certificate(display_order=o, **r))

# -- Achievements --------------------------------------------------------------
# The LinkedIn "Honors & awards" section is empty. This single entry is the
# promotion announced on the profile itself.
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
seed(models.Project, [
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
         demo_url="https://venkataraman-portfolio.netlify.app/", is_featured=False),
], lambda r, o: models.Project(long_description=None, thumbnail_url=None,
                               appstore_url=None, display_order=o, **r))

db.commit()
db.close()
print("Seed complete" + (" (replaced)" if REPLACE else ""))
