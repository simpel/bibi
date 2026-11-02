import { mcpTool, text } from "../../tools/meta";
import { bindArchiveCustomer } from "./archive-binding";
import { archiveCustomerSummary } from "./archive-summary";

/** The nested first contact (ADR 0081) on the approval card, by name. */
const withContact = ({ contact }: { contact: unknown }) =>
  contact && typeof contact === "object" && "name" in contact
    ? ` with contact "${text({ value: contact.name })}"`
    : "";

export const customerMcpTools = [
  mcpTool({ operation: "customer.list" }),
  mcpTool({ operation: "customer.get" }),
  mcpTool({ operation: "customer.findSimilar" }),
  mcpTool({
    operation: "customer.create",
    summary: ({ input }) =>
      `Create customer "${text({ value: input.name })}" of type ${text({ value: input.entityTypeId })}` +
      withContact({ contact: input.contact }),
  }),
  mcpTool({
    operation: "customer.update",
    idempotent: true,
    summary: ({ input }) =>
      `Update customer ${text({ value: input.id })}: ${Object.keys(input)
        .filter((key) => key !== "id")
        .join(", ")}`,
  }),
  mcpTool({
    operation: "customer.archive",
    destructive: true,
    idempotent: true,
    summary: archiveCustomerSummary,
    bind: bindArchiveCustomer,
  }),
];
