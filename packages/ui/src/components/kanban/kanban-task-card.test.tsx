import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { kanbanCardVariants } from "./kanban-card-variants";
import { KanbanTaskCardContent, KanbanTaskCardStatic } from "./kanban-task-card";

describe("kanban task card", () => {
  it("shows the type, the customer, the time and the assignee", () => {
    const html = renderToString(
      <KanbanTaskCardContent
        typeName="Site visit"
        customerName="Nordkust AB"
        timeLabel="Thu 14:00"
        assigneeName="Sara Berg"
      />,
    );
    expect(html).toContain("Site visit");
    expect(html).toContain("Nordkust AB");
    expect(html).toContain("Thu 14:00");
    expect(html).toContain("SB");
  });

  it("leaves out a missing customer and assignee", () => {
    const html = renderToString(
      <KanbanTaskCardContent typeName="Call" customerName={null} timeLabel="No due time" />,
    );
    expect(html).toContain("No due time");
    expect(html).not.toContain("avatar");
  });

  it("writes an overdue time in red text, never a red fill", () => {
    const html = renderToString(
      <KanbanTaskCardContent typeName="Call" customerName={null} timeLabel="Mon 09:00" overdue />,
    );
    expect(html).toContain("text-destructive");
    expect(html).not.toContain("bg-destructive");
  });

  it("is outlined in the task colour and never filled", () => {
    const task = kanbanCardVariants({ kind: "task" });
    expect(task).toContain("border-task");
    expect(task).toContain("bg-transparent");
    expect(task).not.toContain("bg-card");
    expect(kanbanCardVariants({ kind: "order" })).toContain("bg-card");
    expect(
      renderToString(<KanbanTaskCardStatic typeName="Call" customerName={null} timeLabel="-" />),
    ).toContain("border-task");
  });
});
