import { conferenceEstateOrderStatuses } from "./conference-estate";
import { defaultOrderStatuses } from "./default";
import type { OrderStatusTemplate } from "./order-status-template";

export const ORDER_STATUS_TEMPLATE_KEYS = ["default", "conference-estate"] as const;
export type OrderStatusTemplateKey = (typeof ORDER_STATUS_TEMPLATE_KEYS)[number];

const TEMPLATES: Record<OrderStatusTemplateKey, OrderStatusTemplate> = {
  default: defaultOrderStatuses,
  "conference-estate": conferenceEstateOrderStatuses,
};

export type GetOrderStatusTemplateInput = { key: OrderStatusTemplateKey };

export function getOrderStatusTemplate({ key }: GetOrderStatusTemplateInput): OrderStatusTemplate {
  return TEMPLATES[key];
}
