import { PaymentSchema, TicketBalanceSchema } from "@okazi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of a payment as tool results carry it (dates = ISO strings). */
export const PaymentWireSchema = PaymentSchema.extend({
  expiresAt: z.string().nullable(),
  paidAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const PaymentListWireSchema = z.object({
  items: z.array(PaymentWireSchema),
  nextCursor: z.string().nullable(),
});

export type PaymentWire = z.infer<typeof PaymentWireSchema>;
export type TicketBalanceWire = z.infer<typeof TicketBalanceSchema>;

const paymentCard = uiEntry({
  component: "payment-card",
  schema: PaymentWireSchema,
  toProps: ({ value }) => ({ payment: value }),
});

/** Tool → component for payments requested from customers (ADR 0028, 0029). */
export const PAYMENT_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  payment_list: uiEntry({
    component: "payment-table",
    schema: PaymentListWireSchema,
    toProps: ({ value }) => value,
  }),
  payment_get: paymentCard,
  payment_create: paymentCard,
  payment_balance: uiEntry({
    component: "ticket-balance-card",
    schema: TicketBalanceSchema,
    toProps: ({ value }) => ({ balance: value }),
  }),
};
