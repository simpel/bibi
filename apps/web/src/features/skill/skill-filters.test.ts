import { describe, expect, it } from "vitest";
import { parseSkillFilters, skillFilterQuery } from "./skill-filters";

describe("skill filters", () => {
  it("parses known values and ignores unknown ones", () => {
    const filters = parseSkillFilters({
      params: { scope: "PERSONAL", status: "NOPE", q: [" offert ", "x"], semantic: "1" },
    });
    expect(filters).toEqual({
      scope: "PERSONAL",
      status: undefined,
      q: "offert",
      semantic: true,
      cursor: undefined,
    });
  });

  it("round-trips to query parameters without empty values", () => {
    const filters = parseSkillFilters({ params: { scope: "SYSTEM", q: "a" } });
    expect(skillFilterQuery({ filters })).toEqual({ scope: "SYSTEM", q: "a" });
  });
});
