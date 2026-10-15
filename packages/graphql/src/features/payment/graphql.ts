import {
  createPayment,
  getPayment,
  listPayments,
  type PaymentDto,
  PaymentSchema,
} from "@okazi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { type Page, pageType } from "../../schema/page";
import { runOperation } from "../../schema/run-operation";
import { BookingRef } from "../booking/graphql";

export const PaymentRef = objectFromSchema<PaymentDto>({
  name: "Payment",
  schema: PaymentSchema,
  omit: ["organizationId"],
  description:
    "A payment requested from a booking's customer (card checkout or Stripe invoice), charged " +
    "directly on the organization's Stripe account.",
});
const PaymentPageRef = pageType({ name: "PaymentPage", item: PaymentRef });

fieldFromOperation({ operation: listPayments, type: PaymentPageRef, name: "payments" });
fieldFromOperation({ operation: getPayment, type: PaymentRef, name: "payment" });
mutationFromOperation({ operation: createPayment, type: PaymentRef });

// Graph edge. Goes through `payment.list`, so its permission applies here too.
builder.objectField(BookingRef, "payments", (t) =>
  t.field({
    type: [PaymentRef],
    description: "Payments requested for the booking, newest first.",
    args: { limit: t.arg.int({ defaultValue: 50, description: "Max 100" }) },
    resolve: async (booking, { limit }, ctx) => {
      const input = { bookingId: booking.id, limit: Math.min(Math.max(limit ?? 50, 1), 100) };
      const page = (await runOperation({
        operation: listPayments,
        input,
        ctx,
      })) as Page<PaymentDto>;
      return page.items;
    },
  }),
);
