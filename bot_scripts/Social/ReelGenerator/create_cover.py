import sys
import os
from playwright.sync_api import sync_playwright

def generate_cover_with_playwright(cover_title, output_path="assets/cover.png"):
    logo_abs_path = os.path.abspath("assets/logo.png").replace("\\", "/")
    
    html_content = f"""
    <html>
    <head>
    <style>
        body {{
            margin: 0;
            padding: 0;
            width: 1080px;
            height: 1920px;
            background-color: #0A1128;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: 'Segoe UI', Arial, sans-serif;
            overflow: hidden;
        }}
        .logo {{
            position: absolute;
            top: 300px;
            width: 400px;
            height: auto;
            object-fit: contain;
        }}
        .title {{
            color: white;
            font-size: 100px;
            font-weight: 900;
            text-align: center;
            text-shadow: 8px 8px 0px rgba(0,0,0,0.8);
            line-height: 1.2;
            z-index: 10;
            padding: 0 50px;
        }}
    </style>
    </head>
    <body>
        <img src="file:///{logo_abs_path}" class="logo" onerror="this.style.display='none'">
        <div class="title">{cover_title.replace('\\n', '<br>').replace(chr(10), '<br>')}</div>
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
        # Wait a moment for the image to load
        page.wait_for_timeout(500)
        page.screenshot(path=output_path)
        browser.close()
        
    try:
        os.remove(html_path)
    except:
        pass
    print(f"[+] Copertina grafica generata (Playwright): {output_path}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        generate_cover_with_playwright(sys.argv[1])
    else:
        generate_cover_with_playwright("NEATX<br>APP PRENOTAZIONI")
