import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink, Check, Copy, FolderOpen, HardDrive } from "lucide-react";
import { isTauri, openExternal } from "@/lib/tauri";
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
  const [endpoint, setEndpoint] = useState("international");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setSourceLang(settings.default_source_language || "");
    setTargetLang(settings.default_target_language || "");
    setEndpoint(settings.dashscope_endpoint || "international");
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const updates: Record<string, string> = {
        default_source_language: sourceLang,
        default_target_language: targetLang,
        dashscope_endpoint: endpoint,
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

  const handleCopyPath = async () => {
    if (!settings?.data_dir) return;
    try {
      await navigator.clipboard.writeText(settings.data_dir);
      setCopiedPath(true);
      window.setTimeout(() => setCopiedPath(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenFolder = async () => {
    if (!settings?.data_dir || !isTauri) return;
    try {
      await openExternal(settings.data_dir);
    } catch (err) {
      console.error(err);
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
            <button
              type="button"
              onClick={() => openExternal("https://modelstudio.console.aliyun.com/ap-southeast-1?tab=dashboard#/api-key")}
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline cursor-pointer"
            >
              {t("settings.apiKeyLink")}
              <ExternalLink className="h-3 w-3" />
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("settings.region")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={endpoint} onValueChange={setEndpoint}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="international">
                  {t("settings.endpointInternational")}
                </SelectItem>
                <SelectItem value="china">
                  {t("settings.endpointChina")}
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {t("settings.regionHelp")}
            </p>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HardDrive className="h-4 w-4 text-primary" />
              {t("settings.localStorage")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-3 text-sm">
              <div className="font-medium text-foreground">
                {t("settings.storageModeLocal")}
              </div>
              <div className="mt-1 break-all text-muted-foreground">
                {settings?.data_dir}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("settings.dataDirHelp")}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyPath}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                {copiedPath ? t("settings.pathCopied") : t("settings.copyPath")}
              </Button>
              {isTauri && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleOpenFolder}
                  className="gap-2"
                >
                  <FolderOpen className="h-4 w-4" />
                  {t("settings.openFolder")}
                </Button>
              )}
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
