import { type Db, getDb } from "@bibi/db";
import type { Result } from "../../errors/result";
import { createSystemContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { AnyOperation } from "../../operations/types";
import { notFound } from "../../shared/errors";
import { PublicTokenSchema } from "../payment/public-token";

/** What a guest's request may do once its organization is known: read and book tables only. */
const GUEST_PERMISSIONS = {
  reservation: ["read", "write"],
  diningSetup: ["read"],
  item: ["read"],
  configuration: ["read"],
} as const;

type Edge = { db?: Db };

/** The organization of a published booking page by its slug (the one cross-organization read). */
export async function organizationOfPage({ slug, db = getDb() }: Edge & { slug: string }) {
  const page = await db.bookingPage.findFirst({
    where: { slug, published: true, status: "ACTIVE" },
    select: { organizationId: true },
  });
  return page?.organizationId ?? null;
}

/** The organization of a reservation by its manage token. */
export async function organizationOfToken({ token, db = getDb() }: Edge & { token: string }) {
  if (!PublicTokenSchema.safeParse(token).success) return null;
  const row = await db.reservation.findUnique({
    where: { publicToken: token },
    select: { organizationId: true },
  });
  return row?.organizationId ?? null;
}

export type RunGuestInput<I> = Edge & {
  organizationId: string | null;
  operation: AnyOperation;
  input: I;
};

/**
 * Runs a guest operation (ADR 0119) as SYSTEM in the pinned organization with guest permissions.
 * An unknown slug or token is the same NOT_FOUND as a missing record, so nothing leaks.
 */
export async function runGuest<I>({
  organizationId,
  operation,
  input,
  db = getDb(),
}: RunGuestInput<I>): Promise<Result<unknown>> {
  if (!organizationId) return notFound({ entity: "Booking page" });
  const permissions = Object.fromEntries(
    Object.entries(GUEST_PERMISSIONS).map(([k, v]) => [k, [...v]]),
  );
  const context = createSystemContext({ organizationId, permissions, db });
  return execute({ operation, input, context });
}
