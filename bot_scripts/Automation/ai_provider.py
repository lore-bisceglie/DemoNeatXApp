import json
import os
import re
import urllib.error
import urllib.request


base_url = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
OPENAI_CHAT_URL = f"{base_url}/chat/completions"
DEFAULT_OPENAI_MODEL = "gpt-4o-mini"


def _clean_json_text(text):
    text = (text or "").strip()
    if text.startswith("```"):
        text = text.strip("`").strip()
        if text.lower().startswith("json"):
            text = text[4:].strip()
    start = text.find("{")
    end = text.rfind("}") + 1
    if start != -1 and end > start:
        return text[start:end]
    return text


def _redact_secret(text):
    return re.sub(r"sk-[A-Za-z0-9_-]+", "sk-***", text or "")


def openai_chat(prompt, system=None, json_mode=False, temperature=0.7, max_tokens=1600, model=None):
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return None

    if not model:
        model = os.environ.get("OPENAI_MODEL", DEFAULT_OPENAI_MODEL)
        
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append(
        {
            "role": "user",
            "content": prompt if isinstance(prompt, str) else json.dumps(prompt, ensure_ascii=False),
        }
    )

    body = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if json_mode:
        body["response_format"] = {"type": "json_object"}

    req = urllib.request.Request(
        OPENAI_CHAT_URL,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=90) as response:
            payload = json.loads(response.read().decode("utf-8"))
        return payload["choices"][0]["message"]["content"].strip()
    except urllib.error.HTTPError as exc:
        details = _redact_secret(exc.read().decode("utf-8", errors="ignore"))
        print(f"[!] OpenAI/OmniRoute non disponibile HTTP {exc.code}: {details[:500]}")
    except Exception as exc:
        print(f"[!] OpenAI/OmniRoute non disponibile: {exc}")
    return None


def openai_json(prompt, system=None, temperature=0.7, max_tokens=1600, model=None):
    text = openai_chat(
        prompt,
        system=system or "Rispondi solo con JSON valido, senza markdown.",
        json_mode=True,
        temperature=temperature,
        max_tokens=max_tokens,
        model=model
    )
    if not text:
        return None

    try:
        return json.loads(_clean_json_text(text))
    except Exception as exc:
        print(f"[!] JSON AI non leggibile: {exc}")
        return None


def openai_text(prompt, system=None, temperature=0.7, max_tokens=1800, model=None):
    return openai_chat(
        prompt,
        system=system,
        json_mode=False,
        temperature=temperature,
        max_tokens=max_tokens,
        model=model
    )
