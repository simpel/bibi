import { effectivePrice } from "../line/effective-values";
import type { PriceTermsLookup } from "../price-list/customer-price-terms";
import type { PlansEvaluation } from "./plan/evaluate-plans";
import { firstFreeStart } from "./plan/first-free-start";
import { planGroup, planIssues } from "./plan/plan-groups";
import type {
  OrderPreviewLinesInput,
  PreviewAddOn,
  PreviewEntry,
  PreviewLine,
} from "./preview-lines-schema";
import type { PreviewPlan } from "./preview-plans";

export type ToEntriesInput = {
  input: OrderPreviewLinesInput;
  plans: readonly PreviewPlan[];
  evaluation: PlansEvaluation;
  terms: PriceTermsLookup;
  /** The end of the requested day in the organization's zone. */
  dayEnd: Date;
};

type LinesInput = Omit<ToEntriesInput, "plans" | "dayEnd"> & { plan: PreviewPlan; p: number };

type RowInput = LinesInput & { row: number };

/** One planned row with its effective values, start state and issues. */
function previewRow({ input, plan, p, evaluation, terms, row }: RowInput): PreviewAddOn {
  const line = plan.lines[row] as PreviewPlan["lines"][number];
  const evaluated = evaluation.lines[p]?.[row];
  const item = line.itemId ? evaluation.sources.items.get(line.itemId) : undefined;
  const on = line.startsAt ?? input.startsAt;
  const { price, discount } = effectivePrice({
    line: {
      unitPriceMinor: line.unitPriceMinor ?? null,
      discountPercent: line.discountPercent ?? null,
    },
    item: item ?? null,
    terms: terms({ customerId: input.customerId, on }),
  });
  const slotOf = ({ index }: { index: number }) => plan.slots[index]?.lineIndex ?? index;
  const issues = (evaluated?.issues ?? []).map((issue) =>
    issue.otherLineIndex === null
      ? issue
      : { ...issue, otherLineIndex: slotOf({ index: issue.otherLineIndex }) },
  );
  return {
    index: plan.slots[row]?.addOnIndex ?? plan.slots[row]?.lineIndex ?? row,
    ...{ entityTypeId: line.entityTypeId, name: line.name },
    ...{ itemId: line.itemId ?? null, setupId: line.setupId ?? null },
    ...{ startsAt: line.startsAt ?? null, endsAt: line.endsAt ?? null },
    quantity: line.quantity ?? null,
    effectiveQuantity: evaluated?.quantity.value ?? null,
    quantitySource: evaluated?.quantity.source ?? null,
    ...{ effectiveUnitPriceMinor: price.value, unitPriceSource: price.source },
    ...{ effectiveDiscountPercent: discount.value, discountSource: discount.source },
    stateId: evaluated?.stateId ?? null,
    issues,
  };
}

/** A plan's lines, each with its add-ons nested under it (ADR 0088). */
function previewLines({ ...input }: LinesInput): PreviewLine[] {
  const rows = input.plan.lines.map((_, row) => ({ slot: input.plan.slots[row], row }));
  return rows
    .filter(({ slot }) => slot?.addOnIndex === null)
    .map(({ slot, row }) => ({
      ...previewRow({ ...input, row }),
      options: input.plan.defaults[slot?.lineIndex ?? row] ?? [],
      addOns: rows
        .filter(
          (other) => other.slot?.addOnIndex !== null && other.slot?.lineIndex === slot?.lineIndex,
        )
        .map((other) => previewRow({ ...input, row: other.row })),
    }));
}

/**
 * One output entry per plan: its lines, the package-level issues, the step-3 group and the
 * first clash-free start (only when availability is visible).
 */
export function toEntries({ input, plans, evaluation, terms, dayEnd }: ToEntriesInput) {
  return plans.map((plan, p): PreviewEntry => {
    const lines = previewLines({ input, plan, p, evaluation, terms });
    const allIssues = lines.flatMap((line) => [line, ...line.addOns].flatMap((row) => row.issues));
    const issues = planIssues({
      ...{ headcount: input.headcount, range: plan.range, endsAt: plan.endsAt },
      requestedEnd: input.endsAt,
    });
    const rows = evaluation.availability?.rows;
    return {
      ...{ templateId: plan.templateId, endsAt: plan.endsAt, issues, lines },
      group: planGroup({ issues, lineIssues: allIssues }),
      firstFreeStart: rows
        ? firstFreeStart({
            ...{ plan: plan.lines, periods: evaluation.periods[p] ?? [], rows },
            ...{ requestedStart: input.startsAt, dayEnd },
          })
        : null,
    };
  });
}
