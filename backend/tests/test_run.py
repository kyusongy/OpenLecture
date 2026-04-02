import os
import socket

from app.run import find_free_port


def test_find_free_port_returns_available_port():
    port = find_free_port(8000)
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", port))


def test_find_free_port_skips_occupied():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        s.listen(1)
        occupied_port = s.getsockname()[1]
        port = find_free_port(occupied_port)
        assert port != occupied_port


def test_config_desktop_mode_data_dir(monkeypatch):
    monkeypatch.setenv("OPENLECTURE_APP_MODE", "desktop")
    monkeypatch.delenv("DATA_DIR", raising=False)
    from app.config import Settings

    s = Settings()
    expected = os.path.join(
        os.path.expanduser("~/Library/Application Support"),
        "OpenLecture",
        "data",
    )
    assert s.data_dir == expected


def test_config_default_data_dir(monkeypatch):
    monkeypatch.delenv("OPENLECTURE_APP_MODE", raising=False)
    monkeypatch.delenv("DATA_DIR", raising=False)
    from app.config import Settings

    s = Settings()
    assert s.data_dir == "./data"
