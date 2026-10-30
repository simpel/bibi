import { describe, expect, it } from "vitest";
import { pipelineHref, readPipelineSearch } from "./pipeline-href";

describe("pipeline href", () => {
  it("adds the board and mode only when set", () => {
    expect(pipelineHref({})).toBe("/pipeline");
    expect(pipelineHref({ boardId: "b1" })).toBe("/pipeline?board=b1");
    expect(pipelineHref({ boardId: "b1", customize: true })).toBe(
      "/pipeline?board=b1&mode=customize",
    );
    expect(pipelineHref({ customize: true })).toBe("/pipeline?mode=customize");
  });

  it("reads the search params back", () => {
    expect(readPipelineSearch({ search: { board: "b1", mode: "customize" } })).toEqual({
      boardId: "b1",
      customize: true,
    });
    expect(readPipelineSearch({ search: { board: ["b2"], mode: "other" } })).toEqual({
      boardId: "b2",
      customize: false,
    });
    expect(readPipelineSearch({ search: {} })).toEqual({ boardId: undefined, customize: false });
  });
});
