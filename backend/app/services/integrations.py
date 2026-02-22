from __future__ import annotations

import hashlib
from urllib.parse import urlparse

import httpx

from app.config import (
    ELASTIC_INGEST_URL,
    ETHERSCAN_API_KEY,
    ETHERSCAN_BASE_URL,
    GOPLUS_BASE_URL,
    METAMASK_PHISHING_URL,
    PHISHTANK_FEED_URL,
    REDIS_CACHE_TTL_SECONDS,
)
from app.services.cache import cache_get_json, cache_set_json
from app.services.error_utils import log_service_error

CHAIN_IDS = {
    "ethereum": "1",
    "bsc": "56",
    "polygon": "137",
    "arbitrum": "42161",
    "optimism": "10",
    "avalanche": "43114",
    "base": "8453",
}

NATIVE_PRICE_USD = {
    "ethereum": 3000.0,
    "bsc": 600.0,
    "polygon": 0.8,
    "arbitrum": 3000.0,
    "optimism": 3000.0,
    "avalanche": 35.0,
    "base": 3000.0,
}


async def _get_json(url: str, params: dict | None = None, timeout: float = 10.0) -> dict | list:
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        return response.json()


async def etherscan_txlist(wallet_address: str, chain: str, limit: int = 100) -> list[dict]:
    chain_id = CHAIN_IDS.get(chain, CHAIN_IDS["ethereum"])
    cache_key = f"etherscan:txlist:{chain}:{wallet_address.lower()}"

    params = {
        "chainid": chain_id,
        "module": "account",
        "action": "txlist",
        "address": wallet_address,
        "page": 1,
        "offset": limit,
        "sort": "desc",
        "apikey": ETHERSCAN_API_KEY,
    }

    try:
        payload = await _get_json(ETHERSCAN_BASE_URL, params=params)
        results = payload.get("result", []) if isinstance(payload, dict) else []
        if isinstance(results, list):
            cache_set_json(cache_key, results)
            return results
    except Exception as exc:
        log_service_error(
            "integrations",
            "INTEGRATION_ETHERSCAN_TXLIST_FAILED",
            exc,
            chain=chain,
            wallet_address=wallet_address,
        )

    cached = cache_get_json(cache_key)
    return cached if isinstance(cached, list) else []


async def etherscan_contract_info(contract_address: str, chain: str) -> dict:
    chain_id = CHAIN_IDS.get(chain, CHAIN_IDS["ethereum"])
    cache_key = f"etherscan:contract:{chain}:{contract_address.lower()}"

    params = {
        "chainid": chain_id,
        "module": "contract",
        "action": "getsourcecode",
        "address": contract_address,
        "apikey": ETHERSCAN_API_KEY,
    }
    try:
        payload = await _get_json(ETHERSCAN_BASE_URL, params=params)
        result = payload.get("result", []) if isinstance(payload, dict) else []
        if isinstance(result, list) and result:
            data = result[0]
            cache_set_json(cache_key, data)
            return data
    except Exception as exc:
        log_service_error(
            "integrations",
            "INTEGRATION_ETHERSCAN_CONTRACT_INFO_FAILED",
            exc,
            chain=chain,
            contract_address=contract_address,
        )

    cached = cache_get_json(cache_key)
    return cached if isinstance(cached, dict) else {}


async def goplus_address_security(address: str, chain: str) -> dict:
    chain_id = CHAIN_IDS.get(chain, CHAIN_IDS["ethereum"])
    cache_key = f"goplus:address:{chain}:{address.lower()}"
    url = f"{GOPLUS_BASE_URL}/api/v1/address_security/{chain_id}"
    try:
        payload = await _get_json(url, params={"address": address})
        result = payload.get("result", {}) if isinstance(payload, dict) else {}
        if isinstance(result, dict):
            cache_set_json(cache_key, result)
            return result
    except Exception as exc:
        log_service_error(
            "integrations",
            "INTEGRATION_GOPLUS_ADDRESS_SECURITY_FAILED",
            exc,
            chain=chain,
            address=address,
        )

    cached = cache_get_json(cache_key)
    return cached if isinstance(cached, dict) else {}


