"use client";

import { Button } from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FieldDialog } from "./field-dialog";
import type { VocabularyChoice } from "./field-source-fields";

export type AddFieldButtonProps = { entityTypeId: string; vocabularies: VocabularyChoice[] };

/** Opens the add-field dialog of a type. */
export function AddFieldButton({ entityTypeId, vocabularies }: AddFieldButtonProps) {
  const t = useTranslations("fieldDefinition");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        {t("create")}
      </Button>
      <FieldDialog
        entityTypeId={entityTypeId}
        vocabularies={vocabularies}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
