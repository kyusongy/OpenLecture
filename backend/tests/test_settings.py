def test_settings_defaults(client):
    r = client.get("/api/settings/")
    assert r.status_code == 200
    data = r.json()
    assert data["default_source_language"] == "EN"
    assert data["default_target_language"] == "ZH"
    assert data["api_key_configured"] is False
    assert data["dashscope_endpoint"] == "international"
    assert data["storage_mode"] == "local"
    assert data["data_dir"]


def test_settings_update(client):
    r = client.put("/api/settings/", json={"default_target_language": "JA"})
    assert r.status_code == 200

    r = client.get("/api/settings/")
    assert r.json()["default_target_language"] == "JA"
    # other fields unchanged
    assert r.json()["default_source_language"] == "EN"


def test_settings_update_endpoint(client):
    from app.config import settings as app_settings

    r = client.put("/api/settings/", json={"dashscope_endpoint": "china"})
    assert r.status_code == 200
    assert app_settings.dashscope_endpoint == "china"
    assert r.json()["dashscope_endpoint"] == "china"
    # Reset for other tests
    app_settings.dashscope_endpoint = "international"


def test_settings_model_loads_stored_endpoint(tmp_path):
    import json
    from app.config import Settings

    data_dir = tmp_path / "data"
    data_dir.mkdir()
    (data_dir / "settings.json").write_text(
        json.dumps({"dashscope_endpoint": "china"}),
        encoding="utf-8",
    )

    runtime_settings = Settings(data_dir=str(data_dir), dashscope_endpoint="international")
    assert runtime_settings.dashscope_endpoint == "china"
