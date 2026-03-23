import pytest
from fastapi.testclient import TestClient
from app.config import settings
from app.main import app


@pytest.fixture(autouse=True)
def tmp_data_dir(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "data_dir", str(tmp_path))
    monkeypatch.setattr(settings, "dashscope_api_key", "")
    return tmp_path


@pytest.fixture
def client():
    return TestClient(app)
