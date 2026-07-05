import asyncio
import json
import os
from pathlib import Path

from playwright.async_api import async_playwright

from tiktok_cookies import load_tiktok_cookies


ARTIFACT_DIR = Path("tiktok_health_artifacts")
SCREENSHOT_PATH = ARTIFACT_DIR / "tiktok_upload_check.png"


async def main():
    cookies = load_tiktok_cookies()
    if not cookies:
        print("[TikTok Health] TIKTOK_COOKIES_JSON/TIKTOK_SESSION_ID mancanti.")
        raise SystemExit(1)

    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-dev-shm-usage",
            ],
        )
        context = await browser.new_context(
            viewport={"width": 1440, "height": 1200},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            locale="it-IT",
        )
        await context.add_cookies(cookies)

        page = await context.new_page()
        await page.goto("https://www.tiktok.com/upload?lang=it", wait_until="domcontentloaded", timeout=60000)
        await page.wait_for_timeout(9000)
        await page.screenshot(path=str(SCREENSHOT_PATH), full_page=True)

        title = await page.title()
        current_url = page.url
        file_inputs = await page.locator("input[type='file']").count()
        body_text = (await page.locator("body").inner_text(timeout=10000)).lower()

        login_signals = ["log in", "login", "accedi", "sign up", "registrati"]
        challenge_signals = ["captcha", "verify", "verifica", "unusual", "suspicious"]
        upload_signals = ["upload", "carica", "select video", "seleziona video"]

        logged_out = any(signal in body_text for signal in login_signals)
        challenged = any(signal in body_text for signal in challenge_signals)
        upload_ready = file_inputs > 0 or any(signal in body_text for signal in upload_signals)

        result = {
            "url": current_url,
            "title": title,
            "file_inputs": file_inputs,
            "upload_ready": upload_ready,
            "logged_out": logged_out,
            "challenged": challenged,
            "screenshot": str(SCREENSHOT_PATH),
        }
        print("[TikTok Health]", json.dumps(result, ensure_ascii=False, indent=2))

        await browser.close()

    if challenged:
        print("[TikTok Health] TikTok chiede verifica/captcha. La pubblicazione automatica probabilmente fallira.")
        raise SystemExit(2)
    if logged_out or not upload_ready:
        print("[TikTok Health] Sessione non valida o pagina upload non pronta.")
        raise SystemExit(3)

    print("[TikTok Health] Sessione valida: pagina upload raggiungibile.")


if __name__ == "__main__":
    asyncio.run(main())
