import { afterEach, describe, expect, it } from "vitest";
import { createMemoryFileStore, execute, getFile, setFileStore, uploadFile } from "../src/index";
import { errorCode, peer, testContext, unwrap } from "./helpers";

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
const base64 = PNG.toString("base64");
const input = { contentType: "image/png", base64 } as const;

afterEach(() => setFileStore({ store: undefined }));

describe("files (ADR 0063)", () => {
  it("stores an image under the caller's key, reads it back and audits no bytes", async () => {
    setFileStore({ store: createMemoryFileStore() });
    const a = testContext();
    const { key } = unwrap({ result: await execute({ operation: uploadFile, input, context: a }) });
    expect(key.startsWith(`${a.actor.userId}/`)).toBe(true);
    const file = unwrap({
      result: await execute({ operation: getFile, input: { key }, context: a }),
    });
    expect(file).toEqual({ key, contentType: "image/png", base64 });
    const [audit] = await a.db.auditLog.findMany({ where: { entityId: key } });
    expect(audit?.after).toEqual({ key, contentType: "image/png", size: PNG.byteLength });
    const other = await execute({ operation: getFile, input: { key }, context: peer({ of: a }) });
    expect(errorCode({ result: other })).toBe("NOT_FOUND");
  });

  it("refuses a file that is not the claimed type, too large, or not base64", async () => {
    setFileStore({ store: createMemoryFileStore() });
    const context = testContext();
    const jpeg = { contentType: "image/jpeg", base64 } as const;
    const tooBig = { contentType: "image/png", base64: "A".repeat(3_000_000) } as const;
    const garbage = { contentType: "image/png", base64: "not base64!" } as const;
    for (const bad of [jpeg, tooBig, garbage]) {
      const result = await execute({ operation: uploadFile, input: bad, context });
      expect(errorCode({ result })).toBe("VALIDATION");
    }
  });

  it("is UNAVAILABLE without a store and NOT_FOUND for a missing own key", async () => {
    const context = testContext();
    const upload = await execute({ operation: uploadFile, input, context });
    expect(errorCode({ result: upload })).toBe("UNAVAILABLE");
    setFileStore({ store: createMemoryFileStore() });
    const key = `${context.actor.userId}/missing`;
    const missing = await execute({ operation: getFile, input: { key }, context });
    expect(errorCode({ result: missing })).toBe("NOT_FOUND");
  });
});
