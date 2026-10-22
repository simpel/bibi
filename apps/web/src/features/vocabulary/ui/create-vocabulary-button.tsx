"use client";

import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { VocabularyDialog } from "./vocabulary-dialog";

/** Opens the create-list dialog. */
export function CreateVocabularyButton() {
  const t = useTranslations("vocabulary");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        {t("create")}
      </Button>
      <VocabularyDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
