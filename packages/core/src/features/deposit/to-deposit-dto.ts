import type { Deposit } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { paidByReceivable, settlementOf } from "../payment/settlement";
import type { DepositDto } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

export type ToDepositDtosInput = Db & { rows: readonly Deposit[] };

/** Deposits with what is paid against each derived from their payments (one query). */
export async function toDepositDtos({ context, rows }: ToDepositDtosInput): Promise<DepositDto[]> {
  const ticketIds = [...new Set(rows.map((row) => row.ticketId))];
  const paid = await paidByReceivable({ context, ticketIds });
  return rows.map((row) => ({
    ...row,
    ...settlementOf({ paid, id: row.id, amountMinor: row.amountMinor }),
  }));
}

export type LoadDepositInput = Db & { id: string };

/** The deposit, or null when missing or in another organization. */
export async function loadDeposit({ context, id }: LoadDepositInput): Promise<DepositDto | null> {
  const row = await context.db.deposit.findFirst({ where: { id } });
  if (!row) return null;
  const [dto] = await toDepositDtos({ context, rows: [row] });
  return dto ?? null;
}
