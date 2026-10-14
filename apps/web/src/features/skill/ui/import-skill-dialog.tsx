"use client";

import { useRouter } from "@okazi/i18n/navigation";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
} from "@okazi/ui";
import { useTranslations } from "next-intl";
import { skillRoute } from "@/lib/routes";
import { useFormAction } from "@/lib/use-form-action";
import { importSkillAction } from "../actions";
import { ImportSkillFields } from "./import-skill-fields";
import { useImportSkillForm } from "./use-import-skill-form";

export type ImportSkillDialogProps = { open: boolean; onOpenChange: (open: boolean) => void };

/** Import a SKILL.md (paste or upload) as a draft skill; opens the new skill. */
export function ImportSkillDialog({ open, onOpenChange }: ImportSkillDialogProps) {
  const t = useTranslations("skills");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useImportSkillForm();
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => importSkillAction(values),
    messages: { pending: common("sending"), success: t("imported") },
    onSuccess: ({ value }) => {
      onOpenChange(false);
      router.push(skillRoute({ id: value.id }));
    },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("importTitle")}</DialogTitle>
          <DialogDescription>{t("importDescription")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={submit} noValidate className="grid gap-4">
            <ImportSkillFields form={form} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {common("cancel")}
              </Button>
              <Button type="submit" disabled={pending}>
                {t("import")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
