from pydantic import BaseModel, Field


class ScanRequest(BaseModel):
    target: str = Field(default="hkma.gov.hk")
    ports: str = Field(default="1-10000")


class SimulateRequest(BaseModel):
    email_text: str


class TunnelRequest(BaseModel):
    endpoint: str = Field(default="hk-relay-01.cyberport.hk")


class LogRequest(BaseModel):
    threat_id: str
    compliance: str = Field(default="HKMA_2026")
    payload: str = Field(default="")


class RegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)
    region: str = Field(default="HK")


class LoginRequest(BaseModel):
    email: str
    password: str


class UserProfileResponse(BaseModel):
    id: str
    email: str
    region: str
    created_at: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse


class WalletMonitorRequest(BaseModel):
    wallet_address: str
    chain: str = Field(default="ethereum")
    threshold_usd: float = Field(default=1000.0)
    label: str = Field(default="")


class ApprovalScanRequest(BaseModel):
    wallet_address: str
    chain: str = Field(default="ethereum")


class ContractAnalyzeRequest(BaseModel):
    contract_address: str
    chain: str = Field(default="ethereum")


class PhishingCheckRequest(BaseModel):
    url: str


class AlertActionRequest(BaseModel):
    status: str = Field(default="acknowledged")


class IngestEvent(BaseModel):
    source: str
    severity: str = Field(default="medium")
    message: str
    metadata: dict = Field(default_factory=dict)


class IngestRequest(BaseModel):
    events: list[IngestEvent] = Field(default_factory=list)


class TelegramDiscoverRequest(BaseModel):
    preferred_chat_id: str | None = None


class TelegramStoreRequest(BaseModel):
    chat_id: str
