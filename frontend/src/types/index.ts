export interface TranscriptLine {
  id: string;
  lineIndex: number;
  timestampMs: number;
  text: string;
  translatedText?: string;
  sentenceId?: string;
  isFinal: boolean;
}

export interface Lecture {
  id: string;
  title: string;
  course_id: string;
  source_language: string;
  target_language: string;
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  status: "live" | "complete";
}

export interface Course {
  id: string;
  name: string;
  created_at: string;
}

export interface AppSettings {
  api_key_configured: boolean;
  default_source_language: string;
  default_target_language: string;
  dashscope_endpoint: string;
  data_dir: string;
  storage_mode: string;
}
