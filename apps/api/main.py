from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import engine, Base
from config import settings
from routers import auth, portfolio, crud


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Venkataraman Portfolio API",
    version="1.0.0",
    lifespan=lifespan,
)

_origins = settings.origins
_wildcard = _origins == ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=not _wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
    # covers *.vercel.app preview deployments automatically
    allow_origin_regex=r"https://[\w-]+\.vercel\.app" if not _wildcard else None,
)

app.include_router(auth.router)
app.include_router(portfolio.router)
app.include_router(crud.router)


@app.get("/health")
def health():
    return {"status": "ok"}
