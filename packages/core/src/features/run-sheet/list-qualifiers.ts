import type { Prisma } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import type { Feature } from "../../permissions/features";
import { canView } from "../../shared/can-view";
import { withAlternativePeople } from "../../shared/query/alternative-people";
import type { QueryFilter } from "../../shared/query/parse-query";
import { qualifierWheres } from "../order/list-qualifiers";
import type { OrderFilter } from "../order/list-query";
import { slotWhere } from "./list-people";
import {
  RUN_SHEET_ORDER_QUALIFIERS,
  RUN_SHEET_PEOPLE_QUALIFIERS,
  type RunSheetQualifier,
} from "./list-schema";

export type RunSheetFilter = QueryFilter<RunSheetQualifier>;

type Where = Prisma.RunSheetWhereInput;
type Context = Pick<OperationContext, "db" | "permissions" | "actor" | "now">;

const NOTHING: Where = { id: { in: [] } };
const exact = ({ value }: { value: string }) => ({ equals: value, mode: "insensitive" as const });

/** `is:` on the version itself, or on its order's status (`open`, `closed`). */
const IS: Record<string, Where> = {
  current: { current: true },
  published: { publishedAt: { not: null } },
  sent: { publishedAt: { not: null } },
  draft: { publishedAt: null, baseVersion: null },
  unsent: { publishedAt: null },
  pending: { publishedAt: { not: null }, fulfilledAt: null },
  fulfilled: { fulfilledAt: { not: null } },
  done: { fulfilledAt: { not: null } },
  revision: { publishedAt: null, baseVersion: { not: null } },
  blocked: { blocked: true },
  open: { order: { orderStatus: { closes: false } } },
  closed: { order: { orderStatus: { closes: true } } },
};

type OwnMatch = (input: { value: string; context: Context }) => Where;

const OWN: Record<"definition" | "responsibility" | "is", OwnMatch> = {
  definition: ({ value }) => ({ runSheetDefinition: { name: exact({ value }) } }),
  responsibility: ({ value }) => ({ responsibility: { name: exact({ value }) } }),
  is: ({ value, context }) => {
    const state = value.toLowerCase();
    const onOrder = state === "open" || state === "closed";
    return onOrder && !canView({ context, feature: "pipeline" })
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

type FilterInput = { filter: RunSheetFilter; context: Context };

/** An order qualifier on the run sheet's order; needs `order:read` besides its own gate. */
async function orderWhere({ filter, context }: FilterInput): Promise<Where> {
  if (!canView({ context, feature: "order" })) return NOTHING;
  const [where] = await qualifierWheres({ filters: [filter as OrderFilter], context });
  return where ? { order: where } : NOTHING;
}

async function filterWhere({ filter, context }: FilterInput): Promise<Where> {
  const { key } = filter;
  if (isIn({ list: RUN_SHEET_PEOPLE_QUALIFIERS, key })) return slotWhere({ filter, context });
  if (isIn({ list: RUN_SHEET_ORDER_QUALIFIERS, key })) return orderWhere({ filter, context });
  const own = key as keyof typeof OWN;
  const feature = OWN_FEATURE[own];
  if (feature && !canView({ context, feature })) return NOTHING;
  const any: Where = { OR: filter.values.map((value) => OWN[own]({ value, context })) };
  return filter.negated ? { NOT: any } : any;
}

export type RunSheetQualifierWheresInput = { filters: RunSheetFilter[]; context: Context };

const isPeople = ({ key, negated }: RunSheetFilter) =>
  !negated && isIn({ list: RUN_SHEET_PEOPLE_QUALIFIERS, key });

/** Every qualifier must hold (GitHub style); commas within one are alternatives, and the people qualifiers are alternatives of each other. */
export async function runSheetQualifierWheres({
  filters,
  context,
}: RunSheetQualifierWheresInput): Promise<Where[]> {
  const wheres: { where: Where; people: boolean }[] = [];
  for (const filter of filters) {
    wheres.push({ where: await filterWhere({ filter, context }), people: isPeople(filter) });
  }
  return withAlternativePeople({ wheres });
}
