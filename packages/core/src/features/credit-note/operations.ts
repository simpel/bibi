import type { CreditNote, OrderLine } from "@bibi/db";
import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { invalid, notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { documentNumberOf } from "../invoice/document-number";
import { toOrderLineDto } from "../quote/quote-view";
import {
  type CreditNoteDto,
  CreditNoteIdInputSchema,
  CreditNoteListInputSchema,
  CreditNoteListOutputSchema,
  CreditNoteSchema,
} from "./schema";

/** Its frozen lines in order and the order of the invoice it credits. */
const CREDIT_NOTE_INCLUDE = {
  lines: { orderBy: [{ position: "asc" as const }, { id: "asc" as const }] },
  invoice: { select: { orderId: true } },
};

type CreditNoteRow = CreditNote & { lines: OrderLine[]; invoice: { orderId: string } };

const toCreditNoteDto = ({ row }: { row: CreditNoteRow }): CreditNoteDto => {
  const { lines, invoice, ...note } = row;
  return {
    ...note,
    documentNumber: documentNumberOf({ ...note }),
    orderId: invoice.orderId,
    lines: lines.map((line) => toOrderLineDto({ row: line })),
  };
};

export const listCreditNotes = defineOperation({
  name: "creditNote.list",
  kind: "query",
  description:
    "Credit notes of an invoice (invoiceId) or of all an order's invoices (orderId), newest " +
    "first: number, amount credited incl. VAT, frozen lines, reason and status (PENDING until " +
    "the provider confirmed it, ISSUED, or FAILED). Created with invoice.credit.",
  input: CreditNoteListInputSchema,
  output: CreditNoteListOutputSchema,
  permission: "payment:read",
  handler: async ({ input: { invoiceId, orderId, limit, cursor }, context }) => {
    if (!invoiceId && !orderId) {
      return invalid({
        message: "Give invoiceId or orderId",
        issues: [{ path: "invoiceId", message: "Give invoiceId or orderId" }],
      });
    }
    const rows = await context.db.creditNote.findMany({
      where: {
        ...(invoiceId ? { invoiceId } : {}),
        ...(orderId ? { invoice: { orderId } } : {}),
      },
      include: CREDIT_NOTE_INCLUDE,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...pageArgs({ limit, cursor }),
    });
    const page = paginate({ rows, limit });
    const items = page.items.map((row) => toCreditNoteDto({ row }));
    return ok({ value: { items, nextCursor: page.nextCursor } });
  },
});

export const getCreditNote = defineOperation({
  name: "creditNote.get",
  kind: "query",
  description: "Get one credit note by id with its frozen lines, amount, reason and status.",
  input: CreditNoteIdInputSchema,
  output: CreditNoteSchema,
  permission: "payment:read",
  handler: async ({ input, context }) => {
    const row = await context.db.creditNote.findFirst({
      where: { id: input.id },
      include: CREDIT_NOTE_INCLUDE,
    });
    return row ? ok({ value: toCreditNoteDto({ row }) }) : notFound({ entity: "CreditNote" });
  },
});

/** Credit notes of invoices (ADR 0100): read on every surface; created by `invoice.credit`. */
export const creditNoteOperations = [listCreditNotes, getCreditNote];
