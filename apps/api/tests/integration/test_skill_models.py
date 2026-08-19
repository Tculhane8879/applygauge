from collections.abc import Callable
from uuid import UUID, uuid4

import pytest
from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from applygauge_api.jobs.models import Company, Job, StatusEvent
from applygauge_api.skills.models import JobSkill, JobSkillSuppression, Skill, SkillTerm
from applygauge_api.skills.normalization import normalize_skill_term

pytestmark = pytest.mark.integration

REQUIRED_SKILLS = {
    "JavaScript",
    "TypeScript",
    "Python",
    "Java",
    "C",
    "C++",
    "C#",
    "SQL",
    "PostgreSQL",
    "MongoDB",
    "Redis",
    "React",
    "Next.js",
    "Vue.js",
    "Node.js",
    "FastAPI",
    "Spring Boot",
    ".NET",
    "Docker",
    "Kubernetes",
    "AWS",
    "Git",
    "GitHub Actions",
    "Linux",
}
REQUIRED_ALIASES = {
    "JS": "JavaScript",
    "TS": "TypeScript",
    "Postgres": "PostgreSQL",
    "psql": "PostgreSQL",
    "React.js": "React",
    "ReactJS": "React",
    "NextJS": "Next.js",
    "Vue": "Vue.js",
    "VueJS": "Vue.js",
    "Node": "Node.js",
    "NodeJS": "Node.js",
    "Amazon Web Services": "AWS",
    "cpp": "C++",
    "csharp": "C#",
}
EXTRACTABLE_TERMS = {
    ".NET",
    "Amazon Web Services",
    "AWS",
    "C#",
    "C++",
    "cpp",
    "csharp",
    "Docker",
    "FastAPI",
    "Git",
    "GitHub Actions",
    "Java",
    "JavaScript",
    "Kubernetes",
    "Linux",
    "MongoDB",
    "Next.js",
    "NextJS",
    "Node.js",
    "NodeJS",
    "Postgres",
    "PostgreSQL",
    "psql",
    "Python",
    "React",
    "React.js",
    "ReactJS",
    "Redis",
    "Spring Boot",
    "SQL",
    "TypeScript",
    "Vue",
    "Vue.js",
    "VueJS",
}


def expect_integrity_error(session: Session, operation: Callable[[], object]) -> None:
    with pytest.raises(IntegrityError), session.begin_nested():
        operation()
        session.flush()


def add_skill(session: Session, name: str, category: str = "OTHER") -> Skill:
    skill = Skill(name=name, category=category)
    session.add(skill)
    session.flush()
    return skill


def add_term(session: Session, skill: Skill, term: str, *, is_canonical: bool = False) -> SkillTerm:
    skill_term = SkillTerm(
        skill_id=skill.id,
        term=term,
        normalized_term=normalize_skill_term(term),
        is_canonical=is_canonical,
        is_extractable=False,
    )
    session.add(skill_term)
    session.flush()
    return skill_term


def add_owned_job(session: Session, user_id: UUID) -> Job:
    company = Company(
        user_id=user_id,
        name=f"Company {uuid4()}",
        normalized_name=f"company-{uuid4()}",
    )
    session.add(company)
    session.flush()
    job = Job(
        user_id=user_id,
        company_id=company.id,
        title="Engineer",
        current_status="SAVED",
    )
    session.add(job)
    session.flush()
    return job


def seeded_skill(session: Session, name: str) -> Skill:
    skill = session.scalar(select(Skill).where(Skill.name == name))
    assert skill is not None
    return skill


def test_seed_catalog_and_canonical_terms_are_consistent(database_session: Session) -> None:
    skills = list(database_session.scalars(select(Skill)).all())
    assert {skill.name for skill in skills} == REQUIRED_SKILLS
    assert len(skills) == 24

    for skill in skills:
        canonical_terms = list(
            database_session.scalars(
                select(SkillTerm).where(
                    SkillTerm.skill_id == skill.id,
                    SkillTerm.is_canonical.is_(True),
                )
            ).all()
        )
        assert len(canonical_terms) == 1
        canonical = canonical_terms[0]
        assert canonical.term == skill.name
        assert canonical.normalized_term == normalize_skill_term(skill.name)

    assert database_session.scalar(select(func.count()).select_from(SkillTerm)) == 38


def test_required_aliases_resolve_to_the_expected_seeded_skill(database_session: Session) -> None:
    for alias, expected_name in REQUIRED_ALIASES.items():
        resolved_name = database_session.scalar(
            select(Skill.name)
            .join(SkillTerm, SkillTerm.skill_id == Skill.id)
            .where(SkillTerm.normalized_term == normalize_skill_term(alias))
        )
        assert resolved_name == expected_name


def test_exact_reviewed_extraction_term_policy(database_session: Session) -> None:
    extractable = set(
        database_session.scalars(
            select(SkillTerm.term).where(SkillTerm.is_extractable.is_(True))
        ).all()
    )
    assert extractable == EXTRACTABLE_TERMS
    assert len(extractable) == 34
    assert {"C", "JS", "TS", "Node"}.isdisjoint(extractable)


