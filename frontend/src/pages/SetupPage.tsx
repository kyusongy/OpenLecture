import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ExternalLink, HardDrive, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isTauri, setConfig, openExternal } from "@/lib/tauri";
import AppIcon from "@/components/AppIcon";
import LanguageToggle from "@/components/LanguageToggle";
import { getSettings, updateSettings } from "@/lib/api";
import type { AppSettings } from "@/types";

export default function SetupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState("");
  const [endpoint, setEndpoint] = useState("international");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [bootstrapError, setBootstrapError] = useState("");

  useEffect(() => {
    getSettings()
      .then((data) => {
        setAppSettings(data);
        setEndpoint(data.dashscope_endpoint || "international");
      })
      .catch((err) => {
        console.error(err);
        setBootstrapError(t("setup.backendErrorDesc"));
      });
  }, [t]);

  const handleSubmit = async () => {
    if (!apiKey.trim()) {
      setError(t("setup.apiKeyPlaceholder"));
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (isTauri) {
        await setConfig("dashscope_api_key", apiKey.trim());
        await setConfig("dashscope_endpoint", endpoint);
      }

      await updateSettings({
        dashscope_api_key: apiKey.trim(),
        dashscope_endpoint: endpoint,
      });

      navigate("/?start=course");
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/10 p-6 relative">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <AppIcon size={64} />
          </div>
          <CardTitle className="text-2xl">{t("setup.title")}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t("setup.subtitle")}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              {t("setup.apiKeyLabel")}
            </label>
            <Input
              type="password"
              placeholder={t("setup.apiKeyPlaceholder")}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              {t("setup.endpointLabel")}
            </label>
            <Select value={endpoint} onValueChange={setEndpoint}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="international">
                  {t("setup.endpointInternational")}
                </SelectItem>
                <SelectItem value="china">
                  {t("setup.endpointChina")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">
            {t("setup.apiKeyHelp")}
          </p>

          {bootstrapError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <div className="text-sm font-medium text-foreground">
                {t("setup.backendErrorTitle")}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {bootstrapError}
              </div>
            </div>
          )}

          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-primary shrink-0" />
              <p className="text-xs text-muted-foreground">
                {t("setup.localPromise")}
              </p>
            </div>
            {appSettings?.data_dir && (
              <div className="flex items-start gap-2">
                <HardDrive className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <div>{t("setup.localPathLabel")}</div>
                  <div className="break-all text-foreground/80">
                    {appSettings.data_dir}
                  </div>
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {t("setup.nextStepHint")}
            </p>
          </div>

          <button
            type="button"
            onClick={() => openExternal("https://modelstudio.console.aliyun.com/ap-southeast-1?tab=dashboard#/api-key")}
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline cursor-pointer"
          >
            {t("setup.getApiKey")}
            <ExternalLink className="h-3 w-3" />
          </button>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full"
          >
            {t("setup.getStarted")}
          </Button>

          <div className="pt-2 border-t border-border text-center">
            <p className="mb-2 text-xs text-muted-foreground">
              {t("setup.easypineHint")}
            </p>
            <button
              type="button"
              onClick={() => openExternal("https://easypine-ai.com/")}
              className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              {t("easypine.setupHint")}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
