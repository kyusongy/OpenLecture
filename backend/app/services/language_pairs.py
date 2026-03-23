"""Language support for transcription (ASR) and translation (MT)."""

QWEN_ASR_LANGUAGES: dict[str, str] = {
    "ZH": "Chinese (Mandarin)",
    "YUE": "Cantonese",
    "EN": "English",
    "JA": "Japanese",
    "KO": "Korean",
    "FR": "French",
    "DE": "German",
    "ES": "Spanish",
    "RU": "Russian",
    "IT": "Italian",
    "PT": "Portuguese",
    "AR": "Arabic",
    "TH": "Thai",
    "HI": "Hindi",
    "ID": "Indonesian",
    "TR": "Turkish",
    "VI": "Vietnamese",
    "UK": "Ukrainian",
    "CS": "Czech",
    "DA": "Danish",
    "FI": "Finnish",
    "MS": "Malay",
    "NL": "Dutch",
    "NO": "Norwegian",
    "PL": "Polish",
    "SV": "Swedish",
    "TL": "Filipino",
    "IS": "Icelandic",
}

TRANSLATION_TARGETS: dict[str, str] = {
    "ZH": "Chinese",
    "EN": "English",
    "JA": "Japanese",
    "KO": "Korean",
    "FR": "French",
    "DE": "German",
    "ES": "Spanish",
    "PT": "Portuguese",
    "RU": "Russian",
    "AR": "Arabic",
}

ALL_TARGETS = sorted(TRANSLATION_TARGETS.keys())


def get_asr_languages() -> dict[str, str]:
    return QWEN_ASR_LANGUAGES


def get_sources() -> list[str]:
    return sorted(QWEN_ASR_LANGUAGES.keys())


def get_labels() -> dict[str, str]:
    return {**QWEN_ASR_LANGUAGES, **TRANSLATION_TARGETS}


def validate_source(source: str) -> bool:
    return source.upper() in QWEN_ASR_LANGUAGES


def validate_target(target: str) -> bool:
    return target.upper() in TRANSLATION_TARGETS