def test_normalized_terms_form_one_global_namespace(database_session: Session) -> None:
    first = add_skill(database_session, "First custom skill")
    second = add_skill(database_session, "Second custom skill")
    add_term(database_session, first, "shared token", is_canonical=True)

    expect_integrity_error(
        database_session,
        lambda: database_session.add(
            SkillTerm(
                skill_id=second.id,
                term="SHARED TOKEN",
                normalized_term=normalize_skill_term("SHARED TOKEN"),
                is_canonical=False,
                is_extractable=False,
            )
        ),
    )


def test_only_one_canonical_term_is_allowed_per_skill(database_session: Session) -> None:
    skill = add_skill(database_session, "Custom tool")
    add_term(database_session, skill, "Custom tool", is_canonical=True)
    expect_integrity_error(
        database_session,
        lambda: database_session.add(
            SkillTerm(
                skill_id=skill.id,
                term="CustomTool",
                normalized_term="customtool",
                is_canonical=True,
                is_extractable=False,
            )
        ),
    )


def test_invalid_skill_category_is_rejected(database_session: Session) -> None:
    expect_integrity_error(
        database_session,
        lambda: database_session.add(Skill(name="Invalid", category="INVALID")),
    )


def test_punctuation_sensitive_seed_terms_are_distinct(database_session: Session) -> None:
    terms = set(
        database_session.scalars(
            select(SkillTerm.normalized_term).where(
                SkillTerm.normalized_term.in_(("c", "c++", "c#", ".net", "node.js", "next.js"))
            )
        ).all()
    )
    assert terms == {"c", "c++", "c#", ".net", "node.js", "next.js"}


def test_job_skill_association_integrity(database_session: Session) -> None:
    first_user, second_user = uuid4(), uuid4()
    first_job = add_owned_job(database_session, first_user)
    second_job = add_owned_job(database_session, second_user)
    skill = seeded_skill(database_session, "Python")
    database_session.add_all(
        [
            JobSkill(
                job_id=first_job.id,
                skill_id=skill.id,
                user_id=first_user,
                is_manual=True,
                is_detected=False,
            ),
            JobSkill(
                job_id=second_job.id,
                skill_id=skill.id,
                user_id=second_user,
                is_manual=False,
                is_detected=True,
            ),
        ]
    )
    database_session.flush()

    expect_integrity_error(
        database_session,
        lambda: database_session.add(
            JobSkill(
                job_id=first_job.id,
                skill_id=skill.id,
                user_id=first_user,
                is_manual=True,
                is_detected=False,
            )
        ),
    )
    expect_integrity_error(
        database_session,
        lambda: database_session.add(
            JobSkill(
                job_id=first_job.id,
                skill_id=seeded_skill(database_session, "Java").id,
                user_id=second_user,
                is_manual=True,
                is_detected=False,
            )
        ),
    )
    expect_integrity_error(
        database_session,
        lambda: database_session.add(
            JobSkill(
                job_id=uuid4(),
                skill_id=skill.id,
                user_id=first_user,
                is_manual=True,
                is_detected=False,
            )
        ),
    )
    expect_integrity_error(
        database_session,
        lambda: database_session.add(
            JobSkill(
                job_id=first_job.id,
                skill_id=uuid4(),
                user_id=first_user,
                is_manual=True,
                is_detected=False,
            )
        ),
    )


def test_job_and_skill_deletion_cascades_are_bounded(database_session: Session) -> None:
    first_user, second_user = uuid4(), uuid4()
    first_job = add_owned_job(database_session, first_user)
    second_job = add_owned_job(database_session, second_user)
    retained_skill = seeded_skill(database_session, "Python")
    deleted_skill = add_skill(database_session, "Disposable skill")
    add_term(database_session, deleted_skill, "Disposable skill", is_canonical=True)
    database_session.add_all(
        [
            JobSkill(
                job_id=first_job.id,
                skill_id=retained_skill.id,
                user_id=first_user,
                is_manual=True,
                is_detected=False,
            ),
            JobSkill(
                job_id=second_job.id,
                skill_id=deleted_skill.id,
                user_id=second_user,
                is_manual=True,
                is_detected=False,
            ),
        ]
    )
    database_session.flush()

    database_session.execute(delete(Job).where(Job.id == first_job.id))
    database_session.flush()
    assert database_session.get(JobSkill, (first_job.id, retained_skill.id)) is None
    assert database_session.get(Skill, retained_skill.id) is not None
    assert (
        database_session.scalar(select(SkillTerm).where(SkillTerm.skill_id == retained_skill.id))
        is not None
    )

    database_session.execute(delete(Skill).where(Skill.id == deleted_skill.id))
    database_session.flush()
    assert database_session.get(JobSkill, (second_job.id, deleted_skill.id)) is None
    assert (
        database_session.scalar(select(SkillTerm).where(SkillTerm.skill_id == deleted_skill.id))
        is None
    )
    assert database_session.get(Job, second_job.id) is not None


