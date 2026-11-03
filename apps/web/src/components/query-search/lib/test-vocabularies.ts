import en from "@bibi/i18n/messages/en.json";
import sv from "@bibi/i18n/messages/sv.json";
import { buildTicketQuery } from "@/features/ticket/lib/ticket-query";

/** The search words and dropdown texts as the app ships them, for tests. */
const ticket = { en: buildTicketQuery({ messages: en }), sv: buildTicketQuery({ messages: sv }) };

export const EN_VOCABULARY = ticket.en.vocabulary;
export const SV_VOCABULARY = ticket.sv.vocabulary;
export const EN_TEXTS = ticket.en.texts;
export const SV_TEXTS = ticket.sv.texts;
