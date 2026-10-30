import { mcpTool, text } from "../../tools/meta";

const list = ({ value }: { value: unknown }): string =>
  Array.isArray(value) ? value.map((entry) => text({ value: entry })).join(", ") : "";

export const boardPhaseMcpTools = [
  mcpTool({
    operation: "boardPhase.create",
    summary: ({ input }) =>
      `Create phase "${text({ value: input.name })}" on board ${text({ value: input.boardId })}`,
  }),
  mcpTool({
    operation: "boardPhase.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update phase ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "boardPhase.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Archive phase ${text({ value: input.id })}`,
  }),
  mcpTool({
    operation: "boardPhase.reorder",
    idempotent: true,
    summary: ({ input }) =>
      `Reorder phases of board ${text({ value: input.boardId })}: ${list({ value: input.ids })}`,
  }),
  mcpTool({
    operation: "boardPhase.moveStatus",
    idempotent: true,
    summary: ({ input }) =>
      `Show ticket status ${text({ value: input.statusId })} ` +
      (input.phaseId === null
        ? `nowhere on board ${text({ value: input.boardId })}`
        : `in phase ${text({ value: input.phaseId })}`),
  }),
];

export const boardCrudMcpTools = [
  mcpTool({ operation: "board.list" }),
  mcpTool({ operation: "board.get" }),
  mcpTool({
    operation: "board.create",
    summary: ({ input }) => `Create board "${text({ value: input.name })}"`,
  }),
  mcpTool({
    operation: "board.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update board ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "board.archive",
    destructive: true,
    idempotent: true,
    summary: ({ input }) => `Archive board ${text({ value: input.id })}`,
  }),
  mcpTool({
    operation: "board.reorder",
    idempotent: true,
    summary: ({ input }) => `Reorder boards: ${list({ value: input.ids })}`,
  }),
];