def test_existing_job_status_domain_is_unchanged(database_session: Session) -> None:
    user_id = uuid4()
    job = add_owned_job(database_session, user_id)
    event = StatusEvent(user_id=user_id, job_id=job.id, from_status=None, to_status="SAVED")
    database_session.add(event)
    database_session.flush()

    assert job.current_status == "SAVED"
    assert database_session.get(StatusEvent, event.id) is not None
    assert (
        database_session.scalar(
            select(func.count()).select_from(JobSkill).where(JobSkill.job_id == job.id)
        )
        == 0
    )


@pytest.mark.parametrize(
    ("is_manual", "is_detected"),
    [(True, False), (False, True), (True, True)],
)
def test_valid_job_skill_provenance_states(
    database_session: Session, is_manual: bool, is_detected: bool
) -> None:
    user_id = uuid4()
    job = add_owned_job(database_session, user_id)
    skill = seeded_skill(database_session, "Python")
    database_session.add(
        JobSkill(
            job_id=job.id,
            skill_id=skill.id,
            user_id=user_id,
            is_manual=is_manual,
            is_detected=is_detected,
        )
    )
    database_session.flush()


def test_job_skill_requires_non_null_positive_provenance(database_session: Session) -> None:
    user_id = uuid4()
    job = add_owned_job(database_session, user_id)
    skills = [seeded_skill(database_session, name) for name in ("Python", "Java", "Docker")]
    expect_integrity_error(
        database_session,
        lambda: database_session.add(
            JobSkill(
                job_id=job.id,
                skill_id=skills[0].id,
                user_id=user_id,
                is_manual=False,
                is_detected=False,
            )
        ),
    )
    expect_integrity_error(
        database_session,
        lambda: database_session.add(
            JobSkill(
                job_id=job.id,
                skill_id=skills[1].id,
                user_id=user_id,
                is_manual=None,
                is_detected=True,
            )
        ),
    )
    expect_integrity_error(
        database_session,
        lambda: database_session.add(
            JobSkill(
                job_id=job.id,
                skill_id=skills[2].id,
                user_id=user_id,
                is_manual=True,
                is_detected=None,
            )
        ),
    )


def test_suppression_integrity_and_cross_table_exclusion_is_not_database_enforced(
    database_session: Session,
) -> None:
    first_user, second_user = uuid4(), uuid4()
    job = add_owned_job(database_session, first_user)
    skill = seeded_skill(database_session, "Python")
    database_session.add(JobSkillSuppression(job_id=job.id, skill_id=skill.id, user_id=first_user))
    database_session.flush()

    expect_integrity_error(
        database_session,
        lambda: database_session.add(
            JobSkillSuppression(
                job_id=job.id,
                skill_id=seeded_skill(database_session, "Java").id,
                user_id=second_user,
            )
        ),
    )
    expect_integrity_error(
        database_session,
        lambda: database_session.add(
            JobSkillSuppression(job_id=uuid4(), skill_id=skill.id, user_id=first_user)
        ),
    )
    expect_integrity_error(
        database_session,
        lambda: database_session.add(
            JobSkillSuppression(job_id=job.id, skill_id=uuid4(), user_id=first_user)
        ),
    )

    # Deliberately document the cross-table limitation: Increment 2 will enforce exclusion while
    # holding the owned job row lock; no database trigger is used.
    database_session.add(
        JobSkill(
            job_id=job.id,
            skill_id=skill.id,
            user_id=first_user,
            is_manual=True,
            is_detected=False,
        )
    )
    database_session.flush()
    assert database_session.get(JobSkill, (job.id, skill.id)) is not None
    assert database_session.get(JobSkillSuppression, (job.id, skill.id)) is not None


def test_suppression_cascades_are_bounded(database_session: Session) -> None:
    first_user, second_user = uuid4(), uuid4()
    deleted_job = add_owned_job(database_session, first_user)
    retained_job = add_owned_job(database_session, second_user)
    retained_skill = seeded_skill(database_session, "Python")
    deleted_skill = add_skill(database_session, "Suppressed disposable skill")
    add_term(database_session, deleted_skill, "Suppressed disposable skill", is_canonical=True)
    database_session.add_all(
        [
            JobSkillSuppression(
                job_id=deleted_job.id, skill_id=retained_skill.id, user_id=first_user
            ),
            JobSkillSuppression(
                job_id=retained_job.id, skill_id=deleted_skill.id, user_id=second_user
            ),
        ]
    )
    database_session.flush()

    database_session.execute(delete(Job).where(Job.id == deleted_job.id))
    database_session.execute(delete(Skill).where(Skill.id == deleted_skill.id))
    database_session.flush()

    assert database_session.get(JobSkillSuppression, (deleted_job.id, retained_skill.id)) is None
    assert database_session.get(JobSkillSuppression, (retained_job.id, deleted_skill.id)) is None
    assert database_session.get(Skill, retained_skill.id) is not None
    assert database_session.get(Job, retained_job.id) is not None
    assert database_session.get(Company, retained_job.company_id) is not None
