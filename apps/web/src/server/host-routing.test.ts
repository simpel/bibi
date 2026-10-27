import { describe, expect, it } from "vitest";
import { resolveHostAction } from "./host-routing";

const urls = { publicUrl: "https://heybibi.se", webUrl: "https://app.heybibi.se" };
type AtInput = { host: string; pathname: string; search?: string };
const at = ({ host, pathname, search = "" }: AtInput) =>
  resolveHostAction({ host, pathname, search, ...urls });

describe("resolveHostAction", () => {
  it("does nothing without a public URL", () => {
    const action = resolveHostAction({
      host: "localhost:3330",
      pathname: "/",
      search: "",
      publicUrl: undefined,
      webUrl: "http://localhost:3330",
    });
    expect(action).toEqual({ type: "pass" });
  });

  it("leaves the app host untouched", () => {
    expect(at({ host: "app.heybibi.se", pathname: "/" })).toEqual({ type: "pass" });
    expect(at({ host: "app.heybibi.se", pathname: "/sv/acme/pipeline" })).toEqual({ type: "pass" });
  });

  it("serves the public site on the apex front page in the right locale", () => {
    expect(at({ host: "heybibi.se", pathname: "/" })).toEqual({
      type: "rewrite",
      pathname: "/sv/site",
    });
    expect(at({ host: "heybibi.se", pathname: "/sv" })).toEqual({
      type: "rewrite",
      pathname: "/sv/site",
    });
    expect(at({ host: "heybibi.se", pathname: "/en/" })).toEqual({
      type: "rewrite",
      pathname: "/en/site",
    });
  });

  it("sends every other apex path to the same path on the app host", () => {
    expect(at({ host: "heybibi.se", pathname: "/sv/login", search: "?next=%2Fx" })).toEqual({
      type: "redirect",
      url: "https://app.heybibi.se/sv/login?next=%2Fx",
    });
    expect(at({ host: "heybibi.se", pathname: "/pay/abc" })).toEqual({
      type: "redirect",
      url: "https://app.heybibi.se/pay/abc",
    });
  });

  it("sends www and the redirect domain to the apex", () => {
    for (const host of ["www.heybibi.se", "heybibi.tech", "www.heybibi.tech"]) {
      expect(at({ host, pathname: "/sv/pricing", search: "?a=1" })).toEqual({
        type: "redirect",
        url: "https://heybibi.se/sv/pricing?a=1",
      });
    }
  });

  it("compares hosts case-insensitively", () => {
    expect(at({ host: "HeyBibi.SE", pathname: "/" })).toEqual({
      type: "rewrite",
      pathname: "/sv/site",
    });
  });
});
