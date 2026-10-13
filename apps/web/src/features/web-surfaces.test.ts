import { existsSync } from "node:fs";
import { join } from "node:path";
import { createCoreOperations } from "@okazi/core";
import { describe, expect, it } from "vitest";
import { UI_EXEMPT, WEB_SURFACES } from "./web-surfaces";

const stubEmbed = async () => ({ model: "stub", embeddings: [] });
const operationNames = createCoreOperations({ embed: stubEmbed }).map(({ name }) => name);
const appDir = join(import.meta.dirname, "..", "app", "[locale]", "(app)");

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

  it("points every surface at an existing page", () => {
    const missing = WEB_SURFACES.filter(
      ({ route }) => !existsSync(join(appDir, route, "page.tsx")),
    );
    expect(missing).toEqual([]);
  });
});
