import { existsSync } from "node:fs";
import { join } from "node:path";
import { createCoreOperations } from "@bibi/core";
import { describe, expect, it } from "vitest";
import { UI_EXEMPT } from "./ui-exempt";
import { WEB_SURFACES } from "./web-surfaces";

const stubEmbed = async () => ({ model: "stub", embeddings: [] });
const operationNames = createCoreOperations({ embed: stubEmbed }).map(({ name }) => name);
const srcDir = join(import.meta.dirname, "..");
const appDirs = [
  ...["(contained)", "(canvas)"].map((group) =>
    join(srcDir, "app", "[locale]", "[org]", "(app)", group),
  ),
  // The full-screen welcome flow (ADR 0061) sits beside the app shell.
  join(srcDir, "app", "[locale]", "[org]"),
];

describe("web surfaces", () => {
  it("covers every core operation or lists it as uiExempt with a reason", () => {
    const covered = new Set([
      ...WEB_SURFACES.map(({ operation }) => operation),
      ...UI_EXEMPT.map(({ operation }) => operation),
    ]);
    expect(operationNames.filter((name) => !covered.has(name))).toEqual([]);
  });

  it("only references registered operations", () => {
    const known = new Set(operationNames);
    const listed = [...WEB_SURFACES, ...UI_EXEMPT].map(({ operation }) => operation);
    expect(listed.filter((name) => !known.has(name))).toEqual([]);
  });

  it("gives every exemption a reason and never lists an operation twice", () => {
    expect(UI_EXEMPT.every(({ reason }) => reason.trim().length > 10)).toBe(true);
    const surfaced = new Set(WEB_SURFACES.map(({ operation }) => operation));
    expect(UI_EXEMPT.filter(({ operation }) => surfaced.has(operation))).toEqual([]);
  });

  it("points every surface at an existing page, or at an existing shell component", () => {
    const missing = WEB_SURFACES.filter(({ route, component }) =>
      route === "*"
        ? !component || !existsSync(join(srcDir, component))
        : !appDirs.some((dir) => existsSync(join(dir, route, "page.tsx"))),
    );
    expect(missing).toEqual([]);
  });

  it("only uses the shell wildcard together with a component", () => {
    const wildcard = WEB_SURFACES.filter(({ route }) => route === "*");
    expect(wildcard.every(({ component }) => Boolean(component))).toBe(true);
    expect(WEB_SURFACES.filter(({ component, route }) => component && route !== "*")).toEqual([]);
  });
});
