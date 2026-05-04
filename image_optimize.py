"""Resize and compress uploaded property images (JPEG)."""
from __future__ import annotations

import os
import uuid
from typing import BinaryIO, Tuple

from PIL import Image, ImageOps


MAX_SIDE = 1920
JPEG_QUALITY = 82


def process_property_upload(file_stream: BinaryIO, original_name: str, dest_dir: str) -> Tuple[str, str]:
	"""
	Save an optimized JPEG under dest_dir. Returns (filename_on_disk, public_url_path_suffix).
	public_url_path_suffix is relative to static root: nestr images/<file>.jpg
	"""
	img = Image.open(file_stream)
	img = ImageOps.exif_transpose(img)
	if img.mode in ("RGBA", "P"):
		img = img.convert("RGB")
	elif img.mode != "RGB":
		img = img.convert("RGB")

	img.thumbnail((MAX_SIDE, MAX_SIDE), Image.Resampling.LANCZOS)

	base = uuid.uuid4().hex[:12]
	filename = f"{base}.jpg"
	os.makedirs(dest_dir, exist_ok=True)
	path = os.path.join(dest_dir, filename)
	i = 1
	while os.path.exists(path):
		filename = f"{base}-{i}.jpg"
		path = os.path.join(dest_dir, filename)
		i += 1

	img.save(path, "JPEG", quality=JPEG_QUALITY, optimize=True)
	return filename, f"nestr images/{filename}"
