import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";

const MINUTE_MS = 60_000;

/** A part of a bundle item as expansion reads it (ADR 0021, 0059). */
export type BundlePartDefaults = {
  itemId: string;
  name: string;
  quantity: number;
  offsetMinutes: number;
  durationMinutes: number | null;
};

/** What a part line is created with. */
export type PartLinePlan = {
  itemId: string;
  name: string;
  startsAt: Date | null;
  endsAt: Date | null;
  quantity: number | null;
};

export type PlanPartsInput = {
  bundle: { startsAt: Date | null; endsAt: Date | null; quantity: number | null };
  /** The ticket's headcount in effect (guaranteed, else estimated), for parts of several each. */
  headcount: number | null;
  parts: readonly BundlePartDefaults[];
};

function quantityOf({ bundle, headcount, part }: PlanPartsInput & { part: BundlePartDefaults }) {
  if (bundle.quantity !== null) return bundle.quantity * part.quantity;
  if (part.quantity === 1) return null;
  return headcount === null ? null : headcount * part.quantity;
}

/**
 * ADR 0059: the part lines a bundle line gets. A part starts at the bundle's start plus its
 * offset and lasts its duration, else to the bundle's end; an untimed bundle has untimed parts.
 * Its quantity is the part's quantity per bundle; a part of one per bundle on a bundle that counts
 * the headcount counts it too. Both are defaults: each part line can be changed afterwards.
 */
export function planParts({ bundle, headcount, parts }: PlanPartsInput): Result<PartLinePlan[]> {
  const plans: PartLinePlan[] = [];
  for (const part of parts) {
    const quantity = quantityOf({ bundle, headcount, parts, part });
    const base = { itemId: part.itemId, name: part.name, quantity };
    if (!bundle.startsAt || !bundle.endsAt) {
      plans.push({ ...base, startsAt: null, endsAt: null });
      continue;
    }
    const startsAt = new Date(bundle.startsAt.getTime() + part.offsetMinutes * MINUTE_MS);
    const endsAt =
      part.durationMinutes === null
        ? bundle.endsAt
        : new Date(startsAt.getTime() + part.durationMinutes * MINUTE_MS);
    if (endsAt <= startsAt) {
      const message = `The part "${part.name}" starts after the bundle ends: give it a longer time`;
      return invalid({ message, issues: [{ path: "endsAt", message }] });
    }
    plans.push({ ...base, startsAt, endsAt });
  }
  return ok({ value: plans });
}

export type LoadBundleInput = { context: Pick<OperationContext, "db">; itemId: string };

/**
 * The active `BUNDLE` item with its active parts in order; null when there is no such item.
 * Customisation options are not parts: they are chosen per line (`line.chooseOptions`).
 */
export async function loadBundle({ context, itemId }: LoadBundleInput) {
  const item = await context.db.item.findFirst({
    where: { id: itemId, entityType: { capabilities: { has: "BUNDLE" } } },
    select: {
      name: true,
      parts: {
        where: { part: { status: "ACTIVE" } },
        orderBy: [{ position: "asc" }, { id: "asc" }],
        select: {
          ...{ partId: true, quantity: true, offsetMinutes: true, durationMinutes: true },
          part: { select: { name: true } },
        },
      },
    },
  });
  if (!item) return null;
  const parts: BundlePartDefaults[] = item.parts.map(({ partId, part, ...rest }) => ({
    ...rest,
    itemId: partId,
    name: part.name,
  }));
  return { name: item.name, parts };
}
