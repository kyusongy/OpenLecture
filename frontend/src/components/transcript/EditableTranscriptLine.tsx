import { useState } from "react";
import type { TranscriptLine } from "../../types";
import { formatTime } from "../../lib/utils";
import { Check, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  line: TranscriptLine;
  onSave: (text: string) => void;
}

export function EditableTranscriptLine({ line, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(line.text);

  const handleSave = () => {
    if (text !== line.text) {
      onSave(text);
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setText(line.text);
    setEditing(false);
  };

  return (
    <div
      data-line-index={line.lineIndex}
      className="group rounded px-3 py-1.5 bg-muted/50 hover:bg-muted transition-colors"
    >
      <div className="flex items-baseline gap-2">
        <span className="text-xs text-muted-foreground font-mono shrink-0">
          {formatTime(line.timestampMs)}
        </span>
      </div>

      {editing ? (
        <div className="mt-1 flex items-start gap-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 resize-none rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            rows={2}
            autoFocus
          />
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleSave}
            className="text-primary hover:text-primary"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleCancel}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-start gap-1 mt-0.5">
          <p className="flex-1 text-sm text-foreground">{line.text}</p>
          <button
            onClick={() => setEditing(true)}
            className="shrink-0 rounded p-1 text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:text-muted-foreground transition-opacity"
          >
            <Pencil className="h-3 w-3" />
          </button>
        </div>
      )}

      {line.translatedText && (
        <p className="text-sm text-muted-foreground mt-0.5">
          {line.translatedText}
        </p>
      )}
    </div>
  );
}
