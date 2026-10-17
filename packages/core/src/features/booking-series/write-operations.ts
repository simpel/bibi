import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { expandOccurrences } from "../../recurrence/expand-occurrences";
import { parseRecurrenceRule } from "../../recurrence/parse-recurrence-rule";
import { toJson } from "../../shared/to-json";
import { checkNewBooking } from "../booking/check-new-booking";
import { generateOccurrences } from "./generate-occurrences";
import { BookingSeriesCreateInputSchema, BookingSeriesSchema } from "./schema";
import { checkSeriesItems } from "./series-rules";
import { toBookingSeriesDto } from "./to-booking-series-dto";

export const createBookingSeries = defineOperation({
  name: "bookingSeries.create",
  kind: "command",
  description:
    "Create a recurring booking for a customer: every occurrence of the rule becomes an ordinary " +
    "booking (default TENTATIVE status) occupying the given bookable items, at most 12 months or " +
    "52 occurrences ahead. An occurrence whose items are already taken is still created but " +
    "flagged `clash` and listed in `clashes`, so another item or time can be chosen for it.",
  input: BookingSeriesCreateInputSchema,
  output: BookingSeriesSchema,
  permission: "booking:write",
  handler: async ({ input, context }) => {
    const { entityTypeId, customerId, rule: rrule, startsAt, durationMinutes, timeZone } = input;
    const checked = await checkNewBooking({ context, ...input });
    if (!checked.ok) return checked;
    const setupId = input.setupId ?? null;
    const changeover = await checkSeriesItems({
      context,
      itemIds: input.itemIds,
      setupId,
      customerId,
    });
    if (!changeover.ok) return changeover;
    const rule = parseRecurrenceRule({ rrule });
    if (!rule.ok) return rule;
    const expanded = expandOccurrences({
      rule: rule.value,
      start: startsAt,
      durationMinutes,
      timeZone,
    });
    if (!expanded.ok) return expanded;
    const template = {
      itemIds: input.itemIds,
      setupId,
      estimatedHeadcount: input.estimatedHeadcount ?? null,
      assigneeId: input.assigneeId ?? null,
      fields: checked.value,
    };
    const series = await context.db.bookingSeries.create({
      data: {
        organizationId: context.organizationId,
        ...{ entityTypeId, customerId, startsAt, durationMinutes, timeZone },
        rule: toJson({ value: rule.value }) ?? {},
        template: toJson({ value: template }) ?? {},
        truncated: expanded.value.truncated,
      },
    });
    const bookings = await generateOccurrences({
      context,
      series,
      template,
      occurrences: expanded.value.occurrences,
      changeoverMinutes: changeover.value,
    });
    if (!bookings.ok) return bookings;
    const dto = toBookingSeriesDto({ row: { ...series, bookings: bookings.value } });
    context.recordChange({ entityId: series.id, after: dto });
    return ok({ value: dto });
  },
});
