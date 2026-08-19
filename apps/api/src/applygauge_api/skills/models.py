from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    String,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from applygauge_api.db.base import Base

SKILL_CATEGORIES = (
    "LANGUAGE",
    "FRAMEWORK",
    "DATABASE",
    "CLOUD",
    "DEVOPS",
    "MESSAGING",
    "TESTING",
    "OTHER",
)


class Skill(Base):
    __tablename__ = "skills"
    __table_args__ = (
        CheckConstraint(f"category IN {SKILL_CATEGORIES!r}", name="category_allowed"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[str] = mapped_column(String(16), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    terms: Mapped[list["SkillTerm"]] = relationship(back_populates="skill", passive_deletes=True)
    job_skills: Mapped[list["JobSkill"]] = relationship(
        back_populates="skill", passive_deletes=True
    )


class SkillTerm(Base):
    __tablename__ = "skill_terms"
    __table_args__ = (
        Index(
            "uq_skill_terms_skill_id_canonical",
            "skill_id",
            unique=True,
            postgresql_where=text("is_canonical"),
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    skill_id: Mapped[UUID] = mapped_column(
        ForeignKey("skills.id", ondelete="CASCADE"), nullable=False
    )
    term: Mapped[str] = mapped_column(String(100), nullable=False)
    normalized_term: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    is_canonical: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    skill: Mapped[Skill] = relationship(back_populates="terms")


class JobSkill(Base):
    __tablename__ = "job_skills"
    __table_args__ = (
        ForeignKeyConstraint(
            ("job_id", "user_id"),
            ("jobs.id", "jobs.user_id"),
            name="fk_job_skills_job_id_user_id_jobs",
            ondelete="CASCADE",
        ),
        Index("ix_job_skills_skill_id", "skill_id"),
    )

    job_id: Mapped[UUID] = mapped_column(primary_key=True)
    skill_id: Mapped[UUID] = mapped_column(
        ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True
    )
    user_id: Mapped[UUID] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    skill: Mapped[Skill] = relationship(back_populates="job_skills")
