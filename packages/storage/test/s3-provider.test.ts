import { describe, expect, it } from "vitest";
import { createS3Provider } from "../src/index";

const base = { region: "eu-1", bucket: "b", accessKeyId: "id", secretAccessKey: "secret" };
const body = new Uint8Array([9, 8]);

describe("s3 provider", () => {
  it("sends put, get and delete commands to the bucket", async () => {
    const sent: { name: string; input: Record<string, unknown> }[] = [];
    const client = {
      send: async (command: unknown) => {
        const { input } = command as { input: Record<string, unknown> };
        const name = (command as object).constructor.name;
        sent.push({ name, input });
        if (name === "GetObjectCommand") {
          return {
            Body: { transformToByteArray: async () => body },
            ContentType: "image/webp",
          };
        }
        return {};
      },
    };
    const storage = createS3Provider({ ...base, client });
    await storage.put({ key: "u/k", body, contentType: "image/webp" });
    const got = await storage.get({ key: "u/k" });
    await storage.delete({ key: "u/k" });
    expect(got.ok && got.value).toEqual({ body, contentType: "image/webp" });
    expect(sent.map((s) => s.name)).toEqual([
      "PutObjectCommand",
      "GetObjectCommand",
      "DeleteObjectCommand",
    ]);
    expect(sent[0]?.input).toMatchObject({ Bucket: "b", Key: "u/k", ContentType: "image/webp" });
  });

  it("returns null for a missing key and rejects unsafe keys", async () => {
    const client = {
      send: async (): Promise<never> => {
        throw Object.assign(new Error("missing"), { name: "NoSuchKey" });
      },
    };
    const storage = createS3Provider({ ...base, client });
    const missing = await storage.get({ key: "u/none" });
    expect(missing.ok && missing.value).toBeNull();
    const bad = await storage.get({ key: "../x" });
    expect(!bad.ok && bad.error.code).toBe("VALIDATION");
  });
});
