"use client";

import { Button } from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ResponsibilityDialog } from "./responsibility-dialog";
import type { ResponsibilityOptions } from "./responsibility-options";

export type CreateResponsibilityButtonProps = { options: ResponsibilityOptions };

/** Opens the create-responsibility dialog. */
export function CreateResponsibilityButton({ options }: CreateResponsibilityButtonProps) {
  const t = useTranslations("responsibility");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        {t("create")}
      </Button>
      <ResponsibilityDialog options={options} open={open} onOpenChange={setOpen} />
    </>
  );
}
