import type { ChangePreview } from "@bibi/core/schemas";
import { describe, expect, it } from "vitest";
import { applyEdits, editKind } from "./approval-edits";

const field = ({ path, after }: { path: string; after: unknown }) => ({
  path,
  before: null,
  after,
});

type PreviewInput = { fields?: ReturnType<typeof field>[]; names?: Record<string, string> };

const preview = ({ fields = [], names = {} }: PreviewInput = {}): ChangePreview =>
  ({
    group: "setup",
    changes: [{ entityType: "venue", entityId: "v1", kind: "create", name: "Hall", fields }],
    consequences: [],
    names,
  }) as unknown as ChangePreview;

describe("editKind", () => {
  it("edits plain top-level values by their type", () => {
    const p = preview();
    expect(editKind({ preview: p, field: field({ path: "name", after: "Hall" }) })).toBe("text");
    expect(
      editKind({ preview: p, field: field({ path: "defaultVatRatePercent", after: 25 }) }),
    ).toBe("number");
    expect(editKind({ preview: p, field: field({ path: "priceMinor", after: 1000 }) })).toBe(
      "money",
    );
    expect(editKind({ preview: p, field: field({ path: "required", after: true }) })).toBe(
      "boolean",
    );
  });

  it("leaves references, nested paths and looked-up names alone", () => {
    const p = preview({ names: { v2: "Other hall" } });
    expect(editKind({ preview: p, field: field({ path: "venueId", after: "v2" }) })).toBeNull();
    expect(editKind({ preview: p, field: field({ path: "parent", after: "v2" }) })).toBeNull();
    expect(
      editKind({ preview: p, field: field({ path: "fields.0.name", after: "x" }) }),
    ).toBeNull();
    expect(editKind({ preview: p, field: field({ path: "layouts", after: ["a"] }) })).toBeNull();
  });
});

describe("applyEdits", () => {
  it("shows the edited value as the new value", () => {
    const p = applyEdits({
      preview: preview({ fields: [field({ path: "name", after: "Hall" })] }),
      edits: { name: "Main" },
    });
    expect(p.changes[0]?.fields[0]?.after).toBe("Main");
  });
});
