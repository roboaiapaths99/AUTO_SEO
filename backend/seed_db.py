"""
AutoSEO AI Platform — Database Seeding Utility
================================================
Helper script to initialize the database and seed initial data.
"""

import asyncio
import sys
import os

# Add parent directory to sys.path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import connect_to_mongodb, close_mongodb_connection, get_database, create_indexes
from app.core.security import hash_password
from datetime import datetime, timezone


async def seed():
    print("🚀 Starting database seeding...", flush=True)
    
    try:
        await connect_to_mongodb()
        print("✅ Connected to MongoDB", flush=True)
        
        await create_indexes()
        print("✅ Created indexes", flush=True)
        
        db = get_database()
        
        # ── Seed Default User ────────────────────────────────
        admin_email = "admin@autoseo.ai"
        existing_user = await db.users.find_one({"email": admin_email})
        
        if not existing_user:
            admin_user = {
                "email": admin_email,
                "full_name": "System Admin",
                "hashed_password": hash_password("admin123"),
                "is_active": True,
                "plan": "enterprise",
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            await db.users.insert_one(admin_user)
            print(f"✅ Created default admin: {admin_email} / admin123", flush=True)
        else:
            print(f"ℹ️ Admin user already exists: {admin_email}", flush=True)
            
        print("✨ Database seeding complete!", flush=True)
    except Exception as e:
        print(f"❌ Error during seeding: {e}", flush=True)
        import traceback
        traceback.print_exc()
    finally:
        await close_mongodb_connection()


if __name__ == "__main__":
    asyncio.run(seed())
