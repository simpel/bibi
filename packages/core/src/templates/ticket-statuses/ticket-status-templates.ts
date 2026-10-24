import { conferenceEstateTicketStatuses } from "./conference-estate";
import { defaultTicketStatuses } from "./default";
import type { TicketStatusTemplate } from "./ticket-status-template";

export const TICKET_STATUS_TEMPLATE_KEYS = ["default", "conference-estate"] as const;
export type TicketStatusTemplateKey = (typeof TICKET_STATUS_TEMPLATE_KEYS)[number];

const TEMPLATES: Record<TicketStatusTemplateKey, TicketStatusTemplate> = {
  default: defaultTicketStatuses,
  "conference-estate": conferenceEstateTicketStatuses,
};

export type GetTicketStatusTemplateInput = { key: TicketStatusTemplateKey };

export function getTicketStatusTemplate({
  key,
}: GetTicketStatusTemplateInput): TicketStatusTemplate {
  return TEMPLATES[key];
}
