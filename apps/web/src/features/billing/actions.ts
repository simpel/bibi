"use server";

import {
  approveSeat,
  type BillingCheckoutInput,
  type BillingDto,
  type BillingPortalInput,
  type BillingRedirectDto,
  type BillingReminderDto,
  type BillingUpdateInput,
  type InvitationDto,
  openBillingPortal,
  rejectSeat,
  remindBillingAdmins,
  startBillingCheckout,
  syncBilling,
  updateBilling,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type StartBillingCheckoutActionInput = { input: BillingCheckoutInput };

/** "Continue to payment": a Stripe Checkout link for the chosen plan (ADR 0095). */
export async function startBillingCheckoutAction({
  input,
}: StartBillingCheckoutActionInput): Promise<ActionResult<BillingRedirectDto>> {
  return toActionResult({ result: await runOperation({ operation: startBillingCheckout, input }) });
}

export type OpenBillingPortalActionInput = { input: BillingPortalInput };

/** "Manage billing": Stripe's Customer Portal, returning to `returnTo`. */
export async function openBillingPortalAction({
  input,
}: OpenBillingPortalActionInput): Promise<ActionResult<BillingRedirectDto>> {
  return toActionResult({ result: await runOperation({ operation: openBillingPortal, input }) });
}

/** Re-reads the subscription from Stripe when Checkout sends the payer back. */
export async function syncBillingAction(): Promise<ActionResult<BillingDto>> {
  return toActionResult({ result: await runOperation({ operation: syncBilling, input: {} }) });
}

export type UpdateBillingActionInput = { input: BillingUpdateInput };

/** Auto-assign seats and the number of extra seats (Settings → Billing). */
export async function updateBillingAction({
  input,
}: UpdateBillingActionInput): Promise<ActionResult<BillingDto>> {
  return toActionResult({ result: await runOperation({ operation: updateBilling, input }) });
}

export type SeatRequestActionInput = { id: string };

/** Adds a paid seat for a held invitation and sends it. */
export async function approveSeatAction({
  id,
}: SeatRequestActionInput): Promise<ActionResult<InvitationDto>> {
  return toActionResult({ result: await runOperation({ operation: approveSeat, input: { id } }) });
}

/** Declines a held invitation; it is cancelled and never sent. */
export async function rejectSeatAction({
  id,
}: SeatRequestActionInput): Promise<ActionResult<InvitationDto>> {
  return toActionResult({ result: await runOperation({ operation: rejectSeat, input: { id } }) });
}

/** "Remind your admin" on the payment page, for members who cannot pay. */
export async function remindBillingAdminsAction(): Promise<ActionResult<BillingReminderDto>> {
  return toActionResult({
    result: await runOperation({ operation: remindBillingAdmins, input: {} }),
  });
}
