import type { InquiryDto } from "@okazi/core";
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
import type { NamedOption } from "@/components/form/named-option";
import { OptionSelectField } from "@/components/form/option-select-field";
import { useQualifyForm } from "./use-qualify-form";

export type QualifyDialogProps = {
  inquiry: InquiryDto;
  members: readonly NamedOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type QualifyFormProps = Omit<QualifyDialogProps, "open" | "onOpenChange"> & {
  onDone: () => void;
};

function QualifyForm({ inquiry, members, onDone }: QualifyFormProps) {
  const common = useTranslations("common");
  const t = useTranslations("inquiry");
  const { form, submit, pending } = useQualifyForm({ inquiry, onDone });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <OptionSelectField
          control={form.control}
          name="assigneeId"
          label={t("fields.assignee")}
          options={members}
          noneLabel={t("keepAssignee")}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {t("qualify")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

/** Qualify the inquiry (ADR 0022); it needs a main assignee (ADR 0034). */
export function QualifyDialog({ open, onOpenChange, ...props }: QualifyDialogProps) {
  const t = useTranslations("inquiry");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("qualify")}</DialogTitle>
          <DialogDescription>{t("qualifyDescription")}</DialogDescription>
        </DialogHeader>
        <QualifyForm {...props} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
