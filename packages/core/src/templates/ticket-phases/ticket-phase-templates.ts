import { conferenceVenueTicketPhases } from "./conference-venue";
import { defaultTicketPhases } from "./default";
import type { TicketPhaseTemplate } from "./ticket-phase-template";

export const TICKET_PHASE_TEMPLATE_KEYS = ["default", "conference-venue"] as const;
export type TicketPhaseTemplateKey = (typeof TICKET_PHASE_TEMPLATE_KEYS)[number];

const TEMPLATES: Record<TicketPhaseTemplateKey, TicketPhaseTemplate> = {
  default: defaultTicketPhases,
  "conference-venue": conferenceVenueTicketPhases,
};

export type GetTicketPhaseTemplateInput = { key: TicketPhaseTemplateKey };

export function getTicketPhaseTemplate({ key }: GetTicketPhaseTemplateInput): TicketPhaseTemplate {
  return TEMPLATES[key];
}
