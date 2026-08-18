from applygauge_api.jobs.normalization import normalize_company_name


def test_company_name_normalization_is_deterministic() -> None:
    assert normalize_company_name("  ACME\t Software   Inc.  ") == "acme software inc."
