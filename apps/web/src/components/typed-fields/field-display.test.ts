import type { FieldDefinitionDto, VocabularyDto } from "@bibi/core";
import { describe, expect, it } from "vitest";
import { displayValue } from "./field-display";

const yesNo = { yes: "Ja", no: "Nej" };
const field = ({ patch }: { patch: Partial<FieldDefinitionDto> }) =>
  ({ kind: "TEXT", vocabularyId: null, options: [], ...patch }) as FieldDefinitionDto;
const vocabularies = [
  {
    id: "v1",
    values: [
      { id: "a", name: "Gluten" },
      { id: "b", name: "Milk" },
    ],
  },
] as VocabularyDto[];

describe("displayValue", () => {
  it("shows list value names for list-backed choices", () => {
    const multi = field({ patch: { kind: "MULTI_CHOICE", vocabularyId: "v1" } });
    expect(displayValue({ field: multi, value: ["a", "b"], vocabularies, yesNo })).toBe(
      "Gluten, Milk",
    );
  });

  it("shows yes/no, text and a dash for missing values", () => {
    const bool = field({ patch: { kind: "BOOLEAN" } });
    expect(displayValue({ field: bool, value: true, vocabularies, yesNo })).toBe("Ja");
    expect(displayValue({ field: field({ patch: {} }), value: "x", vocabularies, yesNo })).toBe(
      "x",
    );
    expect(
      displayValue({ field: field({ patch: {} }), value: undefined, vocabularies, yesNo }),
    ).toBe("–");
  });
});
