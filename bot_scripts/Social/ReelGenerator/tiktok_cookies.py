import json
import os


def _normalize_same_site(value):
    if not value:
        return "Lax"
    value = str(value).lower().replace("_", "-")
    if value in {"strict"}:
        return "Strict"
    if value in {"none", "no-restriction", "no_restriction"}:
        return "None"
    return "Lax"


def _normalize_cookie(cookie):
    name = cookie.get("name")
    value = cookie.get("value")
    if not name or value is None:
        return None

    domain = cookie.get("domain") or ".tiktok.com"
    if "tiktok.com" not in domain:
        return None

    normalized = {
        "name": name,
        "value": str(value),
        "domain": domain,
        "path": cookie.get("path") or "/",
        "secure": bool(cookie.get("secure", True)),
        "httpOnly": bool(cookie.get("httpOnly", cookie.get("http_only", False))),
        "sameSite": _normalize_same_site(cookie.get("sameSite") or cookie.get("same_site")),
    }

    expires = cookie.get("expires") or cookie.get("expirationDate") or cookie.get("expiry")
    try:
        if expires is not None:
            normalized["expires"] = int(float(expires))
    except Exception:
        pass

    return normalized


def load_tiktok_cookies():
    cookies_json = os.environ.get("TIKTOK_COOKIES_JSON", "").strip()
    if cookies_json:
        try:
            data = json.loads(cookies_json)
            if isinstance(data, dict):
                data = data.get("cookies", [])
            cookies = [_normalize_cookie(cookie) for cookie in data if isinstance(cookie, dict)]
            cookies = [cookie for cookie in cookies if cookie]
            if cookies:
                print(f"[TikTok Cookies] Uso {len(cookies)} cookie da TIKTOK_COOKIES_JSON.")
                return cookies
            print("[TikTok Cookies] TIKTOK_COOKIES_JSON presente ma senza cookie TikTok validi.")
        except Exception as exc:
            print(f"[TikTok Cookies] TIKTOK_COOKIES_JSON non leggibile: {exc}")

    session_id = os.environ.get("TIKTOK_SESSION_ID", "").strip()
    if session_id:
        print("[TikTok Cookies] Uso fallback TIKTOK_SESSION_ID.")
        return [
            {
                "name": "sessionid",
                "value": session_id,
                "domain": ".tiktok.com",
                "path": "/",
                "httpOnly": True,
                "secure": True,
                "sameSite": "Lax",
            }
        ]

    return []
