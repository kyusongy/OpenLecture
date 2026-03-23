import { useCallback, useEffect, useRef, useState } from "react";
import type { RecordingState } from "./useTranscription";

const SILENCE_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes
const COUNTDOWN_SECONDS = 60;
const CHECK_INTERVAL_MS = 10_000; // check every 10s

export function useAutoPause({
  state,
  lastTranscriptAtRef,
  onPause,
}: {
  state: RecordingState;
  lastTranscriptAtRef: React.RefObject<number>;
  onPause: () => void;
}) {
  const [promptVisible, setPromptVisible] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  // Silence detection — check every 10s while recording
  useEffect(() => {
    if (state !== "recording") return;

    const id = setInterval(() => {
      const elapsed = Date.now() - lastTranscriptAtRef.current;
      if (elapsed >= SILENCE_THRESHOLD_MS) {
        setCountdown(COUNTDOWN_SECONDS);
        setPromptVisible(true);
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(id);
  }, [state, lastTranscriptAtRef]);

  // Countdown timer — starts when prompt becomes visible
  useEffect(() => {
    if (!promptVisible || state !== "recording") {
      clearCountdown();
      return;
    }

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Auto-pause
          setPromptVisible(false);
          onPause();
          return COUNTDOWN_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return clearCountdown;
  }, [promptVisible, state, onPause, clearCountdown]);

  const keepRecording = useCallback(() => {
    setPromptVisible(false);
    setCountdown(COUNTDOWN_SECONDS);
    lastTranscriptAtRef.current = Date.now();
  }, [lastTranscriptAtRef]);

  const pauseNow = useCallback(() => {
    setPromptVisible(false);
    setCountdown(COUNTDOWN_SECONDS);
    onPause();
  }, [onPause]);

  return {
    promptVisible: promptVisible && state === "recording",
    countdown,
    keepRecording,
    pauseNow,
  };
}
