import { z } from "zod";

/** What a planned line's issue says (ADR 0081 decision 7). Add a kind here, never free text. */
export const LINE_ISSUE_KINDS = [
  "HARD_CLASH",
  "SOFT_OVERLAP",
  "SELF_OVERLAP",
  "SETUP_CAPACITY",
  "POOL_SHORT",
  "OUTSIDE_HOURS",
] as const;

export const LineIssueKindSchema = z.enum(LINE_ISSUE_KINDS);
export type LineIssueKind = z.infer<typeof LineIssueKindSchema>;

const only = ({ kinds }: { kinds: string }) => `Set for ${kinds}; null otherwise`;

/**
 * One issue of a planned line. Flat: the fields of other kinds are null. It carries ids, order
 * references and numbers only, never another feature's names (ADR 0050, 0071).
 */
export const PlanLineIssueSchema = z.object({
  kind: LineIssueKindSchema.describe(
    "HARD_CLASH: an existing hard hold, buffer or manual block on the item overlaps. " +
      "SOFT_OVERLAP: an existing soft hold overlaps (allowed, ADR 0044). SELF_OVERLAP: another " +
      "line of the same plan holds the same item at the same time. SETUP_CAPACITY: the quantity " +
      "is above the setup's capacity. POOL_SHORT: a mandatory demand of the item finds fewer " +
      "free units than it needs. OUTSIDE_HOURS: outside the item's or venue's hours (advisory)",
  ),
  message: z.string().describe("A short English explanation, for logs and the assistant"),
  orderReference: z
    .number()
    .int()
    .nullable()
    .describe(
      `${only({ kinds: "HARD_CLASH and SOFT_OVERLAP" })}: the holding order; null for a block`,
    ),
  orderTitle: z
    .string()
    .nullable()
    .describe(
      `${only({ kinds: "HARD_CLASH and SOFT_OVERLAP" })}: the holding order's title; null for a ` +
        "block or an untitled order",
    ),
  startsAt: z
    .date()
    .nullable()
    .describe(`${only({ kinds: "HARD_CLASH and SOFT_OVERLAP" })}: its start`),
  endsAt: z
    .date()
    .nullable()
    .describe(`${only({ kinds: "HARD_CLASH and SOFT_OVERLAP" })}: its end`),
  refusesCreate: z
    .boolean()
    .nullable()
    .describe(
      `${only({ kinds: "HARD_CLASH" })}: true when the line's own start state is hard, so Create refuses ` +
        "it; false when it would be prebooked as a soft hold (ADR 0081 decision 8)",
    ),
  otherLineIndex: z
    .number()
    .int()
    .nullable()
    .describe(`${only({ kinds: "SELF_OVERLAP" })}: the index of the other line in the plan`),
  capacity: z
    .number()
    .int()
    .nullable()
    .describe(`${only({ kinds: "SETUP_CAPACITY" })}: the setup's capacity`),
  demandId: z
    .string()
    .nullable()
    .describe(`${only({ kinds: "POOL_SHORT" })}: the demand (itemDemand.get)`),
  needed: z
    .number()
    .int()
    .nullable()
    .describe(`${only({ kinds: "POOL_SHORT" })}: units the demand needs`),
  free: z
    .number()
    .int()
    .nullable()
    .describe(`${only({ kinds: "POOL_SHORT" })}: free units in its windows`),
  hoursKind: z
    .enum(["OUTSIDE_ITEM_HOURS", "OUTSIDE_VENUE_HOURS"])
    .nullable()
    .describe(`${only({ kinds: "OUTSIDE_HOURS" })}: whose hours (as the line warnings, ADR 0064)`),
  hoursOwnerId: z
    .string()
    .nullable()
    .describe(`${only({ kinds: "OUTSIDE_HOURS" })}: the item or venue whose hours apply`),
});

export type PlanLineIssue = z.infer<typeof PlanLineIssueSchema>;

const EMPTY = {
  ...{ orderReference: null, orderTitle: null, startsAt: null, endsAt: null },
  refusesCreate: null,
  ...{ otherLineIndex: null, capacity: null, demandId: null, needed: null, free: null },
  ...{ hoursKind: null, hoursOwnerId: null },
} as const;

export type LineIssueInput = Pick<PlanLineIssue, "kind" | "message"> &
  Partial<Omit<PlanLineIssue, "kind" | "message">>;

/** An issue with every field of the other kinds null. */
export const lineIssue = ({ kind, message, ...rest }: LineIssueInput): PlanLineIssue => ({
  ...EMPTY,
  ...rest,
  kind,
  message,
});

/** What a whole package's (or draft's) issue says. */
export const PlanIssueKindSchema = z.enum(["GUESTS_OUTSIDE_RANGE", "PAST_REQUESTED_END"]);

export const PlanIssueSchema = z.object({
  kind: PlanIssueKindSchema.describe(
    "GUESTS_OUTSIDE_RANGE: the headcount is outside the package's guest range. " +
      "PAST_REQUESTED_END: a line ends after the requested end",
  ),
  message: z.string().describe("A short English explanation"),
  minGuests: z.number().int().nullable().describe("GUESTS_OUTSIDE_RANGE: the package's minimum"),
  maxGuests: z.number().int().nullable().describe("GUESTS_OUTSIDE_RANGE: the package's maximum"),
  endsAt: z.date().nullable().describe("PAST_REQUESTED_END: when the last line ends"),
});

export type PlanIssue = z.infer<typeof PlanIssueSchema>;

/** How step 3 groups a package (ADR 0081 decision 5). */
export const PlanGroupSchema = z.enum(["AVAILABLE", "CLASHES", "OUTSIDE_RANGE"]);
export type PlanGroup = z.infer<typeof PlanGroupSchema>;
