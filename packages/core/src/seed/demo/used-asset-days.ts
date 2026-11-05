import type { DemoItem } from "./config-types";
import type { DemoOrderTemplate } from "./template-types";
import type { DemoOrder } from "./order-types";

export type UsedAssetDaysInput = {
  orders: readonly DemoOrder[];
  templates: readonly DemoOrderTemplate[];
  /** The catalog, for the parts an expanded bundle puts on the order. */
  items: readonly DemoItem[];
};

/** `asset@day` for an item a line holds on a day offset. */
export const assetDay = ({ asset, day }: { asset: string; day: number }) => `${asset}@${day}`;

/**
 * Every item the orders' lines use, by day: their own lines, the lines of the predefined order
 * they are made from and the parts of their bundles (#488). Generated orders stay off these.
 */
export function usedAssetDays({ orders, templates, items }: UsedAssetDaysInput): Set<string> {
  const templateItems = new Map(templates.map((row) => [row.name, row.lines.map((l) => l.item)]));
  const partsOf = new Map(items.map((item) => [item.name, (item.parts ?? []).map((p) => p.name)]));
  const used = new Set<string>();
  for (const order of orders) {
    const assets = [
      ...(order.lines ?? []).map((line) => line.item),
      ...(templateItems.get(order.template ?? "") ?? []),
      ...(order.bundles ?? []).flatMap((bundle) => partsOf.get(bundle.item) ?? []),
    ];
    for (const asset of assets) used.add(assetDay({ asset, day: order.day }));
  }
  return used;
}
