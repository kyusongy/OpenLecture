// Detect if running inside Tauri webview
export const isTauri = "__TAURI_INTERNALS__" in window;

type AppConfig = {
  dashscope_api_key?: string;
  dashscope_endpoint?: string;
};

export async function getConfig(): Promise<AppConfig> {
  if (!isTauri) return {};
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<AppConfig>("get_config");
}

export async function setConfig(
  key: string,
  value: string,
): Promise<AppConfig> {
  if (!isTauri) return {};
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<AppConfig>("set_config", { key, value });
}

export async function getBackendPort(): Promise<number> {
  if (!isTauri) return 8000;
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<number>("get_backend_port");
}

export async function openExternal(url: string): Promise<void> {
  if (!isTauri) {
    window.open(url, "_blank");
    return;
  }
  const { open } = await import("@tauri-apps/plugin-shell");
  await open(url);
}
