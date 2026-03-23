def _setup(client):
    course_id = client.post("/api/courses/", json={"name": "C"}).json()["id"]
    lecture_id = client.post(
        "/api/lectures/", json={"title": "L", "course_id": course_id}
    ).json()["id"]
    return lecture_id


def test_notes_crud(client):
    lid = _setup(client)

    # empty by default
    r = client.get(f"/api/lectures/{lid}/notes")
    assert r.status_code == 200
    assert r.json()["content"] == ""

    # update
    r = client.put(f"/api/lectures/{lid}/notes", json={"content": "# Notes"})
    assert r.status_code == 200
    assert r.json()["content"] == "# Notes"

    # verify persisted
    r = client.get(f"/api/lectures/{lid}/notes")
    assert r.json()["content"] == "# Notes"
