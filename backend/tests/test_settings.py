def test_settings_defaults(client):
    r = client.get("/api/settings/")
    assert r.status_code == 200
    data = r.json()
    assert data["default_source_language"] == "EN"
    assert data["default_target_language"] == "ZH"
    assert data["api_key_configured"] is False


def test_settings_update(client):
    r = client.put("/api/settings/", json={"default_target_language": "JA"})
    assert r.status_code == 200

    r = client.get("/api/settings/")
    assert r.json()["default_target_language"] == "JA"
    # other fields unchanged
    assert r.json()["default_source_language"] == "EN"
