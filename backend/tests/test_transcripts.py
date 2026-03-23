def _setup(client):
    course_id = client.post("/api/courses/", json={"name": "C"}).json()["id"]
    lecture_id = client.post(
        "/api/lectures/", json={"title": "L", "course_id": course_id}
    ).json()["id"]
    return lecture_id


def test_append_and_get(client):
    lid = _setup(client)

    r = client.post(
        f"/api/lectures/{lid}/transcript",
        json={"lines": [{"line_index": 0, "timestamp_ms": 1000, "text": "Hello"}]},
    )
    assert r.status_code == 201

    r = client.get(f"/api/lectures/{lid}/transcript")
    assert r.status_code == 200
    lines = r.json()
    assert len(lines) == 1
    assert lines[0]["text"] == "Hello"


def test_dedup_same_index(client):
    lid = _setup(client)

    client.post(
        f"/api/lectures/{lid}/transcript",
        json={"lines": [{"line_index": 0, "timestamp_ms": 1000, "text": "Hello"}]},
    )
    client.post(
        f"/api/lectures/{lid}/transcript",
        json={
            "lines": [{"line_index": 0, "timestamp_ms": 1000, "text": "Hello world"}]
        },
    )

    r = client.get(f"/api/lectures/{lid}/transcript")
    lines = r.json()
    assert len(lines) == 1
    assert lines[0]["text"] == "Hello world"
