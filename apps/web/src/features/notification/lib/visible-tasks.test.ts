import { describe, expect, it } from "vitest";
import { visibleTasks } from "./visible-tasks";

const tasks = [{ key: "a" }, { key: "b" }];

describe("visibleTasks", () => {
  it("shows every task when none is dismissed", () => {
    const result = visibleTasks({ tasks, readFor: null, dismissed: new Map(), pathname: "/" });
    expect(result.tasks).toEqual(tasks);
    expect(result.dimmed.size).toBe(0);
  });

  it("keeps a task dismissed on this page, greyed out", () => {
    const dismissed = new Map([["a", "/orders"]]);
    const result = visibleTasks({ tasks, readFor: null, dismissed, pathname: "/orders" });
    expect(result.tasks).toEqual(tasks);
    expect([...result.dimmed]).toEqual(["a"]);
  });

  it("hides a task dismissed on an earlier page until a read for this page has it", () => {
    const dismissed = new Map([["a", "/orders"]]);
    const stale = visibleTasks({ tasks, readFor: "/orders", dismissed, pathname: "/" });
    expect(stale.tasks).toEqual([{ key: "b" }]);
    const back = visibleTasks({ tasks, readFor: "/", dismissed, pathname: "/" });
    expect(back.tasks).toEqual(tasks);
    expect(back.dimmed.size).toBe(0);
  });
});
