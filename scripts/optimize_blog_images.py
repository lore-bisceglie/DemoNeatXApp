"""Convert images in public/blog to optimized WebP files.

Usage:
    python scripts/optimize_blog_images.py
    python scripts/optimize_blog_images.py --quality 80 --max-width 1600
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageOps


PROJECT_ROOT = Path(__file__).resolve().parents[1]
BLOG_DIR = PROJECT_ROOT / "public" / "blog"
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def optimize_image(source: Path, quality: int, max_width: int) -> tuple[Path, int, int]:
    destination = source.with_suffix(".webp")
    original_size = source.stat().st_size

    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image)
        if image.width > max_width:
            height = round(image.height * max_width / image.width)
            image = image.resize((max_width, height), Image.Resampling.LANCZOS)

        if image.mode not in {"RGB", "RGBA"}:
            image = image.convert("RGBA" if "transparency" in image.info else "RGB")

        image.save(
            destination,
            format="WEBP",
            quality=quality,
            method=6,
            optimize=True,
        )

    return destination, original_size, destination.stat().st_size


def main() -> None:
    parser = argparse.ArgumentParser(description="Optimize NeatX blog images as WebP")
    parser.add_argument("--quality", type=int, default=82, choices=range(1, 101))
    parser.add_argument("--max-width", type=int, default=1600)
    args = parser.parse_args()

    sources = sorted(
        path for path in BLOG_DIR.rglob("*")
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
    )
    if not sources:
        print("No blog images found.")
        return

    total_before = 0
    total_after = 0
    for source in sources:
        destination, before, after = optimize_image(source, args.quality, args.max_width)
        total_before += before
        total_after += after
        saving = 100 * (1 - after / before)
        print(f"{source.name} -> {destination.name}: {saving:.1f}% smaller")

    total_saving = 100 * (1 - total_after / total_before)
    print(f"Total: {total_before:,} -> {total_after:,} bytes ({total_saving:.1f}% smaller)")


if __name__ == "__main__":
    main()
