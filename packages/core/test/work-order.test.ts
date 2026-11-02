import { describe, expect, it } from "vitest";
import {
  applyOverrides,
  execute,
  generateWorkOrder,
  getWorkOrder,
  listWorkOrders,
  sendWorkOrder,
  type WorkOrderDto,
} from "../src/index";
import { errorCode, peer, unwrap } from "./helpers";
import { moveToStatus } from "./ticket-helpers";
import { confirmTicket, setCount, workOrderSetup } from "./work-order-helpers";

type SetupResult = Awaited<ReturnType<typeof workOrderSetup>>;

const generate = ({ context, ticket, definition }: SetupResult) =>
  execute({
    operation: generateWorkOrder,
    input: { ticketId: ticket.id, workOrderDefinitionId: definition.id },
    context,
  });

type SendInput = { setup: SetupResult; workOrder: WorkOrderDto };
const send = ({ setup, workOrder }: SendInput) =>
  execute({ operation: sendWorkOrder, input: { id: workOrder.id }, context: setup.context });

describe("workOrder.generate (ADR 0021)", () => {
  it("snapshots the ticket, the included items with fields and the counts", async () => {
    const setup = await workOrderSetup();
    const workOrder = unwrap({ result: await generate(setup) });
    const { responsibilityId } = setup.definition;
    expect(workOrder).toMatchObject({
      version: 1,
      responsibilityId,
      baseVersion: null,
      sentAt: null,
    });
    expect(workOrder.changes).toEqual([]);
    const [head, item, count] = workOrder.content.rows;
    expect(head).toMatchObject({ kind: "TICKET", key: setup.ticket.id });
    expect(item).toMatchObject({
      kind: "ITEM",
      key: setup.held.id,
      itemName: "Älvsalen",
      values: { [setup.floor.key]: "Second" },
    });
    expect(count).toMatchObject({
      kind: "REQUIREMENT",
      label: "Gluten",
      quantity: 5,
      parentKey: null,
      values: { list: "Allergens" },
    });
    expect(workOrder.content.rows).toHaveLength(3);
  });

  it("returns the latest version while the ticket is unchanged", async () => {
    const setup = await workOrderSetup();
    const first = unwrap({ result: await generate(setup) });
    const again = unwrap({ result: await generate(setup) });
    expect(again.id).toBe(first.id);
    const list = unwrap({
      result: await execute({ operation: listWorkOrders, input: {}, context: setup.context }),
    });
    expect(list.items).toHaveLength(1);
  });

  it("marks the rows changed since the last SENT version with ★ data", async () => {
    const setup = await workOrderSetup();
    await confirmTicket({ context: setup.context, ticketId: setup.ticket.id });
    const first = unwrap({ result: await generate(setup) });
    unwrap({ result: await send({ setup, workOrder: first }) });
    unwrap({ result: await setCount({ ...setup, id: setup.count.id, quantity: 7 }) });
    const second = unwrap({ result: await generate(setup) });
    expect(second).toMatchObject({ version: 2, baseVersion: 1 });
    expect(second.changes).toEqual([
      {
        key: `ticket:${setup.gluten}`,
        kind: "REQUIREMENT",
        change: "CHANGED",
        label: "Gluten",
        changed: ["quantity"],
      },
    ]);
    unwrap({ result: await setCount({ ...setup, id: setup.count.id, quantity: 8 }) });
    const third = unwrap({ result: await generate(setup) });
    expect(third).toMatchObject({ version: 3, baseVersion: 1 });
    expect(third.changes.map((change) => change.changed)).toEqual([["quantity"]]);
  });

  it("refuses an unknown ticket or definition, and other organizations' ids", async () => {
    const setup = await workOrderSetup();
    const other = await workOrderSetup();
    const unknown = { ...setup, ticket: { ...setup.ticket, id: "nope" } };
    expect(errorCode({ result: await generate(unknown) })).toBe("NOT_FOUND");
    const foreign = { ...setup, definition: other.definition };
    expect(errorCode({ result: await generate(foreign) })).toBe("NOT_FOUND");
    const reader = peer({ of: setup.context, access: "read" });
    expect(errorCode({ result: await generate({ ...setup, context: reader }) })).toBe("FORBIDDEN");
  });

  it("needs view on the program it copies (ADR 0050)", async () => {
    const setup = await workOrderSetup();
    const overrides = [{ feature: "program", action: "read", effect: "deny" }];
    const permissions = applyOverrides({ preset: "admin", overrides });
    const result = await generate({ ...setup, context: { ...setup.context, permissions } });
    expect(result).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    expect(result.ok ? "" : result.error.message).toContain("missing program:read");
  });
});

describe("workOrder.send (ADR 0022)", () => {
  it("is sent once while the ticket is open and refused once it is closed", async () => {
    const setup = await workOrderSetup();
    const workOrder = unwrap({ result: await generate(setup) });
    const sent = unwrap({ result: await send({ setup, workOrder }) });
    expect(sent.sentAt).toBeInstanceOf(Date);
    expect(errorCode({ result: await send({ setup, workOrder }) })).toBe("CONFLICT");
    const closed = await workOrderSetup();
    const draft = unwrap({ result: await generate(closed) });
    const lost = { context: closed.context, ticketId: closed.ticket.id, name: "Lost" };
    unwrap({ result: await moveToStatus({ ...lost, reason: "Price" }) });
    expect(errorCode({ result: await send({ setup: closed, workOrder: draft }) })).toBe("CONFLICT");
  });

  it("sends only the latest version", async () => {
    const setup = await workOrderSetup();
    await confirmTicket({ context: setup.context, ticketId: setup.ticket.id });
    const first = unwrap({ result: await generate(setup) });
    unwrap({ result: await setCount({ ...setup, id: setup.count.id, quantity: 6 }) });
    const second = unwrap({ result: await generate(setup) });
    expect(errorCode({ result: await send({ setup, workOrder: first }) })).toBe("CONFLICT");
    expect(errorCode({ result: await send({ setup, workOrder: second }) })).toBeNull();
  });

  it("gets a version by id and keeps it hidden from other organizations", async () => {
    const setup = await workOrderSetup();
    const workOrder = unwrap({ result: await generate(setup) });
    const input = { id: workOrder.id };
    const got = unwrap({
      result: await execute({ operation: getWorkOrder, input, context: setup.context }),
    });
    expect(got.id).toBe(workOrder.id);
    const other = await workOrderSetup();
    const hidden = await execute({ operation: getWorkOrder, input, context: other.context });
    expect(errorCode({ result: hidden })).toBe("NOT_FOUND");
  });
});
