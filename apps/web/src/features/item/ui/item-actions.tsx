"use client";

import type { ItemDto } from "@okazi/core";
import { Button } from "@okazi/ui";
import { ArchiveIcon, PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ArchiveItemDialog } from "./archive-item-dialog";
import { ItemDialog } from "./item-dialog";
import type { ItemFormData } from "./item-form-data";

export type ItemActionsProps = { item: ItemDto; data: ItemFormData };

/** Edit and archive buttons of the item detail page. */
export function ItemActions({ item, data }: ItemActionsProps) {
  const t = useTranslations("item");
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
      <ItemDialog
        data={data}
        item={item}
        open={dialog === "edit"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      <ArchiveItemDialog
        item={item}
        open={dialog === "archive"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </>
  );
}
