"use client";

import { Button } from "@okazi/ui";
import { UploadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ImportSkillDialog } from "./import-skill-dialog";

/** Opens the SKILL.md import dialog. */
export function ImportSkillButton() {
  const t = useTranslations("skills");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <UploadIcon />
        {t("import")}
      </Button>
      <ImportSkillDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
