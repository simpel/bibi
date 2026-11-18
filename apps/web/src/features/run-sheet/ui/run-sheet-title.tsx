"use client";

import { useTranslations } from "next-intl";
import { EditableTitle } from "@/components/states/editable-title";
import { updateRunSheetDefinitionAction } from "@/features/run-sheet-definition/actions";

export type RunSheetTitleProps = {
  /** The run sheet definition whose name this is: renaming it renames every version. */
  definitionId: string;
  name: string;
  canEdit: boolean;
};

/** The run sheet page's heading: rename in place (`template:write`, as on the definition). */
export function RunSheetTitle({ definitionId, name, canEdit }: RunSheetTitleProps) {
  const t = useTranslations("runSheet");
  return (
    <EditableTitle
      title={name}
      value={name}
      maxLength={100}
      label={t("nameLabel")}
      editLabel={t("editName")}
      successMessage={t("nameUpdated")}
      canEdit={canEdit}
      className="font-serif text-3xl"
      save={({ value }) =>
        updateRunSheetDefinitionAction({ input: { id: definitionId, name: value } })
      }
    />
  );
}
