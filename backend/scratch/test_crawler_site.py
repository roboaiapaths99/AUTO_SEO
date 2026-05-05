
import httpx
import asyncio

async def test_url():
    url = "https://asbcrystal.in"
    print(f"Testing {url}...")
    try:
        async with httpx.AsyncClient(follow_redirects=True, verify=False) as client:
            resp = await client.get(url, timeout=10)
            print(f"Status: {resp.status_code}")
            print(f"Final URL: {resp.url}")
            print(f"Content-Type: {resp.headers.get('content-type')}")
            print(f"HTML Length: {len(resp.text)}")
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(resp.text, "lxml")
            links = soup.find_all("a", href=True)
            print(f"Links found: {len(links)}")
            for l in links[:5]:
                print(f" - {l['href']}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_url())
