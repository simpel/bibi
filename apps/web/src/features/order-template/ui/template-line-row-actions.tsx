"use client";

import type { OrderTemplateDto } from "@bibi/core/schemas";
import { DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { OrderTemplateFormData } from "./order-template-form-data";
import { RemoveTemplateLineDialog } from "./remove-template-line-dialog";
import { TemplateLineDialog } from "./template-line-dialog";

export type TemplateLineRowActionsProps = {
  template: OrderTemplateDto;
  data: OrderTemplateFormData;
  index: number;
};

/** Edit one line in the dialog, or remove it after a confirm. */
export function TemplateLineRowActions({ template, data, index }: TemplateLineRowActionsProps) {
  const t = useTranslations("orderTemplate");
  const common = useTranslations("common");
  const [dialog, setDialog] = useState<"edit" | "remove" | null>(null);
  return (
    <>
      <DataTableRowActions
        label={common("actions")}
        primary={[{ label: t("editLine"), icon: PencilIcon, onClick: () => setDialog("edit") }]}
      >
        <DropdownMenuItem destructive onSelect={() => setDialog("remove")}>
          {t("removeLine")}
        </DropdownMenuItem>
      </DataTableRowActions>
      <TemplateLineDialog
        {...{ template, data, index }}
        open={dialog === "edit"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      <RemoveTemplateLineDialog
        {...{ template, data, index }}
        open={dialog === "remove"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </>
  );
}
