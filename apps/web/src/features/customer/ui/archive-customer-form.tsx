import type { CustomerDto } from "@bibi/core";
import { Button, DialogFooter, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { useFormAction } from "@/lib/use-form-action";
import { archiveCustomerAction } from "../actions";
import { ArchiveTicketsField } from "./archive-tickets-field";
import { useArchiveCustomerForm } from "./use-archive-customer-form";

export type ArchiveCustomerFormProps = { customer: CustomerDto; onClose: () => void };

/**
 * Tickets that are not archived block archiving the customer, whatever their status (#134):
 * the form says how many, and confirm stays disabled until the box to archive them too is
 * ticked. The count shown is bound to the input (#144). The detail page is gone afterwards, so
 * go back to the list.
 */
export function ArchiveCustomerForm({ customer, onClose }: ArchiveCustomerFormProps) {
  const t = useTranslations("customer");
  const common = useTranslations("common");
  const router = useRouter();
  // `null`: the caller may not view tickets, so no count is shown and none is bound (ADR 0050).
  const count = customer.ticketCount ?? 0;
  const form = useArchiveCustomerForm({ id: customer.id, ticketCount: count });
  const blocked = count > 0 && !form.watch("archiveTickets");
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => archiveCustomerAction({ values }),
    messages: {
      pending: t("archiving"),
      success: count > 0 ? t("archivedWithTickets", { count }) : t("archived"),
    },
    onSuccess: () => {
      onClose();
      router.replace(ROUTES.customers);
    },
    // A CONFLICT may mean the ticket count changed since the dialog opened: reload the count.
    onError: () => router.refresh(),
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        {count > 0 ? <ArchiveTicketsField form={form} count={count} /> : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {common("cancel")}
          </Button>
          <Button type="submit" variant="destructive" disabled={pending || blocked}>
            {t("archive")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
