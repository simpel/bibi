"use client";

import type { CustomerDto } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { ArchiveIcon, PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { customerRoute, updateRoute } from "@/lib/routes";
import { ArchiveCustomerDialog } from "./archive-customer-dialog";

export type CustomerActionsProps = {
  customer: CustomerDto;
  canEdit: boolean;
  canArchive: boolean;
};

/** Edit (its own page) and archive buttons of the customer detail page. */
export function CustomerActions({ customer, canEdit, canArchive }: CustomerActionsProps) {
  const t = useTranslations("customer");
  const [archiving, setArchiving] = useState(false);
  return (
    <>
      {canEdit ? (
        <Button asChild variant="outline">
          <Link href={updateRoute({ detail: customerRoute({ id: customer.id }) })}>
            <PencilIcon />
            {t("edit")}
          </Link>
        </Button>
      ) : null}
      {canArchive ? (
        <Button variant="outline" onClick={() => setArchiving(true)}>
          <ArchiveIcon />
          {t("archive")}
        </Button>
      ) : null}
      <ArchiveCustomerDialog customer={customer} open={archiving} onOpenChange={setArchiving} />
    </>
  );
}
