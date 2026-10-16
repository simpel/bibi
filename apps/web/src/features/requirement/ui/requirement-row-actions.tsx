"use client";

import type { RequirementDto } from "@okazi/core";
import { Button } from "@okazi/ui";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { nameOf } from "@/components/form/named-option";
import { ArchiveRequirementDialog } from "./archive-requirement-dialog";
import { RequirementDialog } from "./requirement-dialog";
import type { RequirementFormData } from "./requirement-form-data";

export type RequirementRowActionsProps = { requirement: RequirementDto; data: RequirementFormData };

/** Edit the count or fields of one requirement, or remove it. */
export function RequirementRowActions({ requirement, data }: RequirementRowActionsProps) {
  const t = useTranslations("requirement");
  const [dialog, setDialog] = useState<"edit" | "archive" | null>(null);
  const icon = { variant: "ghost", size: "icon" } as const;
  return (
    <div className="flex justify-end gap-1">
      <Button {...icon} aria-label={t("edit")} onClick={() => setDialog("edit")}>
        <PencilIcon />
      </Button>
      <Button {...icon} aria-label={t("archive")} onClick={() => setDialog("archive")}>
        <Trash2Icon />
      </Button>
      <RequirementDialog
        data={data}
        bookingId={requirement.bookingId}
        requirement={requirement}
        open={dialog === "edit"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      <ArchiveRequirementDialog
        requirement={requirement}
        name={nameOf({ options: data.values, id: requirement.vocabularyValueId })}
        open={dialog === "archive"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </div>
  );
}
