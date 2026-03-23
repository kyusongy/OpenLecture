import { useTranslation } from "react-i18next";
import { Mic, Square, Loader2, WifiOff, Pause, Play } from "lucide-react";
import { formatTime } from "../../lib/utils";
import type { RecordingState } from "../../hooks/useTranscription";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  state: RecordingState;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  elapsed: number;
  translationEnabled: boolean;
  onTranslationToggle: (enabled: boolean) => void;
  sources: string[];
  targets: string[];
  labels: Record<string, string>;
  sourceLanguage: string;
  targetLanguage: string;
  onSourceChange: (lang: string) => void;
  onTargetChange: (lang: string) => void;
  error?: string | null;
}

export function RecordingControls({
  state,
  onStart,
  onStop,
  onPause,
  onResume,
  elapsed,
  translationEnabled,
  onTranslationToggle,
  sources,
  targets,
  labels,
  sourceLanguage,
  targetLanguage,
  onSourceChange,
  onTargetChange,
  error,
}: Props) {
  const { t } = useTranslation();
  const isActive = state !== "idle";

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Language selectors — disabled while active */}
      <div className="flex items-center gap-2">
        <Select value={sourceLanguage} onValueChange={onSourceChange} disabled={isActive}>
          <SelectTrigger size="sm" className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sources.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`lang.${s}`, labels[s] ?? s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-muted-foreground text-xs">→</span>

        <Select value={targetLanguage} onValueChange={onTargetChange} disabled={isActive}>
          <SelectTrigger size="sm" className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {targets.map((tgt) => (
              <SelectItem key={tgt} value={tgt}>
                {t(`lang.${tgt}`, labels[tgt] ?? tgt)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Translation toggle */}
      <label className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer select-none">
        <input
          type="checkbox"
          checked={translationEnabled}
          onChange={(e) => onTranslationToggle(e.target.checked)}
          className="accent-primary h-3.5 w-3.5"
        />
        {t("recording.translationEnabled")}
      </label>

      {/* Recording buttons */}
      {state === "idle" && (
        <Button
          onClick={onStart}
          className="gap-2 rounded-full px-6 bg-gradient-to-r from-primary to-primary/90 shadow-sm hover:shadow-md transition-all"
        >
          <Mic className="h-4 w-4" />
          {t("recording.start")}
        </Button>
      )}

      {state === "connecting" && (
        <Button disabled className="gap-2 rounded-full px-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("recording.connecting")}
        </Button>
      )}

      {state === "reconnecting" && (
        <>
          <Button
            variant="outline"
            onClick={onStop}
            className="gap-2 rounded-full"
          >
            <Square className="h-4 w-4" />
            {t("recording.stop")}
          </Button>
          <div className="flex items-center gap-2 px-2">
            <WifiOff className="h-4 w-4 text-yellow-500 animate-pulse" />
            <span className="text-sm text-yellow-600 font-medium">
              {t("recording.reconnecting")}
            </span>
            <span className="text-sm text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded-md">
              {formatTime(elapsed)}
            </span>
          </div>
        </>
      )}

      {state === "recording" && (
        <>
          <Button
            variant="outline"
            onClick={onStop}
            className="gap-2 rounded-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
          >
            <Square className="h-4 w-4" />
            {t("recording.stop")}
          </Button>
          <Button
            variant="outline"
            onClick={onPause}
            className="gap-2 rounded-full"
          >
            <Pause className="h-4 w-4" />
            {t("recording.pause")}
          </Button>
          <div className="flex items-center gap-2 px-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse-soft shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
            <span className="text-sm font-medium text-foreground font-mono bg-muted/50 px-2 py-0.5 rounded-md">
              {formatTime(elapsed)}
            </span>
          </div>
        </>
      )}

      {state === "paused" && (
        <>
          <Button
            variant="outline"
            onClick={onStop}
            className="gap-2 rounded-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
          >
            <Square className="h-4 w-4" />
            {t("recording.stop")}
          </Button>
          <Button
            variant="default"
            onClick={onResume}
            className="gap-2 rounded-full"
          >
            <Play className="h-4 w-4" />
            {t("recording.resume")}
          </Button>
          <div className="flex items-center gap-2 px-2">
            <span className="text-sm text-yellow-600 font-medium">
              {t("recording.paused")}
            </span>
            <span className="text-sm text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded-md">
              {formatTime(elapsed)}
            </span>
          </div>
        </>
      )}

      {error && (
        <span className="text-sm text-destructive font-medium px-2">
          {error}
        </span>
      )}
    </div>
  );
}
