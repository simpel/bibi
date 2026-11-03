import {
  approveSeat,
  type BillingAccessDto,
  BillingAccessSchema,
  type BillingDto,
  type BillingRedirectDto,
  BillingRedirectSchema,
  type BillingReminderDto,
  BillingReminderSchema,
  BillingSchema,
  getBilling,
  getBillingAccess,
  listSeatRequests,
  openBillingPortal,
  rejectSeat,
  remindBillingAdmins,
  type SeatRequestDto,
  SeatRequestSchema,
  startBillingCheckout,
  syncBilling,
  updateBilling,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { InvitationRef } from "../member/graphql";

const BillingRef = objectFromSchema<BillingDto>({
  name: "Billing",
  schema: BillingSchema,
  omit: ["organizationId"],
  description: "The organization's subscription to Bibi (ADR 0095); access, seats and prices.",
});
const BillingAccessRef = objectFromSchema<BillingAccessDto>({
  name: "BillingAccess",
  schema: BillingAccessSchema,
  description: "Whether the organization may use Bibi now, and whether the caller can pay.",
});
const BillingRedirectRef = objectFromSchema<BillingRedirectDto>({
  name: "BillingRedirect",
  schema: BillingRedirectSchema,
  description: "A Stripe page to open in a browser.",
});
const BillingReminderRef = objectFromSchema<BillingReminderDto>({
  name: "BillingReminder",
  schema: BillingReminderSchema,
  omit: ["organizationId"],
  description: "Result of reminding the admins to pay.",
});
const SeatRequestRef = objectFromSchema<SeatRequestDto>({
  name: "SeatRequest",
  schema: SeatRequestSchema,
  omit: ["organizationId"],
  description: "An invitation held until an admin approves a seat for it.",
});
const SeatRequestListRef = builder
  .objectRef<{ items: SeatRequestDto[] }>("SeatRequestList")
  .implement({
    description: "Invitations waiting for a seat.",
    fields: (t) => ({ items: t.field({ type: [SeatRequestRef], resolve: (list) => list.items }) }),
  });

fieldFromOperation({ operation: getBilling, type: BillingRef, name: "billing" });
fieldFromOperation({ operation: getBillingAccess, type: BillingAccessRef, name: "billingAccess" });
fieldFromOperation({
  operation: listSeatRequests,
  type: SeatRequestListRef,
  name: "billingSeatRequests",
});
mutationFromOperation({ operation: startBillingCheckout, type: BillingRedirectRef });
mutationFromOperation({ operation: openBillingPortal, type: BillingRedirectRef });
mutationFromOperation({ operation: syncBilling, type: BillingRef });
mutationFromOperation({ operation: updateBilling, type: BillingRef });
mutationFromOperation({ operation: approveSeat, type: InvitationRef });
mutationFromOperation({ operation: rejectSeat, type: InvitationRef });
mutationFromOperation({ operation: remindBillingAdmins, type: BillingReminderRef });
