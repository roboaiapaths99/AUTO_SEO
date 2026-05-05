import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

async def test_conn():
    uri = os.getenv("MONGODB_URL")
    print(f"Connecting to: {uri[:20]}...")
    client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
    try:
        await client.admin.command("ping")
        print("Ping successful!")
    except Exception as e:
        print(f"Ping failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_conn())
