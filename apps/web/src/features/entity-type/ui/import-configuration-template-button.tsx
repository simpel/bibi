"use client";

import { useRouter } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { DownloadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useToastAction } from "@/lib/use-toast-action";
import { importConfigurationTemplateAction } from "../actions";

/** Imports the "Conference venue" starter pack; types that already exist are skipped. */
export function ImportConfigurationTemplateButton() {
  const t = useTranslations("entityType");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const importTemplate = () =>
    run({
      action: importConfigurationTemplateAction,
      messages: {
        pending: t("importing"),
        success: ({ value }) =>
          t("imported", {
            created: value.created.entityTypes.length,
            skipped: value.skipped.entityTypes.length,
          }),
      },
      onSuccess: () => router.refresh(),
    });
  return (
    <Button variant="outline" disabled={pending} onClick={importTemplate}>
      <DownloadIcon />
      {t("importTemplate")}
    </Button>
  );
}
