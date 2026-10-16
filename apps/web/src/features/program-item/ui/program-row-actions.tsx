"use client";

import type { ProgramItemDto } from "@okazi/core";
import { Button } from "@okazi/ui";
import { PencilIcon, Trash2Icon, UserRoundIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ArchiveProgramItemDialog } from "./archive-program-item-dialog";
import { AssignResponsibleDialog } from "./assign-responsible-dialog";
import type { ProgramFormData } from "./program-form-data";
import { ProgramItemDialog } from "./program-item-dialog";

export type ProgramRowActionsProps = { programItem: ProgramItemDto; data: ProgramFormData };

/** Edit, change the responsible person and remove one row of the run schedule. */
export function ProgramRowActions({ programItem, data }: ProgramRowActionsProps) {
  const t = useTranslations("programItem");
  const [dialog, setDialog] = useState<"edit" | "assign" | "archive" | null>(null);
  const icon = { variant: "ghost", size: "icon" } as const;
  return (
    <div className="flex justify-end gap-1">
      <Button {...icon} aria-label={t("edit")} onClick={() => setDialog("edit")}>
        <PencilIcon />
      </Button>
      <Button {...icon} aria-label={t("assign")} onClick={() => setDialog("assign")}>
        <UserRoundIcon />
      </Button>
      <Button {...icon} aria-label={t("archive")} onClick={() => setDialog("archive")}>
        <Trash2Icon />
      </Button>
      <ProgramItemDialog
        data={data}
        bookingId={programItem.bookingId}
        startsAt={programItem.startsAt}
        programItem={programItem}
        open={dialog === "edit"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      <AssignResponsibleDialog
        programItem={programItem}
        members={data.members}
        open={dialog === "assign"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      <ArchiveProgramItemDialog
        programItem={programItem}
        open={dialog === "archive"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </div>
  );
}
