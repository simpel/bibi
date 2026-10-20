"use client";

import type { PriceListDto } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import { DataTableRowActions, DropdownMenuItem } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { listItemRoute, ROUTES, updateRoute } from "@/lib/routes";
import { ArchivePriceListDialog } from "./archive-price-list-dialog";
import type { PriceListFormData } from "./load-price-list-form-data";
import { PriceListItemsDialog } from "./price-list-items-dialog";

export type PriceListRowActionsProps = {
  priceList: PriceListDto;
  data: PriceListFormData;
  access: RowAccess;
};

type Open = "items" | "archive";

type MenuProps = {
  priceList: PriceListDto;
  access: RowAccess;
  itemsHidden: boolean;
  onOpen: (input: { dialog: Open }) => void;
};

function ActionsMenu({ priceList, access, itemsHidden, onOpen }: MenuProps) {
  const t = useTranslations("priceList");
  const common = useTranslations("common");
  return (
    <DataTableRowActions label={common("actions")}>
      {access.canEdit ? (
        <>
          <DropdownMenuItem asChild>
            <Link
              href={updateRoute({
                detail: listItemRoute({ list: ROUTES.settingsPriceLists, id: priceList.id }),
              })}
            >
              {t("edit")}
            </Link>
          </DropdownMenuItem>
          {itemsHidden ? null : (
            <DropdownMenuItem onSelect={() => onOpen({ dialog: "items" })}>
              {t("items.edit")}
            </DropdownMenuItem>
          )}
        </>
      ) : null}
      {access.canRemove ? (
        <DropdownMenuItem destructive onSelect={() => onOpen({ dialog: "archive" })}>
          {t("archive")}
        </DropdownMenuItem>
      ) : null}
    </DataTableRowActions>
  );
}

/** Edit / item prices / archive menu for one price list. */
export function PriceListRowActions({ priceList, data, access }: PriceListRowActionsProps) {
  const [dialog, setDialog] = useState<Open | null>(null);
  const props = ({ key }: { key: Open }) => ({
    open: dialog === key,
    onOpenChange: (open: boolean) => !open && setDialog(null),
  });
  return (
    <>
      <ActionsMenu
        priceList={priceList}
        access={access}
        itemsHidden={data.itemsHidden}
        onOpen={({ dialog: key }) => setDialog(key)}
      />
      <PriceListItemsDialog priceList={priceList} items={data.items} {...props({ key: "items" })} />
      <ArchivePriceListDialog priceList={priceList} {...props({ key: "archive" })} />
    </>
  );
}
