import type { ProgramItemDto } from "@okazi/core";
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
import type { NamedOption } from "../../booking/ui/booking-form-data";
import { OptionSelectField } from "../../booking/ui/option-select-field";
import { useAssignResponsibleForm } from "./use-assign-responsible-form";

export type AssignResponsibleDialogProps = {
  programItem: ProgramItemDto;
  members: readonly NamedOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type FormProps = Omit<AssignResponsibleDialogProps, "open" | "onOpenChange"> & {
  onDone: () => void;
};

function AssignResponsibleForm({ programItem, members, onDone }: FormProps) {
  const common = useTranslations("common");
  const t = useTranslations("programItem");
  const { form, submit, pending } = useAssignResponsibleForm({ programItem, onDone });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <OptionSelectField
          control={form.control}
          name="responsibleId"
          label={t("fields.responsible")}
          options={members}
          noneLabel={t("noResponsible")}
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

/** Set or change who is responsible for a program item (`programItem.assign`). */
export function AssignResponsibleDialog({
  open,
  onOpenChange,
  ...props
}: AssignResponsibleDialogProps) {
  const t = useTranslations("programItem");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("assign")}</DialogTitle>
          <DialogDescription>{t("assignDescription")}</DialogDescription>
        </DialogHeader>
        <AssignResponsibleForm {...props} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
