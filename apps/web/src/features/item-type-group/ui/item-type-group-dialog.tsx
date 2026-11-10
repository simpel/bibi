import type { ItemTypeGroupDto } from "@bibi/core";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { ItemTypeGroupForm } from "./item-type-group-form";

export type ItemTypeGroupDialogProps = {
  /** Present = edit mode, absent = create mode. */
  group?: ItemTypeGroupDto | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ItemTypeGroupDialog({ group, open, onOpenChange }: ItemTypeGroupDialogProps) {
  const t = useTranslations("itemTypeGroup");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{group ? t("edit") : t("create")}</DialogTitle>
          <DialogDescription>
            {group ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <ItemTypeGroupForm key={group?.id} group={group} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
