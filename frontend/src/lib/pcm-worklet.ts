/**
 * AudioWorklet processor that captures raw PCM16 at 16kHz.
 *
 * Usage:
 *   const blob = new Blob([PCM_WORKLET_CODE], { type: "application/javascript" });
 *   const url = URL.createObjectURL(blob);
 *   await audioCtx.audioWorklet.addModule(url);
 *   const node = new AudioWorkletNode(audioCtx, "pcm-capture");
 *   node.port.onmessage = (e) => { /* e.data is Int16Array PCM buffer *\/ };
 */

// Inline worklet code as a string — AudioWorklet requires a separate JS file/blob
export const PCM_WORKLET_CODE = `
class PCMCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    // 16kHz target, sampleRate is the AudioContext rate (usually 44100 or 48000)
    this._ratio = sampleRate / 16000;
    this._resampleIndex = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const samples = input[0]; // Float32Array, mono channel

    // Downsample to 16kHz by skipping samples
    for (; this._resampleIndex < samples.length; this._resampleIndex += this._ratio) {
      const idx = Math.floor(this._resampleIndex);
      if (idx < samples.length) {
        // Convert float32 [-1, 1] to int16 [-32768, 32767]
        const s = Math.max(-1, Math.min(1, samples[idx]));
        this._buffer.push(s < 0 ? s * 0x8000 : s * 0x7FFF);
      }
    }
    this._resampleIndex -= samples.length;

    // Send chunks of ~100ms worth of 16kHz audio (1600 samples)
    if (this._buffer.length >= 1600) {
      const chunk = new Int16Array(this._buffer.splice(0, 1600));
      this.port.postMessage(chunk.buffer, [chunk.buffer]);
    }

    return true;
  }
}

registerProcessor("pcm-capture", PCMCaptureProcessor);
`;

/** Helper to register the PCM worklet on an AudioContext */
export async function registerPCMWorklet(
  audioCtx: AudioContext,
): Promise<void> {
  const blob = new Blob([PCM_WORKLET_CODE], {
    type: "application/javascript",
  });
  const url = URL.createObjectURL(blob);
  try {
    await audioCtx.audioWorklet.addModule(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}
