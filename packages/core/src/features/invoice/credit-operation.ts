import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid, notFound } from "../../shared/errors";
import { nowOf } from "../../time/now";
import { writeOrderLines } from "../quote/freeze-lines";
import { toOrderLineDto } from "../quote/quote-view";
import { creditAtProvider } from "./credit-at-provider";
import { type InvoiceCreditInput, InvoiceCreditInputSchema } from "./credit-schema";
import { raisedInProvider } from "./invoice-provider";
import { InvoiceSchema } from "./schema";
import { INVOICE_INCLUDE, loadInvoice } from "./to-invoice-dto";

type Context = Pick<OperationContext, "db" | "organizationId" | "actor" | "recordChange" | "now">;

type Loaded = NonNullable<Awaited<ReturnType<typeof loadSent>>>;

const loadSent = ({ context, id }: { context: Context; id: string }) =>
  context.db.invoice.findFirst({ where: { id, status: "SENT" }, include: INVOICE_INCLUDE });

type Credit = { amountMinor: number; totalExclVatMinor: number; lineIds: string[] };

const gross = ({ line }: { line: { totalExclVatMinor: number; vatMinor: number } }) =>
  line.totalExclVatMinor + line.vatMinor;

/** What is credited: whole frozen lines, or an amount spread over the invoice like its total. */
function creditOf({
  invoice,
  input,
}: {
  invoice: Loaded;
  input: InvoiceCreditInput;
}): Result<Credit> {
  const counted = invoice.lines.filter((line) => line.inTotal);
  if (input.lineIds) {
    const picked = counted.filter((line) => input.lineIds?.includes(line.id));
    if (picked.length !== new Set(input.lineIds).size) {
      const message = "Every line must be one of the invoice's lines";
      return invalid({ message, issues: [{ path: "lineIds", message }] });
    }
    const amountMinor = picked.reduce((sum, line) => sum + gross({ line }), 0);
    const totalExclVatMinor = picked.reduce((sum, line) => sum + line.totalExclVatMinor, 0);
    return ok({ value: { amountMinor, totalExclVatMinor, lineIds: picked.map((l) => l.id) } });
  }
  const amountMinor = input.amountMinor ?? 0;
  const { totalExclVatMinor: excl, totalInclVatMinor: incl } = invoice;
  const totalExclVatMinor = incl === 0 ? 0 : Math.round((amountMinor * excl) / incl);
  // The whole invoice credited: its lines are the credit note's too.
  const lineIds = amountMinor === incl ? counted.map((line) => line.id) : [];
  return ok({ value: { amountMinor, totalExclVatMinor, lineIds } });
}

type WriteInput = { context: Context; input: InvoiceCreditInput };

/** The credit note row with its frozen lines (ADR 0052), ISSUED at once unless a provider must. */
async function writeCredit({ context, input }: WriteInput) {
  if (input.lineIds && input.amountMinor !== undefined) {
    const message = "Give lineIds or amountMinor, not both";
    return invalid({ message, issues: [{ path: "lineIds", message }] });
  }
  // Locks the SENT invoice row first (a no-op update): concurrent credits of it run one after
  // the other, each seeing what the one before credited and the number it took.
  await context.db.invoice.updateMany({
    where: { id: input.invoiceId, status: "SENT" },
    data: { status: "SENT" },
  });
  const before = await loadInvoice({ context, id: input.invoiceId });
  const invoice = await loadSent({ context, id: input.invoiceId });
  if (!before || !invoice) {
    if (!before) return notFound({ entity: "Invoice" });
    return conflict({ message: `A ${before.status} invoice cannot be credited` });
  }
  const asked = creditOf({
    invoice,
    input: {
      ...input,
      amountMinor: input.lineIds ? undefined : (input.amountMinor ?? before.amountDueMinor),
    },
  });
  if (!asked.ok) return asked;
  const { amountMinor, totalExclVatMinor, lineIds } = asked.value;
  if (amountMinor <= 0 || amountMinor > before.amountDueMinor) {
    return conflict({
      message: `At most ${Math.max(0, before.amountDueMinor)} minor units are left to credit`,
      issues: [{ path: "amountMinor", message: "More than is left to credit" }],
    });
  }
  const atProvider = Boolean(invoice.providerReference) && raisedInProvider({ invoice });
  // Credits of two invoices at once may take the same number: the unique key refuses the
  // second with CONFLICT (as invoice numbers, ADR 0077), and a retry takes the next.
  const top = await context.db.creditNote.aggregate({ _max: { number: true } });
  const note = await context.db.creditNote.create({
    data: {
      organizationId: context.organizationId,
      invoiceId: invoice.id,
      number: (top._max.number ?? 0) + 1,
      currency: invoice.currency,
      amountMinor,
      totalExclVatMinor,
      totalInclVatMinor: amountMinor,
      reason: input.reason ?? null,
      status: atProvider ? "PENDING" : "ISSUED",
      issuedAt: atProvider ? null : nowOf({ context }),
      provider: atProvider ? invoice.provider : null,
      connectionId: atProvider ? invoice.connectionId : null,
      createdBy: context.actor.userId,
    },
  });
  const lines = invoice.lines.filter((line) => lineIds.includes(line.id));
  const dtos = lines.map((row) => toOrderLineDto({ row }));
  if (dtos.length > 0)
    await writeOrderLines({ context, owner: { creditNoteId: note.id }, lines: dtos });
  const after = await loadInvoice({ context, id: invoice.id });
  if (!after) return notFound({ entity: "Invoice" });
  context.recordChange({ entityType: "creditNote", entityId: note.id, after: note });
  context.recordChange({ entityId: invoice.id, before, after });
  return ok({ value: after });
}

export const creditInvoice = defineOperation({
  name: "invoice.credit",
  kind: "command",
  description:
    "Credit a SENT invoice in full or in part with a credit note (ADR 0052, 0100): give lineIds " +
    "(whole frozen lines of the invoice), or amountMinor (incl. VAT, spread over its VAT rates), " +
    "or neither to credit all that is still due. It may not exceed amountDueMinor (CONFLICT). The " +
    "credit note gets the organization's next number and freezes the credited lines; it lowers " +
    "the invoice's amountDueMinor and what the order owes. An invoice raised at a provider is " +
    "credited there too (PENDING until the provider confirms). Money already paid is given back " +
    "with payment.refund.",
  input: InvoiceCreditInputSchema,
  output: InvoiceSchema,
  permission: "payment:write",
  handler: ({ input, context }) => writeCredit({ context, input }),
  external: ({ output, context }) => creditAtProvider({ context, invoice: output }),
});
