import "server-only";
import { resolveExecuteContext } from "@okazi/auth";
import { type FixedRole, hasPermission, highestRole } from "@okazi/core";
import { headers } from "next/headers";

export type CallerAbilities = {
  /** The caller's fixed role (ADR 0034); `null` when not a member or no fixed role. */
  role: FixedRole | null;
  /** The signed-in user (for follow and "Assigned to me"); null when not resolved. */
  userId: string | null;
  skillAdmin: boolean;
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
  assignmentWrite: boolean;
  requirementWrite: boolean;
  inquiryWrite: boolean;
  optionWrite: boolean;
  quoteWrite: boolean;
  paymentAdmin: boolean;
  sheetWrite: boolean;
  paymentWrite: boolean;
  integrationAdmin: boolean;
};

const NONE: CallerAbilities = {
  role: null,
  userId: null,
  skillAdmin: false,
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
  assignmentWrite: false,
  requirementWrite: false,
  inquiryWrite: false,
  optionWrite: false,
  quoteWrite: false,
  paymentAdmin: false,
  sheetWrite: false,
  paymentWrite: false,
  integrationAdmin: false,
};

/**
 * What the signed-in user's fixed role allows, for hiding buttons and admin pages that would only
 * fail (the operations still enforce everything). Uses the same resolver as `runOperation`.
 * Every role reads everything (ADR 0034), so there are no read abilities.
 */
export async function getCallerAbilities(): Promise<CallerAbilities> {
  const context = await resolveExecuteContext({ headers: await headers() });
  if (!context.ok) return NONE;
  const { permissions, roles, actor } = context.value;
  return {
    role: highestRole({ roles }),
    userId: actor.userId,
    skillAdmin: hasPermission({ permissions, permission: "skill:admin" }),
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
    assignmentWrite: hasPermission({ permissions, permission: "assignment:write" }),
    requirementWrite: hasPermission({ permissions, permission: "requirement:write" }),
    inquiryWrite: hasPermission({ permissions, permission: "inquiry:write" }),
    optionWrite: hasPermission({ permissions, permission: "option:write" }),
    quoteWrite: hasPermission({ permissions, permission: "quote:write" }),
    paymentAdmin: hasPermission({ permissions, permission: "payment:admin" }),
    sheetWrite: hasPermission({ permissions, permission: "sheet:write" }),
    paymentWrite: hasPermission({ permissions, permission: "payment:write" }),
    integrationAdmin: hasPermission({ permissions, permission: "integration:admin" }),
  };
}
