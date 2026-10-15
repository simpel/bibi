import { z } from "zod";

/** Max keys in `fields`: well above any type's field count, low enough to bound the input. */
export const MAX_FIELD_VALUES = 200;

/**
 * Field values as stored on any typed record (item, customer, contact): keys are the type's
 * field keys (ADR 0021).
 */
export const FieldValuesSchema = z
  .record(z.string().max(40), z.unknown())
  .refine((values) => Object.keys(values).length <= MAX_FIELD_VALUES, {
    message: `At most ${MAX_FIELD_VALUES} field values`,
  });
