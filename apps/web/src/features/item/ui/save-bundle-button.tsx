"use client";

import { Button } from "@okazi/ui";
import { PackagePlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ItemDialog } from "./item-dialog";
import type { ItemFormData } from "./item-form-data";

export type SaveBundleButtonProps = { customerId: string; data: ItemFormData };

/** "Save as bundle": opens the item form that saves a BUNDLE item for this customer. */
export function SaveBundleButton({ customerId, data }: SaveBundleButtonProps) {
  const t = useTranslations("item");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <PackagePlusIcon />
        {t("saveBundle")}
      </Button>
      <ItemDialog data={data} customerId={customerId} open={open} onOpenChange={setOpen} />
    </>
  );
}
