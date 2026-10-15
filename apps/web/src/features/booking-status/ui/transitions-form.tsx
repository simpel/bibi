import type { BookingStatusDto } from "@okazi/core/schemas";
import { useRouter } from "@okazi/i18n/navigation";
import { Button, DialogFooter, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useFormAction } from "@/lib/use-form-action";
import { setBookingStatusTransitionsAction } from "../actions";
import { TransitionTargetsField } from "./transition-targets-field";
import { useTransitionsForm } from "./use-transitions-form";

export type TransitionsFormProps = {
  status: BookingStatusDto;
  /** The statuses a booking could move to (every active status except `status`). */
  targets: readonly BookingStatusDto[];
  onDone: () => void;
};

/** Checkbox list of allowed targets, saved as a set with `bookingStatus.setTransitions`. */
export function TransitionsForm({ status, targets, onDone }: TransitionsFormProps) {
  const t = useTranslations("bookingStatus");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useTransitionsForm({ status });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => setBookingStatusTransitionsAction({ input: values }),
    messages: { pending: t("saving"), success: t("transitionsSaved") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TransitionTargetsField control={form.control} targets={targets} />
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
