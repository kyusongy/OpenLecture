def test_language_pairs(client):
    r = client.get("/api/languages/pairs")
    assert r.status_code == 200
    data = r.json()

    assert "sources" in data
    assert "targets" in data
    assert "labels" in data

    assert "EN" in data["sources"]
    assert "ZH" in data["sources"]
    assert "JA" in data["sources"]

    assert "EN" in data["targets"]
    assert "ZH" in data["targets"]
