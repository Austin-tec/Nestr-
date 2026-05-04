"""
Resize/compress static marketing images under NESTR PROJECTS (not user uploads).

Run from project root:
  python scripts/optimize_static_images.py

Requires Pillow. Skips the `nestr images` folder (listing uploads).
"""
from __future__ import annotations

import os
import sys

from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND = os.path.join(ROOT, "NESTR PROJECTS")
SKIP_DIRS = {"nestr images"}
MAX_SIDE = 1400
JPEG_QUALITY = 85


def main() -> None:
	if not os.path.isdir(FRONTEND):
		print("NESTR PROJECTS not found:", FRONTEND)
		sys.exit(1)
	total_saved = 0
	for dirpath, dirnames, filenames in os.walk(FRONTEND):
		dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
		for name in filenames:
			low = name.lower()
			if low.endswith((".png", ".jpg", ".jpeg")):
				path = os.path.join(dirpath, name)
				try:
					saved = _optimize_one(path)
					total_saved += saved
					if saved > 0:
						print(f"Optimized: {path} (saved ~{saved // 1024} KB)")
				except Exception as ex:
					print(f"Skip {path}: {ex}")
	print(f"Done. Approx total bytes saved: {total_saved}")


def _optimize_one(path: str) -> int:
	old_size = os.path.getsize(path)
	img = Image.open(path)
	img = ImageOps.exif_transpose(img)
	img.thumbnail((MAX_SIDE, MAX_SIDE), Image.Resampling.LANCZOS)
	if path.lower().endswith(".png"):
		img.save(path, "PNG", optimize=True, compress_level=9)
	else:
		rgb = img.convert("RGB") if img.mode not in ("RGB", "L") else img
		rgb.save(path, "JPEG", quality=JPEG_QUALITY, optimize=True)
	new_size = os.path.getsize(path)
	return max(0, old_size - new_size)


if __name__ == "__main__":
	main()
