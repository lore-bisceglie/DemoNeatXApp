import html
import re
import sys
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright


BASE_DIR = Path(__file__).resolve().parent
ASSETS_DIR = BASE_DIR / "assets"
MASTER_BACKGROUND = ASSETS_DIR / "cover_templates" / "neatx_instagram_cover_master_v2.jpg"


def split_title(value: str, max_line_length: int = 17) -> str:
    """Create short, balanced lines that remain readable in Instagram's grid."""
    words = re.sub(r"\s+", " ", value.strip()).upper().split(" ")
    lines: list[str] = []
    current: list[str] = []

    for word in words:
        candidate = " ".join(current + [word])
        if current and len(candidate) > max_line_length:
            lines.append(" ".join(current))
            current = [word]
        else:
            current.append(word)

    if current:
        lines.append(" ".join(current))
    if len(lines) > 3:
        lines = [lines[0], lines[1], " ".join(lines[2:])]

    return "<br>".join(html.escape(line) for line in lines)


def generate_cover_with_playwright(cover_title: str, output_path: str = "assets/cover.png"):
    output = Path(output_path)
    if not output.is_absolute():
        output = BASE_DIR / output
    output.parent.mkdir(parents=True, exist_ok=True)

    title_html = split_title(cover_title)
    background_url = MASTER_BACKGROUND.as_uri() if MASTER_BACKGROUND.exists() else ""
    background_css = (
        f"url('{background_url}') center center / cover no-repeat"
        if background_url
        else "linear-gradient(145deg, #020617 0%, #071a36 48%, #020617 100%)"
    )

    html_content = f"""
    <!doctype html>
    <html lang="it">
    <head>
      <meta charset="utf-8">
      <style>
        * {{ box-sizing: border-box; }}
        html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; }}
        body {{ font-family: "Segoe UI", Arial, sans-serif; color: #fff; background: #020617; }}
        .background {{ position: absolute; inset: 0; background: {background_css}; transform: scale(1.025); }}
        .scrim {{
          position: absolute; inset: 0;
          background:
            radial-gradient(circle at 50% 52%, rgba(2, 6, 23, .20) 0%, rgba(2, 6, 23, .72) 45%, rgba(2, 6, 23, .92) 100%),
            linear-gradient(180deg, rgba(2, 6, 23, .36) 0%, rgba(2, 6, 23, .42) 28%, rgba(2, 6, 23, .82) 72%, rgba(2, 6, 23, .94) 100%);
        }}
        .frame {{
          position: absolute; inset: 54px; border: 2px solid rgba(125, 211, 252, .34);
          border-radius: 42px; box-shadow: inset 0 0 55px rgba(14, 165, 233, .10), 0 0 50px rgba(14, 165, 233, .12);
        }}
        .brand {{
          position: absolute; top: 155px; left: 50%; transform: translateX(-50%);
          font-size: 88px; font-weight: 300; letter-spacing: -5px; text-shadow: 0 8px 30px rgba(0, 0, 0, .78);
        }}
        .brand strong {{ color: #11bff5; font-weight: 500; }}
        .kicker {{
          position: absolute; top: 276px; left: 50%; transform: translateX(-50%);
          padding: 15px 30px; border-radius: 999px; border: 1px solid rgba(125, 211, 252, .48);
          background: rgba(2, 6, 23, .62); font-size: 25px; font-weight: 800; letter-spacing: 4px; white-space: nowrap;
        }}
        .title-card {{
          position: absolute; top: 575px; left: 95px; right: 95px; min-height: 650px; padding: 70px 46px;
          display: flex; flex-direction: column; justify-content: center; align-items: center;
          background: linear-gradient(145deg, rgba(2, 6, 23, .84), rgba(7, 24, 49, .70));
          border: 2px solid rgba(56, 189, 248, .52); border-radius: 56px;
          box-shadow: 0 32px 100px rgba(0, 0, 0, .58), inset 0 0 65px rgba(14, 165, 233, .10);
          backdrop-filter: blur(14px);
        }}
        .eyebrow {{ margin-bottom: 30px; color: #7dd3fc; font-size: 29px; font-weight: 900; letter-spacing: 5px; }}
        .title {{
          font-size: 116px; line-height: .96; font-weight: 950; letter-spacing: -4px;
          text-align: center; text-transform: uppercase;
          text-shadow: 0 9px 0 rgba(0, 0, 0, .52), 0 0 42px rgba(14, 165, 233, .25);
        }}
        .accent {{
          width: 175px; height: 8px; margin-top: 42px; border-radius: 99px;
          background: linear-gradient(90deg, #22d3ee, #3b82f6, #d946ef); box-shadow: 0 0 28px rgba(34, 211, 238, .72);
        }}
        .footer {{
          position: absolute; left: 92px; right: 92px; bottom: 188px;
          display: flex; justify-content: space-between; align-items: center;
          font-size: 26px; font-weight: 800; letter-spacing: 2px; text-shadow: 0 5px 18px rgba(0, 0, 0, .9);
        }}
        .site {{ color: #7dd3fc; font-size: 31px; }}
      </style>
    </head>
    <body>
      <div class="background"></div><div class="scrim"></div><div class="frame"></div>
      <div class="brand">Neat<strong>X</strong></div>
      <div class="kicker">AGENDA SMART PER PROFESSIONISTI</div>
      <main class="title-card">
        <div class="eyebrow">IL TUO BUSINESS, PIÙ LIBERO</div>
        <div class="title">{title_html}</div>
        <div class="accent"></div>
      </main>
      <footer class="footer"><span>PRENOTA • GESTISCI • CRESCI</span><span class="site">neatx.store</span></footer>
    </body>
    </html>
    """

    html_path = BASE_DIR / "temp_cover.html"
    html_path.write_text(html_content, encoding="utf-8")
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1080, "height": 1920})
            page.goto(html_path.as_uri())
            page.wait_for_timeout(800)
            page.screenshot(path=str(output))
            browser.close()

        jpeg_path = output.with_suffix(".jpg")
        with Image.open(output) as cover:
            cover.convert("RGB").save(jpeg_path, "JPEG", quality=94, optimize=True, progressive=True)
    finally:
        html_path.unlink(missing_ok=True)

    print(f'[+] Copertina Instagram pronta: "{cover_title}" ({output.name} + {jpeg_path.name})')


if __name__ == "__main__":
    generate_cover_with_playwright(sys.argv[1] if len(sys.argv) > 1 else "PRENOTAZIONI SENZA STRESS")
