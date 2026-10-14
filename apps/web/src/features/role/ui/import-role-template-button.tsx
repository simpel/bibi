"use client";

import { useRouter } from "@okazi/i18n/navigation";
import { Button, toast } from "@okazi/ui";
import { DownloadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionSubmit } from "@/lib/use-action-submit";
import { type ImportRoleTemplateResult, importRoleTemplateAction } from "../actions";

/** Imports the "Konferensgård" role template; roles that already exist are skipped. */
export function ImportRoleTemplateButton() {
  const t = useTranslations("role");
  const router = useRouter();
  const { pending, run } = useActionSubmit<ImportRoleTemplateResult>({
    onSuccess: ({ created, skipped }) => {
      toast.success(t("imported", { created: created.length, skipped: skipped.length }));
      router.refresh();
    },
  });
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() => run({ action: importRoleTemplateAction })}
    >
      <DownloadIcon />
      {t("importTemplate")}
    </Button>
  );
}
