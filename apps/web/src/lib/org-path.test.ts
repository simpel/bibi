import { describe, expect, it } from "vitest";
import { isScopedPath, orgPath, orgSlugFromPathname, scopePath, stripOrg } from "./org-path";

describe("org paths", () => {
  it("treats app routes as scoped and top-level pages as unscoped", () => {
    expect(isScopedPath({ path: "/pipeline" })).toBe(true);
    expect(isScopedPath({ path: "/" })).toBe(true);
    expect(isScopedPath({ path: "/settings/payments" })).toBe(true);
    expect(isScopedPath({ path: "/new/venue?x=1" })).toBe(true);
    expect(isScopedPath({ path: "/login?next=%2F" })).toBe(false);
    expect(isScopedPath({ path: "/mothership/logs" })).toBe(false);
    expect(isScopedPath({ path: "https://example.com/x" })).toBe(false);
    expect(isScopedPath({ path: "//evil.test" })).toBe(false);
  });

  it("prefixes scoped paths with the slug", () => {
    expect(scopePath({ path: "/pipeline", org: "acme" })).toBe("/acme/pipeline");
    expect(scopePath({ path: "/", org: "acme" })).toBe("/acme");
    expect(scopePath({ path: "/?q=1", org: "acme" })).toBe("/acme?q=1");
    expect(scopePath({ path: "/login", org: "acme" })).toBe("/login");
    expect(scopePath({ path: "/pipeline", org: undefined })).toBe("/pipeline");
    expect(orgPath({ path: "/welcome", org: "acme" })).toBe("/acme/welcome");
  });

  it("strips the slug from pathnames", () => {
    expect(stripOrg({ pathname: "/acme/tickets/1", org: "acme" })).toBe("/tickets/1");
    expect(stripOrg({ pathname: "/acme", org: "acme" })).toBe("/");
    expect(stripOrg({ pathname: "/acmeish/x", org: "acme" })).toBe("/acmeish/x");
    expect(stripOrg({ pathname: "/login", org: undefined })).toBe("/login");
  });
});

describe("orgSlugFromPathname", () => {
  it("reads the slug after the locale and ignores reserved segments", () => {
    expect(orgSlugFromPathname({ pathname: "/sv/acme/pipeline" })).toBe("acme");
    expect(orgSlugFromPathname({ pathname: "/en/acme" })).toBe("acme");
    expect(orgSlugFromPathname({ pathname: "/sv/login" })).toBeUndefined();
    expect(orgSlugFromPathname({ pathname: "/sv" })).toBeUndefined();
    expect(orgSlugFromPathname({ pathname: "/acme/pipeline" })).toBeUndefined();
  });
});
