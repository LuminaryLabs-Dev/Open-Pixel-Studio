#!/usr/bin/env python3
"""Restore unchanged large assets committed as .xz; SHA-256 checked."""
from __future__ import annotations
import hashlib
import json
import lzma
import os
from pathlib import Path
import tempfile

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "tools" / "large-assets.json"


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def restore_all() -> None:
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    for item in data["files"]:
        target = ROOT / item["path"]
        src = ROOT / item["compressed_path"]
        if not src.is_file() or sha256(src) != item["compressed_sha256"]:
            raise RuntimeError(f"Compressed asset missing or corrupt: {src}")
        if target.exists():
            if target.stat().st_size == item["bytes"] and sha256(target) == item["sha256"]:
                print(f"Already restored: {item['path']}")
                continue
            raise RuntimeError(f"Refusing to overwrite unexpected file: {target}")
        target.parent.mkdir(parents=True, exist_ok=True)
        tmp_name = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, dir=target.parent) as dst:
                tmp_name = dst.name
                with lzma.open(src, "rb") as original:
                    for chunk in iter(lambda: original.read(1024 * 1024), b""):
                        dst.write(chunk)
            tmp = Path(tmp_name)
            if tmp.stat().st_size != item["bytes"] or sha256(tmp) != item["sha256"]:
                raise RuntimeError(f"Restored asset hash mismatch: {target}")
            os.replace(tmp, target)
            print(f"Restored: {item['path']}")
        finally:
            if tmp_name and os.path.exists(tmp_name):
                os.unlink(tmp_name)


if __name__ == "__main__":
    restore_all()
