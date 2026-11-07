import { BILLING_SURFACES } from "./billing-surfaces";
import { NOTIFICATION_SURFACES } from "./notification-surfaces";
import type { WebSurface } from "./web-surfaces";

/** The settings pages (members, payments, price lists, API keys), part of `WEB_SURFACES`. */
export const SETTINGS_SURFACES: readonly WebSurface[] = [
  { operation: "priceList.list", route: "/admin/price-lists" },
  { operation: "priceList.get", route: "/admin/price-lists" },
  { operation: "priceList.create", route: "/admin/price-lists" },
  { operation: "priceList.update", route: "/admin/price-lists" },
  { operation: "priceList.setItems", route: "/admin/price-lists" },
  { operation: "priceList.archive", route: "/admin/price-lists" },
  { operation: "member.list", route: "/admin/members" },
  { operation: "member.assignRole", route: "/admin/members" },
  { operation: "member.remove", route: "/admin/members" },
  { operation: "member.invite", route: "/admin/members" },
  { operation: "member.listInvitations", route: "/admin/members" },
  { operation: "member.cancelInvitation", route: "/admin/members" },
  // Domain join sits with the organization's other settings (ADR 0078).
  { operation: "organizationProfile.setDomainJoin", route: "/admin/general" },
  { operation: "paymentAccount.get", route: "/admin/integrations" },
  { operation: "paymentAccount.startOnboarding", route: "/admin/integrations" },
  { operation: "paymentAccount.sync", route: "/admin/integrations" },
  { operation: "paymentAccount.disconnect", route: "/admin/integrations" },
  { operation: "paymentSettings.get", route: "/admin/payments" },
  { operation: "paymentSettings.update", route: "/admin/payments" },
  { operation: "integration.list", route: "/admin/integrations" },
  { operation: "integration.connect", route: "/admin/integrations" },
  { operation: "integration.disconnect", route: "/admin/integrations" },
  { operation: "apiKey.list", route: "/admin/api-keys" },
  { operation: "apiKey.create", route: "/admin/api-keys" },
  { operation: "apiKey.revoke", route: "/admin/api-keys" },
  { operation: "apiKey.update", route: "/admin/api-keys/[id]/update" },
  // One permission grid per member and per API key (ADR 0050).
  { operation: "permission.get", route: "/admin/members/[id]/permissions" },
  { operation: "member.get", route: "/admin/members/[id]" },
  // A member's positions and schedule kind sit on the member page (ADR 0068).
  { operation: "memberProfile.get", route: "/admin/members/[id]" },
  { operation: "memberProfile.update", route: "/admin/members/[id]" },
  { operation: "memberProfile.setItems", route: "/admin/members/[id]" },
  { operation: "member.get", route: "/admin/members/[id]/permissions" },
  { operation: "member.assignRole", route: "/admin/members/[id]/permissions" },
  { operation: "apiKey.update", route: "/admin/api-keys/[id]/permissions" },
  { operation: "permission.get", route: "/admin/api-keys/[id]/permissions" },
  { operation: "apiKey.get", route: "/admin/api-keys/[id]/permissions" },
  { operation: "permission.update", route: "/admin/members/[id]/permissions" },
  { operation: "permission.update", route: "/admin/api-keys/[id]/permissions" },
  { operation: "statusGrid.get", route: "/admin/pipeline" },
  { operation: "statusGrid.setCell", route: "/admin/pipeline" },
  { operation: "statusGrid.importTemplate", route: "/admin/pipeline" },
  { operation: "itemState.list", route: "/admin/item-states" },
  { operation: "itemState.get", route: "/admin/item-states" },
  { operation: "itemState.create", route: "/new/item-state" },
  { operation: "itemState.update", route: "/admin/item-states/[id]/update" },
  { operation: "itemState.archive", route: "/admin/item-states" },
  { operation: "itemState.archivePreview", route: "/admin/item-states" },
  { operation: "itemState.reorder", route: "/admin/item-states" },
  { operation: "itemState.setTransitions", route: "/admin/item-states" },
  { operation: "orderTemplate.list", route: "/admin/order-templates" },
  { operation: "orderTemplate.get", route: "/admin/order-templates" },
  { operation: "orderTemplate.create", route: "/new/order-template" },
  { operation: "orderTemplate.update", route: "/admin/order-templates/[id]/update" },
  { operation: "orderTemplate.archive", route: "/admin/order-templates" },
  // Every user's own connected OAuth/MCP clients.
  { operation: "oauthGrant.list", route: "/profile" },
  { operation: "oauthGrant.revoke", route: "/profile" },
  // The user's own date and clock format.
  { operation: "userSettings.get", route: "/profile" },
  { operation: "userSettings.update", route: "/profile" },
  // The user's own choice of notifications (ADR 0094).
  { operation: "notificationPreference.list", route: "/profile" },
  { operation: "notificationPreference.set", route: "/profile" },
  // The bell and the list of the user's own notifications (ADR 0094).
  ...NOTIFICATION_SURFACES,
  // Bibi's own subscription, its payment page and seat requests (ADR 0095).
  ...BILLING_SURFACES,
];
