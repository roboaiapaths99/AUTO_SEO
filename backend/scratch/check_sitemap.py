
import httpx
import asyncio

async def check_sitemap():
    url = "https://asbcrystal.in/sitemap.xml"
    print(f"Checking {url}...")
    try:
        async with httpx.AsyncClient(follow_redirects=True, verify=False) as client:
            resp = await client.get(url, timeout=10)
            print(f"Status: {resp.status_code}")
            if resp.status_code == 200:
                print(f"Content-Type: {resp.headers.get('content-type')}")
                print(f"Sitemap snippet: {resp.text[:500]}")
            else:
                print("Sitemap not found.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_sitemap())
