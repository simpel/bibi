import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDiskProvider, newStorageKey, type StorageProvider } from "../src/index";

let root: string;
let storage: StorageProvider;
const body = new Uint8Array([1, 2, 3, 4]);

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "bibi-storage-"));
  storage = createDiskProvider({ root });
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("disk provider", () => {
  it("puts, gets and deletes a file with its content type", async () => {
    const key = newStorageKey({ ownerId: "user_1" });
    expect((await storage.put({ key, body, contentType: "image/png" })).ok).toBe(true);
    const got = await storage.get({ key });
    expect(got.ok && got.value).toEqual({ body, contentType: "image/png" });
    expect((await storage.delete({ key })).ok).toBe(true);
    const gone = await storage.get({ key });
    expect(gone.ok && gone.value).toBeNull();
    expect(await readdir(join(root, "user_1"))).toEqual([]);
  });

  it("treats deleting a missing key as success", async () => {
    expect((await storage.delete({ key: "a/missing" })).ok).toBe(true);
  });

  it.each(["../escape", "a/../../escape", "/etc/passwd", "a//b", "a\\b", ""])(
    "rejects the key %j",
    async (key) => {
      for (const result of [
        await storage.put({ key, body, contentType: "image/png" }),
        await storage.get({ key }),
        await storage.delete({ key }),
      ]) {
        expect(!result.ok && result.error.code).toBe("VALIDATION");
      }
    },
  );
});

describe("newStorageKey", () => {
  it("scopes a random key by owner", () => {
    const a = newStorageKey({ ownerId: "u1" });
    expect(a).toMatch(/^u1\/[0-9a-f-]{36}$/);
    expect(newStorageKey({ ownerId: "u1" })).not.toBe(a);
  });
});
