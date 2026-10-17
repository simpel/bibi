import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { CheckField } from "@/components/form/check-field";
import type { ArchiveCustomerInput, ArchiveCustomerValues } from "./use-archive-customer-form";

export type ArchiveInquiriesFieldProps = {
  form: UseFormReturn<ArchiveCustomerValues, unknown, ArchiveCustomerInput>;
};

/** Box to archive the customer's active inquiries with it; any active inquiry blocks otherwise. */
export function ArchiveInquiriesField({ form }: ArchiveInquiriesFieldProps) {
  const t = useTranslations("customer");
  return (
    <div data-slot="archive-customer-inquiries">
      <CheckField form={form} name="archiveInquiries" label={t("archiveInquiries")} />
    </div>
  );
}
