import type { Course, Lecture, TranscriptLine, AppSettings } from "../types";

let BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export function initApi(port: number) {
  BASE_URL = `http://localhost:${port}`;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body?.detail ?? `API error: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function getWsUrl(path: string): string {
  const proto = BASE_URL.startsWith("https") ? "wss" : "ws";
  const host = BASE_URL.replace(/^https?:\/\//, "");
  return `${proto}://${host}${path}`;
}

// Courses
export const getCourses = (): Promise<Course[]> =>
  request("/api/courses/");

export const createCourse = (name: string): Promise<Course> =>
  request("/api/courses/", {
    method: "POST",
    body: JSON.stringify({ name }),
  });

export const updateCourse = (courseId: string, name: string): Promise<Course> =>
  request(`/api/courses/${courseId}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });

export const deleteCourse = (courseId: string): Promise<void> =>
  request(`/api/courses/${courseId}`, { method: "DELETE" });

// Lectures
export const getLectures = (courseId: string): Promise<Lecture[]> =>
  request(`/api/courses/${courseId}/lectures`);

export const getLecture = (id: string): Promise<Lecture> =>
  request(`/api/lectures/${id}`);

export const createLecture = (
  title: string,
  courseId: string,
  sourceLang?: string,
  targetLang?: string,
): Promise<{ id: string }> =>
  request("/api/lectures/", {
    method: "POST",
    body: JSON.stringify({
      title,
      course_id: courseId,
      ...(sourceLang && { source_language: sourceLang }),
      ...(targetLang && { target_language: targetLang }),
    }),
  });

export const stopLecture = (
  lectureId: string,
  activeSeconds?: number,
): Promise<Lecture> =>
  request(`/api/lectures/${lectureId}/stop`, {
    method: "POST",
    body: JSON.stringify({ active_seconds: activeSeconds }),
  });

export const deleteLecture = (lectureId: string): Promise<void> =>
  request(`/api/lectures/${lectureId}`, { method: "DELETE" });

// Transcripts
export const getTranscript = async (
  lectureId: string,
): Promise<TranscriptLine[]> => {
  const lines = await request<Record<string, unknown>[]>(
    `/api/lectures/${lectureId}/transcript`,
  );
  return lines.map((l) => ({
    id: l.id as string,
    lineIndex: l.line_index as number,
    timestampMs: l.timestamp_ms as number,
    text: l.text as string,
    translatedText: l.translated_text as string | undefined,
    sentenceId: l.sentence_id as string | undefined,
    isFinal: l.is_final as boolean,
  }));
};

export const postTranscriptLines = (
  lectureId: string,
  lines: TranscriptLine[],
): Promise<void> =>
  request(`/api/lectures/${lectureId}/transcript`, {
    method: "POST",
    body: JSON.stringify({
      lines: lines.map((l) => ({
        line_index: l.lineIndex,
        timestamp_ms: l.timestampMs,
        text: l.text,
        translated_text: l.translatedText ?? null,
        sentence_id: l.sentenceId,
        is_final: l.isFinal,
      })),
    }),
  });

// Notes
export const getNotes = async (lectureId: string): Promise<string> => {
  const data = await request<{ content: string }>(
    `/api/lectures/${lectureId}/notes`,
  );
  return data.content;
};

export const saveNotes = (
  lectureId: string,
  content: string,
): Promise<void> =>
  request(`/api/lectures/${lectureId}/notes`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  });

// Languages
export const getLanguagePairs = (): Promise<{
  sources: string[];
  targets: string[];
  labels: Record<string, string>;
}> => request("/api/languages/pairs");

// Translation
export const translateTexts = (
  texts: string[],
  targetLang?: string,
): Promise<{ translations: string[] }> =>
  request("/api/translate", {
    method: "POST",
    body: JSON.stringify({ texts, target_lang: targetLang }),
  });

// Settings
export const getSettings = (): Promise<AppSettings> =>
  request("/api/settings/");

export const updateSettings = (
  updates: Record<string, string>,
): Promise<AppSettings> =>
  request("/api/settings/", {
    method: "PUT",
    body: JSON.stringify(updates),
  });
