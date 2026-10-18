"use client";

import { Button } from "@okazi/ui";
import { DownloadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { downloadText } from "@/lib/download-text";
import { useToastAction } from "@/lib/use-toast-action";
import { exportTicketAction } from "../actions";

export type ExportTicketButtonProps = { id: string };

/** Downloads the ticket as a versioned json document (`ticket.export`, ADR 0024). */
export function ExportTicketButton({ id }: ExportTicketButtonProps) {
  const t = useTranslations("ticket");
  const common = useTranslations("common");
  const { run, pending } = useToastAction();
  const onClick = () =>
    run({
      action: () => exportTicketAction({ id }),
      messages: { pending: common("sending"), success: t("exported") },
      onSuccess: ({ value }) =>
        downloadText({ text: value.content, filename: value.filename, mimeType: value.mime }),
    });
  return (
    <Button variant="outline" disabled={pending} onClick={onClick}>
      <DownloadIcon />
      {t("export")}
    </Button>
  );
}
