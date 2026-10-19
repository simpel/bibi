import { describe, expect, it } from "vitest";
import {
  DISABLED_ADMIN_PATHS,
  getAuth,
  resolvePlatformContext,
  setPlatformAdmin,
} from "../src/index";
import { signUp } from "./helpers";

describe("superadmin (ADR 0015)", () => {
  it("new users are not superadmins", async () => {
    const user = await signUp();
    const result = await resolvePlatformContext({ headers: user.headers });
    expect(result.ok ? null : result.error.code).toBe("FORBIDDEN");
  });

  it("grant takes effect on the next request and revoke removes it again", async () => {
    const user = await signUp();
    await setPlatformAdmin({ email: user.email, admin: true });
    const granted = await resolvePlatformContext({ headers: user.headers });
    expect(granted.ok && granted.value.platformRole).toBe("superadmin");
    await setPlatformAdmin({ email: user.email, admin: false });
    const revoked = await resolvePlatformContext({ headers: user.headers });
    expect(revoked.ok).toBe(false);
  });

  it("refuses API keys and bearer tokens even for an admin", async () => {
    const user = await signUp();
    await setPlatformAdmin({ email: user.email, admin: true });
    const headers = new Headers(user.headers);
    headers.set("authorization", "Bearer some-token");
    const result = await resolvePlatformContext({ headers });
    expect(result.ok ? null : result.error.code).toBe("FORBIDDEN");
  });

  it("answers 404 on every admin plugin endpoint over HTTP", async () => {
    const user = await signUp();
    for (const path of DISABLED_ADMIN_PATHS) {
      const request = new Request(`http://localhost:3000/api/auth${path}`, {
        method: "POST",
        headers: { ...Object.fromEntries(user.headers), "content-type": "application/json" },
        body: JSON.stringify({ userId: user.userId, role: "admin" }),
      });
      const response = await getAuth().handler(request);
      expect([404, 405], `${path} -> ${response.status}`).toContain(response.status);
    }
  });
});
