import type { OperationContext } from "../../operations/types";
import type { PriceTerms } from "../line/effective-values";

type Db = { context: Pick<OperationContext, "db"> };

type ListRow = {
  customerId: string | null;
  validFrom: Date | null;
  validTo: Date | null;
  createdAt: Date;
  discountPercent: { toNumber: () => number } | null;
  items: { itemId: string; priceMinor: number }[];
};

const day = ({ at }: { at: Date }) => at.toISOString().slice(0, 10);

const validOn = ({ list, on }: { list: ListRow; on: string }) =>
  (!list.validFrom || day({ at: list.validFrom }) <= on) &&
  (!list.validTo || day({ at: list.validTo }) >= on);

/** The newest start first (an open start last), then the most recently created. */
const newest = ({ lists }: { lists: ListRow[] }) =>
  lists.reduce<ListRow | undefined>((best, list) => {
    if (!best) return list;
    const diff =
      (list.validFrom?.getTime() ?? -Infinity) - (best.validFrom?.getTime() ?? -Infinity) ||
      list.createdAt.getTime() - best.createdAt.getTime();
    return diff > 0 ? list : best;
  }, undefined);

/** Picks a customer's price terms on a day; reads the lists once for many lookups. */
export type PriceTermsLookup = (query: { customerId: string; on: Date }) => PriceTerms | null;

export type LoadPriceTermsInput = Db & { customerIds: readonly string[] };

/**
 * ADR 0052: the customer's valid price list (active, the day within its inclusive validity; the
 * newest when several are valid) as price terms. One query for every customer given.
 */
export async function loadPriceTerms({
  context,
  customerIds,
}: LoadPriceTermsInput): Promise<PriceTermsLookup> {
  const ids = [...new Set(customerIds)];
  const lists: ListRow[] = ids.length
    ? await context.db.priceList.findMany({
        where: { customerId: { in: ids } },
        include: { items: { select: { itemId: true, priceMinor: true } } },
      })
    : [];
  return ({ customerId, on }) => {
    const today = day({ at: on });
    const list = newest({
      lists: lists.filter(
        (row) => row.customerId === customerId && validOn({ list: row, on: today }),
      ),
    });
    if (!list) return null;
    return {
      prices: new Map(list.items.map(({ itemId, priceMinor }) => [itemId, priceMinor])),
      discountPercent: list.discountPercent?.toNumber() ?? null,
    };
  };
}
