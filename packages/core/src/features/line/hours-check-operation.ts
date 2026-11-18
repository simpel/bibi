import { ok } from "../../errors/result";
import { loadHoursWarnings } from "../../hours/hours-warnings";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { checkPeriod } from "../occupancy/occupancy-rules";
import { checkReadable } from "../order/order-rules";
import { LineHoursCheckInputSchema, LineHoursCheckOutputSchema } from "./hours-check-schema";

/** The id the planned line is evaluated under; it is never stored. */
const PLANNED = "planned";

export const checkLineHours = defineOperation({
  name: "line.checkHours",
  kind: "query",
  description:
    "Whether a line with this item and time would fall outside the hours that apply (ADR 0064 " +
    "rule 11), before it is saved: the item's own working hours, else its venue's opening " +
    "hours. Hours are advisory: a line outside them can still be saved, so ask the user to " +
    "confirm first. The same rule as the OUTSIDE_ITEM_HOURS and OUTSIDE_VENUE_HOURS warnings " +
    "on a saved line. Writes nothing.",
  input: LineHoursCheckInputSchema,
  output: LineHoursCheckOutputSchema,
  permission: "program:read",
  handler: async ({ input, context }) => {
    const readable = checkReadable({ context, permission: "item:read", path: "itemId" });
    if (!readable.ok) return readable;
    const period = checkPeriod({ startsAt: input.startsAt, endsAt: input.endsAt });
    if (!period.ok) return period;
    const item = await context.db.item.findFirst({
      where: { id: input.itemId, status: { in: ["ACTIVE", "ARCHIVED"] } },
      select: { id: true },
    });
    if (!item) return notFound({ entity: "Item" });
    const line = { id: PLANNED, ...input };
    const warning = (await loadHoursWarnings({ context, lines: [line] })).get(PLANNED);
    return ok({ value: { kind: warning?.kind ?? null, id: warning?.id ?? null } });
  },
});
