from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "OpenLecture"
    debug: bool = True
    log_level: str = "INFO"
    cors_origins: str = "http://localhost:5173"

    # DashScope (single key for both ASR + MT)
    dashscope_api_key: str = ""

    # "international" (Singapore, default) or "china" (Beijing)
    dashscope_endpoint: str = "international"

    # Where lecture data is stored
    data_dir: str = "./data"

    model_config = {
        "env_file": ("../.env", ".env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

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
