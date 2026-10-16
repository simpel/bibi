import type { PriceList, PriceListItem } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import type { PriceListDto } from "./schema";

/** Prisma `include` for every price list read: its item prices, in a stable order. */
export const PRICE_LIST_INCLUDE = {
  items: { orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }] },
};

export type PriceListRow = PriceList & { items: PriceListItem[] };

export type ToPriceListDtoInput = { row: PriceListRow };

export const toPriceListDto = ({ row }: ToPriceListDtoInput): PriceListDto => {
  const { items, discountPercent, ...priceList } = row;
  return {
    ...priceList,
    discountPercent: discountPercent === null ? null : discountPercent.toNumber(),
    items: items.map(({ itemId, priceMinor }) => ({ itemId, priceMinor })),
  };
};

export type LoadPriceListInput = { context: Pick<OperationContext, "db">; id: string };

/** The active price list, or null when missing, archived or in another organization. */
export async function loadPriceList({
  context,
  id,
}: LoadPriceListInput): Promise<PriceListDto | null> {
  const row = await context.db.priceList.findFirst({ where: { id }, include: PRICE_LIST_INCLUDE });
  return row ? toPriceListDto({ row }) : null;
}
