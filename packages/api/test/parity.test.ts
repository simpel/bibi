import { describe, expect, it } from "vitest";
import { listRestOperationNames } from "../src/index";
import { operations } from "./helpers";

describe("REST parity with the core registry", () => {
  it("exposes every operation (commands and entity reads) over REST", () => {
    const rest = new Set(listRestOperationNames());
    const missing = operations.map((op) => op.name).filter((name) => !rest.has(name));
    expect(missing).toEqual([]);
  });
});
