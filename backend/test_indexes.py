import asyncio
from app.core.database import connect_to_mongodb, create_indexes, close_mongodb_connection
import os
from dotenv import load_dotenv

# Load env from the root of backend
load_dotenv(".env")

async def test_indexes():
    print("Connecting to MongoDB...")
    await connect_to_mongodb()
    print("Creating indexes...")
    try:
        await asyncio.wait_for(create_indexes(), timeout=10)
        print("Indexes created successfully!")
    except asyncio.TimeoutError:
        print("TIMED OUT creating indexes!")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await close_mongodb_connection()

if __name__ == "__main__":
    asyncio.run(test_indexes())
