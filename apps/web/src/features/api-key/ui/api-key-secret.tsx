import type { ApiKeyCreated } from "@bibi/core";
import { Button, DialogFooter } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { CopyField } from "@/components/copy-field";

export type ApiKeySecretProps = { created: ApiKeyCreated; onDone: () => void };

/** The new key, shown this one time: it is not stored in plain text and cannot be shown again. */
export function ApiKeySecret({ created, onDone }: ApiKeySecretProps) {
  const t = useTranslations("integration.apiKeys");
  const common = useTranslations("common");
  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">{t("secretOnce")}</p>
      <CopyField
        id="api-key-secret"
        label={created.apiKey.name}
        value={created.secret}
        messages={{ copy: t("copy"), copied: t("copied"), copyFailed: t("copyFailed") }}
      />
      <DialogFooter>
        <Button type="button" onClick={onDone}>
          {common("close")}
        </Button>
      </DialogFooter>
    </div>
  );
}
