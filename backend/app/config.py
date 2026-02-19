import os

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://fortress:fortress@postgres:5432/fortressai",
)
DEMO_TARGET = os.getenv("DEMO_TARGET", "hkma.gov.hk")
EXPRESSVPN_PROFILE = os.getenv("EXPRESSVPN_PROFILE", "hk")
ENABLE_REAL_EXPRESSVPN = os.getenv("ENABLE_REAL_EXPRESSVPN", "true").lower() == "true"
ENABLE_REAL_FABRIC = os.getenv("ENABLE_REAL_FABRIC", "true").lower() == "true"
FABRIC_PEER_ADDRESS = os.getenv("FABRIC_PEER_ADDRESS", "hyperledger:7051")
