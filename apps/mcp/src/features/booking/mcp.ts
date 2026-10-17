import { mcpTool, text } from "../../tools/meta";

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
    operation: "booking.createQuick",
    summary: ({ input }) =>
      `Quick-book item ${text({ value: input.itemId })} for customer ${text({
        value: input.customerId,
      })} from ${text({ value: input.startsAt })} to ${text({ value: input.endsAt })}, ${text({
        value: input.paymentMethod,
      })}`,
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
    operation: "booking.changeStatus",
    summary: ({ input }) =>
      `Move booking ${text({ value: input.bookingId })} to status ${text({
        value: input.statusId,
      })}${input.reason === undefined ? "" : ` (reason: ${text({ value: input.reason })})`}`,
  }),
];
