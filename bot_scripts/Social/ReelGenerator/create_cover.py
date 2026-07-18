import sys
import os
import html
import random
from playwright.sync_api import sync_playwright
from PIL import Image

BG_PALETTES = [
    # (top/bg, bottom, accent)
    ("#0A1128", "#1a0a2e", "#00b4ff"),
    ("#0d1b2a", "#1b2838", "#415a77"),
    ("#1a0a2e", "#16213e", "#e94560"),
    ("#0f0c29", "#302b63", "#24243e"),
    ("#000428", "#004e92", "#00b4ff"),
    ("#1a1a2e", "#16213e", "#0f3460"),
    ("#0b0c10", "#1f2833", "#45a29e"),
    ("#2c0e37", "#0f0c29", "#e94560"),
    ("#0a0a23", "#1a1a3e", "#ff6b6b"),
    ("#111827", "#1e293b", "#38bdf8"),
    ("#0f172a", "#1e293b", "#8b5cf6"),
    ("#020024", "#090979", "#00d4ff"),
]

def generate_cover_with_playwright(cover_title, output_path="assets/cover.png"):
    logo_abs_path = os.path.abspath("assets/logo.png").replace("\\", "/")
    title_html = html.escape(cover_title).replace("\n", "<br>")

    palette = random.choice(BG_PALETTES)
    bg_top, bg_bottom, accent = palette

    logo_top = random.choice([280, 300, 320, 350])
    title_size = random.choice([90, 95, 100, 105, 110])
    shadow_offset = random.choice([6, 7, 8])
    accent_opacity = random.uniform(0.03, 0.08)

    html_content = f"""
    <html>
    <head>
    <style>
        body {{
            margin: 0;
            padding: 0;
            width: 1080px;
            height: 1920px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: 'Segoe UI', Arial, sans-serif;
            overflow: hidden;
        }}
        .bg {{
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(180deg, {bg_top} 0%, {bg_bottom} 100%);
        }}
        .accent-glow {{
            position: absolute;
            top: {random.randint(200, 400)}px;
            {random.choice(['left', 'right'])}: {random.randint(-100, 100)}px;
            width: {random.randint(400, 700)}px;
            height: {random.randint(400, 700)}px;
            background: radial-gradient(circle, {accent} {int(accent_opacity*100)}%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
        }}
        .accent-glow-2 {{
            position: absolute;
            bottom: {random.randint(100, 300)}px;
            {random.choice(['left', 'right'])}: {random.randint(-50, 200)}px;
            width: {random.randint(300, 500)}px;
            height: {random.randint(300, 500)}px;
            background: radial-gradient(circle, {accent} {int(accent_opacity*50)}%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
        }}
        .logo {{
            position: absolute;
            top: {logo_top}px;
            width: 400px;
            height: auto;
            object-fit: contain;
            opacity: {random.uniform(0.7, 1.0):.1f};
        }}
        .title {{
            color: white;
            font-size: {title_size}px;
            font-weight: 900;
            text-align: center;
            text-shadow: {shadow_offset}px {shadow_offset}px 0px rgba(0,0,0,0.8);
            line-height: 1.2;
            z-index: 10;
            padding: 0 50px;
            margin-top: {random.randint(-30, 30)}px;
        }}
    </style>
    </head>
    <body>
        <div class="bg"></div>
        <div class="accent-glow"></div>
        <div class="accent-glow-2"></div>
        <img src="file:///{logo_abs_path}" class="logo" onerror="this.style.display='none'">
        <div class="title">{title_html}</div>
    </body>
    </html>
    """
    
    html_path = os.path.abspath("temp_cover.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
        
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1080, "height": 1920})
        page.goto(f"file:///{html_path.replace(chr(92), '/')}")
        page.wait_for_timeout(500)
        page.screenshot(path=output_path)
        browser.close()

    jpeg_path = os.path.splitext(output_path)[0] + ".jpg"
    with Image.open(output_path) as cover:
        cover.convert("RGB").save(jpeg_path, "JPEG", quality=94, optimize=True)
        
    try:
        os.remove(html_path)
    except:
        pass
    print(f"[+] Copertina: \"{cover_title}\" generata in PNG e JPEG: {jpeg_path}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        generate_cover_with_playwright(sys.argv[1])
    else:
        generate_cover_with_playwright("NEATX\nAPP PRENOTAZIONI")
