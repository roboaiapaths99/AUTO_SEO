"""
AutoSEO AI Platform — Backend Entry Point
==========================================
Initializes FastAPI app, configures middleware, and sets up lifecycle hooks.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import connect_to_mongodb, close_mongodb_connection, create_indexes
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events for FastAPI app."""
    # ── Startup ──────────────────────────────────────────
    await connect_to_mongodb()
    await create_indexes()
    yield
    # ── Shutdown ─────────────────────────────────────────
    await close_mongodb_connection()


app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    lifespan=lifespan,
    debug=settings.DEBUG,
)

# ── CORS Middleware ──────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ───────────────────────────────────────────────
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "app": settings.APP_NAME,
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs"
    }
