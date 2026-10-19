import type { Modifier } from "@dnd-kit/core";
import { describe, expect, it } from "vitest";
import { restrictToMovableColumns } from "./data-table-restrict-modifier";

const transform = { x: 12, y: 0, scaleX: 1, scaleY: 1 };
type RunInput = { args?: Partial<Parameters<Modifier>[0]> };

const run = ({ args = {} }: RunInput = {}) =>
  restrictToMovableColumns({ activatorEvent: null, transform, ...args } as Parameters<Modifier>[0]);

describe("restrictToMovableColumns", () => {
  it("leaves the drag alone without a browser (dnd-kit renders modifiers on the server)", () => {
    expect(typeof Element).toBe("undefined");
    expect(run()).toBe(transform);
  });

  it("leaves the drag alone when the event target is not an element", () => {
    expect(run({ args: { activatorEvent: { target: {} } as unknown as Event } })).toBe(transform);
  });
});
