import type { OperationContext } from "../../operations/types";
import { BILLING_PLAN } from "./plan";

type Context = { context: Pick<OperationContext, "db"> };

/** Seats in use: members plus pending, unexpired invitations; held ones wait (ADR 0095 §6). */
export async function seatUsage({ context }: Context) {
  const now = new Date();
  const [members, pending, held] = await Promise.all([
    context.db.member.count({}),
    context.db.invitation.count({ where: { status: "pending", expiresAt: { gt: now } } }),
    context.db.invitation.count({ where: { status: "held", expiresAt: { gt: now } } }),
  ]);
  return { used: members + pending, held };
}

export type SeatCapacityInput = { extraSeats: number };

export const seatCapacity = ({ extraSeats }: SeatCapacityInput) =>
  BILLING_PLAN.includedSeats + extraSeats;
