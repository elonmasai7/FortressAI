from __future__ import annotations

import logging
from typing import Any


def log_service_error(service: str, code: str, exc: Exception, **context: Any) -> None:
    logger = logging.getLogger(f"fortressai.services.{service}")
    if context:
        logger.exception("[%s] %s | context=%s", code, exc, context)
    else:
        logger.exception("[%s] %s", code, exc)
