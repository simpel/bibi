import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import {
  DepositIdInputSchema,
  DepositListInputSchema,
  DepositListOutputSchema,
  DepositSchema,
} from "./schema";
import { loadDeposit, toDepositDtos } from "./to-deposit-dto";
import { createDeposit, sendDeposit, voidDeposit } from "./write-operations";

export const listDeposits = defineOperation({
  name: "deposit.list",
  kind: "query",
  description:
    "Deposit requests on a ticket, newest first: description, fixed amount, due date, status " +
    "(DRAFT, SENT, VOID) and what is paid against each (paidMinor, openMinor, progress).",
  input: DepositListInputSchema,
  output: DepositListOutputSchema,
  permission: "payment:read",
  handler: async ({ input: { ticketId, limit, cursor }, context }) => {
    const rows = await context.db.deposit.findMany({
      where: { ticketId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...pageArgs({ limit, cursor }),
    });
    const page = paginate({ rows, limit });
    const items = await toDepositDtos({ context, rows: page.items });
    return ok({ value: { items, nextCursor: page.nextCursor } });
  },
});

export const getDeposit = defineOperation({
  name: "deposit.get",
  kind: "query",
  description: "Get one deposit request by id with its status and what is paid against it.",
  input: DepositIdInputSchema,
  output: DepositSchema,
  permission: "payment:read",
  handler: async ({ input, context }) => {
    const deposit = await loadDeposit({ context, id: input.id });
    return deposit ? ok({ value: deposit }) : notFound({ entity: "Deposit" });
  },
});

export { createDeposit, sendDeposit, voidDeposit };

/** Deposit requests: frozen receivables a payment settles (ADR 0057). */
export const depositOperations = [
  listDeposits,
  getDeposit,
  createDeposit,
  sendDeposit,
  voidDeposit,
];
