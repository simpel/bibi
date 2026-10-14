import { defaultKeyHasher } from "@better-auth/api-key";
import { hashApiKey } from "@okazi/core";
import { describe, expect, it } from "vitest";
import { getAuth } from "../src/index";
import { createOrg, signUp } from "./helpers";

describe("Better Auth API key plugin", () => {
  it("hashes keys exactly like core apiKey.create", async () => {
    const key = "okz_TheQuickBrownFoxJumpsOverTheLazyDog";
    expect(hashApiKey({ key })).toBe(await defaultKeyHasher(key));
  });

  it("has its own HTTP endpoints closed (keys go through core apiKey.*)", async () => {
    const owner = await signUp();
    const organizationId = await createOrg({ headers: owner.headers });
    const headers = new Headers(owner.headers);
    headers.set("content-type", "application/json");
    for (const path of ["/api-key/create", "/api-key/list", "/api-key/delete"]) {
      const response = await getAuth().handler(
        new Request(`${getAuth().options.baseURL}/api/auth${path}`, {
          method: "POST",
          headers,
          body: JSON.stringify({ name: "x", organizationId, keyId: "x" }),
        }),
      );
      expect(response.status, path).toBe(404);
    }
  });
});
