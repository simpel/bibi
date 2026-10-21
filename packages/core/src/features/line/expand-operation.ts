import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { checkReadable } from "../ticket/ticket-rules";
import { loadBundle, planParts } from "./bundle-parts";
import { effectiveQuantity } from "./effective-values";
import {
  type LineExpandBundleInput,
  LineExpandBundleInputSchema,
  LineExpandBundleOutputSchema,
} from "./expand-schema";
import { insertLine } from "./insert-line";
import { checkLinePeriod } from "./line-rules";
import type { LineRecord } from "./schema";
import { withEffective } from "./with-effective";

type ExpandInput = { context: OperationContext; input: LineExpandBundleInput };

/** The bundle and the plans of its part lines, or why it cannot be expanded. */
async function prepare({ context, input }: ExpandInput) {
  for (const check of [
    checkReadable({ context, permission: "item:read", path: "itemId" }),
    checkLinePeriod({ startsAt: input.startsAt ?? null, endsAt: input.endsAt ?? null }),
  ]) {
    if (!check.ok) return check;
  }
  const bundle = await loadBundle({ context, itemId: input.itemId });
  if (!bundle) {
    // Never describe an item the caller may not use (ADR 0050, feature scope).
    const message = "Unknown bundle item";
    return invalid({ message, issues: [{ path: "itemId", message }] });
  }
  const ticket = await context.db.ticket.findFirst({
    where: { id: input.ticketId },
    select: { estimatedHeadcount: true, guaranteedHeadcount: true },
  });
  const headcount = ticket ? effectiveQuantity({ quantity: null, ticket }).value : null;
  const times = { startsAt: input.startsAt ?? null, endsAt: input.endsAt ?? null };
  const quantity = input.quantity ?? null;
  const plans = planParts({ bundle: { ...times, quantity }, headcount, parts: bundle.parts });
  if (!plans.ok) return plans;
  return ok({ value: { name: bundle.name, plans: plans.value } });
}

/** Creates the bundle line, then one part line per part linked to it, in the parts' order. */
async function expand({ context, input }: ExpandInput): Promise<Result<LineRecord[]>> {
  const prepared = await prepare({ context, input });
  if (!prepared.ok) return prepared;
  const { name, plans } = prepared.value;
  const { ticketId, entityTypeId, fields } = input;
  const common = { ticketId, entityTypeId, ...(fields ? { fields } : {}) };
  const bundle = await insertLine({
    context,
    input: { ...input, ...common, name: input.name ?? name },
  });
  if (!bundle.ok) return bundle;
  const lines = [bundle.value];
  for (const plan of plans) {
    const part = await insertLine({
      context,
      input: { ...common, ...plan, parentLineId: bundle.value.id },
    });
    if (!part.ok) return part;
    lines.push(part.value);
  }
  return ok({ value: lines });
}

export const expandLineBundle = defineOperation({
  name: "line.expandBundle",
  kind: "command",
  description:
    "Add a BUNDLE item to a ticket as one bundle line plus one part line per part (ADR 0059). " +
    "The bundle line carries the price; the part lines show their own effective prices but do " +
    "not count in the totals, and a quote splits the bundle price's VAT per rate across them. " +
    "A part line starts at the bundle's start plus the part's offset and lasts its duration " +
    "(else to the bundle's end); its times and quantity are defaults that line.update can " +
    "change. Moving the bundle line moves its parts by the same delta and removing it removes " +
    "them. Customisation options are not expanded. Each line starts in its item type's state " +
    "and holds a bookable item as that state says; an overlap with a hard hold is CONFLICT. " +
    "Needs item:read (the bundle's parts are read).",
  input: LineExpandBundleInputSchema,
  output: LineExpandBundleOutputSchema,
  permission: "program:write",
  handler: async ({ input, context }) => {
    const lines = await expand({ context, input });
    if (!lines.ok) return lines;
    return ok({ value: { items: await withEffective({ context, lines: lines.value }) } });
  },
});
