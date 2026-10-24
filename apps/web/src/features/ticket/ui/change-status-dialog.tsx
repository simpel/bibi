import type { TicketDto } from "@bibi/core";
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
import { TextField } from "@/components/form/text-field";
import { useChangeStatusForm } from "./use-change-status-form";

export type ChangeStatusDialogProps = {
  ticket: TicketDto;
  /** The statuses the organization allows from the ticket's current status. */
  targets: readonly NamedOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ChangeStatusFormProps = Pick<ChangeStatusDialogProps, "ticket" | "targets"> & {
  onDone: () => void;
};

function ChangeStatusForm({ ticket, targets, onDone }: ChangeStatusFormProps) {
  const common = useTranslations("common");
  const t = useTranslations("ticket");
  const { form, submit, pending } = useChangeStatusForm({ ticket, onDone });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <OptionSelectField
          control={form.control}
          name="statusId"
          label={t("fields.newStatus")}
          options={targets}
        />
        <TextField form={form} name="reason" label={t("fields.statusReason")} multiline />
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

/** Move a ticket along one of the organization's transitions (`ticket.changeStatus`). */
export function ChangeStatusDialog({
  ticket,
  targets,
  open,
  onOpenChange,
}: ChangeStatusDialogProps) {
  const t = useTranslations("ticket");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("changeStatus")}</DialogTitle>
          <DialogDescription>{t("changeStatusDescription")}</DialogDescription>
        </DialogHeader>
        <ChangeStatusForm ticket={ticket} targets={targets} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
