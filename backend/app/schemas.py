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
