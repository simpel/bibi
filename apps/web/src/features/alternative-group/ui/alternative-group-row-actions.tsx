import type { AlternativeGroupDto } from "@okazi/core/schemas";
import { useRouter } from "@okazi/i18n/navigation";
import {
  DataTableRowActions,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useToastAction } from "@/lib/use-toast-action";
import { chooseAlternativeAction } from "../actions";
import { ArchiveAlternativeGroupDialog } from "./archive-alternative-group-dialog";
import type { OptionLine } from "./option-line";
import { RenameAlternativeGroupDialog } from "./rename-alternative-group-dialog";

export type AlternativeGroupRowActionsProps = { group: AlternativeGroupDto; lines: OptionLine[] };

type ChooseMenuProps = AlternativeGroupRowActionsProps;

/** One entry per option; picking one releases the others (ADR 0052). */
function ChooseMenu({ group, lines }: ChooseMenuProps) {
  const t = useTranslations("alternativeGroup");
  const common = useTranslations("common");
  const router = useRouter();
  const { run } = useToastAction();
  const choose = ({ lineId }: { lineId: string }) =>
    run({
      action: () => chooseAlternativeAction({ input: { id: group.id, lineId } }),
      messages: { pending: common("saving"), success: t("chooseDone") },
      onSuccess: () => router.refresh(),
    });
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>{t("choose")}</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {group.optionLineIds.map((lineId) => (
          <DropdownMenuItem key={lineId} onSelect={() => choose({ lineId })}>
            {lines.find((line) => line.id === lineId)?.name ?? lineId}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

/** Choose an option, rename or dissolve one alternative group. */
export function AlternativeGroupRowActions({ group, lines }: AlternativeGroupRowActionsProps) {
  const t = useTranslations("alternativeGroup");
  const common = useTranslations("common");
  const [dialog, setDialog] = useState<"rename" | "archive" | null>(null);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        {group.chosenLineId ? null : <ChooseMenu group={group} lines={lines} />}
        <DropdownMenuItem onSelect={() => setDialog("rename")}>{t("rename")}</DropdownMenuItem>
        <DropdownMenuItem destructive onSelect={() => setDialog("archive")}>
          {t("archive")}
        </DropdownMenuItem>
      </DataTableRowActions>
      <RenameAlternativeGroupDialog
        group={group}
        open={dialog === "rename"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      <ArchiveAlternativeGroupDialog
        group={group}
        open={dialog === "archive"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </>
  );
}
