import { describe, expect, it } from "vitest";
import { filterTasks } from "./filter-tasks";

type Task = Parameters<typeof filterTasks>[0]["tasks"][number];

const task = ({ overrides }: { overrides: Partial<Task> }) => ({
  reference: 1042,
  title: "Board day",
  customerName: "Acme",
  taskTypeName: null,
  lineName: null,
  runSheetName: null,
  ...overrides,
});

describe("filterTasks", () => {
  const tasks = [
    task({ overrides: {} }),
    task({ overrides: { reference: 7, title: "Wedding", runSheetName: "Kitchen order" } }),
  ];

  it("keeps every task for a blank query", () => {
    expect(filterTasks({ tasks, query: "  " })).toHaveLength(2);
  });

  it("matches the reference, title, customer and subject case-insensitively", () => {
    expect(filterTasks({ tasks, query: "#1042" })).toEqual([tasks[0]]);
    expect(filterTasks({ tasks, query: "wedd" })).toEqual([tasks[1]]);
    expect(filterTasks({ tasks, query: "ACME" })).toHaveLength(2);
    expect(filterTasks({ tasks, query: "kitchen" })).toEqual([tasks[1]]);
  });

  it("returns nothing when no task holds the text", () => {
    expect(filterTasks({ tasks, query: "gala" })).toEqual([]);
  });
});
