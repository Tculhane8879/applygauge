"""Pure deterministic matching for extraction-enabled skill terms."""

import re
import unicodedata
from dataclasses import dataclass
from uuid import UUID


@dataclass(frozen=True)
class ExtractionTerm:
    """The catalog data required to match one extraction-enabled term."""

    skill_id: UUID
    normalized_term: str


@dataclass(frozen=True)
class _Candidate:
    start: int
    end: int
    literal_length: int
    normalized_term: str
    skill_id: UUID


def preprocess_description(description: str | None) -> str:
    """Normalize prose for case-insensitive literal matching without term-input cleaning."""
    if description is None:
        return ""
    return unicodedata.normalize("NFKC", description).casefold()


def extract_skill_ids(
    description: str | None,
    terms: tuple[ExtractionTerm, ...] | list[ExtractionTerm],
) -> tuple[UUID, ...]:
    """Return deterministically ordered canonical IDs matched in the supplied prose."""
    normalized_description = preprocess_description(description)
    if not normalized_description.strip():
        return ()

    candidates: list[_Candidate] = []
    for term in terms:
        if not term.normalized_term:
            raise ValueError("Extraction terms must have a non-empty normalized literal.")
        pattern = _literal_pattern(term.normalized_term)
        for match in pattern.finditer(normalized_description):
            candidates.append(
                _Candidate(
                    start=match.start(),
                    end=match.end(),
                    literal_length=len(term.normalized_term),
                    normalized_term=term.normalized_term,
                    skill_id=term.skill_id,
                )
            )

    candidates.sort(
        key=lambda candidate: (
            -candidate.literal_length,
            candidate.start,
            candidate.end,
            candidate.normalized_term,
            candidate.skill_id.int,
        )
    )
    occupied: list[tuple[int, int]] = []
    matched_skill_ids: set[UUID] = set()
    for candidate in candidates:
        if any(candidate.start < end and start < candidate.end for start, end in occupied):
            continue
        occupied.append((candidate.start, candidate.end))
        matched_skill_ids.add(candidate.skill_id)

    return tuple(sorted(matched_skill_ids, key=lambda skill_id: skill_id.int))


def _literal_pattern(normalized_term: str) -> re.Pattern[str]:
    pieces = normalized_term.split(" ")
    escaped_literal = r"\s+".join(re.escape(piece) for piece in pieces)
    right_boundary = r"(?!\w)"
    if normalized_term.endswith("++"):
        right_boundary = r"(?![\w+])"
    elif normalized_term.endswith("#"):
        right_boundary = r"(?![\w#])"
    return re.compile(rf"(?<!\w){escaped_literal}{right_boundary}")
