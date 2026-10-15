import type { BookingStatusCreateInput, BookingStatusDto } from "@okazi/core/schemas";
import { useRouter } from "@okazi/i18n/navigation";
import { Button, DialogFooter, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import { useFormAction } from "@/lib/use-form-action";
import { createBookingStatusAction, updateBookingStatusAction } from "../actions";
import { PhaseField } from "./phase-field";
import { useBookingStatusForm } from "./use-booking-status-form";

export type BookingStatusFormProps = { status?: BookingStatusDto | undefined; onDone: () => void };

type SaveInput = { status: BookingStatusDto | undefined; values: BookingStatusCreateInput };

const save = ({ status, values: { name, color, ...rest } }: SaveInput) =>
  status
    ? updateBookingStatusAction({ input: { id: status.id, name, color } })
    : createBookingStatusAction({ input: { name, color, ...rest } });

/** Create (no `status`) or edit form: name, color and, when creating, the phase. */
export function BookingStatusForm({ status, onDone }: BookingStatusFormProps) {
  const t = useTranslations("bookingStatus");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useBookingStatusForm({ status });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => save({ status, values }),
    messages: { pending: t("saving"), success: t(status ? "updated" : "created") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TextField form={form} name="name" label={t("fields.name")} required />
        <TextField form={form} name="color" label={t("fields.color")} type="color" />
        <PhaseField control={form.control} disabled={status !== undefined} />
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
