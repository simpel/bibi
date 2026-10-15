import { mcpTool, text } from "../../tools/meta";

const owner = ({ value }: { value: unknown }): string =>
  value === null ? "nobody" : text({ value });

export const bookingMcpTools = [
  mcpTool({ operation: "booking.list" }),
  mcpTool({ operation: "booking.get" }),
  mcpTool({
    operation: "booking.create",
    summary: ({ input }) =>
      `Create a booking for customer ${text({ value: input.customerId })} from ${text({
        value: input.startsAt,
      })} to ${text({ value: input.endsAt })}`,
  }),
  mcpTool({
    operation: "booking.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update booking ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "booking.assign",
    idempotent: true,
    summary: ({ input }) =>
      [
        `Assign booking ${text({ value: input.id })}:`,
        input.salesOwnerId === undefined
          ? null
          : `salesperson ${owner({ value: input.salesOwnerId })}`,
        input.coordinatorId === undefined
          ? null
          : `coordinator ${owner({ value: input.coordinatorId })}`,
      ]
        .filter(Boolean)
        .join(" "),
  }),
  mcpTool({
    operation: "booking.changeStatus",
    summary: ({ input }) =>
      `Move booking ${text({ value: input.bookingId })} to status ${text({
        value: input.statusId,
      })}${input.reason === undefined ? "" : ` (reason: ${text({ value: input.reason })})`}`,
  }),
];
