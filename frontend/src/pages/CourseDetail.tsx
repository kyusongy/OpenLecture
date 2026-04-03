import { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, ArrowLeft, Clock } from "lucide-react";
import { getLectures, deleteLecture } from "@/lib/api";
import { formatTime } from "@/lib/utils";
import type { Lecture } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Lecture | null>(null);

  useEffect(() => {
    if (!courseId) return;
    getLectures(courseId)
      .then(setLectures)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [courseId]);

  useEffect(() => {
    if (loading) return;
    if (searchParams.get("start") !== "lecture") return;
    if (lectures.length === 0) {
      setCreateOpen(true);
    }
    setSearchParams({}, { replace: true });
  }, [loading, lectures.length, searchParams, setSearchParams]);

  const handleCreate = () => {
    if (!title.trim() || !courseId) return;
    const params = new URLSearchParams({
      courseId,
      title: title.trim(),
    });
    navigate(`/live?${params.toString()}`);
    setCreateOpen(false);
    setTitle("");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteLecture(deleteTarget.id);
      setLectures((prev) => prev.filter((l) => l.id !== deleteTarget.id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{t("course.title")}</h1>
        <div className="flex-1" />
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("course.newLecture")}
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      ) : lectures.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Clock className="mx-auto h-8 w-8 text-primary/70" />
          <h2 className="mt-3 text-lg font-semibold text-foreground">
            {t("course.starterTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            {t("course.starterBody")}
          </p>
          <div className="mt-5">
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {t("course.newLecture")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {lectures.map((lecture) => (
            <Link key={lecture.id} to={`/lectures/${lecture.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer py-4">
                <CardHeader>
                  <CardTitle className="text-base">{lecture.title}</CardTitle>
                  <CardDescription className="flex items-center gap-3">
                    <span>{new Date(lecture.started_at).toLocaleString()}</span>
                    {lecture.duration_seconds != null && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(lecture.duration_seconds * 1000)}
                      </span>
                    )}
                    <Badge
                      variant={lecture.status === "live" ? "default" : "secondary"}
                    >
                      {lecture.status === "live"
                        ? t("course.live")
                        : t("course.complete")}
                    </Badge>
                  </CardDescription>
                  <CardAction>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteTarget(lecture);
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </CardAction>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create lecture dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("course.newLecture")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder={t("course.lectureTitlePlaceholder")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleCreate} disabled={!title.trim()}>
              {t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("course.deleteLecture")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("course.deleteConfirm")}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
