import { afterEach, describe, expect, it } from "vitest";
import { execute, getOrder, setExtract, updateOrder } from "../src/index";
import { unwrap } from "./helpers";
import { createSetup, createWith } from "./order-create-helpers";
import { mockModel } from "./order-draft-helpers";

afterEach(() => setExtract({ extract: undefined }));

describe("order title (generated after the create commits)", () => {
  it("names an order created without a title with the model's answer", async () => {
    const setup = await createSetup();
    const calls = mockModel({ answer: { title: "Kick-off with lunch" } });
    const created = unwrap({ result: await createWith({ setup, input: { note: "Lunch at 12" } }) });
    expect(created.title).toBe("Kick-off with lunch");
    expect(calls[0]?.feature).toBe("order.title");
    expect(JSON.parse(calls[0]?.prompt ?? "{}").booking.note).toBe("Lunch at 12");
    const input = { id: created.id };
    const read = unwrap({
      result: await execute({ operation: getOrder, input, context: setup.context }),
    });
    expect(read.title).toBe("Kick-off with lunch");
  });

  it("keeps a given title and never asks the model", async () => {
    const setup = await createSetup();
    const calls = mockModel({ answer: { title: "Other" } });
    const created = unwrap({ result: await createWith({ setup, input: { title: "Board day" } }) });
    expect(created.title).toBe("Board day");
    expect(calls).toHaveLength(0);
  });

  it("leaves the title null when no model answers or the answer does not fit", async () => {
    const setup = await createSetup();
    const none = unwrap({ result: await createWith({ setup }) });
    expect(none.title).toBeNull();
    mockModel({ answer: { name: "wrong shape" } });
    const misfit = unwrap({ result: await createWith({ setup }) });
    expect(misfit.title).toBeNull();
  });

  it("is changed and cleared with order.update", async () => {
    const setup = await createSetup();
    const created = unwrap({ result: await createWith({ setup }) });
    const { context } = setup;
    const renamed = unwrap({
      result: await execute({
        operation: updateOrder,
        input: { id: created.id, title: "Spring kick-off" },
        context,
      }),
    });
    expect(renamed.title).toBe("Spring kick-off");
    const cleared = unwrap({
      result: await execute({
        operation: updateOrder,
        input: { id: created.id, title: null },
        context,
      }),
    });
    expect(cleared.title).toBeNull();
  });
});
