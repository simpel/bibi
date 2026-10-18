import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { CheckField } from "@/components/form/check-field";
import type { ArchiveCustomerInput, ArchiveCustomerValues } from "./use-archive-customer-form";

export type ArchiveTicketsFieldProps = {
  form: UseFormReturn<ArchiveCustomerValues, unknown, ArchiveCustomerInput>;
  count: number;
};

/** Why archiving is blocked (N tickets) and the box to archive them with the customer. */
export function ArchiveTicketsField({ form, count }: ArchiveTicketsFieldProps) {
  const t = useTranslations("customer");
  return (
    <div className="grid gap-3" data-slot="archive-customer-tickets">
      <p className="text-sm">{t("archiveBlocked", { count })}</p>
      <CheckField form={form} name="archiveTickets" label={t("archiveTickets", { count })} />
    </div>
  );
}
