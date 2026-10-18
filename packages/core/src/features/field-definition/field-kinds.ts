import { z } from "zod";

/** The value kinds a field can hold (ADR 0021). Code knows kinds, never field names. */
export const FIELD_KINDS = [
  "TEXT",
  "NUMBER",
  "BOOLEAN",
  "DATE",
  "CHOICE",
  "MULTI_CHOICE",
  "LINK",
] as const;
export type FieldKind = (typeof FIELD_KINDS)[number];

export const FieldKindSchema = z
  .enum(FIELD_KINDS)
  .describe(
    "TEXT, NUMBER, BOOLEAN (yes/no), DATE (YYYY-MM-DD), CHOICE (one value), " +
      "MULTI_CHOICE (several values) or LINK (the id of one record of another type). Choice " +
      "kinds take a list (vocabularyId) or inline options; LINK takes the target type (linkTypeId).",
  );

export type IsChoiceKindInput = { kind: FieldKind };

export const isChoiceKind = ({ kind }: IsChoiceKindInput) =>
  kind === "CHOICE" || kind === "MULTI_CHOICE";

/** Bases whose types have records a LINK field can point to. */
export const LINKABLE_BASES = ["ITEM", "CUSTOMER", "CONTACT", "TICKET"] as const;
export type LinkableBase = (typeof LINKABLE_BASES)[number];

export type IsLinkableBaseInput = { base: string };

export const isLinkableBase = ({ base }: IsLinkableBaseInput): boolean =>
  (LINKABLE_BASES as readonly string[]).includes(base);
