import { mcpTool } from "../../tools/meta";

export const bookingPageMcpTools = [
  mcpTool({ operation: "bookingPage.get" }),
  mcpTool({
    operation: "bookingPage.update",
    idempotent: true,
    summary: ({ input }) => `Edit the booking page: ${Object.keys(input).join(", ")}`,
  }),
];
