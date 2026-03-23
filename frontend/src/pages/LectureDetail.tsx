import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Clock } from "lucide-react";
import {
  getLecture,
  getTranscript,
  getNotes,
  saveNotes,
  postTranscriptLines,
} from "@/lib/api";
import { formatTime } from "@/lib/utils";
import type { Lecture, TranscriptLine } from "@/types";
import { TranscriptPanel } from "@/components/transcript/TranscriptPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LectureDetail() {
  const { lectureId } = useParams<{ lectureId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");

  useEffect(() => {
    if (!lectureId) return;
    Promise.all([
      getLecture(lectureId),
      getTranscript(lectureId),
      getNotes(lectureId).catch(() => ""),
    ])
      .then(([lec, transcript, notesContent]) => {
        setLecture(lec);
        setLines(transcript);
        setNotes(notesContent);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [lectureId]);

  const handleEditLine = async (lineId: string, text: string) => {
    if (!lectureId) return;
    setLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, text } : l)),
    );
    // Save updated line
    const line = lines.find((l) => l.id === lineId);
    if (line) {
      postTranscriptLines(lectureId, [{ ...line, text }]).catch(console.error);
    }
  };

  const handleSaveNotes = async () => {
    if (!lectureId) return;
    try {
      await saveNotes(lectureId, notesDraft);
      setNotes(notesDraft);
      setEditingNotes(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">{t("common.error")}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/courses/${lecture.course_id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{lecture.title}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
              <span>{new Date(lecture.started_at).toLocaleString()}</span>
              {lecture.duration_seconds != null && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(lecture.duration_seconds * 1000)}
                </span>
              )}
              <Badge
                variant={
                  lecture.status === "live" ? "default" : "secondary"
                }
              >
                {lecture.status === "live"
                  ? t("course.live")
                  : t("course.complete")}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 min-h-0">
        {/* Transcript */}
        <div className="flex-1 border-r">
          {lines.length > 0 ? (
            <TranscriptPanel lines={lines} onEditLine={handleEditLine} />
          ) : (
            <div className="p-4">
              <p className="text-sm text-muted-foreground italic">
                {t("transcript.noTranscript")}
              </p>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="w-[400px] flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <h2 className="text-sm font-medium text-muted-foreground">
              {t("recording.notes")}
            </h2>
            {editingNotes ? (
              <div className="flex gap-2">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setEditingNotes(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button size="xs" onClick={handleSaveNotes}>
                  {t("common.save")}
                </Button>
              </div>
            ) : (
              <Button
                size="xs"
                variant="ghost"
                onClick={() => {
                  setNotesDraft(notes);
                  setEditingNotes(true);
                }}
              >
                {t("transcript.edit")}
              </Button>
            )}
          </div>
          {editingNotes ? (
            <textarea
              className="flex-1 resize-none bg-transparent p-4 text-sm outline-none"
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              autoFocus
            />
          ) : (
            <div className="flex-1 overflow-y-auto p-4 text-sm whitespace-pre-wrap">
              {notes || (
                <span className="text-muted-foreground italic">
                  {t("recording.notesPlaceholder")}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
