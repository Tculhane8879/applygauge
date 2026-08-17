from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TokenClaims(BaseModel):
    model_config = ConfigDict(extra="ignore", frozen=True)

    iss: str
    aud: str
    exp: int
    iat: int
    sub: UUID
    role: Literal["authenticated"]
    session_id: UUID
    is_anonymous: Literal[False]
    email: str = Field(min_length=1)


class AuthenticatedUser(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: UUID
    email: str
    session_id: UUID
