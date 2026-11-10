"use client";

import type { ItemTypeGroupDto } from "@bibi/core";
import { DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { ArrowDownIcon, ArrowUpIcon, PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { reorderItemTypeGroupsAction } from "../actions";
import { ArchiveItemTypeGroupDialog } from "./archive-item-type-group-dialog";
import { ItemTypeGroupDialog } from "./item-type-group-dialog";
import { moveGroup } from "./move-group";

export type ItemTypeGroupRowActionsProps = {
  group: ItemTypeGroupDto;
  /** Every active group id in its current order. */
  ids: string[];
  access: RowAccess;
};

/** Edit, move up, move down and archive for one group. */
export function ItemTypeGroupRowActions({ group, ids, access }: ItemTypeGroupRowActionsProps) {
  const t = useTranslations("itemTypeGroup");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const [dialog, setDialog] = useState<"edit" | "archive" | null>(null);
  const index = ids.indexOf(group.id);
  const move = ({ direction }: { direction: -1 | 1 }) =>
    run({
      action: () =>
        reorderItemTypeGroupsAction({ ids: moveGroup({ ids, id: group.id, direction }) }),
      messages: { pending: t("saving"), success: t("reordered") },
      onSuccess: () => router.refresh(),
    });
  return (
    <>
      <DataTableRowActions
        label={common("actions")}
        primary={
          access.canEdit
            ? [{ label: t("edit"), icon: PencilIcon, onClick: () => setDialog("edit") }]
            : []
        }
      >
        {access.canEdit ? (
          <>
            <DropdownMenuItem
              disabled={pending || index <= 0}
              onSelect={() => move({ direction: -1 })}
            >
              <ArrowUpIcon />
              {t("moveUp")}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={pending || index < 0 || index >= ids.length - 1}
              onSelect={() => move({ direction: 1 })}
            >
              <ArrowDownIcon />
              {t("moveDown")}
            </DropdownMenuItem>
          </>
        ) : null}
        {access.canRemove ? (
          <DropdownMenuItem destructive onSelect={() => setDialog("archive")}>
            {t("archive")}
          </DropdownMenuItem>
        ) : null}
      </DataTableRowActions>
      <ItemTypeGroupDialog
        group={group}
        open={dialog === "edit"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      <ArchiveItemTypeGroupDialog
        group={group}
        open={dialog === "archive"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </>
  );
}
