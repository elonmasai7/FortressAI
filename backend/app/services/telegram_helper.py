from __future__ import annotations

from collections import OrderedDict

import httpx

from app.config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
from app.services.cache import redis_client

TELEGRAM_CHAT_ID_CACHE_KEY = "fortress:telegram:chat_id"


def get_stored_chat_id() -> str:
    try:
        cached = redis_client().get(TELEGRAM_CHAT_ID_CACHE_KEY)
        if cached:
            return str(cached)
    except Exception:
        pass
    return TELEGRAM_CHAT_ID


def store_chat_id(chat_id: str) -> bool:
    if not chat_id:
        return False
    try:
        redis_client().set(TELEGRAM_CHAT_ID_CACHE_KEY, str(chat_id))
        return True
    except Exception:
        return False


async def fetch_recent_updates(limit: int = 50) -> dict:
    if not TELEGRAM_BOT_TOKEN:
        return {"ok": False, "error": "TELEGRAM_BOT_TOKEN is not configured", "updates": [], "chats": []}

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates"
    params = {"limit": max(1, min(limit, 100)), "timeout": 1}

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            payload = response.json()
    except Exception as exc:
        return {"ok": False, "error": str(exc), "updates": [], "chats": []}

    updates = payload.get("result", []) if isinstance(payload, dict) else []
    chats_map: OrderedDict[str, dict] = OrderedDict()

    for update in updates:
        message = update.get("message") or update.get("channel_post") or update.get("edited_message") or {}
        chat = message.get("chat") or {}
        chat_id = chat.get("id")
        if chat_id is None:
            continue

        key = str(chat_id)
        chats_map[key] = {
            "chat_id": key,
            "type": chat.get("type", ""),
            "title": chat.get("title", ""),
            "username": chat.get("username", ""),
            "last_update_id": update.get("update_id"),
        }

    chats = list(chats_map.values())
    return {
        "ok": True,
        "error": "",
        "updates": updates,
        "chats": chats,
    }


async def discover_and_store_chat_id(preferred_chat_id: str | None = None) -> dict:
    data = await fetch_recent_updates(limit=50)
    if not data.get("ok"):
        return {
            "ok": False,
            "error": data.get("error", "Failed to fetch updates"),
            "stored_chat_id": get_stored_chat_id(),
            "chats": data.get("chats", []),
        }

    chats: list[dict] = data.get("chats", [])
    selected: str = ""

    if preferred_chat_id:
        preferred = str(preferred_chat_id)
        if any(chat.get("chat_id") == preferred for chat in chats):
            selected = preferred
    if not selected and chats:
        selected = str(chats[-1].get("chat_id", ""))

    stored = store_chat_id(selected) if selected else False
    return {
        "ok": True,
        "error": "",
        "stored_chat_id": selected if stored else get_stored_chat_id(),
        "chats": chats,
    }
