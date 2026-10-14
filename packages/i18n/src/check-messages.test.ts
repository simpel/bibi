import { describe, expect, it } from "vitest";
import en from "../messages/en.json";
import sv from "../messages/sv.json";
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
    expect(diffMessageKeys({ base: sv, other: en })).toEqual({
      missingInOther: [],
      extraInOther: [],
    });
    expect(hasKeyParity({ base: sv, other: en })).toBe(true);
  });

  it("contain all required namespaces", () => {
    expect(Object.keys(sv)).toEqual(expect.arrayContaining(REQUIRED_NAMESPACES));
    expect(Object.keys(en)).toEqual(expect.arrayContaining(REQUIRED_NAMESPACES));
  });
});
