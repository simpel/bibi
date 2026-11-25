"use client";

import type { OrderTemplateDto } from "@bibi/core/schemas";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Form,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { InlineEditContext } from "@/components/inline-edit/inline-edit";
import type { OrderTemplateFormData } from "./order-template-form-data";
import { emptyLine } from "./order-template-form-schema";
import { TemplateLineFields } from "./template-line-fields";
import { useTemplateEdit } from "./use-template-edit";

type LineFormProps = {
  template: OrderTemplateDto;
  data: OrderTemplateFormData;
  /** The line to edit; null adds a new one at the end. */
  index: number | null;
};

/** One line's fields over the whole template's form; Save sends the template's lines. */
function TemplateLineForm({ template, data, index }: LineFormProps) {
  const common = useTranslations("common");
  const t = useTranslations("orderTemplate");
  const { form, submit, pending, close } = useTemplateEdit({
    template,
    data,
    groups: ["lines"],
    prepare: (values) =>
      index === null
        ? {
            ...values,
            lines: [...values.lines, emptyLine({ entityTypeId: data.lineTypes[0]?.id ?? "" })],
          }
        : values,
  });
  const at = index ?? template.lines.length;
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TemplateLineFields form={form} data={data} index={at} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={close} disabled={pending}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {index === null ? t("addLine") : common("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export type TemplateLineDialogProps = LineFormProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Add or edit one line of a template in a dialog; the table behind it stays as it is. */
export function TemplateLineDialog({ open, onOpenChange, ...rest }: TemplateLineDialogProps) {
  const t = useTranslations("orderTemplate");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rest.index === null ? t("addLine") : t("editLine")}</DialogTitle>
          <DialogDescription>{t("lineDialogDescription")}</DialogDescription>
        </DialogHeader>
        <InlineEditContext.Provider value={{ close: () => onOpenChange(false) }}>
          {open ? <TemplateLineForm {...rest} /> : null}
        </InlineEditContext.Provider>
      </DialogContent>
    </Dialog>
  );
}
