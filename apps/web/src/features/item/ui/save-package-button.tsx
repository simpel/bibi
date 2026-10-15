"use client";

import { Button } from "@okazi/ui";
import { PackagePlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ItemDialog } from "./item-dialog";
import type { ItemFormData } from "./item-form-data";

export type SavePackageButtonProps = { customerId: string; data: ItemFormData };

/** "Save as package": opens the item form that saves a COMPOSABLE item for this customer. */
export function SavePackageButton({ customerId, data }: SavePackageButtonProps) {
  const t = useTranslations("item");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <PackagePlusIcon />
        {t("savePackage")}
      </Button>
      <ItemDialog data={data} customerId={customerId} open={open} onOpenChange={setOpen} />
    </>
  );
}
