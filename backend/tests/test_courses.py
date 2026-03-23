def test_course_crud(client):
    # create
    r = client.post("/api/courses/", json={"name": "Math"})
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Math"
    course_id = data["id"]

    # list
    r = client.get("/api/courses/")
    assert r.status_code == 200
    assert len(r.json()) == 1

    # update
    r = client.put(f"/api/courses/{course_id}", json={"name": "Physics"})
    assert r.status_code == 200
    assert r.json()["name"] == "Physics"

    # delete
    r = client.delete(f"/api/courses/{course_id}")
    assert r.status_code == 204

    # list empty
    r = client.get("/api/courses/")
    assert r.json() == []


def test_update_missing_course(client):
    r = client.put("/api/courses/nonexistent", json={"name": "X"})
    assert r.status_code == 404
