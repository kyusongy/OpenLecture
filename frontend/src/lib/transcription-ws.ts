export type TranscriptData = {
  text: string;
  isFinal: boolean;
  sentenceId: string;
  timestampMs: number;
};

export type TranslationData = {
  sentenceId: string;
  translatedText: string;
};

export type TranscriptionCallbacks = {
  onTranscript: (data: TranscriptData) => void;
  onTranslation: (data: TranslationData) => void;
  onOpen: () => void;
  onClose: (event: CloseEvent) => void;
  onError: (err: string) => void;
};

/**
 * Open a WebSocket to the backend transcription endpoint.
 * Sends a config message with language settings, then resolves
 * once the server confirms connection.
 */
export function createTranscriptionSocket(
  wsUrl: string,
  config: {
    source_language: string;
    target_language: string;
    translation_enabled: boolean;
  },
  callbacks: TranscriptionCallbacks,
): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.binaryType = "arraybuffer";

    let connected = false;

    ws.onopen = () => {
      // Send config as first message
      ws.send(JSON.stringify({ type: "config", ...config }));
    };

    ws.onclose = (e) => {
      callbacks.onClose(e);
      if (!connected) reject(new Error("WebSocket closed before connecting"));
    };

    ws.onerror = () => {
      if (!connected)
        reject(new Error("WebSocket connection failed"));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "connected") {
          connected = true;
          callbacks.onOpen();
          resolve(ws);
          return;
        }

        if (data.type === "transcript") {
          callbacks.onTranscript({
            text: data.text ?? "",
            isFinal: data.isFinal ?? false,
            sentenceId: data.sentenceId ?? "",
            timestampMs: data.timestampMs ?? 0,
          });
          return;
        }

        if (data.type === "translation") {
          callbacks.onTranslation({
            sentenceId: data.sentenceId ?? "",
            translatedText: data.translatedText ?? "",
          });
          return;
        }

        if (data.type === "error") {
          callbacks.onError(data.message ?? "Unknown error");
          if (!connected) reject(new Error(data.message));
        }
      } catch (err) {
        console.warn("[TranscriptionWS] Failed to parse message:", err);
      }
    };
  });
}

export function sendAudio(ws: WebSocket, pcmBuffer: ArrayBuffer) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(pcmBuffer);
  }
}

export function closeTranscription(ws: WebSocket) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "stop" }));
    ws.close();
  }
}
