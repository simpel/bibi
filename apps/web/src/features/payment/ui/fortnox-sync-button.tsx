"use client";

import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { syncInvoiceAction } from "../../invoice/actions";

export type FortnoxSyncButtonProps = { id: string };

/** Raises a SENT invoice in Fortnox if that failed and mirrors the payments booked there. */
export function FortnoxSyncButton({ id }: FortnoxSyncButtonProps) {
  const t = useTranslations("invoice");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const sync = () =>
    run({
      action: () => syncInvoiceAction({ id }),
      messages: { pending: common("saving"), success: t("synced") },
      onSuccess: () => router.refresh(),
    });
  return (
    <Button size="sm" variant="outline" disabled={pending} onClick={sync}>
      {t("sync")}
    </Button>
  );
}
