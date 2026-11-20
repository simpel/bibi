import type { ChangePreview } from "@bibi/core/schemas";
import { describe, expect, it } from "vitest";
import { createdRecord } from "./created-record";

type PreviewInput = { entityType: string; kind: "create" | "update" };

const preview = ({ entityType, kind }: PreviewInput): ChangePreview =>
  ({
    group: "setup",
    changes: [{ entityType, entityId: "rolled-back", kind, name: "Test Hall", fields: [] }],
    consequences: [],
    names: {},
  }) as unknown as ChangePreview;

describe("createdRecord", () => {
  it("links a new record by the id in the result, not the preview's", () => {
    const record = createdRecord({
      preview: preview({ entityType: "venue", kind: "create" }),
      result: { id: "v_real", name: "Test Hall" },
    });
    expect(record).toEqual({ name: "Test Hall", href: "/venues/v_real", created: true });
  });

  it("has no link for an update or a type without a page", () => {
    const update = createdRecord({
      preview: preview({ entityType: "venue", kind: "update" }),
      result: { id: "v1" },
    });
    expect(update).toMatchObject({ created: false, href: null });
    const other = createdRecord({
      preview: preview({ entityType: "orderStatus", kind: "create" }),
      result: { id: "s1" },
    });
    expect(other).toMatchObject({ created: true, href: null });
  });
});
