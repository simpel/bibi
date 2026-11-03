"use server";

import { findInvitationByCode, getAuth, joinOffer, setPrimaryOrganization } from "@bibi/auth";
import { InviteCodeInputSchema } from "@bibi/core/schemas";
import { headers } from "next/headers";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { getSessionState } from "@/server/session";

const IdSchema = z.object({ organizationId: z.string().min(1).max(64) });

type FailInput = { code: "NOT_FOUND" | "UNAUTHENTICATED"; path?: string };

const fail = ({ code, path }: FailInput): ActionResult<never> => ({
  ok: false,
  error: { code, message: code, issues: path ? [{ path, message: code }] : [] },
});

const signedIn = async () => {
  const state = await getSessionState();
  return state.status === "anonymous" ? null : state.session.user;
};

/**
 * "Join <organization>" on a domain offer (ADR 0078). `held`: every seat is taken, so the join
 * waits for an admin to approve a seat (ADR 0095 §6).
 */
export async function joinOfferAction({
  input,
}: {
  input: { organizationId: string };
}): Promise<ActionResult<"joined" | "held">> {
  const user = await signedIn();
  const parsed = IdSchema.safeParse(input);
  if (!user) return fail({ code: "UNAUTHENTICATED" });
  if (!parsed.success) return fail({ code: "NOT_FOUND" });
  const outcome = await joinOffer({ userId: user.id, organizationId: parsed.data.organizationId });
  return outcome === "refused" ? fail({ code: "NOT_FOUND" }) : { ok: true, value: outcome };
}

/** `/welcome/join`: accepts the invitation an invite code names, for the signed-in email only. */
export async function redeemInviteCodeAction({
  input,
}: {
  input: { code: string };
}): Promise<ActionResult<true>> {
  const user = await signedIn();
  const parsed = InviteCodeInputSchema.safeParse(input);
  if (!user) return fail({ code: "UNAUTHENTICATED" });
  if (!parsed.success) return fail({ code: "NOT_FOUND", path: "code" });
  const invitationId = await findInvitationByCode({ code: parsed.data.code, email: user.email });
  if (!invitationId) return fail({ code: "NOT_FOUND", path: "code" });
  // Through Better Auth, so the role and the member hooks are the same as the mailed link.
  await getAuth().api.acceptInvitation({ headers: await headers(), body: { invitationId } });
  return { ok: true, value: true };
}

/** `/welcome/organizations` → Continue: the primary organization, made active (ADR 0078). */
export async function finishJoiningAction({
  input,
}: {
  input: { organizationId: string };
}): Promise<ActionResult<true>> {
  const user = await signedIn();
  const parsed = IdSchema.safeParse(input);
  if (!user) return fail({ code: "UNAUTHENTICATED" });
  if (!parsed.success) return fail({ code: "NOT_FOUND" });
  const { organizationId } = parsed.data;
  if (!(await setPrimaryOrganization({ userId: user.id, organizationId })))
    return fail({ code: "NOT_FOUND" });
  await getAuth().api.setActiveOrganization({ headers: await headers(), body: { organizationId } });
  return { ok: true, value: true };
}
