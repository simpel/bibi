"use client";

import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { RequirementDialog } from "./requirement-dialog";
import type { RequirementFormData } from "./requirement-form-data";

export type CreateRequirementButtonProps = { data: RequirementFormData; ticketId: string };

/** Opens the requirement dialog for the ticket on the page. */
export function CreateRequirementButton(props: CreateRequirementButtonProps) {
  const t = useTranslations("requirement");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <PlusIcon />
        {t("create")}
      </Button>
      <RequirementDialog {...props} open={open} onOpenChange={setOpen} />
    </>
  );
}
