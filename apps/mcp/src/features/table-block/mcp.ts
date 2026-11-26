import { mcpTool, type SummaryInput, text } from "../../tools/meta";
import { whenText } from "../reservation/summary";

/** "Block tables 11, 12 on 4 Dec 17:00-23:00" with the tables' numbers read from the layout. */
async function createSummary({ input, context }: SummaryInput): Promise<string> {
  const ids = Array.isArray(input.elementIds) ? input.elementIds.map(String) : [];
  const pieces = await context.db.floorElement.findMany({
    where: { id: { in: ids } },
    select: { id: true, label: true },
  });
  const labels = ids.map((id) => pieces.find((piece) => piece.id === id)?.label ?? id);
  const from = await whenText({ context, value: input.startsAt });
  const to = await whenText({ context, value: input.endsAt });
  const verb = input.kind === "ONLINE_ONLY" ? "Keep from guests" : "Block";
  const [day, start] = from.split(" at ");
  const [endDay, end] = to.split(" at ");
  const span = day === endDay ? `on ${day} ${start}-${end}` : `from ${from} to ${to}`;
  return `${verb} tables ${labels.join(", ")} ${span}`;
}

export const tableBlockMcpTools = [
  mcpTool({ operation: "tableBlock.list" }),
  mcpTool({ operation: "tableBlock.create", summary: createSummary }),
  mcpTool({
    operation: "tableBlock.delete",
    destructive: true,
    summary: ({ input }) => `Release table block ${text({ value: input.id })}`,
  }),
];
