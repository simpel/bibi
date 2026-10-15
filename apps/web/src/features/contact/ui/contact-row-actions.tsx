"use client";

import type { ContactDto } from "@okazi/core";
import { Button } from "@okazi/ui";
import { ArchiveIcon, PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { TypedFormData } from "@/components/typed-fields/typed-form-data";
import { ArchiveContactDialog } from "./archive-contact-dialog";
import { ContactDialog } from "./contact-dialog";

export type ContactRowActionsProps = { contact: ContactDto; data: TypedFormData };

/** Edit and archive of one contact person in the customer's contact table. */
export function ContactRowActions({ contact, data }: ContactRowActionsProps) {
  const t = useTranslations("contact");
  const [dialog, setDialog] = useState<"edit" | "archive" | null>(null);
  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon" aria-label={t("edit")} onClick={() => setDialog("edit")}>
        <PencilIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("archive")}
        onClick={() => setDialog("archive")}
      >
        <ArchiveIcon />
      </Button>
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
    </div>
  );
}
