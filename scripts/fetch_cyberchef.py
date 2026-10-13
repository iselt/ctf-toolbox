#!/usr/bin/env python3
"""Download a pinned CyberChef release into public/cyberchef/ (fully offline afterwards).

Pure stdlib: works identically on macOS / Linux / Windows CI runners and dev machines.
"""
import hashlib
import io
import os
import shutil
import sys
import urllib.request
import zipfile

VERSION = "11.5.0"
ASSET = "CyberChef_8cd426dd4f40f1423912d5fad91b578a86a65112.zip"
SHA256 = "f6478925d3eaa16ec08626a85f5b85eed10d531a5e18700615fed7ecb024cccf"
URL = f"https://github.com/gchq/CyberChef/releases/download/v{VERSION}/{ASSET}"

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DST = os.path.join(ROOT, "public", "cyberchef")
STAMP = os.path.join(DST, f".stamp-v{VERSION}")


def main() -> int:
    if os.path.exists(STAMP) and os.path.exists(os.path.join(DST, "index.html")):
        print(f"[fetch-cyberchef] v{VERSION} already present, skipping.")
        return 0

    print(f"[fetch-cyberchef] downloading {URL}")
    req = urllib.request.Request(URL, headers={"User-Agent": "ctf-toolbox-build"})
    with urllib.request.urlopen(req) as resp:
        data = resp.read()

    digest = hashlib.sha256(data).hexdigest()
    if digest != SHA256:
        print(f"[fetch-cyberchef] SHA256 MISMATCH: got {digest}, want {SHA256}", file=sys.stderr)
        return 1
    print(f"[fetch-cyberchef] sha256 ok ({digest[:16]}...)")

    if os.path.exists(DST):
        shutil.rmtree(DST)
    os.makedirs(DST, exist_ok=True)

    with zipfile.ZipFile(io.BytesIO(data)) as zf:
        zf.extractall(DST)

    # v11+ ships the entry page as CyberChef_vX.Y.Z.html; normalize to index.html
    idx = os.path.join(DST, "index.html")
    if not os.path.exists(idx):
        import glob

        candidates = glob.glob(os.path.join(DST, "CyberChef_v*.html"))
        if not candidates:
            print("[fetch-cyberchef] no entry html found after extract", file=sys.stderr)
            return 1
        shutil.copyfile(candidates[0], idx)

    with open(STAMP, "w") as fh:
        fh.write(f"{VERSION} {SHA256}\n")

    total = sum(
        os.path.getsize(os.path.join(dirpath, f))
        for dirpath, _dirs, files in os.walk(DST)
        for f in files
    )
    print(f"[fetch-cyberchef] extracted v{VERSION} ({total / 1e6:.1f} MB) -> public/cyberchef")
    return 0


if __name__ == "__main__":
    sys.exit(main())
