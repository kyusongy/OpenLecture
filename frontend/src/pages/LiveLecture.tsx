import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTranscription } from "@/hooks/useTranscription";
import { useLanguagePairs } from "@/hooks/useLanguagePairs";
import { useAutoPause } from "@/hooks/useAutoPause";
import { useSettings } from "@/hooks/useSettings";
import { stopLecture, saveNotes } from "@/lib/api";
import { RecordingControls } from "@/components/lecture/RecordingControls";
import { TranscriptPanel } from "@/components/transcript/TranscriptPanel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const NOTES_SAVE_DELAY = 2000;

export default function LiveLecture() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const transcription = useTranscription();
  const { sources, targets, labels } = useLanguagePairs();

  const courseId = searchParams.get("courseId") ?? "";
  const title = searchParams.get("title") ?? "";
  const { settings: appSettings } = useSettings();

  const [sourceLang, setSourceLang] = useState("");
  const [targetLang, setTargetLang] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [notes, setNotes] = useState("");
  const [stopConfirm, setStopConfirm] = useState(false);
  const notesSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Set default languages from settings
  useEffect(() => {
    if (appSettings && !sourceLang) {
      setSourceLang(appSettings.default_source_language || "EN");
      setTargetLang(appSettings.default_target_language || "ZH");
    }
  }, [appSettings, sourceLang]);

  const handleStart = () => {
    transcription.start(courseId, title, sourceLang, targetLang);
  };

  // Elapsed timer
  useEffect(() => {
    if (!transcription.startTime) return;
    const id = setInterval(() => {
      setElapsed(transcription.getActiveSeconds() * 1000);
    }, 500);
    return () => clearInterval(id);
  }, [transcription.startTime, transcription.getActiveSeconds]);

  // Auto-pause on silence
  const autoPause = useAutoPause({
    state: transcription.state,
    lastTranscriptAtRef: transcription.lastTranscriptAtRef,
    onPause: transcription.pause,
  });

  // Debounced notes save
  const handleNotesChange = useCallback(
    (value: string) => {
      setNotes(value);
      if (notesSaveTimer.current) clearTimeout(notesSaveTimer.current);
      if (!transcription.lectureId) return;
      const lid = transcription.lectureId;
      notesSaveTimer.current = setTimeout(() => {
        saveNotes(lid, value).catch(console.error);
      }, NOTES_SAVE_DELAY);
    },
    [transcription.lectureId],
  );

  const handleStop = async () => {
    setStopConfirm(false);
    const lid = transcription.lectureId;
    const activeSeconds = transcription.getActiveSeconds();
    await transcription.stop();
    if (lid) {
      await stopLecture(lid, activeSeconds).catch(console.error);
      // Save final notes
      if (notes.trim()) {
        await saveNotes(lid, notes).catch(console.error);
      }
      navigate(`/lectures/${lid}`);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Controls bar */}
      <div className="border-b px-4 py-3">
        <RecordingControls
          state={transcription.state}
          onStart={handleStart}
          onStop={() => setStopConfirm(true)}
          onPause={transcription.pause}
          onResume={transcription.resume}
          elapsed={elapsed}
          translationEnabled={transcription.translationEnabled}
          onTranslationToggle={transcription.setTranslationEnabled}
          sources={sources}
          targets={targets}
          labels={labels}
          sourceLanguage={sourceLang}
          targetLanguage={targetLang}
          onSourceChange={setSourceLang}
          onTargetChange={setTargetLang}
          error={transcription.error}
        />
      </div>

      {/* Auto-pause prompt */}
      {autoPause.promptVisible && (
        <div className="flex items-center gap-3 border-b bg-yellow-50 px-4 py-2 text-sm dark:bg-yellow-950/30">
          <span className="text-yellow-800 dark:text-yellow-200">
            {t("recording.autoPause", { countdown: autoPause.countdown })}
          </span>
          <Button size="xs" onClick={autoPause.keepRecording}>
            {t("recording.keepRecording")}
          </Button>
          <Button size="xs" variant="outline" onClick={autoPause.pauseNow}>
            {t("recording.pauseNow")}
          </Button>
        </div>
      )}

      {/* Two-column layout */}
      <div className="flex flex-1 min-h-0">
        {/* Transcript panel */}
        <div className="flex-1 border-r">
          <TranscriptPanel lines={transcription.lines} />
        </div>

        {/* Notes panel */}
        <div className="w-[400px] flex flex-col">
          <div className="px-4 py-2 border-b">
            <h2 className="text-sm font-medium text-muted-foreground">
              {t("recording.notes")}
            </h2>
          </div>
          <textarea
            className="flex-1 resize-none bg-transparent p-4 text-sm outline-none placeholder:text-muted-foreground"
            placeholder={t("recording.notesPlaceholder")}
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
          />
        </div>
      </div>

      {/* Stop confirmation */}
      <Dialog open={stopConfirm} onOpenChange={setStopConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("recording.stopConfirm")}</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStopConfirm(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleStop}>
              {t("recording.stop")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
