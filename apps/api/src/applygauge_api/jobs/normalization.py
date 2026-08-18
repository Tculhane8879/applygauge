def normalize_company_name(name: str) -> str:
    """Return the deterministic per-user company comparison key."""
    return " ".join(name.strip().split()).casefold()
