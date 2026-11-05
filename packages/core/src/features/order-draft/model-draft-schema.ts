import { z } from "zod";

/**
 * What the model returns (ADR 0084): text only, never ids. Every key is required and absent
 * values are null, so the schema also works with strict structured output. Core parses the
 * model's answer with it again; output that does not fit is `UNAVAILABLE`.
 */
const Evidence = {
  quote: z.string().max(2000).describe("Copied exactly from the message; empty if nothing says it"),
  guessed: z.boolean().describe("True when you inferred the value instead of reading it"),
};

const text = ({ max }: { max: number }) =>
  z.object({ value: z.string().max(max), ...Evidence }).nullable();

const Time = z
  .object({
    asWritten: z.string().max(200),
    time: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .describe("24-hour local time, HH:mm"),
    ...Evidence,
  })
  .nullable();

export const ModelDraftSchema = z.object({
  senderName: text({ max: 200 }),
  company: text({ max: 200 }),
  email: text({ max: 320 }),
  phone: text({ max: 50 }),
  date: z
    .object({
      asWritten: z.string().max(200),
      year: z.number().int().min(2000).max(2100).nullable().describe("Null when not written"),
      month: z.number().int().min(1).max(12),
      day: z.number().int().min(1).max(31),
      ...Evidence,
    })
    .nullable(),
  start: Time,
  end: Time,
  headcount: z.object({ value: z.number().int().min(1).max(100_000), ...Evidence }).nullable(),
  wish: text({ max: 2000 }),
  packageName: text({ max: 200 }).describe("Only a name from the given package list"),
  needs: z
    .array(
      z.object({
        value: z.string().max(200).describe("Only a value name from the given lists"),
        count: z.number().int().min(1).max(100_000),
        ...Evidence,
      }),
    )
    .max(50),
  notes: text({ max: 4000 }),
});

export type ModelDraft = z.infer<typeof ModelDraftSchema>;
export type ModelText = NonNullable<ModelDraft["company"]>;
export type ModelTime = NonNullable<ModelDraft["start"]>;
