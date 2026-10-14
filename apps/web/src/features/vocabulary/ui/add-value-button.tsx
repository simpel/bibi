"use client";

import { Button } from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ValueDialog } from "./value-dialog";

export type AddValueButtonProps = { vocabularyId: string };

/** Opens the add-value dialog of a list. */
export function AddValueButton({ vocabularyId }: AddValueButtonProps) {
  const t = useTranslations("vocabulary.value");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        {t("add")}
      </Button>
      <ValueDialog vocabularyId={vocabularyId} open={open} onOpenChange={setOpen} />
    </>
  );
}
