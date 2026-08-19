"""Add the canonical skills vocabulary and private job associations.

Revision ID: 20260818_0003
Revises: 20260817_0002
Create Date: 2026-08-18
"""

from collections.abc import Sequence
from unicodedata import category, normalize
from uuid import UUID, uuid5

import sqlalchemy as sa

from alembic import op

revision: str = "20260818_0003"
down_revision: str | None = "20260817_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

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
TERM_ID_NAMESPACE = UUID("f38b54a7-f86f-49ba-ab3d-727c31faf80e")

# These fixed identifiers make the required global catalog stable across downgrade/re-upgrade.
SKILLS = (
    (UUID("bcb48458-8358-4e87-aa98-3792e015b470"), "JavaScript", "LANGUAGE"),
    (UUID("e8d63f5d-336e-445a-a619-28239996c313"), "TypeScript", "LANGUAGE"),
    (UUID("62f3936f-fb97-4741-b2f0-8027b836a1bd"), "Python", "LANGUAGE"),
    (UUID("ca336779-b913-4811-8c4f-51a2bc17b865"), "Java", "LANGUAGE"),
    (UUID("5d345ce5-7a3e-4531-9565-879dc0b42cb3"), "C", "LANGUAGE"),
    (UUID("eb01bde8-1b6f-4bb8-a1b6-00e5c90750ec"), "C++", "LANGUAGE"),
    (UUID("6663554b-a31a-4bf2-9c28-775fb1a4641e"), "C#", "LANGUAGE"),
    (UUID("8fe0db66-7b9d-43c7-a7b0-db55237b9f20"), "SQL", "LANGUAGE"),
    (UUID("91023d6a-9347-4550-850d-d0187d4afe2c"), "PostgreSQL", "DATABASE"),
    (UUID("c13eaea4-cab3-409f-a8ee-d75997de9236"), "MongoDB", "DATABASE"),
    (UUID("4356694e-d1ad-461f-8899-1b7875596879"), "Redis", "DATABASE"),
    (UUID("5de5d23b-5dbb-42a3-bb1e-dcc35b98e635"), "React", "FRAMEWORK"),
    (UUID("4008e918-0829-404f-9332-db2919725f51"), "Next.js", "FRAMEWORK"),
    (UUID("b175ccc9-6b37-468c-b56a-4b48b1a385a7"), "Vue.js", "FRAMEWORK"),
    (UUID("fbc9eb64-76ab-41df-9631-ec10dcd5cf2a"), "Node.js", "FRAMEWORK"),
    (UUID("6019f563-79bf-42b3-b1ec-ed5307275eb0"), "FastAPI", "FRAMEWORK"),
    (UUID("8f9ec94d-7b15-4983-9f15-69df49f6015d"), "Spring Boot", "FRAMEWORK"),
    (UUID("9ff0db73-c78d-4442-87fd-a955e0169488"), ".NET", "FRAMEWORK"),
    (UUID("ec185ee3-515e-49e6-a781-434df45e68e9"), "Docker", "DEVOPS"),
    (UUID("3cf8d611-ff28-4dc6-94e7-cb46ad6d640c"), "Kubernetes", "DEVOPS"),
    (UUID("312ce42e-1658-4af7-9288-ec34fd3e4111"), "AWS", "CLOUD"),
    (UUID("9c3151f3-773e-4962-a01a-f0b50175b268"), "Git", "DEVOPS"),
    (UUID("a9ccd38b-0cb1-487a-89c4-2df52f3d4af2"), "GitHub Actions", "DEVOPS"),
    (UUID("e8ac706b-bb7e-4efa-b3d8-10126d6e8063"), "Linux", "DEVOPS"),
)

ALIASES = {
    "JavaScript": ("JS",),
    "TypeScript": ("TS",),
    "PostgreSQL": ("Postgres", "psql"),
    "React": ("React.js", "ReactJS"),
    "Next.js": ("NextJS",),
    "Vue.js": ("Vue", "VueJS"),
    "Node.js": ("Node", "NodeJS"),
    "AWS": ("Amazon Web Services",),
    "C++": ("cpp",),
    "C#": ("csharp",),
}


