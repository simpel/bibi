import type { ApiKeyCreated } from "@bibi/core";
import { Button, DialogFooter, Input, Label, toast } from "@bibi/ui";
import { CopyIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export type ApiKeySecretProps = { created: ApiKeyCreated; onDone: () => void };

/** The new key, shown this one time: it is not stored in plain text and cannot be shown again. */
export function ApiKeySecret({ created, onDone }: ApiKeySecretProps) {
  const t = useTranslations("integration.apiKeys");
  const common = useTranslations("common");
  const copy = () =>
    navigator.clipboard.writeText(created.secret).then(
      () => toast.success(t("copied")),
      () => toast.error(t("copyFailed")),
    );
  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">{t("secretOnce")}</p>
      <div className="grid gap-2">
        <Label htmlFor="api-key-secret">{created.apiKey.name}</Label>
        <div className="flex gap-2">
          <Input id="api-key-secret" readOnly value={created.secret} className="font-mono" />
          <Button type="button" variant="outline" size="icon" onClick={copy} aria-label={t("copy")}>
            <CopyIcon />
          </Button>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" onClick={onDone}>
          {common("close")}
        </Button>
      </DialogFooter>
    </div>
  );
}
