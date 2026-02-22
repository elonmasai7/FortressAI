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

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "fortressai-dev-secret")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))

ETHERSCAN_API_KEY = os.getenv("ETHERSCAN_API_KEY", "")
ETHERSCAN_BASE_URL = os.getenv("ETHERSCAN_BASE_URL", "https://api.etherscan.io/v2/api")
GOPLUS_BASE_URL = os.getenv("GOPLUS_BASE_URL", "https://api.gopluslabs.io")
PHISHTANK_FEED_URL = os.getenv(
    "PHISHTANK_FEED_URL",
    "https://data.phishtank.com/data/online-valid.json",
)
METAMASK_PHISHING_URL = os.getenv(
    "METAMASK_PHISHING_URL",
    "https://raw.githubusercontent.com/MetaMask/eth-phishing-detect/main/src/config.json",
)

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")
ALERT_EMAIL_FROM = os.getenv("ALERT_EMAIL_FROM", "alerts@fortressai.local")
ALERT_EMAIL_TO = os.getenv("ALERT_EMAIL_TO", "")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER", "")
TWILIO_TO_NUMBER = os.getenv("TWILIO_TO_NUMBER", "")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")
DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL", "")

ELASTIC_INGEST_URL = os.getenv("ELASTIC_INGEST_URL", "")
AWS_SECURITY_HUB_ENABLED = os.getenv("AWS_SECURITY_HUB_ENABLED", "false").lower() == "true"
AWS_REGION = os.getenv("AWS_REGION", "ap-east-1")

REDIS_CACHE_TTL_SECONDS = int(os.getenv("REDIS_CACHE_TTL_SECONDS", "900"))
