"use client";

import { useRouter } from "@bibi/i18n/navigation";
import { Button } from "@bibi/ui";
import { DownloadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useToastAction } from "@/lib/use-toast-action";
import { importTicketPhaseTemplateAction } from "../actions";

/** Imports the "Conference estate" phases, transitions and grid; existing names are skipped. */
export function ImportTicketPhaseTemplateButton() {
  const t = useTranslations("ticketPhase");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const importTemplate = () =>
    run({
      action: importTicketPhaseTemplateAction,
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
