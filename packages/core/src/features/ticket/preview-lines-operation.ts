import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { loadZoneOfVenue } from "../../shared/time-zones";
import { addDays } from "../../time/plain-date";
import { fromZonedParts, toZonedParts } from "../../time/zoned-time";
import { checkPeriod } from "../occupancy/occupancy-rules";
import { loadPriceTerms } from "../price-list/customer-price-terms";
import { evaluatePlans } from "./plan/evaluate-plans";
import { toEntries } from "./preview-entries";
import {
  TicketPreviewLinesInputSchema,
  TicketPreviewLinesOutputSchema,
} from "./preview-lines-schema";
import { previewPlans } from "./preview-plans";
import { entryStatusId } from "./ticket-defaults";
import { checkCustomer, checkReadable } from "./ticket-rules";

type DayEndInput = { context: OperationContext; startsAt: Date };

/** Midnight after the requested start in the organization's zone (ADR 0064). */
async function dayEndOf({ context, startsAt }: DayEndInput): Promise<Date> {
  const timeZone = (await loadZoneOfVenue({ context }))({ venue: null });
  const { date } = toZonedParts({ instant: startsAt, timeZone });
  const midnight = { hour: 0, minute: 0, second: 0 };
  return fromZonedParts({ date: addDays({ date, days: 1 }), time: midnight, timeZone });
}

export const previewTicketLines = defineOperation({
  name: "ticket.previewLines",
  kind: "query",
  description:
    "Plan a ticket's lines without writing anything (ADR 0081): either packages (`templateIds`, " +
    "one entry each, planned from `startsAt`) or draft `lines` (one entry), for a customer, a " +
    "requested period and a headcount. Each line comes back with its effective times, quantity, " +
    "unit price and discount, the item state it would start in (the entry status's grid, ADR " +
    "0044) and its issues: HARD_CLASH (with the blocking ticket's reference and period, and " +
    "whether Create would refuse it), SOFT_OVERLAP, SELF_OVERLAP, SETUP_CAPACITY, POOL_SHORT and " +
    "OUTSIDE_HOURS. Each entry has its group (AVAILABLE, CLASHES, OUTSIDE_RANGE), the issues " +
    "GUESTS_OUTSIDE_RANGE and PAST_REQUESTED_END, and the first clash-free start that day. " +
    "Availability needs item:read; without it `availabilityHidden` is true.",
  input: TicketPreviewLinesInputSchema,
  output: TicketPreviewLinesOutputSchema,
  permission: "ticket:read",
  handler: async ({ input, context }) => {
    const period = checkPeriod({ startsAt: input.startsAt, endsAt: input.endsAt });
    if (!period.ok) return period;
    const readable = checkReadable({ context, permission: "customer:read", path: "customerId" });
    if (!readable.ok) return readable;
    const customer = await checkCustomer({ context, customerId: input.customerId });
    if (!customer.ok) return customer;
    const plans = await previewPlans({ context, input });
    if (!plans.ok) return plans;
    const statusId = await entryStatusId({ context });
    if (!statusId.ok) return statusId;
    const withAvailability = canView({ context, feature: "item" });
    const dayEnd = await dayEndOf({ context, startsAt: input.startsAt });
    const [evaluation, terms] = await Promise.all([
      evaluatePlans({
        ...{ context, statusId: statusId.value, headcount: input.headcount, withAvailability },
        plans: plans.value.map((plan) => plan.lines),
        laterMs: Math.max(0, dayEnd.getTime() - input.startsAt.getTime()),
      }),
      loadPriceTerms({ context, customerIds: [input.customerId] }),
    ]);
    const entries = toEntries({ input, plans: plans.value, evaluation, terms, dayEnd });
    return ok({
      value: { statusId: statusId.value, availabilityHidden: !withAvailability, entries },
    });
  },
});
