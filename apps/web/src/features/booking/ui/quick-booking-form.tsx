import { Button, DialogFooter, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import type { QuickBookingData } from "./quick-booking-data";
import { QuickBookingFields } from "./quick-booking-fields";
import { useQuickBookingForm } from "./use-quick-booking-form";

export type QuickBookingFormProps = { data: QuickBookingData; onDone: () => void };

/** Customer, room, time, quantity and payment method: everything a small meeting needs. */
export function QuickBookingForm({ data, onDone }: QuickBookingFormProps) {
  const common = useTranslations("common");
  const { form, submit, pending } = useQuickBookingForm({ data, onDone });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <QuickBookingFields form={form} data={data} />
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
