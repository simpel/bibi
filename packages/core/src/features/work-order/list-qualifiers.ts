import type { Prisma } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import type { Feature } from "../../permissions/features";
import { canView } from "../../shared/can-view";
import { withAlternativePeople } from "../../shared/query/alternative-people";
import type { QueryFilter } from "../../shared/query/parse-query";
import { qualifierWheres } from "../ticket/list-qualifiers";
import type { TicketFilter } from "../ticket/list-query";
import { slotWhere } from "./list-people";
import {
  WORK_ORDER_PEOPLE_QUALIFIERS,
  WORK_ORDER_TICKET_QUALIFIERS,
  type WorkOrderQualifier,
} from "./list-schema";

export type WorkOrderFilter = QueryFilter<WorkOrderQualifier>;

type Where = Prisma.WorkOrderWhereInput;
type Context = Pick<OperationContext, "db" | "permissions" | "actor" | "now">;

const NOTHING: Where = { id: { in: [] } };
const exact = ({ value }: { value: string }) => ({ equals: value, mode: "insensitive" as const });

/** `is:` on the version itself, or on its ticket's status (`open`, `closed`). */
const IS: Record<string, Where> = {
  current: { current: true },
  sent: { sentAt: { not: null } },
  unsent: { sentAt: null },
  blocked: { blocked: true },
  open: { ticket: { ticketStatus: { closes: false } } },
  closed: { ticket: { ticketStatus: { closes: true } } },
};

type OwnMatch = (input: { value: string; context: Context }) => Where;

const OWN: Record<"definition" | "responsibility" | "is", OwnMatch> = {
  definition: ({ value }) => ({ workOrderDefinition: { name: exact({ value }) } }),
  responsibility: ({ value }) => ({ responsibility: { name: exact({ value }) } }),
  is: ({ value, context }) => {
    const state = value.toLowerCase();
    const onTicket = state === "open" || state === "closed";
    return onTicket && !canView({ context, feature: "pipeline" })
      ? NOTHING
      : (IS[state] ?? NOTHING);
  },
};

/** Filtering by another feature's names would reveal them, so it needs that feature's `read`. */
const OWN_FEATURE: Partial<Record<keyof typeof OWN, Feature>> = {
  definition: "template",
  responsibility: "responsibility",
};

const isIn = <T extends string>({ list, key }: { list: readonly T[]; key: string }) =>
  (list as readonly string[]).includes(key);

type FilterInput = { filter: WorkOrderFilter; context: Context };

/** A ticket qualifier on the work order's ticket; needs `ticket:read` besides its own gate. */
async function ticketWhere({ filter, context }: FilterInput): Promise<Where> {
  if (!canView({ context, feature: "ticket" })) return NOTHING;
  const [where] = await qualifierWheres({ filters: [filter as TicketFilter], context });
  return where ? { ticket: where } : NOTHING;
}

async function filterWhere({ filter, context }: FilterInput): Promise<Where> {
  const { key } = filter;
  if (isIn({ list: WORK_ORDER_PEOPLE_QUALIFIERS, key })) return slotWhere({ filter, context });
  if (isIn({ list: WORK_ORDER_TICKET_QUALIFIERS, key })) return ticketWhere({ filter, context });
  const own = key as keyof typeof OWN;
  const feature = OWN_FEATURE[own];
  if (feature && !canView({ context, feature })) return NOTHING;
  const any: Where = { OR: filter.values.map((value) => OWN[own]({ value, context })) };
  return filter.negated ? { NOT: any } : any;
}

export type WorkOrderQualifierWheresInput = { filters: WorkOrderFilter[]; context: Context };

const isPeople = ({ key, negated }: WorkOrderFilter) =>
  !negated && isIn({ list: WORK_ORDER_PEOPLE_QUALIFIERS, key });

/** Every qualifier must hold (GitHub style); commas within one are alternatives, and the people qualifiers are alternatives of each other. */
export async function workOrderQualifierWheres({
  filters,
  context,
}: WorkOrderQualifierWheresInput): Promise<Where[]> {
  const wheres: { where: Where; people: boolean }[] = [];
  for (const filter of filters) {
    wheres.push({ where: await filterWhere({ filter, context }), people: isPeople(filter) });
  }
  return withAlternativePeople({ wheres });
}
