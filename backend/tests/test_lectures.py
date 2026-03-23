def _make_course(client, name="Test Course"):
    r = client.post("/api/courses/", json={"name": name})
    assert r.status_code == 201
    return r.json()["id"]


def test_lecture_crud(client):
    course_id = _make_course(client)

    # create lecture
    r = client.post(
        "/api/lectures/", json={"title": "Lecture 1", "course_id": course_id}
    )
    assert r.status_code == 201
    lec = r.json()
    assert lec["title"] == "Lecture 1"
    assert lec["status"] == "live"
    lecture_id = lec["id"]

    # get lecture
    r = client.get(f"/api/lectures/{lecture_id}")
    assert r.status_code == 200
    assert r.json()["title"] == "Lecture 1"

    # list by course
    r = client.get(f"/api/courses/{course_id}/lectures")
    assert r.status_code == 200
    assert len(r.json()) == 1

    # stop lecture
    r = client.post(f"/api/lectures/{lecture_id}/stop", json={"active_seconds": 120.0})
    assert r.status_code == 200
    assert r.json()["status"] == "complete"

    # delete
    r = client.delete(f"/api/lectures/{lecture_id}")
    assert r.status_code == 204

    # confirm gone
    r = client.get(f"/api/lectures/{lecture_id}")
    assert r.status_code == 404


def test_create_lecture_missing_course(client):
    r = client.post("/api/lectures/", json={"title": "X", "course_id": "bad-id"})
    assert r.status_code == 404
