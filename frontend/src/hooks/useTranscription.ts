import { useCallback, useEffect, useRef, useState } from "react";
import type { TranscriptLine } from "../types";
import {
  createTranscriptionSocket,
  sendAudio,
  closeTranscription,
} from "../lib/transcription-ws";
import type { TranscriptData, TranslationData } from "../lib/transcription-ws";
import { registerPCMWorklet } from "../lib/pcm-worklet";
import { createLecture, postTranscriptLines, getTranscript, getWsUrl } from "../lib/api";
import { generateId } from "../lib/utils";

export type RecordingState =
  | "idle"
  | "connecting"
  | "recording"
  | "reconnecting"
  | "paused";

const MAX_RECONNECT = 3;
const BASE_DELAY = 1000;
const SAVE_BATCH_SIZE = 10;

const SESSION_KEY = "openlecture_live_session";

interface SavedSession {
  lectureId: string;
  startTime: number;
  pausedDuration: number;
  lineIndex: number;
  savedAt: number;
}

function getSavedSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearSavedSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function useTranscription() {
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [state, setState] = useState<RecordingState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [lectureId, setLectureId] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const lineIndexRef = useRef(0);
  const interimIdRef = useRef<string | null>(null);
  const lastFinalTextRef = useRef<string>("");
  const recentFinalsRef = useRef<
    { lineId: string; lineIndex: number; text: string; startSec: number; prefix: string }[]
  >([]);
  const userStoppedRef = useRef(false);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionGenerationRef = useRef(0);
  const lectureIdRef = useRef<string | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const pausedAtRef = useRef<number | null>(null);
  const pausedDurationRef = useRef(0);
  const lastTranscriptAtRef = useRef<number>(0);

  // Refs for unmount cleanup
  const startTimeRef = useRef<number | null>(null);
  const linesRef = useRef<TranscriptLine[]>([]);

  const [translationEnabled, setTranslationEnabled] = useState(true);
  const translationEnabledRef = useRef(true);

  // Store language config for reconnection
  const langConfigRef = useRef<{ source: string; target: string }>({
    source: "EN",
    target: "ZH",
  });

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Keep refs in sync with state
  useEffect(() => {
    translationEnabledRef.current = translationEnabled;
  }, [translationEnabled]);
  useEffect(() => {
    startTimeRef.current = startTime;
  }, [startTime]);
  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

  // Save session and clean up on unmount
  useEffect(() => {
    return () => {
      const lid = lectureIdRef.current;
      const st = startTimeRef.current;

      if (!userStoppedRef.current && lid && st) {
        const totalPaused = pausedDurationRef.current +
          (pausedAtRef.current ? Date.now() - pausedAtRef.current : 0);
        const session: SavedSession = {
          lectureId: lid,
          startTime: st,
          pausedDuration: totalPaused,
          lineIndex: lineIndexRef.current,
          savedAt: Date.now(),
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));

        const currentLines = linesRef.current.filter((l) => l.isFinal);
        if (currentLines.length > 0) {
          postTranscriptLines(lid, currentLines).catch(() => {});
        }
      }
      unsavedRef.current.length = 0;

      userStoppedRef.current = true;
      sessionGenerationRef.current += 1;
      clearReconnectTimeout();

      if (wsRef.current) {
        closeTranscription(wsRef.current);
        wsRef.current = null;
      }
      sourceNodeRef.current?.disconnect();
      sourceNodeRef.current = null;
      workletNodeRef.current?.disconnect();
      workletNodeRef.current = null;
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [clearReconnectTimeout]);

  const unsavedRef = useRef<TranscriptLine[]>([]);

  const flushUnsaved = useCallback(async () => {
    const batch = unsavedRef.current.splice(0);
    const lid = lectureIdRef.current;
    if (batch.length === 0 || !lid) return;

    try {
      await postTranscriptLines(lid, batch);
    } catch (err) {
      console.error("Failed to save transcript lines:", err);
      unsavedRef.current.unshift(...batch);
    }
  }, []);

  const handleTranscript = useCallback(
    ({ text, isFinal, sentenceId: rawSid, timestampMs }: TranscriptData) => {
      // Prefix sentenceId with session generation to avoid collisions after pause/resume
      const sentenceId = `${sessionGenerationRef.current}_${rawSid}`;
      lastTranscriptAtRef.current = Date.now();
      const startSec = timestampMs / 1000;

      if (isFinal) {
        const currentInterimId = interimIdRef.current;
        if (currentInterimId) {
          setLines((prev) => prev.filter((l) => l.id !== currentInterimId));
          interimIdRef.current = null;
        }

        if (text === lastFinalTextRef.current) return;

        // Resegmentation detection
        const prefix = text
          .split(/\s+/)
          .slice(0, 3)
          .join(" ")
          .toLowerCase()
          .replace(/[.,!?;:]/g, "");

        const overlapEntry =
          prefix.length >= 8
            ? recentFinalsRef.current.find((prev) => {
                if (Math.abs(startSec - prev.startSec) <= 3 && prev.prefix === prefix) return true;
                if (Math.abs(startSec - prev.startSec) <= 10) {
                  const shorter = text.length < prev.text.length ? text : prev.text;
                  if (shorter.length >= 15) {
                    return prev.text.includes(text) || text.includes(prev.text);
                  }
                }
                return false;
              })
            : undefined;

        if (overlapEntry) {
          if (text.length > overlapEntry.text.length) {
            const newLine: TranscriptLine = {
              id: generateId(),
              lineIndex: overlapEntry.lineIndex,
              timestampMs,
              text,
              sentenceId,
              isFinal: true,
            };

            setLines((prev) =>
              prev.map((l) =>
                l.id === overlapEntry.lineId
                  ? { ...newLine, translatedText: l.translatedText }
                  : l,
              ),
            );

            const ui = unsavedRef.current.findIndex((l) => l.id === overlapEntry.lineId);
            if (ui >= 0) {
              unsavedRef.current[ui] = newLine;
            } else {
              unsavedRef.current.push(newLine);
            }

            overlapEntry.lineId = newLine.id;
            overlapEntry.text = text;
            overlapEntry.startSec = startSec;
            overlapEntry.prefix = prefix;
            lastFinalTextRef.current = text;
          }
          return;
        }

        lastFinalTextRef.current = text;

        const newLine: TranscriptLine = {
          id: generateId(),
          lineIndex: lineIndexRef.current++,
          timestampMs,
          text,
          sentenceId,
          isFinal: true,
        };

        setLines((prev) => [...prev, newLine]);

        recentFinalsRef.current.push({
          lineId: newLine.id,
          lineIndex: newLine.lineIndex,
          text,
          startSec,
          prefix,
        });
        if (recentFinalsRef.current.length > 10) {
          recentFinalsRef.current.shift();
        }

        unsavedRef.current.push(newLine);
        if (unsavedRef.current.length >= SAVE_BATCH_SIZE) {
          flushUnsaved();
        }
      } else {
        // Interim
        const interimId = interimIdRef.current ?? generateId();
        if (!interimIdRef.current) interimIdRef.current = interimId;

        const interimLine: TranscriptLine = {
          id: interimId,
          lineIndex: lineIndexRef.current,
          timestampMs,
          text,
          sentenceId,
          isFinal: false,
        };

        setLines((prev) => {
          const idx = prev.findIndex((l) => l.id === interimId);
          if (idx >= 0) {
            const copy = [...prev];
            // Preserve existing translatedText from interim translations
            copy[idx] = { ...interimLine, translatedText: prev[idx].translatedText };
            return copy;
          }
          return [...prev, interimLine];
        });
      }
    },
    [flushUnsaved],
  );

  const handleTranslation = useCallback(
    ({ sentenceId: rawSid, translatedText }: TranslationData) => {
      if (!translationEnabledRef.current) return;
      const sentenceId = `${sessionGenerationRef.current}_${rawSid}`;
      setLines((prev) =>
        prev.map((l) =>
          l.sentenceId === sentenceId ? { ...l, translatedText } : l,
        ),
      );
      // Also update unsaved buffer
      const ui = unsavedRef.current.findIndex((l) => l.sentenceId === sentenceId);
      if (ui >= 0) {
        unsavedRef.current[ui] = { ...unsavedRef.current[ui], translatedText };
      }
    },
    [],
  );

  const connectWebSocket = useCallback(
    async (generation = sessionGenerationRef.current) => {
      const openSocket = async (): Promise<WebSocket> => {
        const isStale = () =>
          generation !== sessionGenerationRef.current || userStoppedRef.current;

        const scheduleReconnect = () => {
          if (isStale()) return;

          if (reconnectCountRef.current < MAX_RECONNECT) {
            reconnectCountRef.current++;
            const delay = BASE_DELAY * Math.pow(2, reconnectCountRef.current - 1);
            setState("reconnecting");
            clearReconnectTimeout();
            reconnectTimeoutRef.current = setTimeout(async () => {
              reconnectTimeoutRef.current = null;
              if (isStale()) return;

              try {
                const newWs = await openSocket();
                if (isStale()) {
                  closeTranscription(newWs);
                  return;
                }
                wsRef.current = newWs;
              } catch (error) {
                if (isStale()) return;
                console.error("Failed to reconnect transcription socket", error);
                setError("Failed to reconnect to transcription service");
                pausedAtRef.current = Date.now();
                setState("paused");
              }
            }, delay);
            return;
          }

          setError("Lost connection to transcription service");
          pausedAtRef.current = Date.now();
          setState("paused");
        };

        const wsUrl = getWsUrl("/api/transcription/stream");
        const config = {
          source_language: langConfigRef.current.source,
          target_language: langConfigRef.current.target,
          translation_enabled: translationEnabledRef.current,
        };

        const callbacks = {
          onOpen: () => {
            if (isStale()) return;
            clearReconnectTimeout();
            reconnectCountRef.current = 0;
            setState("recording");
          },
          onClose: () => {
            scheduleReconnect();
          },
          onError: (err: string) => {
            if (!isStale()) {
              setError(err || "Connection to transcription service failed");
            }
          },
          onTranscript: handleTranscript,
          onTranslation: handleTranslation,
        };

        return createTranscriptionSocket(wsUrl, config, callbacks);
      };

      return openSocket();
    },
    [clearReconnectTimeout, handleTranscript, handleTranslation],
  );

  const start = useCallback(async (
    courseId: string,
    title: string,
    sourceLanguage: string,
    targetLanguage: string,
  ) => {
    try {
      setError(null);
      setState("connecting");
      userStoppedRef.current = false;
      sessionGenerationRef.current += 1;
      const generation = sessionGenerationRef.current;
      clearReconnectTimeout();
      reconnectCountRef.current = 0;
      pausedAtRef.current = null;
      pausedDurationRef.current = 0;
      lastTranscriptAtRef.current = Date.now();

      // Store language config for this session (used by connectWebSocket + reconnect)
      langConfigRef.current = {
        source: sourceLanguage,
        target: targetLanguage,
      };

      const { id: newLectureId } = await createLecture(
        title || `Lecture ${new Date().toLocaleDateString()}`,
        courseId,
        langConfigRef.current.source,
        langConfigRef.current.target,
      );
      setLectureId(newLectureId);
      lectureIdRef.current = newLectureId;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ws = await connectWebSocket(generation);
      if (generation !== sessionGenerationRef.current || userStoppedRef.current) {
        closeTranscription(ws);
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setState("idle");
        return;
      }
      wsRef.current = ws;

      // AudioWorklet pipeline for PCM16 @ 16kHz
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;

      await registerPCMWorklet(audioCtx);

      const source = audioCtx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;
      const workletNode = new AudioWorkletNode(audioCtx, "pcm-capture");
      workletNodeRef.current = workletNode;

      workletNode.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
        const currentWs = wsRef.current;
        if (currentWs) sendAudio(currentWs, e.data);
      };

      source.connect(workletNode);
      workletNode.connect(audioCtx.destination);

      setStartTime(Date.now());
      clearSavedSession();
    } catch (err) {
      clearReconnectTimeout();
      lectureIdRef.current = null;
      setLectureId(null);
      if (wsRef.current) {
        closeTranscription(wsRef.current);
        wsRef.current = null;
      }
      sourceNodeRef.current?.disconnect();
      sourceNodeRef.current = null;
      workletNodeRef.current?.disconnect();
      workletNodeRef.current = null;
      if (audioCtxRef.current) {
        await audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setError(
        err instanceof Error ? err.message : "Failed to start recording",
      );
      setState("idle");
    }
  }, [clearReconnectTimeout, connectWebSocket]);

  const pause = useCallback(() => {
    sourceNodeRef.current?.disconnect();
    // Invalidate current session so onClose won't trigger reconnect
    sessionGenerationRef.current += 1;
    clearReconnectTimeout();
    if (wsRef.current) {
      closeTranscription(wsRef.current);
      wsRef.current = null;
    }
    if (interimIdRef.current) {
      setLines((prev) => prev.filter((l) => l.id !== interimIdRef.current));
      interimIdRef.current = null;
    }
    pausedAtRef.current = Date.now();
    setState("paused");
  }, [clearReconnectTimeout]);

  const resume = useCallback(async () => {
    userStoppedRef.current = false;

    if (pausedAtRef.current) {
      pausedDurationRef.current += Date.now() - pausedAtRef.current;
      pausedAtRef.current = null;
    }

    // Clear resegmentation history — new ASR session resets timestamps
    recentFinalsRef.current = [];
    lastFinalTextRef.current = "";

    try {
      if (!streamRef.current || !audioCtxRef.current) {
        setState("connecting");

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const audioCtx = new AudioContext();
        audioCtxRef.current = audioCtx;
        await registerPCMWorklet(audioCtx);

        const source = audioCtx.createMediaStreamSource(stream);
        sourceNodeRef.current = source;
        const workletNode = new AudioWorkletNode(audioCtx, "pcm-capture");
        workletNodeRef.current = workletNode;

        workletNode.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
          const currentWs = wsRef.current;
          if (currentWs) sendAudio(currentWs, e.data);
        };

        source.connect(workletNode);
        workletNode.connect(audioCtx.destination);
      } else {
        const source = sourceNodeRef.current;
        const worklet = workletNodeRef.current;
        if (source && worklet) {
          source.connect(worklet);
        }
      }

      // If WS died during pause, reconnect
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        const generation = sessionGenerationRef.current;
        const ws = await connectWebSocket(generation);
        if (generation !== sessionGenerationRef.current || userStoppedRef.current) {
          closeTranscription(ws);
          return;
        }
        wsRef.current = ws;
      }

      clearSavedSession();
      lastTranscriptAtRef.current = Date.now();
      setState("recording");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resume recording");
      setState("paused");
    }
  }, [connectWebSocket]);

  const restoreSession = useCallback(async (restoringLectureId: string) => {
    const saved = getSavedSession();
    if (!saved || saved.lectureId !== restoringLectureId) {
      clearSavedSession();
      return false;
    }

    try {
      setError(null);
      userStoppedRef.current = false;
      sessionGenerationRef.current += 1;

      setLectureId(restoringLectureId);
      lectureIdRef.current = restoringLectureId;

      const existingLines = await getTranscript(restoringLectureId);
      setLines(existingLines.map((l) => ({ ...l, isFinal: true })));

      const maxLineIndex = existingLines.reduce(
        (max, l) => Math.max(max, l.lineIndex),
        -1,
      );
      lineIndexRef.current = maxLineIndex + 1;

      setStartTime(saved.startTime);
      pausedDurationRef.current = saved.pausedDuration + (Date.now() - saved.savedAt);
      pausedAtRef.current = Date.now();

      lastTranscriptAtRef.current = Date.now();
      setState("paused");
      return true;
    } catch (err) {
      console.error("Failed to restore session:", err);
      clearSavedSession();
      setError(err instanceof Error ? err.message : "Failed to restore session");
      return false;
    }
  }, []);

  const stop = useCallback(async () => {
    userStoppedRef.current = true;
    sessionGenerationRef.current += 1;
    clearReconnectTimeout();
    clearSavedSession();

    if (pausedAtRef.current) {
      pausedDurationRef.current += Date.now() - pausedAtRef.current;
      pausedAtRef.current = null;
    }

    sourceNodeRef.current?.disconnect();
    sourceNodeRef.current = null;
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;

    if (audioCtxRef.current) {
      await audioCtxRef.current.close();
      audioCtxRef.current = null;
    }

    if (wsRef.current) {
      closeTranscription(wsRef.current);
      wsRef.current = null;
    }

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    // Flush remaining unsaved lines
    await flushUnsaved();

    // Final save of all lines with translations
    const lid = lectureIdRef.current;
    if (lid) {
      await new Promise<void>((resolve) => {
        setLines((prev) => {
          const finalLines = prev.filter((l) => l.isFinal);
          if (finalLines.length > 0) {
            postTranscriptLines(lid, finalLines).finally(resolve);
          } else {
            resolve();
          }
          return prev;
        });
      });
    }

    setState("idle");
    setStartTime(null);
    interimIdRef.current = null;
  }, [clearReconnectTimeout, flushUnsaved]);

  const getActiveSeconds = useCallback(() => {
    const st = startTimeRef.current;
    if (!st) return 0;
    const totalPaused = pausedDurationRef.current +
      (pausedAtRef.current ? Date.now() - pausedAtRef.current : 0);
    return Math.max(0, (Date.now() - st - totalPaused) / 1000);
  }, []);

  const saveSession = useCallback(() => {
    const lid = lectureIdRef.current;
    const st = startTimeRef.current;
    if (!lid || !st) return;
    const totalPaused = pausedDurationRef.current +
      (pausedAtRef.current ? Date.now() - pausedAtRef.current : 0);
    const session: SavedSession = {
      lectureId: lid,
      startTime: st,
      pausedDuration: totalPaused,
      lineIndex: lineIndexRef.current,
      savedAt: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }, []);

  return {
    lines,
    isRecording: state === "recording",
    state,
    error,
    startTime,
    lectureId,
    pausedDuration: pausedDurationRef.current,
    translationEnabled,
    setTranslationEnabled,
    lastTranscriptAtRef,
    start,
    stop,
    pause,
    resume,
    restoreSession,
    getActiveSeconds,
    saveSession,
  };
}
