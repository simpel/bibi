"use client";

import type { ContactDto } from "@okazi/core";
import { DataTableRowActions, DropdownMenuItem } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { TypedFormData } from "@/components/typed-fields/typed-form-data";
import { ArchiveContactDialog } from "./archive-contact-dialog";
import { ContactDialog } from "./contact-dialog";

export type ContactRowActionsProps = { contact: ContactDto; data: TypedFormData };

/** Edit and archive of one contact person in the customer's contact table. */
export function ContactRowActions({ contact, data }: ContactRowActionsProps) {
  const t = useTranslations("contact");
  const common = useTranslations("common");
  const [dialog, setDialog] = useState<"edit" | "archive" | null>(null);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        <DropdownMenuItem onSelect={() => setDialog("edit")}>{t("edit")}</DropdownMenuItem>
        <DropdownMenuItem destructive onSelect={() => setDialog("archive")}>
          {t("archive")}
        </DropdownMenuItem>
      </DataTableRowActions>
      <ContactDialog
        customerId={contact.customerId}
        data={data}
        contact={contact}
        open={dialog === "edit"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      <ArchiveContactDialog
        contact={contact}
        open={dialog === "archive"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </>
  );
}
