from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import io
import qrcode

from app.database import init_db
from app.middleware.rate_limit import RateLimitMiddleware
from app.routers.api import router as api_router
from app.routers.guardian import router as guardian_router
from app.ws.socket import router as ws_router

app = FastAPI(title="FortressAI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware, max_requests=180, window_seconds=60)


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/")
def root():
    return {"service": "fortressai-backend", "status": "ok"}


@app.get("/qr")
def qr():
    img = qrcode.make("http://localhost:3000?autoDemo=1")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")


app.include_router(api_router)
app.include_router(guardian_router)
app.include_router(ws_router)
