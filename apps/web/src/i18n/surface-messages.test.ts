import { describe, expect, it } from "vitest";
import {
  APP_NAMESPACES,
  AUTH_NAMESPACES,
  BILLING_NAMESPACES,
  DOCS_NAMESPACES,
  MOTHERSHIP_NAMESPACES,
  NON_APP_NAMESPACES,
  pickSurfaceMessages,
  ROOT_NAMESPACES,
  WELCOME_NAMESPACES,
} from "./surface-messages";

describe("surface-messages", () => {
  it("includes root namespaces in every surface namespace set", () => {
    const surfaces = [
      ROOT_NAMESPACES,
      AUTH_NAMESPACES,
      DOCS_NAMESPACES,
      WELCOME_NAMESPACES,
      BILLING_NAMESPACES,
      MOTHERSHIP_NAMESPACES,
      APP_NAMESPACES,
    ];
    for (const surface of surfaces) {
      expect(surface).toEqual(expect.arrayContaining([...ROOT_NAMESPACES]));
    }
  });

  it("excludes non-app namespaces from APP_NAMESPACES", () => {
    for (const excluded of NON_APP_NAMESPACES) {
      expect(APP_NAMESPACES).not.toContain(excluded);
    }
  });

  it("picks only the requested surface namespaces for a locale", () => {
    const messages = pickSurfaceMessages({ locale: "en", namespaces: AUTH_NAMESPACES });
    expect(Object.keys(messages).sort()).toEqual([...AUTH_NAMESPACES].sort());
  });
});
