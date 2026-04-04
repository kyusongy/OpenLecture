"""Local filesystem storage service for courses, lectures, transcripts, and notes."""

import json
import os
import shutil
import uuid
from datetime import datetime, timezone
from typing import Any


class StorageService:
    def __init__(self, data_dir: str):
        self.data_dir = data_dir
        self.courses_dir = os.path.join(data_dir, "courses")
        os.makedirs(self.courses_dir, exist_ok=True)

    # ── helpers ──────────────────────────────────────────────

    def _read_json(self, path: str, default: Any = None) -> Any:
        if not os.path.exists(path):
            return default
        with open(path) as f:
            return json.load(f)

    def _write_json(self, path: str, data: Any):
        tmp = path + ".tmp"
        with open(tmp, "w") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        os.replace(tmp, path)

    def _courses_path(self) -> str:
        return os.path.join(self.data_dir, "courses.json")

    def _safe_path(self, base: str, *parts: str) -> str:
        """Join path parts and verify result stays within base directory."""
        path = os.path.realpath(os.path.join(base, *parts))
        if not path.startswith(os.path.realpath(base)):
            raise ValueError("Invalid path component")
        return path

    def _course_dir(self, course_id: str) -> str:
        return self._safe_path(self.courses_dir, course_id)

    def _lectures_path(self, course_id: str) -> str:
        return os.path.join(self._course_dir(course_id), "lectures.json")

    def _lecture_dir(self, course_id: str, lecture_id: str) -> str:
        return self._safe_path(self._course_dir(course_id), lecture_id)

    def _settings_path(self) -> str:
        return os.path.join(self.data_dir, "settings.json")

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def _find_lecture(self, lecture_id: str) -> tuple[str, dict] | None:
        """Scan all courses to locate a lecture by id."""
        for course in self.list_courses():
            lectures_data = self._read_json(
                self._lectures_path(course["id"]),
                {"version": 1, "lectures": []},
            )
            for lec in lectures_data["lectures"]:
                if lec["id"] == lecture_id:
                    return course["id"], lec
        return None

    # ── courses ──────────────────────────────────────────────

    def list_courses(self) -> list[dict]:
        data = self._read_json(self._courses_path(), {"version": 1, "courses": []})
        return data["courses"]

    def create_course(self, name: str) -> dict:
        data = self._read_json(self._courses_path(), {"version": 1, "courses": []})
        course = {
            "id": str(uuid.uuid4()),
            "name": name,
            "created_at": self._now_iso(),
        }
        data["courses"].append(course)
        self._write_json(self._courses_path(), data)
        os.makedirs(self._course_dir(course["id"]), exist_ok=True)
        # init empty lectures list
        self._write_json(
            self._lectures_path(course["id"]),
            {"version": 1, "lectures": []},
        )
        return course

    def get_course(self, course_id: str) -> dict | None:
        for c in self.list_courses():
            if c["id"] == course_id:
                return c
        return None

    def update_course(self, course_id: str, name: str) -> dict | None:
        data = self._read_json(self._courses_path(), {"version": 1, "courses": []})
        for c in data["courses"]:
            if c["id"] == course_id:
                c["name"] = name
                self._write_json(self._courses_path(), data)
                return c
        return None

    def delete_course(self, course_id: str):
        data = self._read_json(self._courses_path(), {"version": 1, "courses": []})
        data["courses"] = [c for c in data["courses"] if c["id"] != course_id]
        self._write_json(self._courses_path(), data)
        course_dir = self._course_dir(course_id)
        if os.path.exists(course_dir):
            shutil.rmtree(course_dir)

    # ── lectures ─────────────────────────────────────────────

    def list_lectures(self, course_id: str) -> list[dict]:
        data = self._read_json(
            self._lectures_path(course_id),
            {"version": 1, "lectures": []},
        )
        return data["lectures"]

    def create_lecture(
        self,
        course_id: str,
        title: str,
        source_lang: str,
        target_lang: str,
    ) -> dict:
        data = self._read_json(
            self._lectures_path(course_id),
            {"version": 1, "lectures": []},
        )
        lecture = {
            "id": str(uuid.uuid4()),
            "title": title,
            "course_id": course_id,
            "source_language": source_lang,
            "target_language": target_lang,
            "started_at": self._now_iso(),
            "ended_at": None,
            "duration_seconds": None,
            "status": "live",
        }
        data["lectures"].append(lecture)
        self._write_json(self._lectures_path(course_id), data)
        os.makedirs(self._lecture_dir(course_id, lecture["id"]), exist_ok=True)
        return lecture

    def get_lecture(self, lecture_id: str) -> dict | None:
        result = self._find_lecture(lecture_id)
        return result[1] if result else None

    def stop_lecture(
        self, lecture_id: str, duration: float | None = None
    ) -> dict | None:
        result = self._find_lecture(lecture_id)
        if not result:
            return None
        course_id, _ = result
        data = self._read_json(self._lectures_path(course_id))
        for lec in data["lectures"]:
            if lec["id"] == lecture_id:
                lec["status"] = "complete"
                lec["ended_at"] = self._now_iso()
                if duration is not None:
                    lec["duration_seconds"] = int(duration)
                self._write_json(self._lectures_path(course_id), data)
                return lec
        return None

    def delete_lecture(self, lecture_id: str):
        result = self._find_lecture(lecture_id)
        if not result:
            return
        course_id, _ = result
        data = self._read_json(self._lectures_path(course_id))
        data["lectures"] = [l for l in data["lectures"] if l["id"] != lecture_id]
        self._write_json(self._lectures_path(course_id), data)
        lec_dir = self._lecture_dir(course_id, lecture_id)
        if os.path.exists(lec_dir):
            shutil.rmtree(lec_dir)

    # ── transcript ───────────────────────────────────────────

    def get_transcript(self, lecture_id: str) -> list[dict]:
        result = self._find_lecture(lecture_id)
        if not result:
            return []
        course_id, _ = result
        path = os.path.join(self._lecture_dir(course_id, lecture_id), "transcript.json")
        data = self._read_json(path, {"version": 1, "lines": []})
        return data["lines"]

    def append_transcript(self, lecture_id: str, lines: list[dict]):
        result = self._find_lecture(lecture_id)
        if not result:
            return
        course_id, _ = result
        path = os.path.join(self._lecture_dir(course_id, lecture_id), "transcript.json")
        data = self._read_json(path, {"version": 1, "lines": []})
        # index existing lines for dedup
        by_index = {line["line_index"]: i for i, line in enumerate(data["lines"])}
        for line in lines:
            idx = line["line_index"]
            if idx in by_index:
                data["lines"][by_index[idx]] = line  # overwrite
            else:
                by_index[idx] = len(data["lines"])
                data["lines"].append(line)
        self._write_json(path, data)

    # ── notes ────────────────────────────────────────────────

    def get_notes(self, lecture_id: str) -> str:
        result = self._find_lecture(lecture_id)
        if not result:
            return ""
        course_id, _ = result
        path = os.path.join(self._lecture_dir(course_id, lecture_id), "notes.md")
        if not os.path.exists(path):
            return ""
        with open(path) as f:
            return f.read()

    def save_notes(self, lecture_id: str, content: str):
        result = self._find_lecture(lecture_id)
        if not result:
            return
        course_id, _ = result
        path = os.path.join(self._lecture_dir(course_id, lecture_id), "notes.md")
        with open(path, "w") as f:
            f.write(content)

    # ── settings ─────────────────────────────────────────────

    _default_settings = {
        "version": 1,
        "default_source_language": "EN",
        "default_target_language": "ZH",
        "dashscope_endpoint": "international",
    }

    def get_settings(self) -> dict:
        data = self._read_json(self._settings_path())
        if data is None:
            return dict(self._default_settings)
        return {**self._default_settings, **data}

    def update_settings(self, updates: dict) -> dict:
        current = self.get_settings()
        current.update(updates)
        self._write_json(self._settings_path(), current)
        return current
