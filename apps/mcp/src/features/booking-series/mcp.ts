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
  mcpTool({
    operation: "bookingSeries.updateOccurrences",
    summary: ({ input }) =>
      `Change ${input.scope === "THIS" ? "occurrence" : "occurrences from"} ${text({
        value: input.fromIndex,
      })} of booking series ${text({ value: input.seriesId })}: ${Object.keys(
        input.patch ?? {},
      ).join(", ")}`,
  }),
  mcpTool({
    operation: "bookingSeries.cancel",
    summary: ({ input }) =>
      `Cancel the upcoming occurrences of booking series ${text({ value: input.id })}: ${text({
        value: input.reason,
      })}`,
  }),
];
