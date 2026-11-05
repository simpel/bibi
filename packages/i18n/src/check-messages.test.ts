import { describe, expect, it } from "vitest";
import { EN_BUNDLES, enMessages, pickMessages, SV_BUNDLES, svMessages } from "./catalog";
import { diffMessageKeys, flattenKeys, hasKeyParity } from "./check-messages";

const REQUIRED_NAMESPACES = [
  "common",
  "auth",
  "nav",
  "venue",
  "item",
  "assistant",
  "skills",
  "search",
  "errors",
];

describe("flattenKeys", () => {
  it("flattens nested trees to sorted dotted keys", () => {
    const tree = { b: { y: "1", x: "2" }, a: "3" };
    expect(flattenKeys({ tree })).toEqual(["a", "b.x", "b.y"]);
  });
});

describe("diffMessageKeys", () => {
  it("reports missing and extra keys", () => {
    const diff = diffMessageKeys({ base: { a: "1", b: "2" }, other: { a: "1", c: "3" } });
    expect(diff).toEqual({ missingInOther: ["b"], extraInOther: ["c"] });
  });
});

describe("message catalogues", () => {
  it("sv and en have identical keys", () => {
    expect(diffMessageKeys({ base: svMessages, other: enMessages })).toEqual({
      missingInOther: [],
      extraInOther: [],
    });
    expect(hasKeyParity({ base: svMessages, other: enMessages })).toBe(true);
  });

  it("each domain bundle has identical keys in sv and en", () => {
    expect(Object.keys(SV_BUNDLES)).toEqual(Object.keys(EN_BUNDLES));
    for (const [bundleName, svBundle] of Object.entries(SV_BUNDLES)) {
      const enBundle = EN_BUNDLES[bundleName];
      expect(enBundle, `missing en bundle ${bundleName}`).toBeDefined();
      if (enBundle) {
        expect(diffMessageKeys({ base: svBundle, other: enBundle })).toEqual({
          missingInOther: [],
          extraInOther: [],
        });
      }
    }
  });

  it("domain bundles have disjoint top-level namespaces", () => {
    const seen = new Set<string>();
    for (const bundle of Object.values(SV_BUNDLES)) {
      for (const ns of Object.keys(bundle)) {
        expect(seen.has(ns), `duplicate top-level namespace "${ns}" across bundles`).toBe(false);
        seen.add(ns);
      }
    }
    expect(seen.size).toBe(Object.keys(svMessages).length);
  });

  it("contain all required namespaces", () => {
    expect(Object.keys(svMessages)).toEqual(expect.arrayContaining(REQUIRED_NAMESPACES));
    expect(Object.keys(enMessages)).toEqual(expect.arrayContaining(REQUIRED_NAMESPACES));
  });

  it("pickMessages selects only the requested namespaces", () => {
    const picked = pickMessages({ locale: "sv", namespaces: ["common", "errors"] });
    expect(Object.keys(picked).sort()).toEqual(["common", "errors"]);
    expect(picked.common).toBe(svMessages.common);
  });
});
