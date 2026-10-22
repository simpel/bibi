import { createMemoryFileStore, DEFAULT_WORKING_HOURS, setFileStore } from "@bibi/core";
import { afterEach, describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

type Client = Awaited<ReturnType<typeof connect>>;

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]).toString("base64");
const NAMES = { firstName: "Ada", lastName: "Lovelace", phone: "+46 31 123 45 67" };

const profileOf = async ({ client }: { client: Client }) =>
  (await call({ client, name: "profile_get", args: {} })).data;
const daysOf = async ({ client }: { client: Client }) =>
  (await call({ client, name: "workingHours_get", args: {} })).data.days;

afterEach(() => setFileStore({ store: undefined }));

describe("profile, working hours and file isolation (ADR 0061, 0063)", () => {
  it("keeps each user's profile, hours and files private, in the same and other organizations", async () => {
    setFileStore({ store: createMemoryFileStore() });
    const contextA = testContext({ permissions: {} });
    const a = await connect({ context: contextA });
    const sameOrgAdmin = await connect({
      context: testContext({ organizationId: contextA.organizationId }),
    });
    const otherOrg = await connect({ context: testContext() });
    await call({ client: a, name: "profile_update", args: NAMES });
    await call({ client: a, name: "workingHours_set", args: { days: DEFAULT_WORKING_HOURS } });
    const upload = await call({
      client: a,
      name: "file_upload",
      args: { contentType: "image/png", base64: PNG },
    });
    const { key } = upload.data;
    for (const client of [sameOrgAdmin, otherOrg]) {
      expect((await profileOf({ client })).id).toBeNull();
      expect(await daysOf({ client })).toEqual([]);
      const read = await call({ client, name: "file_get", args: { key } });
      expect(read.isError).toBe(true);
      expect(read.data.code).toBe("NOT_FOUND");
      const steal = await call({
        client,
        name: "profile_update",
        args: { ...NAMES, avatarKey: key },
      });
      expect(steal.data.code).toBe("VALIDATION");
    }
    await call({ client: sameOrgAdmin, name: "workingHours_set", args: { days: [] } });
    expect(await daysOf({ client: a })).toHaveLength(5);
    expect((await profileOf({ client: a })).firstName).toBe("Ada");
    expect((await call({ client: a, name: "file_get", args: { key } })).isError).toBe(false);
  });
});
