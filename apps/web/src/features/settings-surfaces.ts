import type { WebSurface } from "./web-surfaces";

/** The settings pages (roles, members, payments, price lists), part of `WEB_SURFACES`. */
export const SETTINGS_SURFACES: readonly WebSurface[] = [
  { operation: "priceList.list", route: "/settings/price-lists" },
  { operation: "priceList.get", route: "/settings/price-lists" },
  { operation: "priceList.create", route: "/settings/price-lists" },
  { operation: "priceList.update", route: "/settings/price-lists" },
  { operation: "priceList.setItems", route: "/settings/price-lists" },
  { operation: "priceList.archive", route: "/settings/price-lists" },
  { operation: "role.list", route: "/settings/roles" },
  { operation: "role.get", route: "/settings/roles" },
  { operation: "role.create", route: "/settings/roles" },
  { operation: "role.update", route: "/settings/roles" },
  { operation: "role.archive", route: "/settings/roles" },
  { operation: "role.importTemplate", route: "/settings/roles" },
  { operation: "member.list", route: "/settings/members" },
  { operation: "member.assignRole", route: "/settings/members" },
  { operation: "member.remove", route: "/settings/members" },
  { operation: "member.invite", route: "/settings/members" },
  { operation: "member.listInvitations", route: "/settings/members" },
  { operation: "member.cancelInvitation", route: "/settings/members" },
  { operation: "paymentAccount.get", route: "/settings/payments" },
  { operation: "paymentAccount.startOnboarding", route: "/settings/payments" },
  { operation: "paymentAccount.sync", route: "/settings/payments" },
];
