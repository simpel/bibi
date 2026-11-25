"use client";

import type { CustomerDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { ArchiveDangerArea } from "@/components/danger-area/archive-danger-area";
import { ArchiveCustomerDialog } from "./archive-customer-dialog";

export type CustomerDangerAreaProps = { customer: CustomerDto };

/** The customer's danger area, last on its page: the only place it is archived. */
export function CustomerDangerArea({ customer }: CustomerDangerAreaProps) {
  const t = useTranslations("customer");
  return (
    <ArchiveDangerArea
      label={t("archive")}
      description={t("archiveConfirm", { name: customer.name })}
      dialog={(state) => <ArchiveCustomerDialog customer={customer} {...state} />}
    />
  );
}
