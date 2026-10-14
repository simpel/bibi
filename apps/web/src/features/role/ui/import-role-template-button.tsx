"use client";

import { useRouter } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { DownloadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useToastAction } from "@/lib/use-toast-action";
import { importRoleTemplateAction } from "../actions";

/** Imports the "Konferensgård" role template; roles that already exist are skipped. */
export function ImportRoleTemplateButton() {
  const t = useTranslations("role");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const importTemplate = () =>
    run({
      action: importRoleTemplateAction,
      messages: {
        pending: t("importing"),
        success: ({ value }) =>
          t("imported", { created: value.created.length, skipped: value.skipped.length }),
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
