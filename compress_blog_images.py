import os
from PIL import Image

blog_dir = r"public/blog"

for filename in os.listdir(blog_dir):
    if filename.endswith(".jpg") or filename.endswith(".jpeg") or filename.endswith(".png"):
        img_path = os.path.join(blog_dir, filename)
        webp_path = os.path.join(blog_dir, os.path.splitext(filename)[0] + ".webp")
        
        try:
            with Image.open(img_path) as img:
                # Convert to RGB if needed (for PNGs with transparency, we keep RGBA)
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                # Save as WebP
                img.save(webp_path, "WEBP", quality=80)
                print(f"Converted {filename} to {os.path.basename(webp_path)}")
                
            # Remove original file
            os.remove(img_path)
            print(f"Removed original {filename}")
        except Exception as e:
            print(f"Error converting {filename}: {e}")
