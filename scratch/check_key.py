from cryptography.fernet import Fernet
import os
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("ENCRYPTION_KEY")
print(f"Key: {key}")
try:
    f = Fernet(key.encode())
    print("✅ Key is valid")
except Exception as e:
    print(f"❌ Key is invalid: {e}")
