import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isTauri, setConfig } from "@/lib/tauri";
import { updateSettings } from "@/lib/api";

export default function SetupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState("");
  const [endpoint, setEndpoint] = useState("international");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

      navigate("/");
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/10 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <span className="text-xl font-bold text-primary-foreground">OL</span>
          </div>
          <CardTitle className="text-2xl">{t("setup.title")}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{t("setup.subtitle")}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t("setup.apiKeyLabel")}</label>
            <Input
              type="password"
              placeholder={t("setup.apiKeyPlaceholder")}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleSubmit()}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t("setup.endpointLabel")}</label>
            <Select value={endpoint} onValueChange={setEndpoint}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="international">{t("setup.endpointInternational")}</SelectItem>
                <SelectItem value="china">{t("setup.endpointChina")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">{t("setup.apiKeyHelp")}</p>

          <a
            href="https://modelstudio.console.aliyun.com/ap-southeast-1?tab=dashboard#/api-key"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            {t("setup.getApiKey")}
            <ExternalLink className="h-3 w-3" />
          </a>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={() => void handleSubmit()} disabled={saving} className="w-full">
            {t("setup.getStarted")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
