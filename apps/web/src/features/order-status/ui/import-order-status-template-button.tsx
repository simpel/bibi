"use client";

import { Button } from "@bibi/ui";
import { DownloadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { importOrderStatusTemplateAction } from "../actions";

/** Imports the "Conference estate" statuses, transitions and grid; existing names are skipped. */
export function ImportOrderStatusTemplateButton() {
  const t = useTranslations("orderStatus");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const importTemplate = () =>
    run({
      action: importOrderStatusTemplateAction,
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
