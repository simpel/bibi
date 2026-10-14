import { describe, expect, it } from "vitest";
import { hashInput } from "../src/approval/canonical-json";
import { signApprovalToken } from "../src/approval/sign";
import { verifyApprovalToken } from "../src/approval/verify";

const secret = "unit-test-secret-unit-test-secret-1";
const base = {
  operation: "venue.create",
  input: { name: "A", b: 1 },
  organizationId: "org_1",
  userId: "user_1",
};

describe("approval token", () => {
  it("verifies for the same org and user and carries the input", () => {
    const { token } = signApprovalToken({ ...base, secret, now: 1000 });
    const result = verifyApprovalToken({
      token,
      secret,
      organizationId: "org_1",
      userId: "user_1",
      now: 1100,
    });
    expect(result.ok && result.value).toMatchObject({
      operation: "venue.create",
      input: base.input,
      exp: 1600,
    });
  });

  it("expires after 10 minutes", () => {
    const { token } = signApprovalToken({ ...base, secret, now: 1000 });
    const args = { token, secret, organizationId: "org_1", userId: "user_1" };
    expect(verifyApprovalToken({ ...args, now: 1599 }).ok).toBe(true);
    const late = verifyApprovalToken({ ...args, now: 1600 });
    expect(!late.ok && late.error.message).toContain("expired");
  });

  it("rejects another secret, org, user and a modified body", () => {
    const { token } = signApprovalToken({ ...base, secret, now: 1000 });
    const ok = { token, secret, organizationId: "org_1", userId: "user_1", now: 1001 };
    expect(verifyApprovalToken({ ...ok, secret: `${secret}x` }).ok).toBe(false);
    expect(verifyApprovalToken({ ...ok, organizationId: "org_2" }).ok).toBe(false);
    expect(verifyApprovalToken({ ...ok, userId: "user_2" }).ok).toBe(false);
    const [body = "", sig = ""] = token.split(".");
    const claims = JSON.parse(Buffer.from(body, "base64url").toString());
    const tampered = Buffer.from(JSON.stringify({ ...claims, exp: claims.exp + 999 })).toString(
      "base64url",
    );
    expect(verifyApprovalToken({ ...ok, token: `${tampered}.${sig}` }).ok).toBe(false);
  });

  it("hashes inputs independent of key order", () => {
    expect(hashInput({ value: { a: 1, b: [1, { c: 2, d: 3 }] } })).toBe(
      hashInput({ value: { b: [1, { d: 3, c: 2 }], a: 1 } }),
    );
  });
});
