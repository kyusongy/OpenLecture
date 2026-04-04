from pydantic import BaseModel


class CourseCreate(BaseModel):
    name: str


class CourseUpdate(BaseModel):
    name: str


class CourseResponse(BaseModel):
    id: str
    name: str
    created_at: str


class LectureCreate(BaseModel):
    title: str
    course_id: str
    source_language: str = "EN"
    target_language: str = "ZH"


class LectureStop(BaseModel):
    active_seconds: float | None = None


class LectureResponse(BaseModel):
    id: str
    title: str
    course_id: str
    source_language: str = "EN"
    target_language: str = "ZH"
    started_at: str
    ended_at: str | None = None
    duration_seconds: int | None = None
    status: str = "live"  # live | complete


class TranscriptLineSchema(BaseModel):
    line_index: int
    timestamp_ms: int
    text: str
    translated_text: str | None = None
    is_final: bool = True
    sentence_id: str | None = None


class TranscriptBatch(BaseModel):
    lines: list[TranscriptLineSchema]


class TranslateRequest(BaseModel):
    texts: list[str]
    target_lang: str = "ZH"


class TranslateResponse(BaseModel):
    translations: list[str]


class SettingsResponse(BaseModel):
    api_key_configured: bool
    default_source_language: str
    default_target_language: str
    dashscope_endpoint: str
    data_dir: str
    storage_mode: str


class SettingsUpdate(BaseModel):
    dashscope_api_key: str | None = None
    dashscope_endpoint: str | None = None
    default_source_language: str | None = None
    default_target_language: str | None = None


class NotesResponse(BaseModel):
    content: str


class NotesUpdate(BaseModel):
    content: str
