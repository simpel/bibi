"use client";

import { Button } from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { TypedFormData } from "@/components/typed-fields/typed-form-data";
import { ContactDialog } from "./contact-dialog";

export type CreateContactButtonProps = { customerId: string; data: TypedFormData };

/** Opens the create-contact dialog for the customer on the page. */
export function CreateContactButton({ customerId, data }: CreateContactButtonProps) {
  const t = useTranslations("contact");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <PlusIcon />
        {t("create")}
      </Button>
      <ContactDialog customerId={customerId} data={data} open={open} onOpenChange={setOpen} />
    </>
  );
}
