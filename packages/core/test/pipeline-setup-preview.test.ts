import { describe, expect, it } from "vitest";
import { execute, previewPipelineSetup } from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { estateDraft, roomType } from "./pipeline-setup-helpers";

const codes = ({ rows }: { rows: readonly { code: string }[] }) => rows.map((row) => row.code);

describe("pipelineSetup.preview (ADR 0044)", () => {
  it("steps a simulated ticket through every status without writing", async () => {
    const context = testContext();
    const room = await roomType({ context });
    const input = estateDraft({ roomTypeId: room.id });
    const preview = unwrap({
      result: await execute({ operation: previewPipelineSetup, input, context }),
    });
    expect(preview.ready).toBe(true);
    expect(preview.problems).toEqual([]);
    const at = ({ ticketStatus }: { ticketStatus: string }) =>
      preview.steps
        .find((step) => step.ticketStatus === ticketStatus)
        ?.lines.map((line) => line.state);
    expect(preview.steps.map((step) => step.ticketStatus)).toEqual([
      "New",
      "Site visit",
      "Quote sent",
      "Confirmed",
      "Final count locked",
      "Completed",
      "Lost",
      "Cancelled",
    ]);
    expect(at({ ticketStatus: "New" })).toEqual(["Prebooked", "Estimated"]);
    expect(at({ ticketStatus: "Confirmed" })).toEqual(["Booked", "Ordered"]);
    expect(at({ ticketStatus: "Final count locked" })).toEqual(["Booked", "Locked"]);
    expect(at({ ticketStatus: "Lost" })).toEqual(["Released", "Released"]);
    const holds = preview.steps.map((step) => step.lines[0]?.hold);
    expect(holds.slice(0, 5)).toEqual(["SOFT", "SOFT", "SOFT", "HARD", "HARD"]);
    expect(await context.db.ticketStatus.count()).toBe(0);
  });

  it("lists the configuration problems", async () => {
    const context = testContext();
    const draft = estateDraft();
    const [room, dish] = draft.itemTypes;
    if (!room || !dish) throw new Error("draft");
    const input = {
      ...draft,
      statuses: draft.statuses.map((ticketStatus) => ({
        ...ticketStatus,
        entry: false,
        closes: false,
      })),
      itemTypes: [
        { ...room, states: room.states.map((state) => ({ ...state, initial: false })) },
        { ...dish, states: dish.states.filter((state) => !state.released) },
      ],
      cells: [...draft.cells, { ticketStatus: "New", type: "Boat", state: "Afloat" }],
    };
    const preview = unwrap({
      result: await execute({ operation: previewPipelineSetup, input, context }),
    });
    expect(preview.ready).toBe(false);
    expect(codes({ rows: preview.problems })).toEqual(
      expect.arrayContaining([
        "NO_ENTRY_STATUS",
        "NO_CLOSING_STATUS",
        "NO_INITIAL_STATE",
        "STATE_CANNOT_LEAVE",
        "UNKNOWN_CELL",
      ]),
    );
    const stuck = preview.problems.find((row) => row.code === "STATE_CANNOT_LEAVE");
    expect(stuck).toMatchObject({ severity: "warning", type: "Dish", state: "Locked" });
  });

  it("reports a grid cell that moves a line backwards as a blocked line", async () => {
    const context = testContext();
    const draft = estateDraft();
    const cells = [
      ...draft.cells,
      { ticketStatus: "Final count locked", type: "Room", state: "Prebooked" },
    ];
    const preview = unwrap({
      result: await execute({
        operation: previewPipelineSetup,
        input: { ...draft, cells },
        context,
      }),
    });
    expect(preview.problems).toEqual([
      expect.objectContaining({
        code: "LINE_BLOCKED",
        ticketStatus: "Final count locked",
        type: "Room",
      }),
    ]);
    const step = preview.steps.find((row) => row.ticketStatus === "Final count locked");
    expect(step?.lines[0]).toMatchObject({ state: "Booked", blocked: expect.any(String) });
  });

  it("refuses another organization's item type and a caller without configuration:read", async () => {
    const owner = testContext();
    const room = await roomType({ context: owner });
    const input = estateDraft({ roomTypeId: room.id });
    const other = testContext();
    const foreign = await execute({ operation: previewPipelineSetup, input, context: other });
    expect(errorCode({ result: foreign })).toBe("NOT_FOUND");
    const blind = { ...owner, permissions: { ...owner.permissions, configuration: [] } };
    const refused = await execute({ operation: previewPipelineSetup, input, context: blind });
    expect(errorCode({ result: refused })).toBe("VALIDATION");
  });
});
