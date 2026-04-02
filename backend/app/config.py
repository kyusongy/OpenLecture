import os

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "OpenLecture"
    debug: bool = True
    log_level: str = "INFO"
    cors_origins: str = "*"

    # DashScope (single key for both ASR + MT)
    dashscope_api_key: str = ""

    # "international" (Singapore, default) or "china" (Beijing)
    dashscope_endpoint: str = "international"

    # Where lecture data is stored
    openlecture_app_mode: str = ""
    data_dir: str = ""

    model_config = {
        "env_file": ("../.env", ".env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

    def model_post_init(self, __context) -> None:
        if not self.data_dir:
            if self.openlecture_app_mode == "desktop":
                self.data_dir = os.path.join(
                    os.path.expanduser("~/Library/Application Support"),
                    "OpenLecture",
                    "data",
                )
            else:
                self.data_dir = "./data"

    @property
    def dashscope_ws_base(self) -> str:
        if self.dashscope_endpoint == "china":
            return "wss://dashscope.aliyuncs.com"
        return "wss://dashscope-intl.aliyuncs.com"

    @property
    def dashscope_http_base(self) -> str:
        if self.dashscope_endpoint == "china":
            return "https://dashscope.aliyuncs.com"
        return "https://dashscope-intl.aliyuncs.com"


settings = Settings()
