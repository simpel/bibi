import { describe, expect, it } from "vitest";
import { buildPageContext } from "./page-context";

describe("buildPageContext", () => {
  it("adds the venue entity on a venue detail page", () => {
    expect(buildPageContext({ pathname: "/sv/acme/venues/abc%20d", locale: "sv" })).toEqual({
      route: "/sv/acme/venues/abc%20d",
      locale: "sv",
      entity: { type: "venue", id: "abc d" },
    });
  });

  it("adds the skill entity but not for the create page", () => {
    expect(buildPageContext({ pathname: "/en/acme/skills/s1", locale: "en" }).entity).toEqual({
      type: "skill",
      id: "s1",
    });
    expect(
      buildPageContext({ pathname: "/en/acme/new/skill", locale: "en" }).entity,
    ).toBeUndefined();
  });

  it("has no entity on list pages", () => {
    expect(buildPageContext({ pathname: "/sv/acme/venues", locale: "sv" })).toEqual({
      route: "/sv/acme/venues",
      locale: "sv",
    });
  });
});
