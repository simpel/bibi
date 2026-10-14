import type { PermissionSet } from "../../permissions/permission-set";
import type { RoleTemplate } from "./role-template";

/**
 * What every role in the template gets: search, its own assistant conversations and skills.
 * Writing a skill only creates personal ones; organization skills need `skill:admin`.
 */
const everyone: PermissionSet = {
  search: ["read"],
  conversation: ["write"],
  skill: ["write"],
};

/** Everyone reads the catalog and the configuration it is described by (ADR 0021). */
const catalog: PermissionSet = { venue: ["read"], item: ["read"], configuration: ["read"] };

const readAll: PermissionSet = {
  ...everyone,
  ...catalog,
  role: ["read"],
  member: ["read"],
};

/**
 * "Conference venue" (ADR 0020). Optional data an organization imports and then edits freely.
 * Grows with each slice of ADR 0025: customers, quotes, bookings, sheets, invoices etc. are
 * added to the roles below when those resources exist.
 */
export const conferenceVenueTemplate: RoleTemplate = {
  key: "conference-venue",
  name: "Conference venue",
  roles: [
    {
      name: "Admin",
      permissions: {
        venue: ["admin"],
        item: ["admin"],
        configuration: ["admin"],
        search: ["admin"],
        conversation: ["admin"],
        skill: ["admin"],
        role: ["admin"],
        member: ["admin"],
      },
    },
    { name: "Sales", permissions: { ...everyone, ...catalog } },
    { name: "Coordinator", permissions: { ...everyone, ...catalog } },
    { name: "Kitchen", permissions: { ...everyone, ...catalog } },
    { name: "Finance", permissions: readAll },
    { name: "Reader", permissions: readAll },
  ],
};
