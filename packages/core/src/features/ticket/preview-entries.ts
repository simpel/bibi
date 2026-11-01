import { effectivePrice } from "../line/effective-values";
import type { PriceTermsLookup } from "../price-list/customer-price-terms";
import type { PlansEvaluation } from "./plan/evaluate-plans";
import { firstFreeStart } from "./plan/first-free-start";
import { planGroup, planIssues } from "./plan/plan-groups";
import type { PreviewEntry, PreviewLine, TicketPreviewLinesInput } from "./preview-lines-schema";
import type { PreviewPlan } from "./preview-plans";

export type ToEntriesInput = {
  input: TicketPreviewLinesInput;
  plans: readonly PreviewPlan[];
  evaluation: PlansEvaluation;
  terms: PriceTermsLookup;
  /** The end of the requested day in the organization's zone. */
  dayEnd: Date;
};

type LinesInput = Omit<ToEntriesInput, "plans" | "dayEnd"> & { plan: PreviewPlan; p: number };

/** A plan's lines with their effective values, start state and issues. */
function previewLines({ input, plan, p, evaluation, terms }: LinesInput): PreviewLine[] {
  return plan.lines.map((line, index) => {
    const evaluated = evaluation.lines[p]?.[index];
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
    return {
      ...{ index, entityTypeId: line.entityTypeId, name: line.name },
      ...{ itemId: line.itemId ?? null, setupId: line.setupId ?? null },
      ...{ startsAt: line.startsAt ?? null, endsAt: line.endsAt ?? null },
      quantity: line.quantity ?? null,
      effectiveQuantity: evaluated?.quantity.value ?? null,
      quantitySource: evaluated?.quantity.source ?? null,
      ...{ effectiveUnitPriceMinor: price.value, unitPriceSource: price.source },
      ...{ effectiveDiscountPercent: discount.value, discountSource: discount.source },
      stateId: evaluated?.stateId ?? null,
      issues: evaluated?.issues ?? [],
    };
  });
}

/**
 * One output entry per plan: its lines, the package-level issues, the step-3 group and the
 * first clash-free start (only when availability is visible).
 */
export function toEntries({ input, plans, evaluation, terms, dayEnd }: ToEntriesInput) {
  return plans.map((plan, p): PreviewEntry => {
    const lines = previewLines({ input, plan, p, evaluation, terms });
    const issues = planIssues({
      ...{ headcount: input.headcount, range: plan.range, endsAt: plan.endsAt },
      requestedEnd: input.endsAt,
    });
    const rows = evaluation.availability?.rows;
    return {
      ...{ templateId: plan.templateId, endsAt: plan.endsAt, issues, lines },
      group: planGroup({ issues, lineIssues: lines.flatMap((line) => line.issues) }),
      firstFreeStart: rows
        ? firstFreeStart({
            ...{ plan: plan.lines, periods: evaluation.periods[p] ?? [], rows },
            ...{ requestedStart: input.startsAt, dayEnd },
          })
        : null,
    };
  });
}
