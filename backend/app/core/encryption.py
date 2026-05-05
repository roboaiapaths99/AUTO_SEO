"""
AutoSEO AI Platform — Symmetric Encryption Utilities
======================================================
Provides encryption and decryption for sensitive configuration data 
(e.g., CMS API keys) using Fernet (AES-128 in CBC mode with HMAC).
"""

from cryptography.fernet import Fernet
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Initialize Fernet with the encryption key from settings
# Ensure the key is base64 encoded and 32 bytes
try:
    cipher_suite = Fernet(settings.ENCRYPTION_KEY.encode())
except Exception as e:
    logger.error(f"Failed to initialize encryption suite: {e}")
    # In production, this should probably fail hard
    cipher_suite = None


def encrypt_value(value: str) -> str:
    """
    Encrypt a string value.
    
    Args:
        value: The plain text string to encrypt
        
    Returns:
        Encrypted string (base64 encoded)
    """
    if not value:
        return ""
    if not cipher_suite:
        logger.warning("Encryption suite not initialized, returning plain value (UNSAFE!)")
        return value
        
    encrypted_text = cipher_suite.encrypt(value.encode())
    return encrypted_text.decode()


def decrypt_value(encrypted_value: str) -> str:
    """
    Decrypt an encrypted string value.
    
    Args:
        encrypted_value: The base64 encoded encrypted string
        
    Returns:
        Decrypted plain text string
    """
    if not encrypted_value:
        return ""
    if not cipher_suite:
        logger.warning("Encryption suite not initialized, returning original value")
        return encrypted_value
        
    try:
        decrypted_text = cipher_suite.decrypt(encrypted_value.encode())
        return decrypted_text.decode()
    except Exception as e:
        logger.error(f"Decryption failed: {e}")
        return ""
