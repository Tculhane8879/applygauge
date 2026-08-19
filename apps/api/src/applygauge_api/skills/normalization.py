import unicodedata

MAX_SKILL_TERM_LENGTH = 100


class InvalidSkillTermError(ValueError):
    """Raised when a value cannot be normalized into a valid skill term."""


def clean_skill_term(value: str) -> str:
    """Validate and clean a skill term while preserving its display punctuation and casing."""
    if not isinstance(value, str):
        raise TypeError("Skill terms must be strings.")

    unicode_normalized = unicodedata.normalize("NFKC", value)
    if any(unicodedata.category(character) in {"Cc", "Cf"} for character in unicode_normalized):
        raise InvalidSkillTermError("Skill terms cannot contain control or format characters.")

    cleaned = " ".join(unicode_normalized.strip().split())
    if not cleaned:
        raise InvalidSkillTermError("Skill terms cannot be empty.")
    if len(cleaned) > MAX_SKILL_TERM_LENGTH:
        raise InvalidSkillTermError(
            f"Skill terms cannot exceed {MAX_SKILL_TERM_LENGTH} characters."
        )

    return cleaned


def normalize_skill_term(value: str) -> str:
    """Return the deterministic lookup key for a canonical skill name or alias."""
    normalized = clean_skill_term(value).casefold()
    if len(normalized) > MAX_SKILL_TERM_LENGTH:
        raise InvalidSkillTermError(
            f"Normalized skill terms cannot exceed {MAX_SKILL_TERM_LENGTH} characters."
        )
    return normalized
