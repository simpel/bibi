import { z } from "zod";

/** At most a day of setup or teardown around one booking. */
const MAX_BUFFER_MINUTES = 24 * 60;

export type BufferMinutesInputShapeInput = { inherits: string };

/**
 * The owned `setupMinutes` and `teardownMinutes` of a type, item or line as command input
 * (ADR 0059): null = inherit, `inherits` says from where.
 */
export const bufferMinutesInputShape = ({ inherits }: BufferMinutesInputShapeInput) => ({
  setupMinutes: z
    .number()
    .int()
    .min(0)
    .max(MAX_BUFFER_MINUTES)
    .nullish()
    .describe(`Setup buffer before a booking, in minutes; null = ${inherits}`),
  teardownMinutes: z
    .number()
    .int()
    .min(0)
    .max(MAX_BUFFER_MINUTES)
    .nullish()
    .describe(`Teardown buffer after a booking, in minutes; null = ${inherits}`),
});

/** The stored buffer minutes of a type, item or line; null = inherit. */
export const BufferMinutesShape = {
  setupMinutes: z.number().int().nullable(),
  teardownMinutes: z.number().int().nullable(),
};

/**
 * Where an effective buffer comes from (ADR 0059): the line's own, the item's, the item type's,
 * or (setup only) the setup's changeover time when that is larger.
 */
export const BufferSourceSchema = z.enum(["LINE", "ITEM", "TYPE", "SETUP"]);
export type BufferSource = z.infer<typeof BufferSourceSchema>;

const inherited = "Any source other than the record's own is inherited; null = no buffer";

/** The derived buffers of an item or a line, with their sources. Never stored. */
export const EffectiveBuffersShape = {
  effectiveSetupMinutes: z
    .number()
    .int()
    .describe("Setup in effect, minutes: line → item → type, at least the setup's changeover"),
  setupMinutesSource: BufferSourceSchema.nullable().describe(inherited),
  effectiveTeardownMinutes: z
    .number()
    .int()
    .describe("Teardown in effect, minutes: line → item → type"),
  teardownMinutesSource: BufferSourceSchema.nullable().describe(inherited),
};

export type EffectiveBuffers = {
  [K in keyof typeof EffectiveBuffersShape]: z.infer<(typeof EffectiveBuffersShape)[K]>;
};

type Minutes = { setupMinutes: number | null; teardownMinutes: number | null };

export type EffectiveBuffersInput = {
  line?: Minutes | null;
  item: Minutes | null;
  type: Minutes | null;
  /** The changeover time of the line's setup, if any. */
  changeoverMinutes?: number | null;
};

type Sourced = { value: number; source: BufferSource | null };

const firstSet = ({ levels }: { levels: readonly [BufferSource, number | null | undefined][] }) => {
  const found = levels.find(([, value]) => value !== null && value !== undefined);
  return found ? { value: found[1] ?? 0, source: found[0] } : { value: 0, source: null };
};

/**
 * ADR 0059: each buffer is the line's, else the item's, else the type's. The setup is the larger
 * of that and the setup's changeover time, never the sum (a tie keeps the inherited source).
 * The database trigger `sync_line_occupancy` applies the same rule to holds.
 */
export function effectiveBuffers({
  line,
  item,
  type,
  changeoverMinutes,
}: EffectiveBuffersInput): EffectiveBuffers {
  const pick = ({ key }: { key: keyof Minutes }) =>
    firstSet({
      levels: [
        ["LINE", line?.[key]],
        ["ITEM", item?.[key]],
        ["TYPE", type?.[key]],
      ],
    });
  const inheritedSetup = pick({ key: "setupMinutes" });
  const changeover = changeoverMinutes ?? 0;
  const setup: Sourced =
    changeover > inheritedSetup.value ? { value: changeover, source: "SETUP" } : inheritedSetup;
  const teardown = pick({ key: "teardownMinutes" });
  return {
    ...{ effectiveSetupMinutes: setup.value, setupMinutesSource: setup.source },
    ...{ effectiveTeardownMinutes: teardown.value, teardownMinutesSource: teardown.source },
  };
}
