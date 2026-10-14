import { z } from "zod";

/** The value kinds a field can hold (ADR 0021). Code knows kinds, never field names. */
export const FIELD_KINDS = ["TEXT", "NUMBER", "BOOLEAN", "DATE", "CHOICE", "MULTI_CHOICE"] as const;
export type FieldKind = (typeof FIELD_KINDS)[number];

export const FieldKindSchema = z
  .enum(FIELD_KINDS)
  .describe(
    "TEXT, NUMBER, BOOLEAN (yes/no), DATE (YYYY-MM-DD), CHOICE (one value) or " +
      "MULTI_CHOICE (several values). Choice kinds take a list (vocabularyId) or inline options.",
  );

export type IsChoiceKindInput = { kind: FieldKind };

export const isChoiceKind = ({ kind }: IsChoiceKindInput) =>
  kind === "CHOICE" || kind === "MULTI_CHOICE";
