"use client";

import type { FieldDefinitionDto } from "@okazi/core";
import { DataTableRowActions, DropdownMenuItem } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ArchiveFieldDialog } from "./archive-field-dialog";
import { FieldDialog } from "./field-dialog";
import { FieldMoveItems } from "./field-move-items";
import type { VocabularyChoice } from "./field-source-fields";

export type FieldRowActionsProps = {
  field: FieldDefinitionDto;
  /** Neighbours in display order; absent at the ends of the list. */
  previous?: FieldDefinitionDto | undefined;
  next?: FieldDefinitionDto | undefined;
  vocabularies: VocabularyChoice[];
  linkTypes: VocabularyChoice[];
};

/** Move up / move down / edit / archive menu for one field. */
export function FieldRowActions(props: FieldRowActionsProps) {
  const { field, previous, next, vocabularies, linkTypes } = props;
  const t = useTranslations("fieldDefinition");
  const common = useTranslations("common");
  const [dialog, setDialog] = useState<"edit" | "archive" | null>(null);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        <FieldMoveItems field={field} previous={previous} next={next} />
        <DropdownMenuItem onSelect={() => setDialog("edit")}>{t("edit")}</DropdownMenuItem>
        <DropdownMenuItem destructive onSelect={() => setDialog("archive")}>
          {t("archive")}
        </DropdownMenuItem>
      </DataTableRowActions>
      <FieldDialog
        entityTypeId={field.entityTypeId}
        field={field}
        vocabularies={vocabularies}
        linkTypes={linkTypes}
        open={dialog === "edit"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      <ArchiveFieldDialog
        field={field}
        open={dialog === "archive"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </>
  );
}
