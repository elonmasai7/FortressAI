#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
from pathlib import Path

import httpx


def load_env_value(key: str) -> str:
    value = os.getenv(key, "")
    if value:
        return value

    env_path = Path(".env")
    if not env_path.exists():
        return ""

    for line in env_path.read_text(encoding="utf-8").splitlines():
        if not line or line.strip().startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        if k.strip() == key:
            return v.strip()
    return ""


def upsert_env(path: Path, key: str, value: str) -> None:
    lines: list[str] = []
    if path.exists():
        lines = path.read_text(encoding="utf-8").splitlines()

    found = False
    updated: list[str] = []
    for line in lines:
        if line.startswith(f"{key}="):
            updated.append(f"{key}={value}")
            found = True
        else:
            updated.append(line)

    if not found:
        updated.append(f"{key}={value}")

    path.write_text("\n".join(updated).strip() + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Discover Telegram chat ID from recent bot updates")
    parser.add_argument("--token", default="", help="Telegram bot token (falls back to TELEGRAM_BOT_TOKEN/.env)")
    parser.add_argument("--choose", default="latest", help="chat_id to store, or 'latest' (default)")
    parser.add_argument("--save-env", action="store_true", help="Persist selected TELEGRAM_CHAT_ID into .env")
    args = parser.parse_args()

    token = args.token or load_env_value("TELEGRAM_BOT_TOKEN")
    if not token:
        print("Missing TELEGRAM_BOT_TOKEN. Pass --token or set it in env/.env")
        return 1

    url = f"https://api.telegram.org/bot{token}/getUpdates"
    try:
        payload = httpx.get(url, params={"limit": 50, "timeout": 1}, timeout=8.0).json()
    except Exception as exc:
        print(f"Failed to fetch updates: {exc}")
        return 1

    updates = payload.get("result", []) if isinstance(payload, dict) else []
    chats: dict[str, dict] = {}
    for update in updates:
        message = update.get("message") or update.get("channel_post") or update.get("edited_message") or {}
        chat = message.get("chat") or {}
        chat_id = chat.get("id")
        if chat_id is None:
            continue
        chats[str(chat_id)] = {
            "chat_id": str(chat_id),
            "type": chat.get("type", ""),
            "title": chat.get("title", ""),
            "username": chat.get("username", ""),
            "update_id": update.get("update_id"),
        }

    if not chats:
        print("No chats found in recent updates. Send any message to @Fortressaibot first, then retry.")
        return 1

    chat_list = list(chats.values())
    print("Found chats from recent updates:")
    for row in chat_list:
        print(
            f"- chat_id={row['chat_id']} type={row['type']} username={row['username'] or '-'} title={row['title'] or '-'}"
        )

    selected = chat_list[-1]["chat_id"] if args.choose == "latest" else str(args.choose)
    if selected not in chats:
        print(f"Requested chat_id {selected} not found in recent updates")
        return 1

    print(f"Selected TELEGRAM_CHAT_ID={selected}")

    if args.save_env:
        env_path = Path(".env")
        upsert_env(env_path, "TELEGRAM_CHAT_ID", selected)
        print("Saved TELEGRAM_CHAT_ID to .env")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
