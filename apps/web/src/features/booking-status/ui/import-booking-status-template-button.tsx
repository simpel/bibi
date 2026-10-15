"use client";

import { useRouter } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { DownloadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useToastAction } from "@/lib/use-toast-action";
import { importBookingStatusTemplateAction } from "../actions";

/** Imports the "Conference venue" statuses and transitions; existing names are skipped. */
export function ImportBookingStatusTemplateButton() {
  const t = useTranslations("bookingStatus");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const importTemplate = () =>
    run({
      action: importBookingStatusTemplateAction,
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
