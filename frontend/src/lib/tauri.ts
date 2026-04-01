export const isTauri = "__TAURI_INTERNALS__" in window;

type AppConfig = {
  dashscope_api_key?: string;
  dashscope_endpoint?: string;
};

type TauriCore = {
  invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;
};

export async function getConfig(): Promise<AppConfig> {
  if (!isTauri) return {};
  const { invoke } = (await import("@tauri-apps/api/core")) as TauriCore;
  return (await invoke("get_config")) as AppConfig;
}

export async function setConfig(key: string, value: string): Promise<AppConfig> {
  if (!isTauri) return {};
  const { invoke } = (await import("@tauri-apps/api/core")) as TauriCore;
  return (await invoke("set_config", { key, value })) as AppConfig;
}

export async function getBackendPort(): Promise<number> {
  if (!isTauri) return 8000;
  const { invoke } = (await import("@tauri-apps/api/core")) as TauriCore;
  return (await invoke("get_backend_port")) as number;
}
