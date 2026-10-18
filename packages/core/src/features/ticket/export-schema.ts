import { z } from "zod";

/** Formats of `ticket.export` (ADR 0024); csv and pdf follow with the export ticket (#63). */
export const TICKET_EXPORT_FORMATS = ["json"] as const;

export const TicketExportInputSchema = z.object({
  id: z.string().min(1).describe("Id of the ticket"),
  format: z.enum(TICKET_EXPORT_FORMATS).default("json").describe("json: a versioned document"),
});

export const TicketExportOutputSchema = z.object({
  filename: z.string(),
  mime: z.string(),
  size: z.number().int().describe("Size of the content in bytes"),
  content: z.string().describe("The exported document"),
});

export type TicketExport = z.infer<typeof TicketExportOutputSchema>;
