import { OrderBalanceSchema, PaymentSchema } from "@bibi/core/schemas";
import { z } from "zod";
import { DASHBOARD_UI_ENTRIES } from "./dashboard-entries";
import { FINANCE_UI_ENTRIES } from "./finance-entries";
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
export type OrderBalanceWire = z.infer<typeof OrderBalanceSchema>;

const paymentCard = uiEntry({
  component: "payment-card",
  schema: PaymentWireSchema,
  toProps: ({ value }) => ({ payment: value }),
});

/** Tool → component for payments requested from customers and their refunds (ADR 0028, 0100). */
export const PAYMENT_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  ...FINANCE_UI_ENTRIES,
  ...DASHBOARD_UI_ENTRIES,
  payment_list: uiEntry({
    component: "payment-table",
    schema: PaymentListWireSchema,
    toProps: ({ value }) => value,
  }),
  payment_get: paymentCard,
  payment_create: paymentCard,
  payment_cancel: paymentCard,
  payment_recordManual: paymentCard,
  payment_refund: uiEntry({
    component: "payment-refund-card",
    schema: PaymentWireSchema,
    toProps: ({ value }) => ({ payment: value }),
  }),
  deposit_request: paymentCard,
  payment_balance: uiEntry({
    component: "order-balance-card",
    schema: OrderBalanceSchema,
    toProps: ({ value }) => ({ balance: value }),
  }),
};
