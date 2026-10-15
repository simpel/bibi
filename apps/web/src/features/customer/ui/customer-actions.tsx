"use client";

import type { CustomerDto } from "@okazi/core";
import { Button } from "@okazi/ui";
import { ArchiveIcon, PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { TypedFormData } from "@/components/typed-fields/typed-form-data";
import { ArchiveCustomerDialog } from "./archive-customer-dialog";
import { CustomerDialog } from "./customer-dialog";

export type CustomerActionsProps = { customer: CustomerDto; data: TypedFormData };

/** Edit and archive buttons of the customer detail page. */
export function CustomerActions({ customer, data }: CustomerActionsProps) {
  const t = useTranslations("customer");
  const [dialog, setDialog] = useState<"edit" | "archive" | null>(null);
  return (
    <>
      <Button variant="outline" onClick={() => setDialog("edit")}>
        <PencilIcon />
        {t("edit")}
      </Button>
      <Button variant="outline" onClick={() => setDialog("archive")}>
        <ArchiveIcon />
        {t("archive")}
      </Button>
      <CustomerDialog
        data={data}
        customer={customer}
        open={dialog === "edit"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      <ArchiveCustomerDialog
        customer={customer}
        open={dialog === "archive"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </>
  );
}
