import { describe, expect, it } from "vitest";
import { parseLines, vocabularyFormSchema } from "./vocabulary-form-schema";

describe("vocabulary form schema", () => {
  it("splits values per line and drops blanks", () => {
    expect(parseLines({ text: " Gluten\n\nMjölk \n" })).toEqual(["Gluten", "Mjölk"]);
    expect(parseLines({ text: "  " })).toBeUndefined();
  });

  it("validates with core's list schema", () => {
    expect(vocabularyFormSchema.safeParse({ name: "", values: "" }).success).toBe(false);
    const ok = vocabularyFormSchema.safeParse({ name: "Allergener", values: "Gluten" });
    expect(ok.success).toBe(true);
  });
});
