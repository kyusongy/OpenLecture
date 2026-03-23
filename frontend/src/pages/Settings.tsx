import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink, Check } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useLanguagePairs } from "@/hooks/useLanguagePairs";
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

export default function Settings() {
  const { t } = useTranslation();
  const { settings, loading, update } = useSettings();
  const { sources, targets, labels } = useLanguagePairs();

  const [apiKey, setApiKey] = useState("");
  const [sourceLang, setSourceLang] = useState("");
  const [targetLang, setTargetLang] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize form from settings once loaded
  if (settings && !initialized) {
    setSourceLang(settings.default_source_language || "");
    setTargetLang(settings.default_target_language || "");
    setInitialized(true);
  }

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const updates: Record<string, string> = {
        default_source_language: sourceLang,
        default_target_language: targetLang,
      };
      if (apiKey) {
        updates.dashscope_api_key = apiKey;
      }
      await update(updates);
      setApiKey("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t("settings.title")}</h1>

      <div className="space-y-6">
        {/* API Key */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("settings.apiKey")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="password"
              placeholder={
                settings?.api_key_configured
                  ? "********** (configured)"
                  : t("settings.apiKeyPlaceholder")
              }
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              {t("settings.apiKeyHelp")}
            </p>
            <a
              href="https://modelstudio.console.aliyun.com/ap-southeast-1?tab=dashboard#/api-key"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              {t("settings.apiKeyLink")}
              <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>

        {/* Language defaults */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("common.language")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  {t("settings.defaultSourceLanguage")}
                </label>
                <Select value={sourceLang} onValueChange={setSourceLang}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`lang.${s}`, labels[s] ?? s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  {t("settings.defaultTargetLanguage")}
                </label>
                <Select value={targetLang} onValueChange={setTargetLang}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {targets.map((tgt) => (
                      <SelectItem key={tgt} value={tgt}>
                        {t(`lang.${tgt}`, labels[tgt] ?? tgt)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {t("common.save")}
          </Button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <Check className="h-4 w-4" />
              {t("settings.saved")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
