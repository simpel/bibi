import type { Prisma } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import type { Feature } from "../../permissions/features";
import { canView } from "../../shared/can-view";
import { withAlternativePeople } from "../../shared/query/alternative-people";
import { loadZoneOfVenue } from "../../shared/time-zones";
import { nowOf } from "../../time/now";
import { type MeasureEnv, measureWhere } from "./list-measures";
import { peopleWhere } from "./list-people";
import type { OrderFilter } from "./list-query";
import { ORDER_MEASURES, type OrderMeasure, type OrderQualifier } from "./list-schema";

type Where = Prisma.OrderWhereInput;
type Context = Pick<OperationContext, "db" | "permissions" | "actor" | "now">;
type NameQualifier = Exclude<OrderQualifier, OrderMeasure | "assignee" | "follower">;

const NOTHING: Where = { id: { in: [] } };

const exact = ({ value }: { value: string }) => ({ equals: value, mode: "insensitive" as const });
const partial = ({ value }: { value: string }) => ({
  contains: value,
  mode: "insensitive" as const,
});

/** Where one value of a name qualifier matches; `is:` takes `open` or `closed`. */
const NAME_MATCH: Record<NameQualifier, (value: string) => Where> = {
  status: (value) => ({ orderStatus: { name: exact({ value }) } }),
  type: (value) => ({ entityType: { name: exact({ value }) } }),
  customer: (value) => ({ customer: { name: partial({ value }) } }),
  contact: (value) => ({ contact: { name: partial({ value }) } }),
  is: (value) => {
    const state = value.toLowerCase();
    if (state !== "open" && state !== "closed") return NOTHING;
    return { orderStatus: { closes: state === "closed" } };
  },
};

/** Filtering by another feature's names would reveal them, so it needs that feature's `read`. */
const QUALIFIER_FEATURE: Partial<Record<OrderQualifier, Feature>> = {
  status: "pipeline",
  is: "pipeline",
  type: "configuration",
  customer: "customer",
  contact: "customer",
};

const isMeasure = ({ key }: { key: OrderQualifier }): boolean =>
  (ORDER_MEASURES as readonly string[]).includes(key);

type FilterWhereInput = { filter: OrderFilter; context: Context; env: MeasureEnv };

/** One qualifier as a Prisma filter; a qualifier the caller may not use matches nothing. */
async function filterWhere({ filter, context, env }: FilterWhereInput): Promise<Where> {
  const { key } = filter;
  const feature = QUALIFIER_FEATURE[key];
  if (feature && !canView({ context, feature })) return NOTHING;
  if (key === "assignee" || key === "follower") return peopleWhere({ filter, context });
  const match = isMeasure({ key })
    ? (value: string) => measureWhere({ key: key as OrderMeasure, value, env })
    : NAME_MATCH[key as NameQualifier];
  const any: Where = { OR: filter.values.map((value) => match(value)) };
  return filter.negated ? { NOT: any } : any;
}

export type QualifierWheresInput = { filters: OrderFilter[]; context: Context };

/** Every qualifier must hold (GitHub style); commas within one are alternatives, and `assignee:` and `follower:` are alternatives of each other. */
export async function qualifierWheres({ filters, context }: QualifierWheresInput) {
  if (filters.length === 0) return [];
  const zoneOf = await loadZoneOfVenue({ context });
  const env = { zone: zoneOf({ venue: null }), now: nowOf({ context }) };
  const wheres: { where: Where; people: boolean }[] = [];
  for (const filter of filters) {
    const people = !filter.negated && (filter.key === "assignee" || filter.key === "follower");
    wheres.push({ where: await filterWhere({ filter, context, env }), people });
  }
  return withAlternativePeople({ wheres });
}
