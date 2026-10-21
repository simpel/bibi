import type { ExecuteContext } from "../../operations/context";
import type { DemoItem } from "./config-types";
import type { DemoOrg } from "./types";

export type CheckDemoCustomisationsInput = { context: ExecuteContext; org: DemoOrg };

/** A group as the data files describe it: `name min..max: option=EFFECT, ...`. */
const describeData = ({ item }: { item: DemoItem }) =>
  (item.customisations ?? []).map((group) => {
    const max = group.pick ?? 1;
    const options = group.options.map((o) => `${o.name}=${o.priceEffect ?? "INCLUDED"}`);
    return `${group.name} ${group.minPick ?? max}..${max}: ${options.join(", ")}`;
  });

type StoredInput = { context: ExecuteContext; name: string };

/** The same description read from the database, groups and options in their stored order. */
async function describeStored({ context, name }: StoredInput) {
  const groups = await context.db.itemCustomisationGroup.findMany({
    where: { item: { name, customerId: null } },
    orderBy: { position: "asc" },
    include: { options: { orderBy: { position: "asc" }, include: { item: true } } },
  });
  return groups.map((group) => {
    const options = group.options.map((o) => `${o.item.name}=${o.priceEffect}`);
    return `${group.name} ${group.minPick}..${group.maxPick}: ${options.join(", ")}`;
  });
}

/**
 * ADR 0059: every catalog item's customisation groups hang on it as the data files say, each
 * option an item with its price effect (e.g. the Projector's Installation: Our technician as a
 * priced extra, or Self-install, so opting out is choosing the other option).
 */
export async function checkDemoCustomisations({ context, org }: CheckDemoCustomisationsInput) {
  const failures: string[] = [];
  for (const item of org.config.items.filter((candidate) => candidate.customisations)) {
    const want = describeData({ item }).join(" | ");
    const got = (await describeStored({ context, name: item.name })).join(" | ");
    if (got !== want) failures.push(`${org.slug}: ${item.name} has groups "${got}"`);
  }
  return failures;
}
