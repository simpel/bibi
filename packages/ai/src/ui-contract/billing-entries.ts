import { BillingAccessSchema, BillingSchema } from "@bibi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";
import { InvitationWireSchema } from "./wire-schemas";

/** JSON form of the organization's Bibi subscription as tool results carry it (ADR 0095). */
export const BillingWireSchema = BillingSchema.extend({
  access: BillingAccessSchema.extend({ trialEndsAt: z.string() }),
  currentPeriodEnd: z.string().nullable(),
});

export type BillingWire = z.infer<typeof BillingWireSchema>;

/** Props of the billing components. */
export type BillingUiProps = { "billing-card": { billing: BillingWire } };

const billingCard = uiEntry({
  component: "billing-card",
  schema: BillingWireSchema,
  toProps: ({ value }) => ({ billing: value }),
});
const invitationCard = uiEntry({
  component: "invitation-card",
  schema: InvitationWireSchema,
  toProps: ({ value }) => ({ invitation: value }),
});

/** Tool → component for Bibi's own subscription; a decided seat request is its invitation. */
export const BILLING_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  billing_get: billingCard,
  billing_update: billingCard,
  billing_sync: billingCard,
  billing_approveSeat: invitationCard,
  billing_rejectSeat: invitationCard,
};

/** Billing tools shown as JSON, with the reason (part of `GENERIC_UI_TOOLS`). */
export const BILLING_GENERIC_UI_TOOLS: Readonly<Record<string, string>> = {
  billing_access:
    "one open/closed flag the app layout acts on; the payment page is the UI (ADR 0095)",
  billing_listSeatRequests: "seat requests are decided in the table on /admin/billing",
  billing_startCheckout: "never offered to the assistant (aiAllowed: false): a Stripe link",
  billing_openPortal: "never offered to the assistant (aiAllowed: false): a Stripe link",
  billing_remindAdmins: "a sent flag; the payment page shows the outcome as a toast",
};
