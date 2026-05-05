"""
AutoSEO AI Platform — MongoDB Database Connection
====================================================
Async MongoDB connection using Motor driver.
Provides a singleton database client and helper to get the database instance.
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# ── Global MongoDB client ────────────────────────────────
_client: AsyncIOMotorClient | None = None
_database: AsyncIOMotorDatabase | None = None


async def connect_to_mongodb() -> None:
    """Initialize MongoDB connection. Called on app startup."""
    global _client, _database
    try:
        _client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            maxPoolSize=50,
            minPoolSize=10,
            serverSelectionTimeoutMS=5000,
        )
        _database = _client[settings.MONGODB_DB_NAME]

        # Verify connection
        await _client.admin.command("ping")
        logger.info(f"✅ Connected to MongoDB: {settings.MONGODB_DB_NAME}")
    except Exception as e:
        logger.error(f"❌ Failed to connect to MongoDB: {e}")
        raise


async def close_mongodb_connection() -> None:
    """Close MongoDB connection. Called on app shutdown."""
    global _client, _database
    if _client:
        _client.close()
        _client = None
        _database = None
        logger.info("🔌 MongoDB connection closed")


def get_database() -> AsyncIOMotorDatabase:
    """Get the active database instance."""
    if _database is None:
        raise RuntimeError("Database not initialized. Call connect_to_mongodb() first.")
    return _database


async def create_indexes() -> None:
    """Create database indexes for optimal query performance."""
    db = get_database()

    # Users collection indexes
    await db.users.create_index("email", unique=True)

    # Projects collection indexes
    await db.projects.create_index("user_id")
    await db.projects.create_index("domain")

    # Keywords collection indexes
    await db.keywords.create_index("project_id")
    await db.keywords.create_index([("project_id", 1), ("keyword", 1)])

    # Rankings collection indexes
    await db.rankings.create_index("project_id")
    await db.rankings.create_index([("project_id", 1), ("recorded_at", -1)])

    # Domains collection indexes
    await db.domains.create_index("domain", unique=True)

    # Audit reports indexes
    await db.audit_reports.create_index("project_id")

    # Backlinks indexes
    await db.backlinks.create_index("domain")

    # AI Visibility indexes
    await db.ai_visibility.create_index("project_id")

    # Audit pages indexes
    await db.audit_pages.create_index("url")
    await db.audit_pages.create_index([("url", 1), ("crawled_at", -1)])

    # AIO — AI Mentions and corrections indexes
    await db.ai_mentions.create_index("project_id")
    await db.ai_mentions.create_index([("project_id", 1), ("detected_at", -1)])
    await db.aio_corrections.create_index("project_id")
    await db.verified_brand_data.create_index("project_id", unique=True)

    # Integrations indexes
    await db.integrations.create_index([("project_id", 1), ("type", 1)], unique=True)

    # Strategies indexes
    await db.strategies.create_index("project_id")

    # Crawl jobs indexes
    await db.crawl_jobs.create_index("job_id", unique=True)
    await db.crawl_jobs.create_index([("project_id", 1), ("started_at", -1)])

    logger.info("📇 Database indexes created successfully")
