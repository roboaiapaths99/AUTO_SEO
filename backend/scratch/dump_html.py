
import httpx
import asyncio

async def dump_html():
    url = "https://asbcrystal.in"
    async with httpx.AsyncClient(follow_redirects=True, verify=False) as client:
        resp = await client.get(url, timeout=10)
        with open("backend/scratch/asbcrystal_html.txt", "w", encoding="utf-8") as f:
            f.write(resp.text)
        print("HTML dumped to backend/scratch/asbcrystal_html.txt")

if __name__ == "__main__":
    asyncio.run(dump_html())
