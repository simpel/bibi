"use client";

import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ItemTypeGroupDialog } from "./item-type-group-dialog";

/** Opens the create-group dialog. */
export function CreateItemTypeGroupButton() {
  const t = useTranslations("itemTypeGroup");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        {t("create")}
      </Button>
      <ItemTypeGroupDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
