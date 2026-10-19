import { describe, expect, it } from "vitest";
import { execute, previewArchiveItemState } from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { createRoomType } from "./item-helpers";
import { roomStates } from "./item-state-helpers";

describe("itemState.archivePreview (ADR 0044)", () => {
  it("reports what archiving would do and changes nothing", async () => {
    const context = testContext();
    const room = await createRoomType({ context });
    const { prebooked, booked, released } = await roomStates({ context, entityTypeId: room.id });
    const preview = ({ ...input }: { id: string; targetStateId?: string }) =>
      execute({ operation: previewArchiveItemState, input, context });
    const initial = unwrap({ result: await preview({ id: prebooked.id }) });
    expect(initial).toMatchObject({ archivable: false, targetRequired: false });
    expect(initial.blockers).toHaveLength(1);
    const ready = unwrap({ result: await preview({ id: released.id, targetStateId: booked.id }) });
    expect(ready).toMatchObject({ archivable: true, blockers: [], moving: 0 });
    const kept = await context.db.itemState.findFirstOrThrow({ where: { id: released.id } });
    expect(kept.status).toBe("ACTIVE");
    const type = await context.db.entityType.findFirstOrThrow({ where: { id: room.id } });
    expect(type.expiryStateId).toBe(released.id);
    const missing = await preview({ id: "unknown" });
    expect(errorCode({ result: missing })).toBe("NOT_FOUND");
  });
});
