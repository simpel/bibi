import type { TicketDto } from "@okazi/core";
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
import { TextField } from "@/components/form/text-field";
import { useChangePhaseForm } from "./use-change-phase-form";

export type ChangePhaseDialogProps = {
  ticket: TicketDto;
  /** The phases the organization allows from the ticket's current phase. */
  targets: readonly NamedOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ChangePhaseFormProps = Pick<ChangePhaseDialogProps, "ticket" | "targets"> & {
  onDone: () => void;
};

function ChangePhaseForm({ ticket, targets, onDone }: ChangePhaseFormProps) {
  const common = useTranslations("common");
  const t = useTranslations("ticket");
  const { form, submit, pending } = useChangePhaseForm({ ticket, onDone });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <OptionSelectField
          control={form.control}
          name="phaseId"
          label={t("fields.newPhase")}
          options={targets}
        />
        <TextField form={form} name="reason" label={t("fields.phaseReason")} multiline />
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

/** Move a ticket along one of the organization's transitions (`ticket.changePhase`). */
export function ChangePhaseDialog({ ticket, targets, open, onOpenChange }: ChangePhaseDialogProps) {
  const t = useTranslations("ticket");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("changePhase")}</DialogTitle>
          <DialogDescription>{t("changePhaseDescription")}</DialogDescription>
        </DialogHeader>
        <ChangePhaseForm ticket={ticket} targets={targets} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
