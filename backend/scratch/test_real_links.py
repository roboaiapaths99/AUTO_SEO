
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.core.api_clients import GoogleSearchClient
from app.core.config import settings

async def test_search():
    domain = "asbcrystal.in"
    print(f"Searching for real links to {domain}...")
    
    # Try searching for the domain to find mentions
    results = await GoogleSearchClient.search(f'"{domain}" -site:{domain}')
    
    if results["success"]:
        print(f"Found {len(results['results'])} real mentions:")
        for r in results["results"]:
            print(f"- {r['url']} (Title: {r['title']})")
    else:
        print(f"Search failed: {results.get('error')}")

if __name__ == "__main__":
    asyncio.run(test_search())
