import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TranscriptLine } from "../../types";
import { formatTime } from "../../lib/utils";
import { EditableTranscriptLine } from "./EditableTranscriptLine";

interface Props {
  lines: TranscriptLine[];
  onEditLine?: (lineId: string, text: string) => void;
}

export function TranscriptPanel({ lines, onEditLine }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const { t } = useTranslation();

  // Auto-scroll when new lines arrive
  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [lines, autoScroll]);

  // Detect manual scroll up to pause auto-scroll
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setAutoScroll(atBottom);
  };

  return (
    <div className="flex h-full flex-col">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {lines.length === 0 && (
          <p className="text-muted-foreground text-sm italic">
            {t("transcript.empty")}
          </p>
        )}
        {lines.map((line) =>
          line.isFinal && onEditLine ? (
            <EditableTranscriptLine
              key={line.id}
              line={line}
              onSave={(text) => onEditLine(line.id, text)}
            />
          ) : (
            <div
              key={line.id}
              data-line-index={line.lineIndex}
              className={`rounded px-3 py-1.5 ${line.isFinal ? "bg-muted/50" : "bg-accent/30 opacity-70"}`}
            >
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-muted-foreground font-mono shrink-0">
                  {formatTime(line.timestampMs)}
                </span>
              </div>
              <p className="text-sm text-foreground mt-0.5">{line.text}</p>
              {line.translatedText && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {line.translatedText}
                </p>
              )}
            </div>
          )
        )}
        <div ref={bottomRef} />
      </div>

      {!autoScroll && (
        <button
          onClick={() => {
            setAutoScroll(true);
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
          className="mx-auto mb-2 rounded-full bg-primary px-4 py-1 text-xs text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
        >
          {t("transcript.title")}
        </button>
      )}
    </div>
  );
}
