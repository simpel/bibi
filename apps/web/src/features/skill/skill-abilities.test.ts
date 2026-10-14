import { describe, expect, it } from "vitest";
import { skillAbilities } from "./skill-abilities";

describe("skillAbilities", () => {
  it("makes system skills read-only", () => {
    const none = { edit: false, publish: false, archive: false, share: false };
    expect(
      skillAbilities({ skill: { scope: "SYSTEM", status: "PUBLISHED" }, admin: true }),
    ).toEqual(none);
  });

  it("lets owners manage personal drafts, but only admins share them", () => {
    const skill = { scope: "PERSONAL", status: "DRAFT" } as const;
    expect(skillAbilities({ skill, admin: false })).toEqual({
      edit: true,
      publish: true,
      archive: true,
      share: false,
    });
    expect(skillAbilities({ skill, admin: true }).share).toBe(true);
  });

  it("needs an admin for organization skills and stops at archived", () => {
    const skill = { scope: "ORGANIZATION", status: "PUBLISHED" } as const;
    expect(skillAbilities({ skill, admin: false }).edit).toBe(false);
    expect(skillAbilities({ skill, admin: true })).toMatchObject({ edit: true, publish: false });
    expect(skillAbilities({ skill: { ...skill, status: "ARCHIVED" }, admin: true }).edit).toBe(
      false,
    );
  });
});
