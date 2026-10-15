import { mcpTool, text } from "../../tools/meta";

export const bookingSeriesMcpTools = [
  mcpTool({ operation: "bookingSeries.list" }),
  mcpTool({ operation: "bookingSeries.get" }),
  mcpTool({
    operation: "bookingSeries.create",
    summary: ({ input }) =>
      `Create a booking series for customer ${text({ value: input.customerId })} from ${text({
        value: input.startsAt,
      })}, ${text({ value: input.rule })}`,
  }),
];
