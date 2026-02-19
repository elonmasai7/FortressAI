import os

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://fortress:fortress@postgres:5432/fortressai",
)
DEMO_TARGET = os.getenv("DEMO_TARGET", "hkma.gov.hk")
WG_CONFIG_PATH = os.getenv("WG_CONFIG_PATH", "/etc/wireguard/fortressai.conf")
ENABLE_REAL_WG = os.getenv("ENABLE_REAL_WG", "true").lower() == "true"
ENABLE_REAL_FABRIC = os.getenv("ENABLE_REAL_FABRIC", "true").lower() == "true"
FABRIC_PEER_ADDRESS = os.getenv("FABRIC_PEER_ADDRESS", "hyperledger:7051")
