"use client";

import type { ItemDto } from "@okazi/core";
import { Button } from "@okazi/ui";
import { ArchiveIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ArchiveItemDialog } from "./archive-item-dialog";

export type ArchiveItemButtonProps = { item: ItemDto };

/** Opens the archive confirmation. */
export function ArchiveItemButton({ item }: ArchiveItemButtonProps) {
  const t = useTranslations("item");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <ArchiveIcon />
        {t("archive")}
      </Button>
      <ArchiveItemDialog item={item} open={open} onOpenChange={setOpen} />
    </>
  );
}
