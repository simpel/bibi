import { describe, expect, it } from "vitest";
import { cleanTitle } from "./clean-title";

describe("cleanTitle", () => {
  it("keeps titles without separators", () => {
    expect(cleanTitle({ title: "Board meeting" })).toBe("Board meeting");
    expect(cleanTitle({ title: "Västra Sjukvårdsregionen training day" })).toBe(
      "Västra Sjukvårdsregionen training day",
    );
  });

  it("strips place and ref suffixes matching resource", () => {
    expect(
      cleanTitle({
        title: "Board meeting · Vinga (auditorium) (G28)",
        resource: "Vinga (auditorium)",
      }),
    ).toBe("Board meeting");
  });

  it("strips place suffix matching resource with parenthesized details", () => {
    expect(
      cleanTitle({
        title: "Board meeting · Vinga (auditorium)",
        resource: "Vinga (auditorium) (Conference room)",
      }),
    ).toBe("Board meeting");
  });

  it("strips place suffix even when resource is not provided if ref pattern matches", () => {
    expect(cleanTitle({ title: "Training day · Asperö (G38)" })).toBe("Training day");
    expect(cleanTitle({ title: "Management team · Donsö (G9)" })).toBe("Management team");
  });

  it("strips place suffix when resource matches", () => {
    expect(cleanTitle({ title: "Training day · Asperö", resource: "Asperö" })).toBe("Training day");
  });
});
