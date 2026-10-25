import { describe, expect, it } from "vitest";
import {
  execute,
  getFile,
  getMemberProfile,
  prefillMemberProfile,
  updateMemberProfile,
  updateProfile,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { addTestMemberWithUser, testOrg } from "./org-helpers";

const NAMES = { firstName: "Kim", lastName: "Ek", phone: "+46 31 111" };

/** An organization with one real member, and a context acting as that member. */
async function memberSetup() {
  const admin = await testOrg();
  const { memberId, userId } = await addTestMemberWithUser({ context: admin, role: "member" });
  const self = testContext({
    organizationId: admin.organizationId,
    access: "read",
    actor: { type: "user", userId },
  });
  return { admin, self, memberId, userId };
}

const read = async ({
  admin,
  memberId,
}: {
  admin: ReturnType<typeof testContext>;
  memberId: string;
}) =>
  unwrap({
    result: await execute({ operation: getMemberProfile, input: { memberId }, context: admin }),
  });

describe("member contact (ADR 0072)", () => {
  it("starts from the member's own profile and is then owned per organization", async () => {
    const { admin, self, memberId, userId } = await memberSetup();
    const avatarKey = `${userId}/photo`;
    const input = { ...NAMES, avatarKey };
    unwrap({ result: await execute({ operation: updateProfile, input, context: self }) });
    expect(await read({ admin, memberId })).toMatchObject({ phone: "+46 31 111", avatarKey });
    const work = { memberId, phone: "+46 31 999", email: "kim@venue.example" };
    unwrap({
      result: await execute({ operation: updateMemberProfile, input: work, context: admin }),
    });
    const changed = { ...NAMES, phone: "+46 70 000" };
    unwrap({ result: await execute({ operation: updateProfile, input: changed, context: self }) });
    await prefillMemberProfile({ organizationId: admin.organizationId, userId });
    expect(await read({ admin, memberId })).toMatchObject({
      phone: "+46 31 999",
      email: "kim@venue.example",
      scheduleKind: "PATTERN",
    });
  });

  it("lets colleagues here read the member's photo, and nobody in another organization", async () => {
    const { admin, self, memberId, userId } = await memberSetup();
    const avatarKey = `${userId}/photo`;
    unwrap({
      result: await execute({
        operation: updateProfile,
        input: { ...NAMES, avatarKey },
        context: self,
      }),
    });
    expect((await read({ admin, memberId })).avatarKey).toBe(avatarKey);
    const outsider = testContext();
    const refused = await execute({
      operation: getFile,
      input: { key: avatarKey },
      context: outsider,
    });
    expect(errorCode({ result: refused })).toBe("NOT_FOUND");
    const colleague = await execute({
      operation: getFile,
      input: { key: avatarKey },
      context: admin,
    });
    expect(errorCode({ result: colleague })).not.toBe("NOT_FOUND");
  });
});
