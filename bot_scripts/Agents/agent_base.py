import json
from pathlib import Path
from datetime import datetime
from typing import Any

BLACKBOARD_DIR = Path(__file__).parent / "blackboard"

class MessageBus:
    def post(self, sender: str, channel: str, payload: dict):
        path = BLACKBOARD_DIR / f"{channel}.json"
        entries = []
        if path.exists():
            try:
                entries = json.loads(path.read_text(encoding="utf-8"))
            except Exception:
                entries = []
        entries.append({
            "from": sender,
            "channel": channel,
            "payload": payload,
            "timestamp": datetime.now().isoformat(),
        })
        path.write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"[MessageBus] {sender} -> #{channel}: {payload.get('type', 'message')}")

    def read(self, channel: str) -> list[dict]:
        path = BLACKBOARD_DIR / f"{channel}.json"
        if not path.exists():
            return []
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            return []

    def read_since(self, channel: str, since: str) -> list[dict]:
        return [e for e in self.read(channel) if e.get("timestamp", "") > since]

class BaseAgent:
    name: str = "base"
    bus: MessageBus

    def __init__(self):
        self.bus = MessageBus()

    def run(self):
        raise NotImplementedError

    def log(self, msg: str):
        print(f"[{self.name}] {msg}")

    def post(self, channel: str, payload: dict):
        self.bus.post(self.name, channel, payload)
