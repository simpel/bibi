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
import type { NamedOption } from "./booking-form-data";
import { OptionSelectField } from "./option-select-field";
import { useAssignForm } from "./use-assign-form";

export type AssignDialogProps = {
  booking: BookingDto;
  members: readonly NamedOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type AssignFormProps = Omit<AssignDialogProps, "open" | "onOpenChange"> & { onDone: () => void };

function AssignForm({ booking, members, onDone }: AssignFormProps) {
  const common = useTranslations("common");
  const t = useTranslations("booking");
  const { form, submit, pending } = useAssignForm({ booking, onDone });
  const select = { control: form.control, options: members, noneLabel: t("noOwner") };
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <OptionSelectField {...select} name="salesOwnerId" label={t("fields.salesOwner")} />
        <OptionSelectField {...select} name="coordinatorId" label={t("fields.coordinator")} />
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

/** Change the salesperson and coordinator (`booking.assign`); both must be members. */
export function AssignDialog({ booking, members, open, onOpenChange }: AssignDialogProps) {
  const t = useTranslations("booking");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("assign")}</DialogTitle>
          <DialogDescription>{t("assignDescription")}</DialogDescription>
        </DialogHeader>
        <AssignForm booking={booking} members={members} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
