"use client";

import type { PriceListDto } from "@okazi/core";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@okazi/ui";
import { MoreHorizontalIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ArchivePriceListDialog } from "./archive-price-list-dialog";
import type { PriceListFormData } from "./load-price-list-form-data";
import { PriceListDialog } from "./price-list-dialog";
import { PriceListItemsDialog } from "./price-list-items-dialog";

export type PriceListRowActionsProps = { priceList: PriceListDto; data: PriceListFormData };

type Open = "edit" | "items" | "archive";

type MenuProps = { onOpen: (input: { dialog: Open }) => void };

function ActionsMenu({ onOpen }: MenuProps) {
  const t = useTranslations("priceList");
  const common = useTranslations("common");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={common("actions")}>
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onOpen({ dialog: "edit" })}>{t("edit")}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onOpen({ dialog: "items" })}>
          {t("items.edit")}
        </DropdownMenuItem>
        <DropdownMenuItem destructive onSelect={() => onOpen({ dialog: "archive" })}>
          {t("archive")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Edit / item prices / archive menu for one price list. */
export function PriceListRowActions({ priceList, data }: PriceListRowActionsProps) {
  const [dialog, setDialog] = useState<Open | null>(null);
  const props = ({ key }: { key: Open }) => ({
    open: dialog === key,
    onOpenChange: (open: boolean) => !open && setDialog(null),
  });
  return (
    <>
      <ActionsMenu onOpen={({ dialog: key }) => setDialog(key)} />
      <PriceListDialog priceList={priceList} data={data} {...props({ key: "edit" })} />
      <PriceListItemsDialog priceList={priceList} items={data.items} {...props({ key: "items" })} />
      <ArchivePriceListDialog priceList={priceList} {...props({ key: "archive" })} />
    </>
  );
}
