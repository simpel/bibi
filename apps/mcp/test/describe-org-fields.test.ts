import type { EntityTypeDto, FieldDefinitionDto, VocabularyDto } from "@okazi/core";
import { describe, expect, it } from "vitest";
import { describeOrgFields } from "../src/tools/describe-org-fields";

const now = new Date();
const field = ({ ...over }: Partial<FieldDefinitionDto>): FieldDefinitionDto => ({
  id: "f1",
  organizationId: "o",
  entityTypeId: "t1",
  key: "k",
  name: "K",
  kind: "TEXT",
  required: false,
  vocabularyId: null,
  options: [],
  position: 0,
  status: "ACTIVE",
  createdAt: now,
  updatedAt: now,
  createdBy: null,
  ...over,
});
const type = ({ ...over }: Partial<EntityTypeDto>): EntityTypeDto => ({
  id: "t1",
  organizationId: "o",
  base: "ITEM",
  name: "Konferensrum",
  behaviours: ["BOOKABLE"],
  fields: [],
  status: "ACTIVE",
  createdAt: now,
  updatedAt: now,
  createdBy: null,
  ...over,
});
const vocabulary: VocabularyDto = {
  id: "v1",
  organizationId: "o",
  name: "Utsikt",
  values: [
    { id: "val1", vocabularyId: "v1", name: "Älven", position: 0 },
    { id: "val2", vocabularyId: "v1", name: "Innergården", position: 1 },
  ],
  status: "ACTIVE",
  createdAt: now,
  updatedAt: now,
  createdBy: null,
};

describe("describeOrgFields", () => {
  it("is empty without item types", () => {
    expect(describeOrgFields({ types: [], vocabularies: [] })).toBe("");
  });

  it("lists types, behaviours, fields, list values and inline options", () => {
    const out = describeOrgFields({
      vocabularies: [vocabulary],
      types: [
        type({
          fields: [
            field({ key: "vaning", name: "Våning", kind: "NUMBER", required: true }),
            field({ key: "utsikt", name: "Utsikt", kind: "CHOICE", vocabularyId: "v1" }),
            field({ key: "typ", name: "Typ", kind: "CHOICE", options: ["A", "B"] }),
          ],
        }),
      ],
    });
    expect(out).toContain("Konferensrum (entityTypeId=t1) [BOOKABLE]");
    expect(out).toContain("vaning (Våning, NUMBER, required)");
    expect(out).toContain("utsikt (Utsikt, CHOICE: Älven=val1, Innergården=val2)");
    expect(out).toContain("typ (Typ, CHOICE: A, B)");
  });

  it("truncates with a pointer to entityType_list", () => {
    const types = Array.from({ length: 200 }, (_, i) => type({ id: `t${i}`, name: `Typ ${i}` }));
    const out = describeOrgFields({ types, vocabularies: [], maxChars: 1000 });
    expect(out.length).toBeLessThanOrEqual(1000);
    expect(out).toContain("(truncated, use entityType_list)");
  });
});
