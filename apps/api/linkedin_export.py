"""
Read a LinkedIn "Basic Data Export" into the shapes seed.py stores.

The CSVs under data/linkedin/ are a trimmed copy of the official export
downloaded on 2026-10-05. Only the sections the portfolio renders are kept:
Profile, Positions, Education, Skills, Certifications and the primary email.
The export's other files (ad targeting, phone numbers, job applications,
identity documents, saved jobs) are deliberately not in the repo.

Profile.csv is additionally stripped of Address, Birth Date and Zip Code.

Nothing here invents content. Fields the export leaves blank come back as
None, and the only values not traceable to a CSV row are the curation tables
below (skill category/colour/featured flags), which LinkedIn does not export.
"""
import csv
import os
from datetime import datetime

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "linkedin")

MONTHS = {m: i for i, m in enumerate(
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
     "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], start=1)}


def _rows(filename):
    path = os.path.join(DATA_DIR, filename)
    with open(path, newline="", encoding="utf-8-sig") as handle:
        return [
            {k: (v.strip() if isinstance(v, str) else v) for k, v in row.items()}
            for row in csv.DictReader(handle)
        ]


def _clean(value):
    """Collapse the export's blank cells to None."""
    return value or None


def month_key(value):
    """'Sep 2026' -> 202609, for newest-first sorting. Blank sorts last."""
    if not value:
        return 0
    parts = value.split()
    if len(parts) == 2 and parts[0] in MONTHS:
        return int(parts[1]) * 100 + MONTHS[parts[0]]
    if len(parts) == 1 and parts[0].isdigit():
        return int(parts[0]) * 100
    return 0


# ── Skills ────────────────────────────────────────────────────────────────────
# The export lists 100 skills, because LinkedIn also files course objectives
# ("Onboard Oracle Database@AWS"), duplicates ("Rag", "Chatbots") and leftovers
# from unrelated interests under the same section. This table decides which of
# them the portfolio shows and which bucket each lands in; a skill absent from
# the table is skipped, and a change on LinkedIn shows up as a warning at seed
# time rather than silently appearing on the site.
CATEGORY_COLORS = {
    "AI / ML": "#a78bfa",
    "Cloud": "#34d399",
    "Engineering": "#38bdf8",
    "Security": "#fb7185",
    "Design & Media": "#fbbf24",
}

# name in the export -> (category, featured)
SKILL_MAP = {
    # AI / ML
    "Applied Machine Learning": ("AI / ML", True),
    "Generative AI": ("AI / ML", True),
    "Large Language Models (LLM)": ("AI / ML", True),
    "Retrieval-Augmented Generation (RAG)": ("AI / ML", True),
    "Large Language Model Operations (LLMOps)": ("AI / ML", False),
    "Pretraining Large Language Models": ("AI / ML", False),
    "Machine Learning": ("AI / ML", False),
    "Deep Learning": ("AI / ML", False),
    "Artificial Intelligence (AI)": ("AI / ML", False),
    "Data Science": ("AI / ML", True),
    "Model Optimization": ("AI / ML", False),
    "Transformers": ("AI / ML", False),
    "BERT (Language Model)": ("AI / ML", False),
    "AI Chatbots": ("AI / ML", False),
    "Core ML": ("AI / ML", False),
    # Cloud
    "Cloud Computing": ("Cloud", True),
    "Amazon Web Services (AWS)": ("Cloud", True),
    "Oracle Database": ("Cloud", True),
    "Multi-Cloud": ("Cloud", False),
    "Data Migration": ("Cloud", False),
    "Disaster Recovery": ("Cloud", False),
    "Resource Management": ("Cloud", False),
    # Engineering
    "Application Development": ("Engineering", True),
    "Python (Programming Language)": ("Engineering", True),
    "Full-Stack Development": ("Engineering", True),
    "React.js": ("Engineering", True),
    "Node.js": ("Engineering", False),
    "Express.js": ("Engineering", False),
    "Redux.js": ("Engineering", False),
    "SQL": ("Engineering", False),
    "Java": ("Engineering", False),
    "Flask": ("Engineering", False),
    "Ruby on Rails": ("Engineering", False),
    "Ruby": ("Engineering", False),
    "Pandas (Software)": ("Engineering", False),
    "Seaborn": ("Engineering", False),
    "Anaconda": ("Engineering", False),
    "Tkinter": ("Engineering", False),
    "Web Development": ("Engineering", False),
    "REST APIs": ("Engineering", False),
    "API Development": ("Engineering", False),
    "API Testing": ("Engineering", False),
    "Postman API": ("Engineering", False),
    "Data Analysis": ("Engineering", False),
    # Security
    "Cybersecurity": ("Security", False),
    "Network Security": ("Security", False),
    "Networking": ("Security", False),
    "Encryption": ("Security", False),
    # Design & media — the graphic design and audio roles below are real
    # positions on the profile, so the tooling behind them is kept.
    "Graphic Design": ("Design & Media", False),
    "Visual Design": ("Design & Media", False),
    "User Experience Design (UED)": ("Design & Media", False),
    "Adobe Photoshop": ("Design & Media", False),
    "Adobe Illustrator": ("Design & Media", False),
    "Adobe InDesign": ("Design & Media", False),
    "Adobe XD": ("Design & Media", False),
    "Adobe Premiere Pro": ("Design & Media", False),
    "After Effects": ("Design & Media", False),
    "Video Editing": ("Design & Media", False),
    "Music Composition": ("Design & Media", False),
    "Audio Mixing": ("Design & Media", False),
    "FL Studio": ("Design & Media", False),
    "Logic Pro": ("Design & Media", False),
}

# Export rows that are duplicates or wordings of a skill already in SKILL_MAP.
# Folded in so they neither duplicate a tile nor raise an unmapped warning.
SKILL_ALIASES = {
    "Rag": "Retrieval-Augmented Generation (RAG)",
    "Retrieval Augmented Generation (RAG)": "Retrieval-Augmented Generation (RAG)",
    "Chatbots": "AI Chatbots",
}

# Certification issuer/subject -> the portfolio's certificate categories.
CERT_CATEGORIES = {
    "Cybersecurity Essentials": "Security",
    "PCAP - Programming Essentials in Python": "Engineering",
    "Oracle Database@AWS Certified Architect Professional": "Cloud",
    "Oracle Cloud Infrastructure 2025 Certified Generative AI Professional": "AI / ML",
    "Oracle Cloud Infrastructure 2025 Certified Data Science Professional": "AI / ML",
    "Manage Kubernetes in Google Cloud Skill Badge": "Cloud",
    "Certificate of Completion: Al Fluency Framework & Foundations": "AI / ML",
}

# The export writes this title with a capital-i "Al" instead of "AI".
TITLE_FIXES = {
    "Certificate of Completion: Al Fluency Framework & Foundations":
        "Certificate of Completion: AI Fluency Framework & Foundations",
}

# The export abbreviates a few position fields. Expanded only where the fuller
# form is on the profile itself; no location is invented for a blank cell.
LOCATION_FIXES = {
    "Bengaluru": "Bengaluru, Karnataka, India",
    "Bangalore Urban": "Bangalore Urban, Karnataka, India",
    "Hyderabad": "Hyderabad, Telangana, India",
}


# The export writes one employer name in mixed case.
COMPANY_FIXES = {
    "Lumos chennai Institute of Technology": "Lumos Chennai Institute of Technology",
}


def profile():
    row = _rows("Profile.csv")[0]
    emails = _rows("Email Addresses.csv")
    primary = next(
        (e["Email Address"] for e in emails if e.get("Primary") == "Yes"),
        emails[0]["Email Address"] if emails else None,
    )
    return {
        "name": f"{row['First Name']} {row['Last Name']}".strip(),
        "tagline": _clean(row.get("Headline")),
        "bio": _clean(row.get("Summary")),
        "email": primary,
        "location": _clean(row.get("Geo Location")),
        "industry": _clean(row.get("Industry")),
    }


def positions():
    out = []
    for row in _rows("Positions.csv"):
        location = _clean(row.get("Location"))
        out.append({
            "company": COMPANY_FIXES.get(row["Company Name"], row["Company Name"]),
            "role": row["Title"],
            "description": _clean(row.get("Description")),
            "location": LOCATION_FIXES.get(location, location),
            "start_date": _clean(row.get("Started On")),
            "end_date": _clean(row.get("Finished On")),
            "is_current": not row.get("Finished On"),
        })
    out.sort(key=lambda p: month_key(p["start_date"]), reverse=True)
    return out


def education():
    out = []
    for row in _rows("Education.csv"):
        activities = _clean(row.get("Activities"))
        out.append({
            "institution": row["School Name"],
            "degree": row["Degree Name"],
            "start_date": _clean(row.get("Start Date")),
            "end_date": _clean(row.get("End Date")),
            "description": (
                f"Activities and societies: {activities}" if activities else None
            ),
            "notes": _clean(row.get("Notes")),
        })
    out.sort(key=lambda e: month_key(e["start_date"]), reverse=True)
    return out


def certifications():
    out = []
    for row in _rows("Certifications.csv"):
        name = row["Name"]
        out.append({
            "title": TITLE_FIXES.get(name, name),
            "issuer": row["Authority"],
            "issued_date": _clean(row.get("Started On")),
            "expiry_date": _clean(row.get("Finished On")),
            "credential_id": _clean(row.get("License Number")),
            "credential_url": _clean(row.get("Url")),
            "category": CERT_CATEGORIES.get(name),
        })
    out.sort(key=lambda c: month_key(c["issued_date"]), reverse=True)
    return out


def skills():
    """Curated, de-duplicated skills in SKILL_MAP order, plus what was skipped."""
    exported = []
    seen = set()
    for row in _rows("Skills.csv"):
        name = SKILL_ALIASES.get(row["Name"], row["Name"])
        if name not in seen:
            seen.add(name)
            exported.append(name)

    order = list(SKILL_MAP)
    kept = sorted(
        (n for n in exported if n in SKILL_MAP),
        key=lambda n: order.index(n),
    )
    unmapped = [n for n in exported if n not in SKILL_MAP]
    missing = [n for n in SKILL_MAP if n not in exported]

    rows = [{
        "name": name,
        "category": SKILL_MAP[name][0],
        "is_featured": SKILL_MAP[name][1],
        "color": CATEGORY_COLORS[SKILL_MAP[name][0]],
    } for name in kept]
    return rows, unmapped, missing


def counts():
    """Headline numbers derived from the export, not typed in by hand."""
    roles = positions()
    earliest = min(month_key(p["start_date"]) for p in roles if p["start_date"])
    years = max(1, datetime.now().year - earliest // 100)
    return {
        "certifications": len(certifications()),
        "roles": len(roles),
        "skills": len(skills()[0]),
        "years_in_tech": years,
    }
