import urllib.request
import os

project_dir = os.path.dirname(os.path.abspath(__file__))
public_dir = os.path.join(project_dir, "public")

deps = {
    "react.production.min.js": "https://unpkg.com/react@18.2.0/umd/react.production.min.js",
    "react-dom.production.min.js": "https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js",
    "babel.min.js": "https://unpkg.com/@babel/standalone/babel.min.js"
}

print("Starting download of CDN dependencies to make the application 100% offline-capable...")

for filename, url in deps.items():
    target_path = os.path.join(public_dir, filename)
    print(f"Downloading {url} -> {target_path}...")
    try:
        # Use a user-agent to avoid blocking by some CDNs
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req) as response:
            with open(target_path, "wb") as f:
                f.write(response.read())
        print(f"Successfully downloaded {filename} ({os.path.getsize(target_path)} bytes)")
    except Exception as e:
        print(f"Error downloading {filename}: {e}")

print("Done downloading dependencies!")
