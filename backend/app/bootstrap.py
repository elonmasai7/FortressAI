from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import User
from app.security import hash_password

DEFAULT_USERS = (
    {"email": "demo.hk@fortressai.local", "password": "Fortress123!", "region": "HK"},
    {"email": "demo.ke@fortressai.local", "password": "Fortress123!", "region": "KE"},
)


def seed_default_users(db: Session) -> int:
    created = 0
    for row in DEFAULT_USERS:
        email = row["email"].strip().lower()
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            continue
        db.add(
            User(
                email=email,
                password_hash=hash_password(row["password"]),
                region=row["region"],
            )
        )
        created += 1
    if created:
        db.commit()
    return created
