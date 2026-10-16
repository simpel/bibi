"use client";

import { Button } from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { PriceListFormData } from "./load-price-list-form-data";
import { PriceListDialog } from "./price-list-dialog";

export type CreatePriceListButtonProps = { data: PriceListFormData };

/** Opens the create-price-list dialog. */
export function CreatePriceListButton({ data }: CreatePriceListButtonProps) {
  const t = useTranslations("priceList");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        {t("create")}
      </Button>
      <PriceListDialog data={data} open={open} onOpenChange={setOpen} />
    </>
  );
}
