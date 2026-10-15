import type { CustomerDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { Button, DialogFooter, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/lib/routes";
import { useFormAction } from "@/lib/use-form-action";
import { archiveCustomerAction } from "../actions";
import { ArchiveBookingsField } from "./archive-bookings-field";
import { useArchiveCustomerForm } from "./use-archive-customer-form";

export type ArchiveCustomerFormProps = { customer: CustomerDto; onClose: () => void };

/**
 * Bookings that are not archived block archiving the customer, whatever their status (#134):
 * the form says how many, and confirm stays disabled until the box to archive them too is
 * ticked. The detail page is gone afterwards, so go back to the list.
 */
export function ArchiveCustomerForm({ customer, onClose }: ArchiveCustomerFormProps) {
  const t = useTranslations("customer");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useArchiveCustomerForm({ id: customer.id });
  const count = customer.bookingCount;
  const blocked = count > 0 && !form.watch("archiveBookings");
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => archiveCustomerAction({ values }),
    messages: {
      pending: t("archiving"),
      success: count > 0 ? t("archivedWithBookings", { count }) : t("archived"),
    },
    onSuccess: () => {
      onClose();
      router.replace(ROUTES.customers);
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        {count > 0 ? <ArchiveBookingsField form={form} count={count} /> : null}
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
