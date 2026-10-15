import { describe, expect, it } from "vitest";
import {
  archiveBookingStatus,
  createBookingStatus,
  execute,
  getBookingStatus,
  updateBookingStatus,
} from "../src/index";
import { provisionedContext, statusByName, statuses } from "./booking-status-helpers";
import { errorCode, peer, unwrap } from "./helpers";

describe("booking statuses (ADR 0022)", () => {
  it("provisions one status per phase with forward transitions", async () => {
    const context = await provisionedContext();
    const all = await statuses({ context });
    expect(all.map((status) => [status.name, status.phase, status.position])).toEqual([
      ["Tentative", "TENTATIVE", 0],
      ["Confirmed", "CONFIRMED", 1],
      ["Completed", "COMPLETED", 2],
      ["Cancelled", "CANCELLED", 3],
    ]);
    const tentative = await statusByName({ context, name: "Tentative" });
    const ids = Object.fromEntries(all.map((status) => [status.name, status.id]));
    expect(tentative.transitionsTo).toEqual([ids.Confirmed, ids.Cancelled]);
    expect(tentative.createdBy).toBe("system");
  });

  it("places a new status after the last one of its phase", async () => {
    const context = await provisionedContext();
    const input = { name: "Final count locked", color: "#0d9488", phase: "CONFIRMED" };
    const created = unwrap({
      result: await execute({ operation: createBookingStatus, input, context }),
    });
    expect(created).toMatchObject({ position: 2, transitionsTo: [] });
    const names = (await statuses({ context })).map((status) => status.name);
    expect(names).toEqual([
      "Tentative",
      "Confirmed",
      "Final count locked",
      "Completed",
      "Cancelled",
    ]);
    const again = await execute({ operation: createBookingStatus, input, context });
    expect(errorCode({ result: again })).toBe("CONFLICT");
  });

  it("renames and recolors, but refuses a taken name and bad colors", async () => {
    const context = await provisionedContext();
    const { id } = await statusByName({ context, name: "Tentative" });
    const updated = unwrap({
      result: await execute({
        operation: updateBookingStatus,
        input: { id, name: "Preliminary", color: "#123456" },
        context,
      }),
    });
    expect(updated).toMatchObject({ name: "Preliminary", color: "#123456", phase: "TENTATIVE" });
    const taken = { id, name: "Confirmed" };
    expect(
      errorCode({
        result: await execute({ operation: updateBookingStatus, input: taken, context }),
      }),
    ).toBe("CONFLICT");
    const color = { id, color: "red" };
    expect(
      errorCode({
        result: await execute({ operation: updateBookingStatus, input: color, context }),
      }),
    ).toBe("VALIDATION");
  });

  it("archives a status, drops its transitions and keeps the last one of each phase", async () => {
    const context = await provisionedContext();
    const confirmed = await statusByName({ context, name: "Confirmed" });
    const last = await execute({ operation: archiveBookingStatus, input: confirmed, context });
    expect(errorCode({ result: last })).toBe("CONFLICT");
    const input = { name: "Final count locked", color: "#0d9488", phase: "CONFIRMED" };
    unwrap({ result: await execute({ operation: createBookingStatus, input, context }) });
    const archived = unwrap({
      result: await execute({
        operation: archiveBookingStatus,
        input: { id: confirmed.id },
        context,
      }),
    });
    expect(archived).toMatchObject({ status: "ARCHIVED", transitionsTo: [] });
    const tentative = await statusByName({ context, name: "Tentative" });
    expect(tentative.transitionsTo).not.toContain(confirmed.id);
    const gone = await execute({ operation: getBookingStatus, input: confirmed, context });
    expect(errorCode({ result: gone })).toBe("NOT_FOUND");
  });

  it("requires bookingStatus:admin to change statuses and read to list them", async () => {
    const context = await provisionedContext();
    const writer = peer({ of: context, access: "write" });
    const input = { name: "Extra", color: "#000000", phase: "TENTATIVE" };
    const denied = await execute({ operation: createBookingStatus, input, context: writer });
    expect(errorCode({ result: denied })).toBe("FORBIDDEN");
    expect(await statuses({ context: writer })).toHaveLength(4);
  });

  it("never shows another organization's statuses", async () => {
    const context = await provisionedContext();
    const other = await provisionedContext();
    const theirs = await statusByName({ context: other, name: "Tentative" });
    const read = await execute({ operation: getBookingStatus, input: { id: theirs.id }, context });
    expect(errorCode({ result: read })).toBe("NOT_FOUND");
  });
});
