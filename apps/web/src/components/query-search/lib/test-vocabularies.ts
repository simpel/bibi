import { enMessages as en, svMessages as sv } from "@bibi/i18n";
import { buildOrderQuery } from "@/features/order/lib/order-query";

/** The search words and dropdown texts as the app ships them, for tests. */
const order = { en: buildOrderQuery({ messages: en }), sv: buildOrderQuery({ messages: sv }) };

export const EN_VOCABULARY = order.en.vocabulary;
export const SV_VOCABULARY = order.sv.vocabulary;
export const EN_TEXTS = order.en.texts;
export const SV_TEXTS = order.sv.texts;
