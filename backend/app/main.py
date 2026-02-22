from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import logging
import io
import qrcode
import socketio

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.bootstrap import seed_default_users
from app.database import SessionLocal, init_db
from app.middleware.rate_limit import RateLimitMiddleware
from app.realtime import sio
from app.routers.api import router as api_router
from app.routers.guardian import router as guardian_router
from app.ws.socket import router as ws_router

fastapi_app = FastAPI(title="FortressAI API", version="1.0.0")
logger = logging.getLogger("fortressai.api")

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
fastapi_app.add_middleware(RateLimitMiddleware, max_requests=180, window_seconds=60)


@fastapi_app.on_event("startup")
def startup() -> None:
    init_db()
    db = SessionLocal()
    try:
        seed_default_users(db)
    finally:
        db.close()


@fastapi_app.get("/")
def root():
    return {"service": "fortressai-backend", "status": "ok"}


@fastapi_app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "ok": False,
            "error": {
                "type": "http_error",
                "message": str(exc.detail),
                "status_code": exc.status_code,
                "path": request.url.path,
            },
        },
    )


@fastapi_app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "ok": False,
            "error": {
                "type": "validation_error",
                "message": "Request validation failed",
                "details": exc.errors(),
                "path": request.url.path,
            },
        },
    )


@fastapi_app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=500,
        content={
            "ok": False,
            "error": {
                "type": "internal_error",
                "message": "Internal server error",
                "path": request.url.path,
            },
        },
    )


@fastapi_app.get("/qr")
def qr():
    img = qrcode.make("http://localhost:3000?autoDemo=1")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")


fastapi_app.include_router(api_router)
fastapi_app.include_router(guardian_router)
fastapi_app.include_router(ws_router)

app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)
