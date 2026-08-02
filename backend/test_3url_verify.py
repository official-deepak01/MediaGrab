import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

API_BASE = "http://localhost:5000"

TEST_URLS = [
    ("YouTube Rick Astley", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    ("YouTube Baby Shark",  "https://www.youtube.com/watch?v=XqZsoesa55w"),
    ("Vimeo Sample Video",  "https://vimeo.com/76979871"),
]

print("=" * 70)
print("  MediaGrab -- 3-URL Unique Metadata Verification Test")
print("=" * 70)

results = []
for label, url in TEST_URLS:
    print(f"\nTesting: {label}")
    print(f"  URL: {url}")
    try:
        body = json.dumps({"url": url}).encode()
        req = urllib.request.Request(
            f"{API_BASE}/api/video-info",
            data=body,
            headers={"Content-Type": "application/json"}
        )
        res = urllib.request.urlopen(req, timeout=15)
        data = json.loads(res.read().decode())
        title     = data["data"]["title"]
        thumbnail = data["data"]["thumbnail"]
        platform  = data["data"]["platform"]
        author    = data["data"]["author"]
        print(f"  OK Title    : {title}")
        print(f"  Thumbnail   : {thumbnail}")
        print(f"  Platform    : {platform}")
        print(f"  Author      : {author}")
        results.append({"label": label, "url": url, "title": title})
    except Exception as e:
        print(f"  FAILED: {e}")
        results.append({"label": label, "url": url, "title": f"ERROR: {e}"})

print("\n" + "=" * 70)
print("  UNIQUENESS CHECK -- All titles must be different")
print("=" * 70)
titles = [r["title"] for r in results]
unique_titles = set(titles)
if len(unique_titles) == len(titles):
    print(f"  PASSED -- All {len(titles)} URLs returned unique titles:")
    for r in results:
        print(f"    [{r['label']}] -> {r['title']}")
else:
    print(f"  FAILED -- Duplicate titles detected!")
    for r in results:
        print(f"    [{r['label']}] -> {r['title']}")
print("=" * 70)