async def goplus_token_security(token_address: str, chain: str) -> dict:
    chain_id = CHAIN_IDS.get(chain, CHAIN_IDS["ethereum"])
    cache_key = f"goplus:token:{chain}:{token_address.lower()}"
    url = f"{GOPLUS_BASE_URL}/api/v1/token_security/{chain_id}"
    try:
        payload = await _get_json(url, params={"contract_addresses": token_address})
        result = payload.get("result", {}) if isinstance(payload, dict) else {}
        if isinstance(result, dict):
            token = result.get(token_address.lower(), {})
            if token:
                cache_set_json(cache_key, token)
                return token
    except Exception as exc:
        log_service_error(
            "integrations",
            "INTEGRATION_GOPLUS_TOKEN_SECURITY_FAILED",
            exc,
            chain=chain,
            token_address=token_address,
        )

    cached = cache_get_json(cache_key)
    return cached if isinstance(cached, dict) else {}


async def fetch_metamask_phishing_domains() -> set[str]:
    cache_key = "feeds:metamask:phishing"
    cached = cache_get_json(cache_key)
    if isinstance(cached, list):
        return set(cached)

    try:
        payload = await _get_json(METAMASK_PHISHING_URL)
        domains = payload.get("blacklist", []) if isinstance(payload, dict) else []
        clean = sorted({str(d).lower() for d in domains})
        cache_set_json(cache_key, clean, ttl_seconds=REDIS_CACHE_TTL_SECONDS)
        return set(clean)
    except Exception as exc:
        log_service_error(
            "integrations",
            "INTEGRATION_METAMASK_FEED_FAILED",
            exc,
            url=METAMASK_PHISHING_URL,
        )
        return set()


async def fetch_phishtank_domains() -> set[str]:
    cache_key = "feeds:phishtank:domains"
    cached = cache_get_json(cache_key)
    if isinstance(cached, list):
        return set(cached)

    try:
        payload = await _get_json(PHISHTANK_FEED_URL)
        domains: set[str] = set()
        if isinstance(payload, list):
            for row in payload[:10000]:
                url = (row or {}).get("url", "")
                if not url:
                    continue
                parsed = urlparse(url)
                if parsed.hostname:
                    domains.add(parsed.hostname.lower())

        clean = sorted(domains)
        cache_set_json(cache_key, clean, ttl_seconds=REDIS_CACHE_TTL_SECONDS)
        return set(clean)
    except Exception as exc:
        log_service_error(
            "integrations",
            "INTEGRATION_PHISHTANK_FEED_FAILED",
            exc,
            url=PHISHTANK_FEED_URL,
        )
        return set()


async def push_siem_event(event: dict) -> bool:
    if not ELASTIC_INGEST_URL:
        return False

    # Stable document id improves update semantics in ELK pipelines.
    event_hash = hashlib.sha256(str(event).encode("utf-8")).hexdigest()
    url = ELASTIC_INGEST_URL.rstrip("/") + f"/_doc/{event_hash}"

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(url, json=event)
            return response.status_code in (200, 201)
    except Exception as exc:
        log_service_error(
            "integrations",
            "INTEGRATION_SIEM_PUSH_FAILED",
            exc,
            ingest_url=ELASTIC_INGEST_URL,
        )
        return False


def usd_value_from_native_wei(value_wei: str, chain: str) -> float:
    try:
        native = int(value_wei) / 10**18
    except Exception as exc:
        log_service_error(
            "integrations",
            "INTEGRATION_WEI_PARSE_FAILED",
            exc,
            chain=chain,
            value_wei=value_wei,
        )
        return 0.0
    return native * NATIVE_PRICE_USD.get(chain, 0.0)