def _normalized_term(value: str) -> str:
    normalized_unicode = normalize("NFKC", value)
    if any(category(character) in {"Cc", "Cf"} for character in normalized_unicode):
        raise ValueError("Seed terms cannot contain control or format characters.")
    cleaned = " ".join(normalized_unicode.strip().split())
    normalized = cleaned.casefold()
    if not cleaned or len(cleaned) > 100 or len(normalized) > 100:
        raise ValueError("Seed terms must normalize to between 1 and 100 characters.")
    return normalized


def upgrade() -> None:
    op.create_table(
        "skills",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("category", sa.String(length=16), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            f"category IN {SKILL_CATEGORIES!r}",
            name=op.f("ck_skills_category_allowed"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_skills")),
    )
    op.create_table(
        "skill_terms",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("skill_id", sa.Uuid(), nullable=False),
        sa.Column("term", sa.String(length=100), nullable=False),
        sa.Column("normalized_term", sa.String(length=100), nullable=False),
        sa.Column("is_canonical", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ("skill_id",),
            ("skills.id",),
            name=op.f("fk_skill_terms_skill_id_skills"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_skill_terms")),
        sa.UniqueConstraint("normalized_term", name=op.f("uq_skill_terms_normalized_term")),
    )
    op.create_index(
        "uq_skill_terms_skill_id_canonical",
        "skill_terms",
        ("skill_id",),
        unique=True,
        postgresql_where=sa.text("is_canonical"),
    )
    op.create_table(
        "job_skills",
        sa.Column("job_id", sa.Uuid(), nullable=False),
        sa.Column("skill_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ("job_id", "user_id"),
            ("jobs.id", "jobs.user_id"),
            name="fk_job_skills_job_id_user_id_jobs",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ("skill_id",),
            ("skills.id",),
            name=op.f("fk_job_skills_skill_id_skills"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("job_id", "skill_id", name=op.f("pk_job_skills")),
    )
    op.create_index("ix_job_skills_skill_id", "job_skills", ("skill_id",), unique=False)

    _seed_catalog()


def _seed_catalog() -> None:
    connection = op.get_bind()
    skills_table = sa.table(
        "skills",
        sa.column("id", sa.Uuid()),
        sa.column("name", sa.String(length=100)),
        sa.column("category", sa.String(length=16)),
    )
    terms_table = sa.table(
        "skill_terms",
        sa.column("id", sa.Uuid()),
        sa.column("skill_id", sa.Uuid()),
        sa.column("term", sa.String(length=100)),
        sa.column("normalized_term", sa.String(length=100)),
        sa.column("is_canonical", sa.Boolean()),
    )
    skill_ids = {name: skill_id for skill_id, name, _category in SKILLS}
    terms: list[dict[str, object]] = []
    normalized_terms: set[str] = set()

    for skill_id, name, _category in SKILLS:
        skill_terms = ((name, True), *((alias, False) for alias in ALIASES.get(name, ())))
        for term, is_canonical in skill_terms:
            normalized_term = _normalized_term(term)
            if normalized_term in normalized_terms:
                raise ValueError(f"Duplicate normalized seed term: {normalized_term}")
            normalized_terms.add(normalized_term)
            terms.append(
                {
                    "id": uuid5(TERM_ID_NAMESPACE, normalized_term),
                    "skill_id": skill_id,
                    "term": term,
                    "normalized_term": normalized_term,
                    "is_canonical": is_canonical,
                }
            )

    if set(ALIASES) - set(skill_ids):
        raise ValueError("Every alias group must reference a seeded skill.")

    connection.execute(
        skills_table.insert(),
        [
            {"id": skill_id, "name": name, "category": skill_category}
            for skill_id, name, skill_category in SKILLS
        ],
    )
    connection.execute(terms_table.insert(), terms)


def downgrade() -> None:
    op.drop_index("ix_job_skills_skill_id", table_name="job_skills")
    op.drop_table("job_skills")
    op.drop_index("uq_skill_terms_skill_id_canonical", table_name="skill_terms")
    op.drop_table("skill_terms")
    op.drop_table("skills")
