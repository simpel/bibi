import { numberOrNull } from "@/lib/blank";

/** Raw values of the setup and teardown minutes fields (ADR 0059): "" = inherit. */
export type BufferFormValues = { setupMinutes: string; teardownMinutes: string };

const text = ({ value }: { value: number | null | undefined }) =>
  value === null || value === undefined ? "" : String(value);

export type BufferDefaultsInput = {
  stored?: { setupMinutes: number | null; teardownMinutes: number | null } | undefined;
};

/** A record's own minutes as raw form values; empty when it inherits. */
export const bufferFormDefaults = ({ stored }: BufferDefaultsInput): BufferFormValues => ({
  setupMinutes: text({ value: stored?.setupMinutes }),
  teardownMinutes: text({ value: stored?.teardownMinutes }),
});

export type BufferToInputInput = { values: BufferFormValues };

/** Raw minutes → core's input: empty = null (inherit), NaN is kept so validation rejects it. */
export const bufferFormToInput = ({ values }: BufferToInputInput) => ({
  setupMinutes: numberOrNull({ value: values.setupMinutes }),
  teardownMinutes: numberOrNull({ value: values.teardownMinutes }),
});
