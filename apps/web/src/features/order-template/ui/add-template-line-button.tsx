"use client";

import type { OrderTemplateDto } from "@bibi/core/schemas";
import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { OrderTemplateFormData } from "./order-template-form-data";
import { TemplateLineDialog } from "./template-line-dialog";

export type AddTemplateLineButtonProps = {
  template: OrderTemplateDto;
  data: OrderTemplateFormData;
};

/** Add line: opens the line dialog with an empty line appended to the template. */
export function AddTemplateLineButton({ template, data }: AddTemplateLineButtonProps) {
  const t = useTranslations("orderTemplate");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <PlusIcon />
        {t("addLine")}
      </Button>
      <TemplateLineDialog
        template={template}
        data={data}
        index={null}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
