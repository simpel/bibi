import type { DemoItem } from "./config-types";
import type { DemoTicketTemplate } from "./template-types";
import type { DemoTicket } from "./ticket-types";

export type UsedAssetDaysInput = {
  tickets: readonly DemoTicket[];
  templates: readonly DemoTicketTemplate[];
  /** The catalog, for the parts an expanded bundle puts on the ticket. */
  items: readonly DemoItem[];
};

/** `asset@day` for an item a line holds on a day offset. */
export const assetDay = ({ asset, day }: { asset: string; day: number }) => `${asset}@${day}`;

/**
 * Every item the tickets' lines use, by day: their own lines, the lines of the predefined ticket
 * they are made from and the parts of their bundles (#488). Generated tickets stay off these.
 */
export function usedAssetDays({ tickets, templates, items }: UsedAssetDaysInput): Set<string> {
  const templateItems = new Map(templates.map((row) => [row.name, row.lines.map((l) => l.item)]));
  const partsOf = new Map(items.map((item) => [item.name, (item.parts ?? []).map((p) => p.name)]));
  const used = new Set<string>();
  for (const ticket of tickets) {
    const assets = [
      ...(ticket.lines ?? []).map((line) => line.item),
      ...(templateItems.get(ticket.template ?? "") ?? []),
      ...(ticket.bundles ?? []).flatMap((bundle) => partsOf.get(bundle.item) ?? []),
    ];
    for (const asset of assets) used.add(assetDay({ asset, day: ticket.day }));
  }
  return used;
}
