import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, BookOpen, AlertTriangle } from "lucide-react";
import { getCourses, createCourse, deleteCourse } from "@/lib/api";
import { useSettings } from "@/hooks/useSettings";
import type { Course } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);

  useEffect(() => {
    getCourses()
      .then(setCourses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    if (searchParams.get("start") !== "course") return;
    if (courses.length === 0) {
      setCreateOpen(true);
    }
    setSearchParams({}, { replace: true });
  }, [loading, courses.length, searchParams, setSearchParams]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const course = await createCourse(name.trim());
      setCourses((prev) => [...prev, course]);
      setName("");
      setCreateOpen(false);
      if (courses.length === 0) {
        navigate(`/courses/${course.id}?start=lecture`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCourse(deleteTarget.id);
      setCourses((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("dashboard.createCourse")}
        </Button>
      </div>

      {settings && !settings.api_key_configured && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {t("dashboard.noApiKey")}{" "}
            <Link to="/settings" className="underline font-medium">
              {t("nav.settings")}
            </Link>
          </span>
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      ) : courses.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-primary/70" />
          <h2 className="mt-3 text-lg font-semibold text-foreground">
            {t("dashboard.starterTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            {t("dashboard.starterBody")}
          </p>
          <div className="mt-5">
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {t("dashboard.createCourse")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link key={course.id} to={`/courses/${course.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    {course.name}
                  </CardTitle>
                  <CardDescription>
                    {new Date(course.created_at).toLocaleDateString()}
                  </CardDescription>
                  <CardAction>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteTarget(course);
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

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dashboard.createCourse")}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder={t("dashboard.courseNamePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleCreate} disabled={creating || !name.trim()}>
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
            <DialogTitle>{t("dashboard.deleteCourse")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.deleteConfirm")}
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
