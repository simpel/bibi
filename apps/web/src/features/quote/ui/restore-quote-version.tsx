"use client";

import { Button } from "@bibi/ui";
import { HistoryIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { VersionDialog } from "@/features/order-version/ui/version-dialog";

export type RestoreQuoteVersionProps = { versionId: string; quoteVersion: number };

/**
 * "Restore to the order" on a sent quote (ADR 0116): the order version it was sent as, with what
 * the order has changed since and Restore.
 */
export function RestoreQuoteVersion({ versionId, quoteVersion }: RestoreQuoteVersionProps) {
  const t = useTranslations("quote");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <HistoryIcon />
        {t("restoreToOrder")}
      </Button>
      <VersionDialog
        versionId={versionId}
        title={t("restoreTitle", { version: quoteVersion })}
        open={open}
        onOpenChange={setOpen}
        canRestore
      />
    </>
  );
}
