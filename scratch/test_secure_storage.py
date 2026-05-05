import asyncio
import sys
import os

# Add backend to path so we can import app
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.database import connect_to_mongodb, close_mongodb_connection, get_database
from app.services.integration_service import IntegrationService
from app.models.integration import IntegrationCreate, IntegrationType
from app.core.encryption import encrypt_value, decrypt_value
from bson import ObjectId

async def test_secure_storage():
    print("Starting secure storage test...")
    
    # 1. Connect to MongoDB
    await connect_to_mongodb()
    db = get_database()
    
    # 2. Prepare test data
    project_id = ObjectId()
    test_config = {
        "url": "https://example.com",
        "api_key": "secret-api-key-123",
        "password": "super-secure-password",
        "token": "sensitive-token-abc"
    }
    
    integration_in = IntegrationCreate(
        project_id=project_id,
        type=IntegrationType.WORDPRESS,
        config=test_config
    )
    
    print(f"Creating integration for project {project_id}...")
    
    # 3. Create integration (should encrypt)
    created = await IntegrationService.create_integration(integration_in)
    print("Integration created successfully.")
    
    # 4. Verify in-memory (Fetch back to check decryption)
    print("\nFetching back from service...")
    fetched = await IntegrationService.get_integration_by_type(str(project_id), IntegrationType.WORDPRESS)
    
    print("\nChecking decrypted values (from Service):")
    print(f"API Key: {fetched.config.get('api_key')}")
    print(f"Password: {fetched.config.get('password')}")
    print(f"Token: {fetched.config.get('token')}")
    
    # 5. Verify in database (should be encrypted)
    raw_doc = await db.integrations.find_one({"_id": fetched.id})
    print("\nChecking raw values in MongoDB:")
    raw_config = raw_doc.get("config", {})
    print(f"Raw API Key: {raw_config.get('api_key')}")
    print(f"Raw Password: {raw_config.get('password')}")
    print(f"Raw Token: {raw_config.get('token')}")
    
    # 6. Cleanup
    await db.integrations.delete_one({"_id": created.id})
    print("\nCleanup: Test integration deleted.")
    
    await close_mongodb_connection()
    print("Test completed.")

if __name__ == "__main__":
    asyncio.run(test_secure_storage())
