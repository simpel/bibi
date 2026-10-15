import "server-only";
import { resolveExecuteContext } from "@okazi/auth";
import { hasPermission } from "@okazi/core";
import { headers } from "next/headers";

export type CallerAbilities = {
  skillAdmin: boolean;
  roleAdmin: boolean;
  memberAdmin: boolean;
  configurationWrite: boolean;
  bookingStatusAdmin: boolean;
  itemWrite: boolean;
  customerWrite: boolean;
  contactWrite: boolean;
  priceListWrite: boolean;
  occupancyWrite: boolean;
  bookingWrite: boolean;
  programItemWrite: boolean;
  inquiryWrite: boolean;
  auditRead: boolean;
  paymentAdmin: boolean;
  paymentRead: boolean;
  paymentWrite: boolean;
};

const NONE: CallerAbilities = {
  skillAdmin: false,
  roleAdmin: false,
  memberAdmin: false,
  configurationWrite: false,
  bookingStatusAdmin: false,
  itemWrite: false,
  customerWrite: false,
  contactWrite: false,
  priceListWrite: false,
  occupancyWrite: false,
  bookingWrite: false,
  programItemWrite: false,
  inquiryWrite: false,
  auditRead: false,
  paymentAdmin: false,
  paymentRead: false,
  paymentWrite: false,
};

/**
 * What the signed-in user's organization role allows, for hiding buttons that would only fail
 * (the operations still enforce everything). Uses the same resolver as `runOperation`.
 */
export async function getCallerAbilities(): Promise<CallerAbilities> {
  const context = await resolveExecuteContext({ headers: await headers() });
  if (!context.ok) return NONE;
  const { permissions } = context.value;
  return {
    skillAdmin: hasPermission({ permissions, permission: "skill:admin" }),
    roleAdmin: hasPermission({ permissions, permission: "role:admin" }),
    memberAdmin: hasPermission({ permissions, permission: "member:admin" }),
    configurationWrite: hasPermission({ permissions, permission: "configuration:write" }),
    bookingStatusAdmin: hasPermission({ permissions, permission: "bookingStatus:admin" }),
    itemWrite: hasPermission({ permissions, permission: "item:write" }),
    customerWrite: hasPermission({ permissions, permission: "customer:write" }),
    contactWrite: hasPermission({ permissions, permission: "contact:write" }),
    priceListWrite: hasPermission({ permissions, permission: "priceList:write" }),
    occupancyWrite: hasPermission({ permissions, permission: "occupancy:write" }),
    bookingWrite: hasPermission({ permissions, permission: "booking:write" }),
    programItemWrite: hasPermission({ permissions, permission: "programItem:write" }),
    inquiryWrite: hasPermission({ permissions, permission: "inquiry:write" }),
    auditRead: hasPermission({ permissions, permission: "audit:read" }),
    paymentAdmin: hasPermission({ permissions, permission: "payment:admin" }),
    paymentRead: hasPermission({ permissions, permission: "payment:read" }),
    paymentWrite: hasPermission({ permissions, permission: "payment:write" }),
  };
}
