"use client";

import { Button } from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { SetupDialog } from "./setup-dialog";

/** Opens the create-setup dialog. */
export function CreateSetupButton() {
  const t = useTranslations("setup");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        {t("create")}
      </Button>
      <SetupDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
