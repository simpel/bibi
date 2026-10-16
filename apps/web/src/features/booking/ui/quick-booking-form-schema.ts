import { QuickBookingInputSchema } from "@okazi/core/schemas";
import type { z } from "zod";
import { numberOrNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import { fromLocalInputValue } from "../../occupancy/ui/local-date-time";

/** What the resolver outputs: core's `booking.createQuick` input. */
export type QuickBookingFormOutput = z.infer<typeof QuickBookingInputSchema>;

/** Raw values of the quick form: inputs are strings, times `datetime-local` values. */
export type QuickBookingFormValues = {
  entityTypeId: string;
  programItemTypeId: string;
  customerId: string;
  itemId: string;
  startsAt: string;
  endsAt: string;
  quantity: string;
  paymentMethod: string;
};

/** Core's quick booking schema; the server validates again. */
export const quickBookingFormSchema = () =>
  formSchema({
    schema: QuickBookingInputSchema,
    toInput: ({ values }: { values: QuickBookingFormValues }) => ({
      entityTypeId: values.entityTypeId,
      programItemTypeId: values.programItemTypeId,
      customerId: values.customerId,
      itemId: values.itemId,
      startsAt: fromLocalInputValue({ value: values.startsAt }),
      endsAt: fromLocalInputValue({ value: values.endsAt }),
      quantity: numberOrNull({ value: values.quantity }),
      paymentMethod: values.paymentMethod,
    }),
  });
