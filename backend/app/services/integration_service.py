"""
AutoSEO AI Platform — Integration Service
===========================================
Handles management of project integrations (CMS, APIs) with secure credential storage.
"""

from datetime import datetime
from typing import List, Optional, Any, Dict
from bson import ObjectId
from app.core.database import get_database
from app.core.encryption import encrypt_value, decrypt_value
from app.models.integration import Integration, IntegrationCreate, IntegrationUpdate, IntegrationType
from app.core.api_clients import get_http_client
import logging
import httpx
import base64

logger = logging.getLogger(__name__)

# List of fields in the config dictionary that should be encrypted
SENSITIVE_FIELDS = ["api_key", "password", "token", "client_secret", "access_token", "refresh_token"]


class IntegrationService:
    @staticmethod
    def _process_config(config: Dict[str, Any], encrypt: bool = True) -> Dict[str, Any]:
        """
        Recursively process the config dictionary to encrypt or decrypt sensitive fields.
        """
        processed = config.copy()
        for key, value in processed.items():
            if isinstance(value, dict):
                processed[key] = IntegrationService._process_config(value, encrypt)
            elif key.lower() in SENSITIVE_FIELDS and isinstance(value, str):
                if encrypt:
                    processed[key] = encrypt_value(value)
                else:
                    processed[key] = decrypt_value(value)
        return processed

    @staticmethod
    async def create_integration(integration_in: IntegrationCreate) -> Integration:
        """
        Create a new integration for a project.
        """
        db = get_database()
        
        # Check if integration already exists
        existing = await db.integrations.find_one({
            "project_id": ObjectId(integration_in.project_id),
            "type": integration_in.type
        })
        
        if existing:
            # Update existing instead of creating new if it exists? 
            # Or raise error. Let's update for convenience.
            return await IntegrationService.update_integration(
                str(existing["_id"]), 
                IntegrationUpdate(config=integration_in.config, is_active=integration_in.is_active)
            )

        # Encrypt sensitive data
        encrypted_config = IntegrationService._process_config(integration_in.config, encrypt=True)
        
        integration_dict = integration_in.model_dump(by_alias=True)
        integration_dict["config"] = encrypted_config
        integration_dict["project_id"] = ObjectId(integration_in.project_id)
        integration_dict["created_at"] = datetime.utcnow()
        integration_dict["updated_at"] = datetime.utcnow()
        
        result = await db.integrations.insert_one(integration_dict)
        integration_dict["_id"] = result.inserted_id
        
        return Integration(**integration_dict)

    @staticmethod
    async def get_project_integrations(project_id: str) -> List[Integration]:
        """
        Get all integrations for a project.
        """
        db = get_database()
        cursor = db.integrations.find({"project_id": ObjectId(project_id)})
        integrations = []
        async for doc in cursor:
            # Decrypt sensitive data before returning to application logic
            # (Note: API endpoints might want to keep it encrypted or mask it)
            doc["config"] = IntegrationService._process_config(doc["config"], encrypt=False)
            integrations.append(Integration(**doc))
        return integrations

    @staticmethod
    async def get_integration_by_type(project_id: str, integration_type: str) -> Optional[Integration]:
        """
        Get a specific integration by type.
        """
        db = get_database()
        doc = await db.integrations.find_one({
            "project_id": ObjectId(project_id),
            "type": integration_type
        })
        if doc:
            doc["config"] = IntegrationService._process_config(doc["config"], encrypt=False)
            return Integration(**doc)
        return None

    @staticmethod
    async def update_integration(integration_id: str, integration_update: IntegrationUpdate) -> Optional[Integration]:
        """
        Update an existing integration.
        """
        db = get_database()
        update_data = integration_update.model_dump(exclude_unset=True)
        
        if "config" in update_data:
            update_data["config"] = IntegrationService._process_config(update_data["config"], encrypt=True)
            
        update_data["updated_at"] = datetime.utcnow()
        
        doc = await db.integrations.find_one_and_update(
            {"_id": ObjectId(integration_id)},
            {"$set": update_data},
            return_document=True
        )
        
        if doc:
            doc["config"] = IntegrationService._process_config(doc["config"], encrypt=False)
            return Integration(**doc)
        return None

    @staticmethod
    async def delete_integration(integration_id: str) -> bool:
        """
        Delete an integration.
        """
        db = get_database()
        result = await db.integrations.delete_one({"_id": ObjectId(integration_id)})
        return result.deleted_count > 0

    @staticmethod
    async def verify_integration(integration_type: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Verify credentials for a specific integration type.
        """
        client = await get_http_client()
        
        try:
            if integration_type == IntegrationType.WORDPRESS:
                url = config.get("url", "").rstrip("/")
                username = config.get("username")
                password = config.get("password")
                
                if not all([url, username, password]):
                    return {"success": False, "message": "Missing URL, username, or application password."}
                
                # WordPress Application Password uses Basic Auth
                auth = base64.b64encode(f"{username}:{password}".encode()).decode()
                headers = {"Authorization": f"Basic {auth}"}
                
                # Check /wp-json/wp/v2/users/me
                resp = await client.get(f"{url}/wp-json/wp/v2/users/me", headers=headers)
                if resp.status_code == 200:
                    user_data = resp.json()
                    return {
                        "success": True, 
                        "message": f"Connected as {user_data.get('name')}",
                        "details": {"wp_user": user_data.get("slug")}
                    }
                else:
                    return {"success": False, "message": f"WordPress Error: {resp.status_code} - {resp.text[:100]}"}

            elif integration_type == IntegrationType.SHOPIFY:
                url = config.get("url", "").rstrip("/")
                token = config.get("token")
                
                if not all([url, token]):
                    return {"success": False, "message": "Missing Shop URL or Access Token."}
                
                # Shopify Admin API token header
                headers = {"X-Shopify-Access-Token": token}
                
                # Check /admin/api/2023-10/shop.json
                # Note: URL should be the .myshopify.com domain
                api_url = f"{url}/admin/api/2023-10/shop.json"
                resp = await client.get(api_url, headers=headers)
                
                if resp.status_code == 200:
                    shop_data = resp.json().get("shop", {})
                    return {
                        "success": True, 
                        "message": f"Connected to {shop_data.get('name')}",
                        "details": {"shop_domain": shop_data.get("domain")}
                    }
                else:
                    return {"success": False, "message": f"Shopify Error: {resp.status_code} - {resp.text[:100]}"}

            elif integration_type == IntegrationType.GOOGLE_SEARCH_CONSOLE:
                # For GSC, we usually expect an OAuth token. 
                # If they provide a token directly (e.g. from a refresh token flow), we check it.
                # For now, let's assume we are checking if a site is accessible.
                return {"success": True, "message": "GSC integration ready for OAuth flow."}

            else:
                return {"success": False, "message": f"Unsupported integration type: {integration_type}"}
                
        except Exception as e:
            logger.error(f"Verification error for {integration_type}: {e}")
            return {"success": False, "message": str(e)}
