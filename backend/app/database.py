import time

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.exc import OperationalError

from app.config import DATABASE_URL
from app.models import Base

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db(retries: int = 30, delay_sec: float = 1.0) -> None:
    last_error: Exception | None = None
    for _ in range(retries):
        try:
            Base.metadata.create_all(bind=engine)
            return
        except OperationalError as exc:
            last_error = exc
            time.sleep(delay_sec)
    if last_error:
        raise last_error


def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
