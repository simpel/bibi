import type { ScopedDbClient } from "@bibi/db";
import { seatCapacity, seatUsage } from "./seats";

/** `free`: a seat was open. `added`: a paid seat was added. `held`: an admin must approve. */
export type SeatClaim = "free" | "added" | "held";

export type ClaimSeatInput = { db: ScopedDbClient; organizationId: string };

/**
 * Takes a seat for one more member or invitation (ADR 0095 §6), inside the caller's transaction.
 * The billing row is written first, so its row lock makes concurrent claims in one organization
 * count one after the other.
 */
export async function claimSeat({ db, organizationId }: ClaimSeatInput): Promise<SeatClaim> {
  const row = await db.billingAccount.upsert({
    where: { organizationId },
    create: { organizationId },
    update: { updatedAt: new Date() },
  });
  const { used } = await seatUsage({ context: { db } });
  if (used < seatCapacity({ extraSeats: row.extraSeats })) return "free";
  if (!row.autoAssignSeats) return "held";
  await db.billingAccount.update({
    where: { organizationId },
    data: { extraSeats: { increment: 1 } },
  });
  return "added";
}
