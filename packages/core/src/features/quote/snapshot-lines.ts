import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { resolveItemTags } from "../item/resolve-item";
import { lineAmounts } from "./line-totals";
import type { OrderLineDto, OrderLineInput } from "./order-line-schema";

type Db = { context: Pick<OperationContext, "db"> };

/** An order line to write: everything but its id. */
export type LineData = Omit<OrderLineDto, "id">;

type Snapshot = Pick<
  LineData,
  "itemId" | "name" | "priceUnit" | "vatRatePercent" | "tags" | "discountPercent"
> & { unitPriceMinor: number | null };

const lineIssue = ({ at, field, message }: { at: number; field: string; message: string }) =>
  invalid({ message, issues: [{ path: `lines.${at}.${field}`, message }] });

type CopyItemInput = Db & { itemId: string; customerId: string; at: number };

/** A fresh snapshot of an active item: name, price, VAT (else the venue's) and contained tags. */
async function copyItem({
  context,
  itemId,
  customerId,
  at,
}: CopyItemInput): Promise<Result<Snapshot>> {
  const item = await context.db.item.findFirst({
    where: { id: itemId },
    include: { venue: { select: { defaultVatRatePercent: true } } },
  });
  if (!item) return lineIssue({ at, field: "itemId", message: "Unknown item" });
  if (item.customerId && item.customerId !== customerId) {
    return lineIssue({ at, field: "itemId", message: "The item belongs to another customer" });
  }
  const vatRatePercent = item.vatRatePercent ?? item.venue?.defaultVatRatePercent ?? null;
  if (vatRatePercent === null) {
    return lineIssue({ at, field: "itemId", message: "The item has no VAT rate and no venue" });
  }
  const resolution = await resolveItemTags({ context, id: itemId });
  const tags = (resolution?.contains ?? []).map(({ valueId, vocabularyId, name }) => ({
    valueId,
    vocabularyId,
    name,
  }));
  const { name, priceMinor, priceUnit } = item;
  const unitPriceMinor = priceMinor;
  return ok({
    value: { itemId, name, priceUnit, vatRatePercent, tags, unitPriceMinor, discountPercent: 0 },
  });
}

export type SnapshotLinesInput = Db & {
  lines: readonly OrderLineInput[];
  /** The ticket's customer: customer-specific packages of other customers are refused. */
  customerId: string;
  /** The draft's current lines; a line given by `lineId` keeps its snapshot. */
  existing: readonly OrderLineDto[];
};

type SnapshotOneInput = Omit<SnapshotLinesInput, "lines"> & { line: OrderLineInput; at: number };

async function snapshotOne({ context, line, at, customerId, existing }: SnapshotOneInput) {
  if (!line.lineId) return copyItem({ context, itemId: line.itemId, customerId, at });
  const kept = existing.find(({ id }) => id === line.lineId);
  if (!kept || kept.itemId !== line.itemId) {
    return lineIssue({ at, field: "lineId", message: "Not a line of this item on the quote" });
  }
  const snapshot: Snapshot = kept;
  return ok({ value: snapshot });
}

/** The lines to write, in the given order, with their amounts. */
export async function snapshotLines({
  lines,
  ...rest
}: SnapshotLinesInput): Promise<Result<LineData[]>> {
  const out: LineData[] = [];
  for (const [at, line] of lines.entries()) {
    const snapshot = await snapshotOne({ ...rest, line, at });
    if (!snapshot.ok) return snapshot;
    const { itemId, name, priceUnit, vatRatePercent, tags } = snapshot.value;
    const unitPriceMinor = line.unitPriceMinor ?? snapshot.value.unitPriceMinor;
    if (unitPriceMinor === null) {
      return lineIssue({ at, field: "unitPriceMinor", message: "The item has no price; give one" });
    }
    const discountPercent = line.discountPercent ?? snapshot.value.discountPercent;
    const { quantity } = line;
    const amounts = lineAmounts({ quantity, unitPriceMinor, discountPercent, vatRatePercent });
    out.push({
      ...{ itemId, name, priceUnit, vatRatePercent, tags, quantity, unitPriceMinor },
      ...{ discountPercent, position: at, ...amounts },
    });
  }
  return ok({ value: out });
}
