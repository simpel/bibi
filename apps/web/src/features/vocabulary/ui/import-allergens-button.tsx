"use client";

import { useRouter } from "@bibi/i18n/navigation";
import { Button } from "@bibi/ui";
import { DownloadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useToastAction } from "@/lib/use-toast-action";
import { importAllergensAction } from "../actions";

/** Imports the "EU:s 14 allergener" list template; refused (toast) when the list exists. */
export function ImportAllergensButton() {
  const t = useTranslations("vocabulary");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const importTemplate = () =>
    run({
      action: importAllergensAction,
      messages: {
        pending: t("importing"),
        success: ({ value }) => t("imported", { name: value.name }),
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
