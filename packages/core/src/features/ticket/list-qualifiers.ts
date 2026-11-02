import type { Prisma } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import type { Feature } from "../../permissions/features";
import { canView } from "../../shared/can-view";
import { peopleWhere } from "./list-people";
import type { TicketFilter, TicketQualifier } from "./list-query";

type Where = Prisma.TicketWhereInput;
type Context = Pick<OperationContext, "db" | "permissions" | "actor">;

const NOTHING: Where = { id: { in: [] } };

const exact = ({ value }: { value: string }) => ({ equals: value, mode: "insensitive" as const });
const partial = ({ value }: { value: string }) => ({
  contains: value,
  mode: "insensitive" as const,
});

/** Where one value of a name qualifier matches; `is:` takes `open` or `closed`. */
const NAME_MATCH: Record<
  Exclude<TicketQualifier, "assignee" | "follower">,
  (value: string) => Where
> = {
  status: (value) => ({ ticketStatus: { name: exact({ value }) } }),
  type: (value) => ({ entityType: { name: exact({ value }) } }),
  customer: (value) => ({ customer: { name: partial({ value }) } }),
  contact: (value) => ({ contact: { name: partial({ value }) } }),
  is: (value) => {
    const state = value.toLowerCase();
    if (state !== "open" && state !== "closed") return NOTHING;
    return { ticketStatus: { closes: state === "closed" } };
  },
};

/** Filtering by another feature's names would reveal them, so it needs that feature's `read`. */
const QUALIFIER_FEATURE: Partial<Record<TicketQualifier, Feature>> = {
  status: "pipeline",
  is: "pipeline",
  type: "configuration",
  customer: "customer",
  contact: "customer",
};

export type FilterWhereInput = { filter: TicketFilter; context: Context };

/** One qualifier as a Prisma filter; a qualifier the caller may not use matches nothing. */
async function filterWhere({ filter, context }: FilterWhereInput): Promise<Where> {
  const feature = QUALIFIER_FEATURE[filter.key];
  if (feature && !canView({ context, feature })) return NOTHING;
  if (filter.key === "assignee" || filter.key === "follower") {
    return peopleWhere({ filter, context });
  }
  const match = NAME_MATCH[filter.key];
  const any: Where = { OR: filter.values.map((value) => match(value)) };
  return filter.negated ? { NOT: any } : any;
}

export type QualifierWheresInput = { filters: TicketFilter[]; context: Context };

/** Every qualifier must hold (GitHub style); commas within one are alternatives. */
export async function qualifierWheres({ filters, context }: QualifierWheresInput) {
  const wheres: Where[] = [];
  for (const filter of filters) wheres.push(await filterWhere({ filter, context }));
  return wheres;
}
