from __future__ import annotations

import json
from typing import Any

import redis

from app.config import REDIS_CACHE_TTL_SECONDS, REDIS_URL
from app.services.error_utils import log_service_error

_client: redis.Redis | None = None


def redis_client() -> redis.Redis:
    global _client
    if _client is None:
        _client = redis.from_url(REDIS_URL, decode_responses=True)
    return _client


def cache_get_json(key: str) -> Any | None:
    try:
        value = redis_client().get(key)
    except Exception as exc:
        log_service_error("cache", "CACHE_GET_FAILED", exc, key=key)
        return None

    if not value:
        return None
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return None


def cache_set_json(key: str, value: Any, ttl_seconds: int = REDIS_CACHE_TTL_SECONDS) -> None:
    try:
        redis_client().setex(key, ttl_seconds, json.dumps(value))
    except Exception as exc:
        log_service_error("cache", "CACHE_SET_FAILED", exc, key=key, ttl_seconds=ttl_seconds)
        return
