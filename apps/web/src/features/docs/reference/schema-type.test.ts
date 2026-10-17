import { describe, expect, it } from "vitest";
import { isNullable, objectProperties, schemaType } from "./schema-type";

describe("schemaType", () => {
  it("labels formats, arrays, refs and nullable unions", () => {
    expect(schemaType({ schema: { type: "string", format: "date-time" } })).toBe(
      "string (date-time)",
    );
    expect(schemaType({ schema: { type: "array", items: { type: "integer" } } })).toBe("integer[]");
    expect(schemaType({ schema: { $ref: "#/components/schemas/ErrorBody" } })).toBe("ErrorBody");
    expect(schemaType({ schema: { anyOf: [{ type: "string" }, { type: "null" }] } })).toBe(
      "string",
    );
  });
});

describe("isNullable", () => {
  it("detects null branches and type lists", () => {
    expect(isNullable({ schema: { anyOf: [{ type: "string" }, { type: "null" }] } })).toBe(true);
    expect(isNullable({ schema: { type: ["string", "null"] } })).toBe(true);
    expect(isNullable({ schema: { type: "string" } })).toBe(false);
  });
});

describe("objectProperties", () => {
  it("lists fields with required flags, looking through arrays", () => {
    const schema = {
      type: "array",
      items: { type: "object", required: ["id"], properties: { id: {}, name: {} } },
    };
    expect(objectProperties({ schema })).toEqual([
      { name: "id", schema: {}, required: true },
      { name: "name", schema: {}, required: false },
    ]);
  });

  it("returns undefined for scalars", () => {
    expect(objectProperties({ schema: { type: "string" } })).toBeUndefined();
  });
});
