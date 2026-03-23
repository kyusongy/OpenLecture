import { useState, useEffect, useCallback } from "react";
import { getSettings, updateSettings as apiUpdateSettings } from "../lib/api";
import type { AppSettings } from "../types";

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const update = useCallback(async (updates: Record<string, string>) => {
    const updated = await apiUpdateSettings(updates);
    setSettings(updated);
    return updated;
  }, []);

  return { settings, loading, update };
}
