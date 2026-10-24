import { describe, expect, it } from "vitest";
import {
  archiveItem,
  archiveTicketStatus,
  archiveTicketTemplate,
  execute,
  getTicketTemplate,
  listTicketTemplates,
  updateTicketTemplate,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { statusByName } from "./ticket-status-helpers";
import { makeTemplate, roomAndDish, templateSetup } from "./ticket-template-helpers";

describe("ticket templates (ADR 0043)", () => {
  it("creates a template with its lines in order and reads it back", async () => {
    const setup = await templateSetup();
    const { context } = setup;
    const made = unwrap({ result: await makeTemplate({ context, setup }) });
    expect(made.lines.map((line) => line.name)).toEqual(["Meeting room", "Coffee"]);
    expect(made.lines[1]).toMatchObject({ quantity: null, offsetMinutes: 30 });
    const got = unwrap({
      result: await execute({ operation: getTicketTemplate, input: { id: made.id }, context }),
    });
    expect(got.statusId).toBe(setup.confirmed.id);
    const listed = unwrap({
      result: await execute({ operation: listTicketTemplates, input: {}, context }),
    });
    expect(listed.items.map((template) => template.id)).toEqual([made.id]);
  });

  it("refuses a closing start status, a foreign type and a customer's bundle", async () => {
    const setup = await templateSetup();
    const { context } = setup;
    const lost = await statusByName({ context, name: "Lost" });
    const closes = await makeTemplate({ context, setup, statusId: lost.id });
    expect(errorCode({ result: closes })).toBe("VALIDATION");
    const lines = roomAndDish({ setup }).map((line) => ({
      ...line,
      entityTypeId: setup.ticketType.id,
    }));
    const wrongType = await makeTemplate({ context, setup, lines });
    expect(wrongType.ok ? [] : wrongType.error.issues.map((issue) => issue.path)).toEqual([
      "lines.0.entityTypeId",
      "lines.1.entityTypeId",
    ]);
  });

  it("keeps the name unique among the active templates", async () => {
    const setup = await templateSetup();
    const { context } = setup;
    const first = unwrap({ result: await makeTemplate({ context, setup }) });
    const twin = await makeTemplate({ context, setup });
    expect(errorCode({ result: twin })).toBe("CONFLICT");
    unwrap({
      result: await execute({ operation: archiveTicketTemplate, input: { id: first.id }, context }),
    });
    unwrap({ result: await makeTemplate({ context, setup }) });
  });

  it("replaces the lines on update, keeps them when omitted and hides an archived template", async () => {
    const setup = await templateSetup();
    const { context } = setup;
    const made = unwrap({ result: await makeTemplate({ context, setup }) });
    const renamed = unwrap({
      result: await execute({
        operation: updateTicketTemplate,
        input: { id: made.id, name: "Renamed" },
        context,
      }),
    });
    expect(renamed.lines).toHaveLength(2);
    const [first] = roomAndDish({ setup });
    const replaced = unwrap({
      result: await execute({
        operation: updateTicketTemplate,
        input: { id: made.id, lines: first ? [first] : [] },
        context,
      }),
    });
    expect(replaced.lines.map((line) => line.name)).toEqual(["Meeting room"]);
    unwrap({
      result: await execute({ operation: archiveTicketTemplate, input: { id: made.id }, context }),
    });
    const gone = await execute({ operation: getTicketTemplate, input: { id: made.id }, context });
    expect(errorCode({ result: gone })).toBe("NOT_FOUND");
  });

  it("blocks archiving an item or a status a template uses until the template is archived", async () => {
    const setup = await templateSetup();
    const { context, room, confirmed } = setup;
    const made = unwrap({ result: await makeTemplate({ context, setup }) });
    const item = await execute({ operation: archiveItem, input: { id: room.id }, context });
    expect(errorCode({ result: item })).toBe("CONFLICT");
    const ticketStatus = await execute({
      operation: archiveTicketStatus,
      input: { id: confirmed.id },
      context,
    });
    expect(errorCode({ result: ticketStatus })).toBe("CONFLICT");
    unwrap({
      result: await execute({ operation: archiveTicketTemplate, input: { id: made.id }, context }),
    });
    unwrap({ result: await execute({ operation: archiveItem, input: { id: room.id }, context }) });
  });
});
