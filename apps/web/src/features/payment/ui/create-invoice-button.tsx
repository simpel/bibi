"use client";

import { useRouter } from "@bibi/i18n/navigation";
import { Button } from "@bibi/ui";
import { FileTextIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToastAction } from "@/lib/use-toast-action";
import { createInvoiceAction } from "../../invoice/actions";

/** Freezes the ticket's priced lines as an invoice (`invoice.create`) after a confirmation. */
export function CreateInvoiceButton({ ticketId }: { ticketId: string }) {
  const t = useTranslations("invoice");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const [open, setOpen] = useState(false);
  const create = () =>
    run({
      action: () => createInvoiceAction({ ticketId }),
      messages: { pending: common("saving"), success: t("created") },
      onSuccess: () => {
        setOpen(false);
        router.refresh();
      },
    });
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <FileTextIcon />
        {t("create")}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("create")}
        description={t("createConfirm")}
        confirmLabel={t("create")}
        pending={pending}
        onConfirm={create}
      />
    </>
  );
}
