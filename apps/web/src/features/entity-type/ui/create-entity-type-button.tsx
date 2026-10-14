"use client";

import { Button } from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { EntityTypeDialog } from "./entity-type-dialog";

/** Opens the create-type dialog. */
export function CreateEntityTypeButton() {
  const t = useTranslations("entityType");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        {t("create")}
      </Button>
      <EntityTypeDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
