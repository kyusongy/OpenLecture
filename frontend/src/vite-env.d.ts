/// <reference types="vite/client" />

declare module "@tauri-apps/api/core" {
  export function invoke(command: string, args?: Record<string, unknown>): Promise<unknown>;
}
