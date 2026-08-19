from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator

from applygauge_api.skills.normalization import clean_skill_term


class SkillCategory(StrEnum):
    LANGUAGE = "LANGUAGE"
    FRAMEWORK = "FRAMEWORK"
    DATABASE = "DATABASE"
    CLOUD = "CLOUD"
    DEVOPS = "DEVOPS"
    MESSAGING = "MESSAGING"
    TESTING = "TESTING"
    OTHER = "OTHER"


class SkillSource(StrEnum):
    MANUAL = "MANUAL"
    DETECTED = "DETECTED"


class SkillAdd(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str

    @field_validator("name", mode="before")
    @classmethod
    def clean_name(cls, value: object) -> object:
        if not isinstance(value, str):
            return value
        return clean_skill_term(value)


class SkillRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    category: SkillCategory
    sources: list[SkillSource]


class SkillListResponse(BaseModel):
    items: list[SkillRead]
