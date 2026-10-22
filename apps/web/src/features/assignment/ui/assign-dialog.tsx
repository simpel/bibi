import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { NamedOption } from "@/components/form/named-option";
import { OptionSelectField } from "@/components/form/option-select-field";
import type { AssignSubject } from "./assign-form-schema";
import { useAssignForm } from "./use-assign-form";

export type AssignDialogProps = {
  subject: AssignSubject;
  assigneeId: string | null;
  members: readonly NamedOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type AssignFormProps = Omit<AssignDialogProps, "open" | "onOpenChange"> & { onDone: () => void };

function AssignForm({ subject, assigneeId, members, onDone }: AssignFormProps) {
  const common = useTranslations("common");
  const t = useTranslations("assignment");
  const { form, submit, pending } = useAssignForm({ subject, assigneeId, onDone });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <OptionSelectField
          control={form.control}
          name="assigneeId"
          label={t("assignee")}
          options={members}
          noneLabel={t("nobody")}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {common("save")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

/** Change who answers for a ticket (`assignment.assign`, ADR 0034). */
export function AssignDialog({ open, onOpenChange, ...props }: AssignDialogProps) {
  const t = useTranslations("assignment");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("assign")}</DialogTitle>
          <DialogDescription>{t("assignDescription")}</DialogDescription>
        </DialogHeader>
        <AssignForm {...props} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
