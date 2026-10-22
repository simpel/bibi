import { describe, expect, it } from "vitest";
import { execute, getProfile, setWorkingHours, updateProfile } from "../src/index";
import { DEFAULT_WORKING_HOURS } from "../src/schemas";
import { errorCode, peer, testContext, unwrap } from "./helpers";

type Context = ReturnType<typeof testContext>;

const read = async ({ context }: { context: Context }) =>
  unwrap({ result: await execute({ operation: getProfile, input: {}, context }) });

const NAMES = { firstName: " Ada ", lastName: "Lovelace", phone: "+46 31-123 45 67" };

describe("profile (ADR 0061)", () => {
  it("is empty and incomplete before anything is saved", async () => {
    const empty = await read({ context: testContext() });
    expect(empty).toEqual({
      id: null,
      firstName: null,
      lastName: null,
      phone: null,
      avatarKey: null,
      complete: false,
    });
  });

  it("saves trimmed names, is complete only with working hours, and keeps users apart", async () => {
    const a = testContext();
    const saved = unwrap({
      result: await execute({ operation: updateProfile, input: NAMES, context: a }),
    });
    expect(saved).toMatchObject({ firstName: "Ada", lastName: "Lovelace", complete: false });
    const days = [...DEFAULT_WORKING_HOURS];
    unwrap({ result: await execute({ operation: setWorkingHours, input: { days }, context: a }) });
    expect((await read({ context: a })).complete).toBe(true);
    expect((await read({ context: peer({ of: a }) })).id).toBeNull();
    const audit = await a.db.auditLog.findMany({ where: { entityId: saved.id ?? "" } });
    expect(audit.map((row) => row.operation)).toEqual(["profile.update"]);
  });

  it("accepts only the caller's own avatar key and keeps it when omitted", async () => {
    const a = testContext();
    const userId = a.actor.userId ?? "";
    const other = { ...NAMES, avatarKey: "someone-else/abc" };
    const refused = await execute({ operation: updateProfile, input: other, context: a });
    expect(errorCode({ result: refused })).toBe("VALIDATION");
    const own = { ...NAMES, avatarKey: `${userId}/abc` };
    unwrap({ result: await execute({ operation: updateProfile, input: own, context: a }) });
    unwrap({ result: await execute({ operation: updateProfile, input: NAMES, context: a }) });
    expect((await read({ context: a })).avatarKey).toBe(`${userId}/abc`);
    const cleared = { ...NAMES, avatarKey: null };
    unwrap({ result: await execute({ operation: updateProfile, input: cleared, context: a }) });
    expect((await read({ context: a })).avatarKey).toBeNull();
  });

  it("refuses an empty name, a bad phone and the system actor", async () => {
    const a = testContext();
    const blank = { ...NAMES, firstName: "  " };
    expect(
      errorCode({ result: await execute({ operation: updateProfile, input: blank, context: a }) }),
    ).toBe("VALIDATION");
    const phone = { ...NAMES, phone: "call me" };
    expect(
      errorCode({ result: await execute({ operation: updateProfile, input: phone, context: a }) }),
    ).toBe("VALIDATION");
    const system = testContext({ actor: { type: "system", userId: null } });
    expect(
      errorCode({ result: await execute({ operation: getProfile, input: {}, context: system }) }),
    ).toBe("FORBIDDEN");
  });
});
