import { getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import { ALL_RECORDS, effectiveScopes, resolveSubjectsAccess } from "../src/index";
import { testContext } from "./helpers";

const related = [{ root: "order", scope: "related" }];

describe("record scopes (ADR 0113)", () => {
  it("are every record by default, and related only when a valid override says so", () => {
    expect(effectiveScopes({ subjectKind: "member", preset: "member", overrides: [] })).toEqual(
      ALL_RECORDS,
    );
    expect(
      effectiveScopes({ subjectKind: "member", preset: "manager", overrides: related }),
    ).toEqual({ order: "related" });
    const unknown = [
      { root: "venue", scope: "related" },
      { root: "order", scope: "some" },
    ];
    expect(
      effectiveScopes({ subjectKind: "member", preset: "member", overrides: unknown }),
    ).toEqual(ALL_RECORDS);
  });

  it("never limit an admin or an API key, so a stale row grants no false sense of privacy", () => {
    expect(effectiveScopes({ subjectKind: "member", preset: "admin", overrides: related })).toEqual(
      ALL_RECORDS,
    );
    expect(
      effectiveScopes({ subjectKind: "apiKey", preset: "member", overrides: related }),
    ).toEqual(ALL_RECORDS);
  });

  it("resolve permissions and scopes per subject from active rows of the organization", async () => {
    const context = testContext();
    const { organizationId } = context;
    const row = { organizationId, subjectType: "MEMBER" as const, createdBy: "test" };
    await getDb().recordScopeOverride.createMany({
      data: [
        { ...row, subjectId: "member-a", root: "order", scope: "RELATED" },
        { ...row, subjectId: "member-b", root: "order", scope: "RELATED", status: "ARCHIVED" },
      ],
    });
    await getDb().permissionOverride.create({
      data: { ...row, subjectId: "member-a", feature: "item", action: "write", effect: "ALLOW" },
    });
    const access = await resolveSubjectsAccess({
      db: context.db,
      organizationId,
      subjectKind: "member",
      subjects: [
        { id: "member-a", preset: "member" },
        { id: "member-b", preset: "member" },
      ],
    });
    expect(access.get("member-a")?.scopes).toEqual({ order: "related" });
    expect(access.get("member-a")?.permissions.item).toEqual(["read", "write"]);
    expect(access.get("member-b")?.scopes).toEqual(ALL_RECORDS);
    const other = await resolveSubjectsAccess({
      ...{ db: getDb(), organizationId: testContext().organizationId, subjectKind: "member" },
      subjects: [{ id: "member-a", preset: "member" }],
    });
    expect(other.get("member-a")?.scopes).toEqual(ALL_RECORDS);
  });
});
