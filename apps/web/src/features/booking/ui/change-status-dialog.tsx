import type { BookingDto } from "@okazi/core";
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
import { TextField } from "@/components/form/text-field";
import type { NamedOption } from "./booking-form-data";
import { OptionSelectField } from "./option-select-field";
import { useChangeStatusForm } from "./use-change-status-form";

export type ChangeStatusDialogProps = {
  booking: BookingDto;
  /** The statuses the organization allows from the booking's current status. */
  targets: readonly NamedOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ChangeStatusFormProps = Pick<ChangeStatusDialogProps, "booking" | "targets"> & {
  onDone: () => void;
};

function ChangeStatusForm({ booking, targets, onDone }: ChangeStatusFormProps) {
  const common = useTranslations("common");
  const t = useTranslations("booking");
  const { form, submit, pending } = useChangeStatusForm({ booking, onDone });
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

/** Move a booking along one of the organization's transitions (`booking.changeStatus`). */
export function ChangeStatusDialog({
  booking,
  targets,
  open,
  onOpenChange,
}: ChangeStatusDialogProps) {
  const t = useTranslations("booking");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("changeStatus")}</DialogTitle>
          <DialogDescription>{t("changeStatusDescription")}</DialogDescription>
        </DialogHeader>
        <ChangeStatusForm booking={booking} targets={targets} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
