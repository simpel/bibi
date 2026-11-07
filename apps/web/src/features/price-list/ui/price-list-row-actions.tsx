"use client";

import type { PriceListDto } from "@bibi/core";
import { DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { useRouter } from "@/lib/navigation";
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
  const router = useRouter();
  const editHref = updateRoute({
    detail: listItemRoute({ list: ROUTES.adminPriceLists, id: priceList.id }),
  });
  return (
    <DataTableRowActions
      label={common("actions")}
      primary={
        access.canEdit
          ? [{ label: t("edit"), icon: PencilIcon, onClick: () => router.push(editHref) }]
          : []
      }
    >
      {access.canEdit && !itemsHidden ? (
        <DropdownMenuItem onSelect={() => onOpen({ dialog: "items" })}>
          {t("items.edit")}
        </DropdownMenuItem>
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
