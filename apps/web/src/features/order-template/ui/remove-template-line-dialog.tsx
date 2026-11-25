"use client";

import type { OrderTemplateDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { updateOrderTemplateAction } from "../actions";
import type { OrderTemplateFormData } from "./order-template-form-data";
import { orderTemplateFormDefaults, orderTemplateFormSchema } from "./order-template-form-schema";

export type RemoveTemplateLineDialogProps = {
  template: OrderTemplateDto;
  data: OrderTemplateFormData;
  index: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Confirm, then save the template's lines without this one; orders already made keep theirs. */
export function RemoveTemplateLineDialog({
  template,
  data,
  index,
  open,
  onOpenChange,
}: RemoveTemplateLineDialogProps) {
  const t = useTranslations("orderTemplate");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const remove = () => {
    const values = orderTemplateFormDefaults({
      template,
      firstTypes: { orderType: data.orderTypes[0]?.id ?? "", orderStatus: "" },
    });
    const parsed = orderTemplateFormSchema.safeParse({
      ...values,
      lines: values.lines.filter((_line, at) => at !== index),
    });
    // The saved lines always pass their own schema; a failure here would be a bug, not input.
    if (!parsed.success) return;
    const lines = parsed.data.lines;
    return run({
      action: () => updateOrderTemplateAction({ input: { id: template.id, lines } }),
      messages: { pending: t("saving"), success: t("lineRemoved") },
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    });
  };
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("removeLine")}
      description={t("removeLineConfirm", { name: template.lines[index]?.name ?? "" })}
      confirmLabel={t("removeLine")}
      pending={pending}
      onConfirm={remove}
    />
  );
}
