# Venkataraman TB — Portfolio Setup Guide

## Architecture

```
monorepo/
├── apps/
│   ├── portfolio/   ← Main Svelte+GSAP+Three.js site  → Vercel
│   ├── admin/       ← Admin control panel (SvelteKit)  → Vercel
│   └── api/         ← FastAPI backend                  → Render
```

---

## 1. Neon DB Setup

1. Create a free project at https://neon.tech
2. Copy the **Connection string** (starts with `postgresql://...`)
3. Add `?sslmode=require` to the end if not already present

---

## 2. FastAPI Backend (`apps/api`)

```bash
cd apps/api
cp .env.example .env
# Edit .env — fill in DATABASE_URL, SECRET_KEY, ADMIN_PASSWORD
python -m venv .venv
.venv\Scripts\activate       # Windows
pip install -r requirements.txt
python seed.py               # Populates DB with initial data
uvicorn main:app --reload    # Runs on http://localhost:8000
```

**Deploy to Render:**
- New Web Service → connect this repo → Root dir: `apps/api`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Add all env vars from `.env.example`

---

## 3. Portfolio Frontend (`apps/portfolio`)

```bash
cd apps/portfolio
cp .env.example .env.local
# Edit: PUBLIC_API_URL=https://your-api.onrender.com
npm install
npm run dev   # http://localhost:5173
```

**Deploy to Vercel:**
- Import `apps/portfolio` as root directory
- Add env var: `PUBLIC_API_URL=https://your-api.onrender.com`

---

## 4. Admin Panel (`apps/admin`)

```bash
cd apps/admin
cp .env.example .env.local
# Edit: PUBLIC_API_URL=https://your-api.onrender.com
npm install
npm run dev   # http://localhost:5174
```

**Default admin login:**
- Email: `venkataraman.tb@mythics.com`
- Password: set in `.env` → `ADMIN_PASSWORD`

**Deploy to Vercel:**
- Import `apps/admin` as a separate project
- Add env var: `PUBLIC_API_URL=https://your-api.onrender.com`

---

## 5. CORS Configuration

After deploying, update `ALLOWED_ORIGINS` in Render env vars:
```
https://your-portfolio.vercel.app,https://your-admin.vercel.app
```

---

## Adding New Content

All content is dynamic. To add a new certificate after getting certified:
1. Open your admin panel
2. Go to **Certificates** → **Add New**
3. Fill in title, issuer, credential URL
4. Hit **Create** → instantly live on your portfolio ✓

---

## LinkedIn
Profile: https://www.linkedin.com/in/venkataraman-tb-4859771ab/
