"use client";

import type { FieldDefinitionDto } from "@okazi/core";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@okazi/ui";
import { MoreHorizontalIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ArchiveFieldDialog } from "./archive-field-dialog";
import { FieldDialog } from "./field-dialog";
import { FieldOrderButtons } from "./field-order-buttons";
import type { VocabularyChoice } from "./field-source-fields";

export type FieldRowActionsProps = {
  field: FieldDefinitionDto;
  previous?: FieldDefinitionDto | undefined;
  next?: FieldDefinitionDto | undefined;
  vocabularies: VocabularyChoice[];
};

/** Reorder buttons plus an edit / archive menu for one field. */
export function FieldRowActions({ field, previous, next, vocabularies }: FieldRowActionsProps) {
  const t = useTranslations("fieldDefinition");
  const common = useTranslations("common");
  const [dialog, setDialog] = useState<"edit" | "archive" | null>(null);
  return (
    <div className="flex items-center justify-end">
      <FieldOrderButtons field={field} previous={previous} next={next} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={common("actions")}>
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setDialog("edit")}>{t("edit")}</DropdownMenuItem>
          <DropdownMenuItem destructive onSelect={() => setDialog("archive")}>
            {t("archive")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <FieldDialog
        entityTypeId={field.entityTypeId}
        field={field}
        vocabularies={vocabularies}
        open={dialog === "edit"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      <ArchiveFieldDialog
        field={field}
        open={dialog === "archive"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </div>
  );
}
