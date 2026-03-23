import pytest
from app.storage import StorageService


@pytest.fixture
def store(tmp_path):
    return StorageService(str(tmp_path))


def test_create_and_list_courses(store):
    c = store.create_course("Math 101")
    assert c["name"] == "Math 101"
    assert "id" in c
    courses = store.list_courses()
    assert len(courses) == 1
    assert courses[0]["id"] == c["id"]


def test_delete_course(store):
    c = store.create_course("Physics")
    store.delete_course(c["id"])
    assert store.list_courses() == []


def test_create_and_list_lectures(store):
    c = store.create_course("CS 101")
    lec = store.create_lecture(c["id"], "Intro", "EN", "ZH")
    assert lec["title"] == "Intro"
    lectures = store.list_lectures(c["id"])
    assert len(lectures) == 1


def test_append_transcript(store):
    c = store.create_course("Test")
    lec = store.create_lecture(c["id"], "Lec1", "EN", "ZH")
    lines = [
        {
            "line_index": 0,
            "timestamp_ms": 1000,
            "text": "Hello",
            "translated_text": None,
        }
    ]
    store.append_transcript(lec["id"], lines)
    result = store.get_transcript(lec["id"])
    assert len(result) == 1
    assert result[0]["text"] == "Hello"


def test_append_transcript_dedup(store):
    c = store.create_course("Test")
    lec = store.create_lecture(c["id"], "Lec1", "EN", "ZH")
    lines = [
        {
            "line_index": 0,
            "timestamp_ms": 1000,
            "text": "Hello",
            "translated_text": None,
        }
    ]
    store.append_transcript(lec["id"], lines)
    lines2 = [
        {
            "line_index": 0,
            "timestamp_ms": 1000,
            "text": "Hello world",
            "translated_text": "你好世界",
        }
    ]
    store.append_transcript(lec["id"], lines2)
    result = store.get_transcript(lec["id"])
    assert len(result) == 1
    assert result[0]["text"] == "Hello world"


def test_notes(store):
    c = store.create_course("Test")
    lec = store.create_lecture(c["id"], "Lec1", "EN", "ZH")
    assert store.get_notes(lec["id"]) == ""
    store.save_notes(lec["id"], "# My Notes")
    assert store.get_notes(lec["id"]) == "# My Notes"


def test_settings(store):
    s = store.get_settings()
    assert s["default_source_language"] == "EN"
    store.update_settings({"default_target_language": "JA"})
    s = store.get_settings()
    assert s["default_target_language"] == "JA"
