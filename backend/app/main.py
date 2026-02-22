from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import io
import qrcode
import socketio

from app.database import init_db
from app.middleware.rate_limit import RateLimitMiddleware
from app.realtime import sio
from app.routers.api import router as api_router
from app.routers.guardian import router as guardian_router
from app.ws.socket import router as ws_router

fastapi_app = FastAPI(title="FortressAI API", version="1.0.0")

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


@fastapi_app.get("/")
def root():
    return {"service": "fortressai-backend", "status": "ok"}


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
