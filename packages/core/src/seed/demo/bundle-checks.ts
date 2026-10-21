import type { VatRow } from "../../features/quote/order-line-schema";
import type { ExecuteContext } from "../../operations/context";
import type { DemoOrg } from "./types";

export type CheckDemoBundlesInput = { context: ExecuteContext; org: DemoOrg };

type BundleLine = { id: string; name: string; itemId: string | null };

type LineInput = { context: ExecuteContext; line: BundleLine };

const sum = ({ rows, key }: { rows: VatRow[]; key: keyof VatRow }) =>
  rows.reduce((acc, row) => acc + row[key], 0);

/** The bundle line's frozen order lines: one per rate that sum exactly, parts out of the total. */
async function checkFrozen({ context, line }: LineInput): Promise<string[]> {
  const frozen = await context.db.orderLine.findMany({ where: { lineId: line.id } });
  if (frozen.length === 0) return [`${line.name}: no sent quote froze the bundle line`];
  const failures: string[] = [];
  for (const row of frozen) {
    const rows = Array.isArray(row.vatRows) ? (row.vatRows as VatRow[]) : [];
    if (rows.length < 2) failures.push(`${line.name}: ${rows.length} VAT rows, expected 2 or more`);
    const excl = sum({ rows, key: "totalExclVatMinor" });
    const vat = sum({ rows, key: "vatMinor" });
    if (excl !== row.totalExclVatMinor || vat !== row.vatMinor || !row.inTotal) {
      failures.push(`${line.name}: the VAT rows do not sum to the line or it does not count`);
    }
    const parts = await context.db.orderLine.findMany({
      where: { parentLineId: line.id, quoteId: row.quoteId, invoiceId: row.invoiceId },
    });
    if (parts.length === 0 || parts.some((part) => part.inTotal)) {
      failures.push(`${line.name}: its part order lines are missing or count in the total`);
    }
  }
  return failures;
}

/** One part line per part of the bundle item (options are chosen lines, not parts). */
async function checkParts({ context, line }: LineInput): Promise<string[]> {
  const [parts, expected] = await Promise.all([
    context.db.line.count({ where: { parentLineId: line.id, priceEffect: null } }),
    context.db.itemPart.count({ where: { parentId: line.itemId ?? "" } }),
  ]);
  return parts === expected ? [] : [`${line.name}: ${parts} part lines, expected ${expected}`];
}

/**
 * ADR 0059: every seeded bundle is a bundle line with one part line per part, and its sent quote
 * charges the bundle line only, with one VAT row per rate that sums exactly.
 */
export async function checkDemoBundles({ context, org }: CheckDemoBundlesInput) {
  const expected = org.tickets.flatMap((ticket) => ticket.bundles ?? []).length;
  const lines = await context.db.line.findMany({
    where: { partLines: { some: { status: "ACTIVE" } } },
    select: { id: true, name: true, itemId: true },
  });
  const failures: string[] = [];
  if (lines.length !== expected) {
    failures.push(`${lines.length} bundle lines, expected ${expected}`);
  }
  for (const line of lines) {
    failures.push(...(await checkParts({ context, line })));
    failures.push(...(await checkFrozen({ context, line })));
  }
  return failures.map((failure) => `${org.slug}: ${failure}`);
}
