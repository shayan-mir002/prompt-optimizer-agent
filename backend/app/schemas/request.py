"""
app/schemas/request.py
Pydantic request models for the API.
"""
from typing import Optional
from pydantic import BaseModel, field_validator

from app.schemas.response import PreOptimizationResponse


class OptimizeRequest(BaseModel):
    prompt: str

    @field_validator("prompt")
    @classmethod
    def prompt_must_not_be_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("prompt must not be blank")
        return v.strip()


class OptimizeRunRequest(BaseModel):
    prompt: str
    pre_analysis: Optional[PreOptimizationResponse] = None

    @field_validator("prompt")
    @classmethod
    def prompt_must_not_be_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("prompt must not be blank")
        return v.strip()
